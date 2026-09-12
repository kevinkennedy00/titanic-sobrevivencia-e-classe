"""HTTP layer for the Titanic presentation.

All data preparation and statistics live in :mod:`app.analysis_core`, which is
also imported by the academic notebook. This module contains routing only.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any
from urllib.parse import quote

import pandas as pd
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .analysis_core import bootstrap, metric_payloads, source_frame


SOURCE_PATH = Path(__file__).resolve()
PROJECT_ROOT = next(
    (parent for parent in SOURCE_PATH.parents if (parent / "train.csv").exists()),
    Path.cwd(),
)
TEAM_PATH = Path(os.getenv("TEAM_PATH", str(PROJECT_ROOT / "06_membros_equipe")))
CORS_ORIGINS = [item.strip() for item in os.getenv("CORS_ORIGINS", "http://localhost:3011").split(",")]


def presentation_sections() -> list[dict[str, Any]]:
    team = [
        ("cauany", "Cauany Nunes", "Medidas de posição", "CAUANY NUNES.jpg"),
        ("bruna", "Bruna Xavier", "Dispersão da classe", "BRUNA XAVIER.jpg"),
        ("samuel", "Samuel Soares", "Dispersão da sobrevivência", "SAMUEL SOARES.jpg"),
        ("nikson", "Nikson Gabriel", "Sobrevivência por classe", "NIKSON GABRIEL.jpg"),
        ("kevin", "Kevin Kennedy", "Conclusões e limites", "KEVIN KENNEDY.jpg"),
    ]
    colors = ["ivory", "mist", "navy", "ink", "night"]
    return [
        {"slug": slug, "speaker": name, "role": role, "photo": f"/team/{quote(photo)}", "tone": colors[index], "position": index + 1}
        for index, (slug, name, role, photo) in enumerate(team)
    ]


app = FastAPI(
    title="Titanic Presentation API",
    version="1.1.0",
    description="Dados e cálculos auditáveis da apresentação estatística do Titanic.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.middleware("http")
async def restore_vercel_route(request: Request, call_next):
    """Keep compatibility with historical Vercel single-function routes."""
    if request.url.path == "/api/index.py":
        route = request.query_params.get("path")
        if route:
            request.scope["path"] = "/" + route.lstrip("/")
    return await call_next(request)


if TEAM_PATH.exists():
    app.mount("/team", StaticFiles(directory=TEAM_PATH), name="team")


@app.on_event("startup")
def on_startup() -> None:
    bootstrap()


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"status": "UP", "storage": "memory", "records": int(len(source_frame())), "engine": "analysis_core"}


@app.get("/api/presentation")
def presentation() -> dict[str, Any]:
    return {
        "title": "Titanic — Sobrevivência e Classe",
        "subtitle": "Análise estatística descritiva",
        "course": "223711 — Analisar e Elaborar Relatórios Estatísticos — Noite",
        "professor": "Onildo dos Reis Freire",
        "institution": "UNIFACISA",
        "sections": presentation_sections(),
        "metrics": metric_payloads(),
        "source": "Kaggle · Titanic — Machine Learning from Disaster · train.csv",
        "method": "Cálculos em Python/Pandas; desvio padrão populacional (ddof = 0).",
    }


@app.get("/api/metrics")
def metrics() -> list[dict[str, Any]]:
    snapshots = metric_payloads()
    return [snapshots[slug] for slug in sorted(snapshots)]


@app.get("/api/metrics/{slug}")
def metric(slug: str) -> dict[str, Any]:
    snapshot = metric_payloads().get(slug)
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Métrica não encontrada.")
    return snapshot


@app.get("/api/passengers")
def passengers(
    offset: int = Query(0, ge=0),
    limit: int = Query(25, ge=1, le=50),
    pclass: int | None = Query(None, ge=1, le=3),
    survived: int | None = Query(None, ge=0, le=1),
    sex: str | None = Query(None, pattern="^(female|male)$"),
    name: str | None = Query(None, min_length=1, max_length=80),
) -> dict[str, Any]:
    """Return a filterable, paginated audit window for the presentation explorer."""
    frame = source_frame()
    if pclass is not None:
        frame = frame.loc[frame["Pclass"] == pclass]
    if survived is not None:
        frame = frame.loc[frame["Survived"] == survived]
    if sex is not None:
        frame = frame.loc[frame["Sex"] == sex]
    if name is not None:
        frame = frame.loc[frame["Name"].str.contains(name.strip(), case=False, regex=False, na=False)]

    total = int(len(frame))
    page = frame.sort_values("PassengerId").iloc[offset : offset + limit]
    rows = [
        {
            "passenger_id": int(row.PassengerId), "survived": int(row.Survived), "pclass": int(row.Pclass),
            "name": str(row.Name), "sex": str(row.Sex), "age": None if pd.isna(row.Age) else float(row.Age),
            "sib_sp": int(row.SibSp), "parch": int(row.Parch), "ticket": str(row.Ticket), "fare": float(row.Fare),
            "cabin": None if pd.isna(row.Cabin) else str(row.Cabin),
            "embarked": None if pd.isna(row.Embarked) else str(row.Embarked),
        }
        for row in page.itertuples(index=False)
    ]
    returned = len(rows)
    return {"total": total, "offset": offset, "limit": limit, "returned": returned,
            "has_more": offset + returned < total, "rows": rows}
