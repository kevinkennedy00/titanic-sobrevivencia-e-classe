"""Single statistical source of truth for the Titanic presentation.

The FastAPI service consumes these functions to feed the website. The academic
notebook imports the same module to display the calculations, tables and chart.
"""

from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


SOURCE_PATH = Path(__file__).resolve()
PROJECT_ROOT = next(
    (parent for parent in SOURCE_PATH.parents if (parent / "train.csv").exists()),
    Path.cwd(),
)
DATASET_PATH = Path(os.getenv("DATASET_PATH", str(PROJECT_ROOT / "train.csv")))


def percentage(value: float) -> str:
    return f"{value * 100:.1f}".replace(".", ",") + "%"


def decimal(value: float, digits: int = 4) -> str:
    return f"{value:.{digits}f}".replace(".", ",")


@lru_cache(maxsize=1)
def source_frame() -> pd.DataFrame:
    """Load and validate the immutable source dataset once per process."""
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Base Titanic não encontrada em {DATASET_PATH}")

    frame = pd.read_csv(DATASET_PATH)
    required = {"PassengerId", "Survived", "Pclass", "Sex", "Age", "Fare"}
    missing = required.difference(frame.columns)
    if missing:
        raise ValueError(f"Colunas obrigatórias ausentes: {sorted(missing)}")
    if frame.shape != (891, 12):
        raise ValueError(f"Dimensão inesperada: {frame.shape}; esperado: (891, 12).")
    if not frame["Survived"].isin([0, 1]).all():
        raise ValueError("Survived deve conter somente 0 e 1.")
    if not frame["Pclass"].isin([1, 2, 3]).all():
        raise ValueError("Pclass deve conter somente 1, 2 e 3.")
    return frame


def describe_series(series: pd.Series) -> dict[str, float | int]:
    """Return the five required descriptive measures using population DP."""
    values = pd.Series(series).dropna().astype(float)
    mean = float(values.mean())
    std = float(values.std(ddof=0))
    return {
        "n": int(values.size),
        "mean": mean,
        "mode": float(values.mode().iat[0]),
        "median": float(values.median()),
        "std": std,
        "variance": float(values.var(ddof=0)),
        "cv": float(std / mean) if mean else float("nan"),
    }


def analysis_tables(frame: pd.DataFrame | None = None) -> dict[str, pd.DataFrame]:
    """Build the audit tables rendered by the accompanying notebook."""
    data = source_frame() if frame is None else frame
    survived = describe_series(data["Survived"])
    pclass = describe_series(data["Pclass"])

    frequencies = pd.DataFrame(
        {
            "Categoria": ["Não sobreviveu", "Sobreviveu", "1ª classe", "2ª classe", "3ª classe"],
            "Variável": ["Survived", "Survived", "Pclass", "Pclass", "Pclass"],
            "Quantidade": [
                int((data["Survived"] == 0).sum()),
                int((data["Survived"] == 1).sum()),
                int((data["Pclass"] == 1).sum()),
                int((data["Pclass"] == 2).sum()),
                int((data["Pclass"] == 3).sum()),
            ],
        }
    )
    frequencies["Percentual (%)"] = frequencies["Quantidade"] / len(data) * 100

    measures = pd.DataFrame(
        [
            {"Variável": "Sobrevivência", **survived},
            {"Variável": "Classe de passagem", **pclass},
        ]
    ).set_index("Variável").rename(
        columns={
            "n": "n",
            "mean": "Média",
            "mode": "Moda",
            "median": "Mediana",
            "std": "Desvio padrão (ddof=0)",
            "variance": "Variância",
            "cv": "CV (%)",
        }
    )

    counts = pd.crosstab(data["Pclass"], data["Survived"]).reindex(
        index=[1, 2, 3], columns=[0, 1], fill_value=0
    )
    counts.columns = ["Não sobreviveu", "Sobreviveu"]
    counts.index = ["1ª classe", "2ª classe", "3ª classe"]
    counts["Total"] = counts.sum(axis=1)
    counts["Taxa de sobrevivência (%)"] = counts["Sobreviveu"] / counts["Total"] * 100

    summary = pd.DataFrame(
        {
            "Item": ["Registros", "Colunas", "Valores válidos em Survived", "Valores válidos em Pclass"],
            "Resultado": [len(data), len(data.columns), data["Survived"].notna().sum(), data["Pclass"].notna().sum()],
        }
    )
    return {"summary": summary, "frequencies": frequencies, "measures": measures, "class_survival": counts}


@lru_cache(maxsize=1)
def metric_payloads() -> dict[str, dict[str, Any]]:
    """Build the JSON-ready metrics consumed by the presentation frontend."""
    frame = source_frame()
    total = len(frame)
    survived_total = int(frame["Survived"].sum())
    deceased = total - survived_total
    pclass_counts = frame["Pclass"].value_counts().sort_index()
    survival_by_class = frame.groupby("Pclass")["Survived"].agg(["sum", "count"])

    class_rows = []
    for pclass, row in survival_by_class.iterrows():
        survivors = int(row["sum"])
        count = int(row["count"])
        rate = survivors / count
        class_rows.append(
            {
                "class": f"{int(pclass)}ª classe", "pclass": int(pclass), "survivors": survivors,
                "deceased": count - survivors, "total": count, "rate": round(rate, 6),
                "rate_label": percentage(rate), "formula": f"{survivors} ÷ {count} × 100 = {percentage(rate)}",
            }
        )

    measures = analysis_tables(frame)["measures"]
    pclass_mean = float(measures.loc["Classe de passagem", "Média"])
    pclass_std = float(measures.loc["Classe de passagem", "Desvio padrão (ddof=0)"])
    survived_mean = float(measures.loc["Sobrevivência", "Média"])
    survived_std = float(measures.loc["Sobrevivência", "Desvio padrão (ddof=0)"])

    sex_labels = {"female": "Mulheres", "male": "Homens"}
    sex_summary = frame.groupby("Sex")["Survived"].agg(["sum", "count"])
    sex_rows = []
    for sex in ("female", "male"):
        survivors = int(sex_summary.loc[sex, "sum"])
        group_total = int(sex_summary.loc[sex, "count"])
        rate = survivors / group_total
        sex_rows.append({"sex": sex, "label": sex_labels[sex], "survivors": survivors, "total": group_total,
                         "rate": round(rate, 6), "rate_label": percentage(rate),
                         "formula": f"{survivors} ÷ {group_total} × 100 = {percentage(rate)}"})

    age_known = frame.loc[frame["Age"].notna()].copy()
    age_known["age_group"] = np.where(age_known["Age"] < 18, "Menores de 18 anos", "Adultos")
    age_summary = age_known.groupby("age_group")["Survived"].agg(["sum", "count"])
    age_rows = []
    for label in ("Menores de 18 anos", "Adultos"):
        survivors = int(age_summary.loc[label, "sum"])
        group_total = int(age_summary.loc[label, "count"])
        rate = survivors / group_total
        age_rows.append({"label": label, "survivors": survivors, "total": group_total, "rate": round(rate, 6),
                         "rate_label": percentage(rate), "formula": f"{survivors} ÷ {group_total} × 100 = {percentage(rate)}"})

    minors = age_known.loc[age_known["Age"] < 18]
    minor_class_summary = minors.groupby("Pclass")["Survived"].agg(["sum", "count"])
    minor_class_rows = []
    for pclass in (1, 2, 3):
        survivors = int(minor_class_summary.loc[pclass, "sum"])
        group_total = int(minor_class_summary.loc[pclass, "count"])
        rate = survivors / group_total
        minor_class_rows.append({"class": f"{pclass}ª classe", "pclass": pclass, "survivors": survivors,
                                 "total": group_total, "rate": round(rate, 6), "rate_label": percentage(rate),
                                 "formula": f"{survivors} ÷ {group_total} × 100 = {percentage(rate)}"})

    return {
        "overview": {"slug": "overview", "title": "A base em números", "total_passengers": total,
                     "columns": int(len(frame.columns)), "variables_in_focus": 2,
                     "missing_in_focus": int(frame[["Survived", "Pclass"]].isna().sum().sum()),
                     "source": "Kaggle · Titanic — Machine Learning from Disaster · train.csv"},
        "survival-overview": {"slug": "survival-overview", "title": "Sobrevivência geral", "survived": survived_total,
                              "deceased": deceased, "survival_rate": round(survived_total / total, 6),
                              "survival_rate_label": percentage(survived_total / total),
                              "deceased_rate_label": percentage(deceased / total),
                              "formula": f"{survived_total} ÷ {total} × 100 = {percentage(survived_total / total)}"},
        "class-distribution": {"slug": "class-distribution", "title": "Distribuição por classe", "rows": [
            {"class": f"{int(pclass)}ª classe", "pclass": int(pclass), "count": int(count),
             "share": round(int(count) / total, 6), "share_label": percentage(int(count) / total)}
            for pclass, count in pclass_counts.items()]},
        "survival-by-class": {"slug": "survival-by-class", "title": "Taxa de sobrevivência por classe", "rows": class_rows,
                              "gap_first_to_third": round(class_rows[0]["rate"] - class_rows[2]["rate"], 6),
                              "gap_label": f"{(class_rows[0]['rate'] - class_rows[2]['rate']) * 100:.1f}".replace(".", ",") + " pontos percentuais"},
        "central-tendency": {"slug": "central-tendency", "title": "Média, moda e mediana",
                              "survived": {"mean": survived_mean, "mean_label": f"{decimal(survived_mean)} → {percentage(survived_mean)}",
                                           "mode": int(measures.loc["Sobrevivência", "Moda"]), "median": float(measures.loc["Sobrevivência", "Mediana"])},
                              "pclass": {"mean": pclass_mean, "mean_label": decimal(pclass_mean),
                                         "mode": int(measures.loc["Classe de passagem", "Moda"]), "median": float(measures.loc["Classe de passagem", "Mediana"])},
                              "note": "A média de Pclass resume códigos ordinais; não representa uma classe real."},
        "human-context": {"slug": "human-context", "title": "Recortes complementares", "sex": sex_rows,
                          "age": {"known_total": int(len(age_known)), "missing_total": int(frame["Age"].isna().sum()), "rows": age_rows},
                          "minors_by_class": minor_class_rows,
                          "note": "As médias de Survived dentro de cada grupo são taxas descritivas. Os recortes ajudam a contextualizar a história, mas não isolam causas individuais."},
        "dispersion": {"slug": "dispersion", "title": "Dispersão",
                       "pclass": {"std": pclass_std, "std_label": decimal(pclass_std), "cv": pclass_std / pclass_mean, "cv_label": percentage(pclass_std / pclass_mean)},
                       "survived": {"std": survived_std, "std_label": decimal(survived_std), "cv": survived_std / survived_mean, "cv_label": percentage(survived_std / survived_mean)},
                       "formula": "DP ÷ média × 100", "note": "Os coeficientes descrevem a dispersão dos códigos e exigem cautela na interpretação."},
    }


def bootstrap() -> None:
    """Validate the CSV and calculate the presentation values on startup."""
    source_frame()
    metric_payloads()
