from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import torch


MODEL_PATH = Path("models/logit_blender.json")


@dataclass
class LogisticBlender:
    weights: torch.Tensor
    bias: torch.Tensor

    def predict(self, features: torch.Tensor) -> float:
        logits = torch.matmul(features, self.weights) + self.bias
        return torch.sigmoid(logits).item()

    def save(self, path: Path = MODEL_PATH) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        payload = {"weights": self.weights.tolist(), "bias": float(self.bias.item())}
        path.write_text(json.dumps(payload))

    @classmethod
    def load(cls, path: Path = MODEL_PATH) -> "LogisticBlender":
        if path.exists():
            payload = json.loads(path.read_text())
            return cls(weights=torch.tensor(payload["weights"], dtype=torch.float32), bias=torch.tensor(payload["bias"]))
        return cls(weights=torch.ones(4, dtype=torch.float32) * 0.4, bias=torch.tensor(-0.4))

    def fit(self, rows: Iterable[tuple[torch.Tensor, float]], lr: float = 0.1, epochs: int = 100) -> None:
        for _ in range(epochs):
            for features, label in rows:
                pred = torch.sigmoid(torch.matmul(features, self.weights) + self.bias)
                error = pred - label
                self.weights = self.weights - lr * error * features
                self.bias = self.bias - lr * error
