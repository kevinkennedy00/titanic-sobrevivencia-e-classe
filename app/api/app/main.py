from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote

import pandas as pd
from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import Boolean, Float, Integer, JSON, String, Text, create_engine, func, select, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:////tmp/titanic.db" if os.getenv("VERCEL") else f"sqlite:///{PROJECT_ROOT / 'titanic.db'}",
)
DATASET_PATH = Path(os.getenv("DATASET_PATH", str(PROJECT_ROOT / "train.csv")))
TEAM_PATH = Path(os.getenv("TEAM_PATH", str(PROJECT_ROOT / "06_membros_equipe")))
CORS_ORIGINS = [item.strip() for item in os.getenv("CORS_ORIGINS", "http://localhost:3011").split(",")]


class Base(DeclarativeBase):
    pass


class Passenger(Base):
    __tablename__ = "passengers"

    passenger_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    survived: Mapped[bool] = mapped_column(Boolean, nullable=False)
    pclass: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    sex: Mapped[str] = mapped_column(String(16), nullable=False)
    age: Mapped[float | None] = mapped_column(Float)
    sib_sp: Mapped[int] = mapped_column(Integer, nullable=False)
    parch: Mapped[int] = mapped_column(Integer, nullable=False)
    ticket: Mapped[str] = mapped_column(String(64), nullable=False)
    fare: Mapped[float] = mapped_column(Float, nullable=False)
    cabin: Mapped[str | None] = mapped_column(String(32))
    embarked: Mapped[str | None] = mapped_column(String(4))


class MetricSnapshot(Base):
    __tablename__ = "metric_snapshots"

    slug: Mapped[str] = mapped_column(String(80), primary_key=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB().with_variant(JSON, "sqlite"), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(nullable=False)


engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_session():
    with SessionLocal() as session:
        yield session


def percentage(value: float) -> str:
    return f"{value * 100:.1f}".replace(".", ",") + "%"


def decimal(value: float, digits: int = 4) -> str:
    return f"{value:.{digits}f}".replace(".", ",")


def presentation_sections() -> list[dict[str, Any]]:
    team = [
        ("cauany", "Cauany Nunes", "Introdução e medidas de posição", "CAUANY NUNES.jpg"),
        ("bruna", "Bruna Xavier", "Dispersão e distribuição da classe", "BRUNA XAVIER.jpg"),
        ("samuel", "Samuel Soares", "Sobrevivência geral", "SAMUEL SOARES.jpg"),
        ("nikson", "Nikson Gabriel", "Análise conjunta", "NIKSON GABRIEL.jpg"),
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


def source_frame() -> pd.DataFrame:
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Base Titanic não encontrada em {DATASET_PATH}")
    return pd.read_csv(DATASET_PATH)


def seed_passengers(session: Session) -> None:
    if session.scalar(select(func.count()).select_from(Passenger)):
        return
    frame = source_frame()
    passengers = [
        Passenger(
            passenger_id=int(row.PassengerId),
            survived=bool(row.Survived),
            pclass=int(row.Pclass),
            name=str(row.Name),
            sex=str(row.Sex),
            age=None if pd.isna(row.Age) else float(row.Age),
            sib_sp=int(row.SibSp),
            parch=int(row.Parch),
            ticket=str(row.Ticket),
            fare=float(row.Fare),
            cabin=None if pd.isna(row.Cabin) else str(row.Cabin),
            embarked=None if pd.isna(row.Embarked) else str(row.Embarked),
        )
        for row in frame.itertuples(index=False)
    ]
    session.add_all(passengers)
    session.commit()


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


def refresh_metrics(session: Session) -> None:
    generated_at = datetime.now(timezone.utc)
    for slug, payload in metric_payloads().items():
        snapshot = session.get(MetricSnapshot, slug)
        if snapshot is None:
            snapshot = MetricSnapshot(slug=slug, payload=payload, updated_at=generated_at)
            session.add(snapshot)
        else:
            snapshot.payload = payload
            snapshot.updated_at = generated_at
    session.commit()


def bootstrap() -> None:
    Base.metadata.create_all(engine)
    with SessionLocal() as session:
        seed_passengers(session)
        refresh_metrics(session)


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
def health(session: Session = Depends(get_session)) -> dict[str, str]:
    session.execute(text("SELECT 1"))
    return {"status": "UP"}


@app.get("/api/presentation")
def presentation(session: Session = Depends(get_session)) -> dict[str, Any]:
    snapshots = {row.slug: row.payload for row in session.scalars(select(MetricSnapshot)).all()}
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
def metrics(session: Session = Depends(get_session)) -> list[dict[str, Any]]:
    return [row.payload for row in session.scalars(select(MetricSnapshot).order_by(MetricSnapshot.slug)).all()]


@app.get("/api/metrics/{slug}")
def metric(slug: str, session: Session = Depends(get_session)) -> dict[str, Any]:
    snapshot = session.get(MetricSnapshot, slug)
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Métrica não encontrada.")
    return snapshot.payload


@app.get("/api/passengers")
def passengers(
    offset: int = Query(0, ge=0),
    limit: int = Query(25, ge=1, le=50),
    session: Session = Depends(get_session),
) -> dict[str, Any]:
    """Return a small, paginated audit window for the post-presentation explorer."""
    total = session.scalar(select(func.count()).select_from(Passenger)) or 0
    rows = session.scalars(
        select(Passenger).order_by(Passenger.passenger_id).offset(offset).limit(limit)
    ).all()
    returned = len(rows)
    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "returned": returned,
        "has_more": offset + returned < total,
        "rows": [
            {
                "passenger_id": row.passenger_id,
                "survived": int(row.survived),
                "pclass": row.pclass,
                "name": row.name,
                "sex": row.sex,
                "age": row.age,
                "sib_sp": row.sib_sp,
                "parch": row.parch,
                "ticket": row.ticket,
                "fare": row.fare,
                "cabin": row.cabin,
                "embarked": row.embarked,
            }
            for row in rows
        ],
    }
