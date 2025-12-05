from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest
from sqlmodel import SQLModel

ROOT_DIR = Path(__file__).resolve().parents[1]

if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

TEST_DB_PATH = ROOT_DIR / "test_app.db"
os.environ.setdefault("DATABASE_URL", f"sqlite:///{TEST_DB_PATH.as_posix()}")
os.environ.setdefault("AI_PIPELINE_URL", "")

from app.database import engine  # noqa: E402


@pytest.fixture(autouse=True)
def reset_database():
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    yield
