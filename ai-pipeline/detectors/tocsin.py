from __future__ import annotations

import random
from typing import Sequence

import torch


def random_perturb(tokens: Sequence[str], drop_ratio: float = 0.1) -> list[str]:
    if not tokens:
        return []
    count = max(1, int(len(tokens) * drop_ratio))
    indices = set(random.sample(range(len(tokens)), min(count, len(tokens))))
    return [tok for idx, tok in enumerate(tokens) if idx not in indices]


def semantic_distance(original: Sequence[str], perturbed: Sequence[str]) -> float:
    if not original:
        return 0.0
    original_vec = torch.zeros(128)
    perturbed_vec = torch.zeros(128)
    for token in original:
        original_vec[hash(token) % 128] += 1
    for token in perturbed:
        perturbed_vec[hash(token) % 128] += 1
    original_norm = torch.nn.functional.normalize(original_vec.unsqueeze(0), dim=1)
    perturbed_norm = torch.nn.functional.normalize(perturbed_vec.unsqueeze(0), dim=1)
    cosine = torch.nn.functional.cosine_similarity(original_norm, perturbed_norm).item()
    return 1 - cosine


def tocsin_score(tokens: Sequence[str]) -> float:
    perturbed = random_perturb(tokens)
    distance = semantic_distance(tokens, perturbed)
    return max(0.0, min(distance, 1.0))
