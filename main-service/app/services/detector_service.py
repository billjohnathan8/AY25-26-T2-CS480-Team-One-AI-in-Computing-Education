from __future__ import annotations

import math
import os
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any, Dict, Tuple

import httpx

try:
    import torch  # type: ignore
except Exception:  # pragma: no cover - torch is optional in the main service container
    torch = None  # type: ignore

PIPELINE_DIR: Path | None = None
MODEL_PATH: Path | None = None
LOCAL_PIPELINE_AVAILABLE = False

try:
    project_root = Path(__file__).resolve().parents[2]
    repo_root = project_root.parent
except IndexError:
    repo_root = Path(__file__).resolve().parent

candidate = repo_root / "ai-pipeline"
if candidate.exists():
    PIPELINE_DIR = candidate
    MODEL_PATH = PIPELINE_DIR / "models" / "logit_blender.json"
    if str(PIPELINE_DIR) not in sys.path:
        sys.path.append(str(PIPELINE_DIR))

if PIPELINE_DIR:
    try:
        from detectors.cross_perplexity import compute_feature_vector  # type: ignore  # noqa: E402
        from detectors.tocsin import tocsin_score  # type: ignore  # noqa: E402
        from ensemble import LogisticBlender  # type: ignore  # noqa: E402
        from preprocess import clean_text  # type: ignore  # noqa: E402

        LOCAL_PIPELINE_AVAILABLE = True
    except Exception:
        compute_feature_vector = None  # type: ignore
        tocsin_score = None  # type: ignore
        LogisticBlender = None  # type: ignore
        clean_text = None  # type: ignore
        LOCAL_PIPELINE_AVAILABLE = False
else:
    compute_feature_vector = None  # type: ignore
    tocsin_score = None  # type: ignore
    LogisticBlender = None  # type: ignore
    clean_text = None  # type: ignore


class DetectorService:
    """Wraps the AI inference pipeline so the main service can score submissions."""

    def __init__(self, model_path: Path | None = None, pipeline_url: str | None = None) -> None:
        self.model_path = model_path or MODEL_PATH
        self.threshold = float(os.getenv("AI_FLAG_THRESHOLD", "0.6"))
        self.ollama_host = os.getenv("OLLAMA_HOST", "http://ollama:11434")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "llama3")
        self.ai_pipeline_url = pipeline_url or os.getenv("AI_PIPELINE_URL", "http://ai-pipeline:8001")
        self.pipeline_timeout = float(os.getenv("AI_PIPELINE_TIMEOUT", "15"))
        self._local_enabled = (
            LOCAL_PIPELINE_AVAILABLE
            and self.model_path is not None
            and "LogisticBlender" in globals()
            and LogisticBlender is not None
            and torch is not None
        )
        self._blender = LogisticBlender.load(self.model_path) if self._local_enabled else None  # type: ignore

    def _coherence_score(self, text: str) -> float:
        if not text:
            return 0.5
        payload = {
            "model": self.ollama_model,
            "prompt": f"Evaluate coherence (0-1 FLOAT) for: {text[:800]}",
            "stream": False,
        }
        try:
            with httpx.Client(timeout=20) as client:
                response = client.post(f"{self.ollama_host}/api/generate", json=payload)
                response.raise_for_status()
                data = response.json()
        except Exception:
            return 0.5
        message = str(data.get("response", "0.5"))
        for token in message.split():
            token = token.strip().strip("%")
            try:
                score = float(token)
            except ValueError:
                continue
            if 0 <= score <= 1:
                return score
            if 0 <= score <= 100:
                return score / 100
        return 0.5

    def _build_features(self, text: str) -> tuple[torch.Tensor, Dict[str, float]]:
        if torch is None or not (clean_text and compute_feature_vector and tocsin_score):  # type: ignore
            raise RuntimeError("Local pipeline modules are unavailable.")
        processed = clean_text(text)  # type: ignore
        tokens = processed.cleaned.split(" ")
        cross_vec = compute_feature_vector(tokens)  # type: ignore
        tocsin = tocsin_score(tokens)  # type: ignore
        coherence = self._coherence_score(processed.cleaned)
        features = torch.tensor(
            [
                coherence,
                cross_vec[0].item(),
                tocsin,
                processed.token_count / 1000.0,
            ],
            dtype=torch.float32,
        )
        metrics = {
            "coherence": coherence,
            "cross_perplexity": cross_vec[0].item(),
            "tocsin": tocsin,
            "length_norm": processed.token_count / 1000.0,
        }
        return features, metrics

    def _remote_predict(self, text: str) -> Dict[str, Any] | None:
        if not self.ai_pipeline_url:
            return None
        url = f"{self.ai_pipeline_url.rstrip('/')}/analyze"
        try:
            with httpx.Client(timeout=self.pipeline_timeout) as client:
                response = client.post(url, json={"answer": text})
                response.raise_for_status()
                data = response.json()
        except Exception:
            return None
        probability = float(data.get("ai_probability", data.get("prob_ai", 0.0)) or 0.0)
        metrics = {
            "coherence": float(data.get("coherence", 0.0) or 0.0),
            "cross_perplexity": float(data.get("cross_perplexity", 0.0) or 0.0),
            "tocsin": float(data.get("tocsin", 0.0) or 0.0),
            "length_norm": float(data.get("length_norm", 0.0) or 0.0),
        }
        label = "ai" if probability >= self.threshold else "human"
        return {"prob_ai": probability, "label": label, "metrics": metrics}

    def _local_predict(self, text: str) -> Dict[str, Any] | None:
        if not (self._local_enabled and self._blender):
            return None
        features, metrics = self._build_features(text)
        probability = float(self._blender.predict(features))
        label = "ai" if probability >= self.threshold else "human"
        return {"prob_ai": probability, "label": label, "metrics": metrics}

    def _tokenize(self, text: str) -> list[str]:
        normalized = re.sub(r"\s+", " ", (text or "").lower()).strip()
        return normalized.split(" ") if normalized else []

    def _heuristic_metrics(self, text: str) -> Tuple[float, Dict[str, float]]:
        tokens = self._tokenize(text)
        if not tokens:
            return 0.05, {"coherence": 0.5, "cross_perplexity": 0.0, "tocsin": 0.0, "length_norm": 0.0}
        counts = Counter(tokens)
        total = float(len(tokens))
        entropy = -sum((freq / total) * math.log(freq / total + 1e-9) for freq in counts.values())
        cross_perplexity = min(math.exp(entropy) / 50.0, 1.0)
        repetitiveness = min(sum(freq for freq in counts.values() if freq > 3) / total, 1.0)
        length_norm = min(len(tokens) / 400.0, 1.0)
        avg_len = sum(len(token) for token in tokens) / total
        coherence = max(0.0, min(1.0, 1.0 - 0.6 * repetitiveness - abs(avg_len - 4) / 10.0))
        probability = max(
            0.05,
            min(
                0.95,
                0.15 + 0.4 * (1 - cross_perplexity) + 0.3 * length_norm + 0.3 * (1 - coherence),
            ),
        )
        metrics = {
            "coherence": round(coherence, 4),
            "cross_perplexity": round(cross_perplexity, 4),
            "tocsin": round(repetitiveness, 4),
            "length_norm": round(length_norm, 4),
        }
        return probability, metrics

    def _heuristic_predict(self, text: str) -> Dict[str, Any]:
        probability, metrics = self._heuristic_metrics(text)
        label = "ai" if probability >= self.threshold else "human"
        return {"prob_ai": probability, "label": label, "metrics": metrics}

    def predict(self, text: str) -> Dict[str, Any]:
        normalized = text or ""
        if not normalized.strip():
            return self._heuristic_predict("")
        remote = self._remote_predict(normalized)
        if remote:
            return remote
        local = self._local_predict(normalized)
        if local:
            return local
        return self._heuristic_predict(normalized)


detector = DetectorService()
