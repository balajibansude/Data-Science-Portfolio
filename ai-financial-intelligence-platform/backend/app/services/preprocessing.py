from dataclasses import dataclass
from pathlib import Path

import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer, make_column_selector
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


class DataPreprocessingError(Exception):
    """Raised when a stored CSV cannot be transformed into model-ready features."""


class FeatureEngineeringTransformer(BaseEstimator, TransformerMixin):
    """Create generic date parts and a row-level missing-value count without target knowledge."""

    date_name_hints = ("date", "time", "timestamp")

    def fit(self, features: pd.DataFrame, y: object = None) -> "FeatureEngineeringTransformer":
        self.date_columns_ = [
            str(column)
            for column in features.columns
            if self._is_date_column(features[str(column)], str(column))
        ]
        return self

    def transform(self, features: pd.DataFrame) -> pd.DataFrame:
        transformed = features.copy()
        transformed["missing_value_count"] = transformed.isna().sum(axis=1)
        for column in self.date_columns_:
            parsed = pd.to_datetime(transformed[column], errors="coerce", format="mixed")
            transformed[f"{column}_year"] = parsed.dt.year
            transformed[f"{column}_month"] = parsed.dt.month
            transformed[f"{column}_day"] = parsed.dt.day
            transformed[f"{column}_day_of_week"] = parsed.dt.dayofweek
            transformed = transformed.drop(columns=column)
        return transformed

    def get_engineered_feature_names(self) -> list[str]:
        names = ["missing_value_count"]
        for column in self.date_columns_:
            names.extend([f"{column}_year", f"{column}_month", f"{column}_day", f"{column}_day_of_week"])
        return names

    def _is_date_column(self, series: pd.Series, column_name: str) -> bool:
        if not any(hint in column_name.lower() for hint in self.date_name_hints):
            return False
        parsed = pd.to_datetime(series.dropna(), errors="coerce", format="mixed")
        return not parsed.empty and float(parsed.notna().mean()) >= 0.8


def build_preprocessing_pipeline() -> Pipeline:
    """Build one sklearn Pipeline for generic tabular model inputs."""
    numeric_pipeline = Pipeline(
        steps=[
            ("impute", SimpleImputer(strategy="median")),
            ("scale", StandardScaler()),
        ]
    )
    categorical_pipeline = Pipeline(
        steps=[
            ("impute", SimpleImputer(strategy="most_frequent")),
            ("encode", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )
    column_preprocessor = ColumnTransformer(
        transformers=[
            ("numeric", numeric_pipeline, make_column_selector(dtype_include="number")),
            ("categorical", categorical_pipeline, make_column_selector(dtype_exclude="number")),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )
    return Pipeline(
        steps=[
            ("feature_engineering", FeatureEngineeringTransformer()),
            ("preprocess_columns", column_preprocessor),
        ]
    )


@dataclass(frozen=True)
class PreprocessingProfile:
    input_features: list[str]
    engineered_features: list[str]
    output_feature_count: int
    steps: list[str]


def profile_preprocessing(file_path: Path) -> PreprocessingProfile:
    """Fit-transform a stored CSV to validate the pipeline and report its output shape."""
    try:
        dataframe = pd.read_csv(file_path, encoding="utf-8-sig", on_bad_lines="error")
        pipeline = build_preprocessing_pipeline()
        transformed = pipeline.fit_transform(dataframe)
        feature_engineer = pipeline.named_steps["feature_engineering"]
        column_preprocessor = pipeline.named_steps["preprocess_columns"]
        output_feature_count = len(column_preprocessor.get_feature_names_out())
    except (OSError, UnicodeDecodeError, ValueError, TypeError, pd.errors.ParserError) as error:
        raise DataPreprocessingError("The uploaded CSV could not be preprocessed.") from error

    return PreprocessingProfile(
        input_features=[str(column) for column in dataframe.columns],
        engineered_features=feature_engineer.get_engineered_feature_names(),
        output_feature_count=output_feature_count if transformed is not None else 0,
        steps=["feature_engineering", "numeric_imputation_and_scaling", "categorical_imputation_and_encoding"],
    )
