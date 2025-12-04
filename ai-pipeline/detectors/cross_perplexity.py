from __future__ import annotations

import math
from collections import Counter
from typing import Sequence

import torch


def cross_perplexity_score(tokens: Sequence[str]) -> float:
    if not tokens:
        return 0.0
    counts = Counter(tokens)
    total = sum(counts.values())
    entropy = -sum((freq / total) * math.log(freq / total + 1e-8) for freq in counts.values())
    perplexity = math.exp(entropy)
    normalized = min(perplexity / 50.0, 1.0)
    return float(normalized)


def compute_feature_vector(tokens: Sequence[str]) -> torch.Tensor:
    vocab = len(set(tokens))
    cross_perp = cross_perplexity_score(tokens)
    avg_len = sum(len(t) for t in tokens) / max(len(tokens), 1)
    return torch.tensor([cross_perp, vocab / 500.0, avg_len / 10.0], dtype=torch.float32)
