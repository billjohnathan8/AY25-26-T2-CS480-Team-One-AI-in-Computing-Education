from __future__ import annotations

import secrets
from datetime import datetime, timedelta
from typing import Dict


class SessionStore:
    def __init__(self) -> None:
        self._sessions: Dict[str, tuple[int, datetime]] = {}

    def create(self, user_id: int, ttl_minutes: int = 60) -> str:
        token = secrets.token_urlsafe(24)
        self._sessions[token] = (user_id, datetime.utcnow() + timedelta(minutes=ttl_minutes))
        return token

    def validate(self, token: str) -> int | None:
        entry = self._sessions.get(token)
        if not entry:
            return None
        user_id, expires_at = entry
        if datetime.utcnow() > expires_at:
            self._sessions.pop(token, None)
            return None
        return user_id


session_store = SessionStore()
