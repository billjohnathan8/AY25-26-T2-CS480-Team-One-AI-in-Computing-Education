from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any, Dict

import httpx
import torch

PROJECT_ROOT = Path(__file__).resolve().parents[2].parent
PIPELINE_DIR = PROJECT_ROOT / "ai-pipeline"
MODEL_PATH = PIPELINE_DIR / "models" / "logit_blender.json"

if not PIPELINE_DIR.exists():
    raise RuntimeError(f"AI pipeline directory not found at {PIPELINE_DIR}")

if str(PIPELINE_DIR) not in sys.path:
    sys.path.append(str(PIPELINE_DIR))

from detectors.cross_perplexity import compute_feature_vector  # type: ignore  # noqa: E402
from detectors.tocsin import tocsin_score  # type: ignore  # noqa: E402
from ensemble import LogisticBlender  # type: ignore  # noqa: E402
from preprocess import clean_text  # type: ignore  # noqa: E402


class DetectorService:
    """Wraps the AI inference pipeline so the main service can score submissions."""

    def __init__(self, model_path: Path | None = None) -> None:
        self.model_path = model_path or MODEL_PATH
        self.threshold = float(os.getenv("AI_FLAG_THRESHOLD", "0.6"))
        self.ollama_host = os.getenv("OLLAMA_HOST", "http://ollama:11434")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "llama3")
        self._blender = LogisticBlender.load(self.model_path)

    def _coherence_score(self, text: str) -> float:
        if not text:
            return 0.5
        payload = {
            "model": self.ollama_model,
            "prompt": f"Evaluate coherence (0-1 float) for: {text[:800]}",
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
        processed = clean_text(text)
        tokens = processed.cleaned.split(" ")
        cross_vec = compute_feature_vector(tokens)
        tocsin = tocsin_score(tokens)
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

    def predict(self, text: str) -> Dict[str, Any]:
        features, metrics = self._build_features(text or "")
        probability = float(self._blender.predict(features))
        label = "ai" if probability >= self.threshold else "human"
        return {
            "prob_ai": probability,
            "label": label,
            "metrics": metrics,
        }


detector = DetectorService()
