from __future__ import annotations

import hashlib
import secrets
from typing import Dict


def hash_password(raw: str) -> str:
    salt = secrets.token_hex(8)
    digest = hashlib.sha256(f"{salt}:{raw}".encode("utf-8")).hexdigest()
    return f"{salt}${digest}"


def verify_password(raw: str, hashed: str) -> bool:
    try:
        salt, digest = hashed.split("$")
    except ValueError:
        return False
    candidate = hashlib.sha256(f"{salt}:{raw}".encode("utf-8")).hexdigest()
    return secrets.compare_digest(candidate, digest)
