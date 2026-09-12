from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any
from urllib.parse import quote

import pandas as pd
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


SOURCE_PATH = Path(__file__).resolve()
PROJECT_ROOT = next(
    (parent for parent in SOURCE_PATH.parents if (parent / "train.csv").exists()),
    Path.cwd(),
)
DATASET_PATH = Path(os.getenv("DATASET_PATH", str(PROJECT_ROOT / "train.csv")))
TEAM_PATH = Path(os.getenv("TEAM_PATH", str(PROJECT_ROOT / "06_membros_equipe")))
CORS_ORIGINS = [item.strip() for item in os.getenv("CORS_ORIGINS", "http://localhost:3011").split(",")]


def percentage(value: float) -> str:
    return f"{value * 100:.1f}".replace(".", ",") + "%"


def decimal(value: float, digits: int = 4) -> str:
    return f"{value:.{digits}f}".replace(".", ",")


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
        {
            "slug": slug,
            "speaker": name,
            "role": role,
            "photo": f"/team/{quote(photo)}",
            "tone": colors[index],
            "position": index + 1,
        }
        for index, (slug, name, role, photo) in enumerate(team)
    ]


@lru_cache(maxsize=1)
def source_frame() -> pd.DataFrame:
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Base Titanic não encontrada em {DATASET_PATH}")
    return pd.read_csv(DATASET_PATH)


def metric_payloads() -> dict[str, dict[str, Any]]:
    frame = source_frame()
    total = len(frame)
    survived = int(frame["Survived"].sum())
    deceased = total - survived
    pclass_counts = frame["Pclass"].value_counts().sort_index()
    survival_by_class = frame.groupby("Pclass")["Survived"].agg(["sum", "count"])

    class_rows = []
    for pclass, row in survival_by_class.iterrows():
        survivors = int(row["sum"])
        count = int(row["count"])
        class_rows.append(
            {
                "class": f"{int(pclass)}ª classe",
                "pclass": int(pclass),
                "survivors": survivors,
                "deceased": count - survivors,
                "total": count,
                "rate": round(survivors / count, 6),
                "rate_label": percentage(survivors / count),
                "formula": f"{survivors} ÷ {count} × 100 = {percentage(survivors / count)}",
            }
        )

    pclass_mean = float(frame["Pclass"].mean())
    pclass_std = float(frame["Pclass"].std(ddof=0))
    survived_mean = float(frame["Survived"].mean())
    survived_std = float(frame["Survived"].std(ddof=0))

    sex_labels = {"female": "Mulheres", "male": "Homens"}
    sex_summary = frame.groupby("Sex")["Survived"].agg(["sum", "count"])
    sex_rows = [
        {
            "sex": sex,
            "label": sex_labels[sex],
            "survivors": int(sex_summary.loc[sex, "sum"]),
            "total": int(sex_summary.loc[sex, "count"]),
            "rate": round(float(sex_summary.loc[sex, "sum"] / sex_summary.loc[sex, "count"]), 6),
            "rate_label": percentage(float(sex_summary.loc[sex, "sum"] / sex_summary.loc[sex, "count"])),
            "formula": f"{int(sex_summary.loc[sex, 'sum'])} ÷ {int(sex_summary.loc[sex, 'count'])} × 100 = {percentage(float(sex_summary.loc[sex, 'sum'] / sex_summary.loc[sex, 'count']))}",
        }
        for sex in ("female", "male")
    ]

    age_known = frame.loc[frame["Age"].notna()].copy()
    age_known["age_group"] = age_known["Age"].map(
        lambda age: "Menores de 18 anos" if float(age) < 18 else "Adultos"
    )
    age_summary = age_known.groupby("age_group")["Survived"].agg(["sum", "count"])
    age_rows = [
        {
            "label": label,
            "survivors": int(age_summary.loc[label, "sum"]),
            "total": int(age_summary.loc[label, "count"]),
            "rate": round(float(age_summary.loc[label, "sum"] / age_summary.loc[label, "count"]), 6),
            "rate_label": percentage(float(age_summary.loc[label, "sum"] / age_summary.loc[label, "count"])),
            "formula": f"{int(age_summary.loc[label, 'sum'])} ÷ {int(age_summary.loc[label, 'count'])} × 100 = {percentage(float(age_summary.loc[label, 'sum'] / age_summary.loc[label, 'count']))}",
        }
        for label in ("Menores de 18 anos", "Adultos")
    ]

    minors = age_known.loc[age_known["Age"] < 18]
    minor_class_summary = minors.groupby("Pclass")["Survived"].agg(["sum", "count"])
    minor_class_rows = [
        {
            "class": f"{int(pclass)}ª classe",
            "pclass": int(pclass),
            "survivors": int(minor_class_summary.loc[pclass, "sum"]),
            "total": int(minor_class_summary.loc[pclass, "count"]),
            "rate": round(float(minor_class_summary.loc[pclass, "sum"] / minor_class_summary.loc[pclass, "count"]), 6),
            "rate_label": percentage(float(minor_class_summary.loc[pclass, "sum"] / minor_class_summary.loc[pclass, "count"])),
            "formula": f"{int(minor_class_summary.loc[pclass, 'sum'])} ÷ {int(minor_class_summary.loc[pclass, 'count'])} × 100 = {percentage(float(minor_class_summary.loc[pclass, 'sum'] / minor_class_summary.loc[pclass, 'count']))}",
        }
        for pclass in (1, 2, 3)
    ]

    return {
        "overview": {
            "slug": "overview",
            "title": "A base em números",
            "total_passengers": total,
            "columns": int(len(frame.columns)),
            "variables_in_focus": 2,
            "missing_in_focus": int(frame[["Survived", "Pclass"]].isna().sum().sum()),
            "source": "Kaggle · Titanic — Machine Learning from Disaster · train.csv",
        },
        "survival-overview": {
            "slug": "survival-overview",
            "title": "Sobrevivência geral",
            "survived": survived,
            "deceased": deceased,
            "survival_rate": round(survived / total, 6),
            "survival_rate_label": percentage(survived / total),
            "deceased_rate_label": percentage(deceased / total),
            "formula": f"{survived} ÷ {total} × 100 = {percentage(survived / total)}",
        },
        "class-distribution": {
            "slug": "class-distribution",
            "title": "Distribuição por classe",
            "rows": [
                {
                    "class": f"{int(pclass)}ª classe",
                    "pclass": int(pclass),
                    "count": int(count),
                    "share": round(int(count) / total, 6),
                    "share_label": percentage(int(count) / total),
                }
                for pclass, count in pclass_counts.items()
            ],
        },
        "survival-by-class": {
            "slug": "survival-by-class",
            "title": "Taxa de sobrevivência por classe",
            "rows": class_rows,
            "gap_first_to_third": round(class_rows[0]["rate"] - class_rows[2]["rate"], 6),
            "gap_label": f"{(class_rows[0]['rate'] - class_rows[2]['rate']) * 100:.1f}".replace(".", ",") + " pontos percentuais",
        },
        "central-tendency": {
            "slug": "central-tendency",
            "title": "Média, moda e mediana",
            "survived": {
                "mean": survived_mean,
                "mean_label": f"{decimal(survived_mean)} → {percentage(survived_mean)}",
                "mode": int(frame["Survived"].mode().iat[0]),
                "median": float(frame["Survived"].median()),
            },
            "pclass": {
                "mean": pclass_mean,
                "mean_label": decimal(pclass_mean),
                "mode": int(frame["Pclass"].mode().iat[0]),
                "median": float(frame["Pclass"].median()),
            },
            "note": "A média de Pclass resume códigos ordinais; não representa uma classe real.",
        },
        "human-context": {
            "slug": "human-context",
            "title": "Recortes complementares",
            "sex": sex_rows,
            "age": {
                "known_total": int(len(age_known)),
                "missing_total": int(frame["Age"].isna().sum()),
                "rows": age_rows,
            },
            "minors_by_class": minor_class_rows,
            "note": "As médias de Survived dentro de cada grupo são taxas descritivas. Os recortes ajudam a contextualizar a história, mas não isolam causas individuais.",
        },
        "dispersion": {
            "slug": "dispersion",
            "title": "Dispersão",
            "pclass": {
                "std": pclass_std,
                "std_label": decimal(pclass_std),
                "cv": pclass_std / pclass_mean,
                "cv_label": percentage(pclass_std / pclass_mean),
            },
            "survived": {
                "std": survived_std,
                "std_label": decimal(survived_std),
                "cv": survived_std / survived_mean,
                "cv_label": percentage(survived_std / survived_mean),
            },
            "formula": "DP ÷ média × 100",
            "note": "Os coeficientes descrevem a dispersão dos códigos e exigem cautela na interpretação.",
        },
    }


def bootstrap() -> None:
    """Validate the immutable CSV source once when an API instance starts."""
    source_frame()
    metric_payloads()


app = FastAPI(
    title="Titanic Presentation API",
    version="1.0.0",
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
    """Restore the original API path after Vercel's single-function rewrite."""
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
    return {"status": "UP", "storage": "memory", "records": int(len(source_frame()))}


@app.get("/api/presentation")
def presentation() -> dict[str, Any]:
    snapshots = metric_payloads()
    return {
        "title": "Titanic — Sobrevivência e Classe",
        "subtitle": "Análise estatística descritiva",
        "course": "223711 — Analisar e Elaborar Relatórios Estatísticos — Noite",
        "professor": "Onildo dos Reis Freire",
        "institution": "UNIFACISA",
        "sections": presentation_sections(),
        "metrics": snapshots,
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
    return snapshot.payload


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
            "passenger_id": int(row.PassengerId),
            "survived": int(row.Survived),
            "pclass": int(row.Pclass),
            "name": str(row.Name),
            "sex": str(row.Sex),
            "age": None if pd.isna(row.Age) else float(row.Age),
            "sib_sp": int(row.SibSp),
            "parch": int(row.Parch),
            "ticket": str(row.Ticket),
            "fare": float(row.Fare),
            "cabin": None if pd.isna(row.Cabin) else str(row.Cabin),
            "embarked": None if pd.isna(row.Embarked) else str(row.Embarked),
        }
        for row in page.itertuples(index=False)
    ]
    returned = len(rows)
    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "returned": returned,
        "has_more": offset + returned < total,
        "rows": rows,
    }
