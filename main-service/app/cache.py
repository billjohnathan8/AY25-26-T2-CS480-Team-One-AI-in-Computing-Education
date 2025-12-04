from __future__ import annotations

import asyncio
import json
from typing import Any

from redis.asyncio import Redis

from .config import get_settings

_redis_client: Redis | None = None


def get_redis() -> Redis | None:
    global _redis_client
    if _redis_client:
        return _redis_client
    settings = get_settings()
    try:
        _redis_client = Redis.from_url(settings.redis_url, decode_responses=True)
    except Exception:
        _redis_client = None
    return _redis_client


async def cache_set(key: str, value: Any, ttl_seconds: int = 60) -> None:
    client = get_redis()
    if not client:
        return
    try:
        await client.set(key, json.dumps(value, default=str), ex=ttl_seconds)
    except Exception:
        pass


async def cache_get(key: str) -> Any | None:
    client = get_redis()
    if not client:
        return None
    try:
        payload = await client.get(key)
        if payload:
            return json.loads(payload)
    except Exception:
        return None
    return None


async def warm_cache(key: str, loader) -> Any:
    cached = await cache_get(key)
    if cached:
        return cached
    value = loader()
    await cache_set(key, value)
    return value
