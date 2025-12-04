from __future__ import annotations

import os
import json
from pathlib import Path
from typing import Optional

import httpx
import mlflow
import torch
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, PlainTextResponse
from pydantic import BaseModel

from ensemble import LogisticBlender
from preprocess import clean_text
from detectors.cross_perplexity import compute_feature_vector
from detectors.tocsin import tocsin_score

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://ollama:11434")
MLFLOW_TRACKING_URI = os.getenv("MLFLOW_TRACKING_URI", "file:./mlruns")
ENABLE_MLFLOW = os.getenv("ENABLE_MLFLOW", "1") == "1"
CONTRACT_FILE = Path(__file__).resolve().parents[1] / "documentation" / "api-contracts" / "ai-pipeline.yaml"

if ENABLE_MLFLOW:
    mlflow.set_tracking_uri(MLFLOW_TRACKING_URI)

app = FastAPI(
    title="AI Detection Pipeline",
    swagger_ui_parameters={
        "urls": [
            {"name": "AI Pipeline (Live)", "url": "/openapi.json"},
            {"name": "AI Pipeline Contract", "url": "/contracts/ai-pipeline.yaml"},
        ]
    },
)
BLENDER = LogisticBlender.load()


class AnalyzePayload(BaseModel):
    answer: str
    topic: Optional[str] = "general"
    course_name: Optional[str] = None


class TrainingSample(BaseModel):
    answer: str
    label: float


class TrainPayload(BaseModel):
    samples: list[TrainingSample]


async def _ollama_coherence_score(prompt: str) -> float:
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                f"{OLLAMA_HOST}/api/generate",
                json={
                    "model": os.getenv("OLLAMA_MODEL", "llama3"),
                    "prompt": f"Evaluate coherence (0-1 float) for: {prompt[:800]}",
                    "stream": False,
                },
            )
            response.raise_for_status()
            data = response.json()
            text = data.get("response", "0.5")
            for token in text.split():
                try:
                    score = float(token.strip().strip("%"))
                    if 0 <= score <= 1:
                        return score
                    if 0 <= score <= 100:
                        return score / 100
                except ValueError:
                    continue
    except Exception:
        return 0.5
    return 0.5


async def _build_features(answer: str) -> tuple[torch.Tensor, dict[str, float]]:
    processed = clean_text(answer)
    tokens = processed.cleaned.split(" ")
    cross_vec = compute_feature_vector(tokens)
    tocsin = tocsin_score(tokens)
    coherence = await _ollama_coherence_score(processed.cleaned)
    features = torch.tensor(
        [
            coherence,
            cross_vec[0].item(),
            tocsin,
            processed.token_count / 1000.0,
        ],
        dtype=torch.float32,
    )
    details = {
        "coherence": coherence,
        "cross_perplexity": cross_vec[0].item(),
        "tocsin": tocsin,
        "length_norm": processed.token_count / 1000.0,
    }
    return features, details


@app.post("/analyze")
async def analyze(payload: AnalyzePayload) -> dict[str, float]:
    features, metrics = await _build_features(payload.answer)
    probability = BLENDER.predict(features)
    if ENABLE_MLFLOW:
        with mlflow.start_run(run_name="inference", nested=True):
            mlflow.log_params(
                {
                    "topic": payload.topic or "general",
                    "course": payload.course_name or "unknown",
                }
            )
            mlflow.log_metrics({"ai_probability": probability, **metrics})
    return {"ai_probability": probability, "flagged": probability >= 0.6, **metrics}


@app.post("/train")
async def train(payload: TrainPayload) -> dict[str, str]:
    if not payload.samples:
        raise HTTPException(status_code=400, detail="No training samples provided")
    rows: list[tuple[torch.Tensor, float]] = []
    for sample in payload.samples:
        features, _ = await _build_features(sample.answer)
        rows.append((features, torch.tensor(sample.label, dtype=torch.float32)))
    BLENDER.fit(rows)
    BLENDER.save()
    if ENABLE_MLFLOW:
        with mlflow.start_run(run_name="training"):
            mlflow.log_metric("samples", len(rows))
            mlflow.log_params({"trainer": "logistic_blender"})
    return {"status": "model updated"}


@app.get("/healthz")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/contracts/ai-pipeline.yaml", include_in_schema=False)
def contract():
    if CONTRACT_FILE.exists():
        return FileResponse(CONTRACT_FILE)
    return PlainTextResponse(json.dumps(app.openapi()), media_type="application/json")
