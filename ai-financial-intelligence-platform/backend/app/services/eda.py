from dataclasses import dataclass
from math import isfinite
from pathlib import Path

import pandas as pd


class DataAnalysisError(Exception):
    """Raised when a validated stored CSV cannot be profiled."""


@dataclass(frozen=True)
class NumericStatistics:
    count: int
    mean: float | None
    std: float | None
    min: float | None
    percentile_25: float | None
    median: float | None
    percentile_75: float | None
    max: float | None


@dataclass(frozen=True)
class SuggestedTarget:
    column: str
    task_type: str
    reason: str


@dataclass(frozen=True)
class ExploratoryProfile:
    rows: int
    columns: int
    missing_values: dict[str, int]
    duplicate_rows: int
    statistics: dict[str, NumericStatistics]
    column_types: dict[str, str]
    correlation: dict[str, dict[str, float | None]]
    target_suggestions: list[SuggestedTarget]


TARGET_NAME_HINTS = ("target", "label", "class", "outcome", "default", "fraud", "churn", "risk", "status")


def _finite_float(value: object) -> float | None:
    if pd.isna(value):
        return None
    numeric_value = float(value)
    return numeric_value if isfinite(numeric_value) else None


def _numeric_statistics(dataframe: pd.DataFrame) -> dict[str, NumericStatistics]:
    numeric = dataframe.select_dtypes(include="number")
    if numeric.empty:
        return {}

    described = numeric.describe().transpose()
    return {
        str(column): NumericStatistics(
            count=int(values["count"]),
            mean=_finite_float(values["mean"]),
            std=_finite_float(values["std"]),
            min=_finite_float(values["min"]),
            percentile_25=_finite_float(values["25%"]),
            median=_finite_float(values["50%"]),
            percentile_75=_finite_float(values["75%"]),
            max=_finite_float(values["max"]),
        )
        for column, values in described.iterrows()
    }


def _correlation(dataframe: pd.DataFrame) -> dict[str, dict[str, float | None]]:
    numeric = dataframe.select_dtypes(include="number")
    if numeric.empty:
        return {}

    matrix = numeric.corr()
    return {
        str(column): {str(related): _finite_float(value) for related, value in values.items()}
        for column, values in matrix.to_dict().items()
    }


def _target_suggestions(dataframe: pd.DataFrame) -> list[SuggestedTarget]:
    suggestions: list[SuggestedTarget] = []
    rows = len(dataframe)

    for column in dataframe.columns:
        series = dataframe[column]
        non_null = series.dropna()
        unique_count = int(non_null.nunique())
        unique_ratio = unique_count / max(len(non_null), 1)
        normalized_name = str(column).lower().replace(" ", "_")
        is_named_target = any(hint in normalized_name for hint in TARGET_NAME_HINTS)
        is_numeric = pd.api.types.is_numeric_dtype(series)

        if unique_count < 2 or unique_ratio > 0.95:
            continue

        if is_named_target:
            task_type = "classification" if unique_count <= 20 else "regression"
            suggestions.append(SuggestedTarget(str(column), task_type, "The column name matches a common target-label convention."))
        elif is_numeric and unique_count > 20 and unique_ratio < 0.8:
            suggestions.append(SuggestedTarget(str(column), "regression", "Numeric column has enough repeated observations for a regression target candidate."))
        elif not is_numeric and unique_count <= min(20, max(rows // 2, 2)):
            suggestions.append(SuggestedTarget(str(column), "classification", "Categorical column has a bounded number of repeated classes."))

    return suggestions[:5]


def analyze_csv(file_path: Path) -> ExploratoryProfile:
    """Profile a stored UTF-8 CSV with pandas and return JSON-safe primitives."""
    try:
        dataframe = pd.read_csv(file_path, encoding="utf-8-sig", on_bad_lines="error")
    except (OSError, UnicodeDecodeError, pd.errors.ParserError) as error:
        raise DataAnalysisError("The uploaded CSV could not be analyzed.") from error

    return ExploratoryProfile(
        rows=int(dataframe.shape[0]),
        columns=int(dataframe.shape[1]),
        missing_values={str(column): int(count) for column, count in dataframe.isna().sum().items()},
        duplicate_rows=int(dataframe.duplicated().sum()),
        statistics=_numeric_statistics(dataframe),
        column_types={str(column): str(dtype) for column, dtype in dataframe.dtypes.items()},
        correlation=_correlation(dataframe),
        target_suggestions=_target_suggestions(dataframe),
    )
