"""Vercel entry point for the public, read-only presentation API."""

import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
os.environ.setdefault("DATASET_PATH", str(PROJECT_ROOT / "train.csv"))
os.environ.setdefault("TEAM_PATH", str(PROJECT_ROOT / "06_membros_equipe"))
os.environ.setdefault("DATABASE_URL", "sqlite:////tmp/titanic.db")
sys.path.insert(0, str(PROJECT_ROOT / "app" / "api"))

from app.main import app

