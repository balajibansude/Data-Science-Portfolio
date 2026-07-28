from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from tempfile import NamedTemporaryFile
from uuid import UUID, uuid4

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score, root_mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.tree import DecisionTreeRegressor
from sqlalchemy.orm import Session
from xgboost import XGBRegressor

from app.models import TrainedModel as TrainedModelRecord
from app.services.preprocessing import build_preprocessing_pipeline

MODEL_TYPES = ("linear_regression", "decision_tree", "random_forest", "xgboost")
RANDOM_STATE = 42
MINIMUM_TRAINING_ROWS = 10


class ModelTrainingError(Exception):
    """Raised when a requested regression model cannot be trained safely."""


@dataclass(frozen=True)
class ModelMetrics:
    mae: float
    rmse: float
    r2: float


@dataclass(frozen=True)
class TrainedModel:
    model_id: UUID
    dataset_id: UUID
    model_type: str
    target_column: str
    training_rows: int
    test_rows: int
    metrics: ModelMetrics
    model_path: str


def _build_estimator(model_type: str):
    estimators = {
        "linear_regression": LinearRegression(),
        "decision_tree": DecisionTreeRegressor(random_state=RANDOM_STATE),
        "random_forest": RandomForestRegressor(n_estimators=200, random_state=RANDOM_STATE, n_jobs=-1),
        "xgboost": XGBRegressor(
            objective="reg:squarederror",
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=RANDOM_STATE,
            n_jobs=1,
        ),
    }
    try:
        return estimators[model_type]
    except KeyError as error:
        raise ModelTrainingError(f"Unsupported model type: {model_type}.") from error


def _load_training_data(file_path: Path, target_column: str) -> tuple[pd.DataFrame, pd.Series]:
    try:
        dataframe = pd.read_csv(file_path, encoding="utf-8-sig", on_bad_lines="error")
    except (OSError, UnicodeDecodeError, pd.errors.ParserError) as error:
        raise ModelTrainingError("The stored dataset could not be loaded for training.") from error

    if target_column not in dataframe.columns:
        raise ModelTrainingError(f"Target column '{target_column}' does not exist in this dataset.")

    raw_target = dataframe[target_column]
    target = pd.to_numeric(raw_target, errors="coerce")
    if target.notna().sum() != raw_target.notna().sum():
        raise ModelTrainingError("Regression training requires a numeric target column.")

    usable_rows = target.notna()
    features = dataframe.loc[usable_rows].drop(columns=target_column)
    target = target.loc[usable_rows]
    if len(features) < MINIMUM_TRAINING_ROWS:
        raise ModelTrainingError(f"At least {MINIMUM_TRAINING_ROWS} rows with a target value are required for training.")
    if features.shape[1] == 0:
        raise ModelTrainingError("At least one feature column is required for training.")
    return features, target


def _save_model(pipeline: Pipeline, models_directory: Path, model_id: UUID) -> str:
    models_directory.mkdir(mode=0o750, parents=True, exist_ok=True)
    destination = models_directory / f"{model_id}.joblib"
    temporary_path: Path | None = None
    try:
        with NamedTemporaryFile(dir=models_directory, prefix=".model-", suffix=".tmp", delete=False) as temporary_file:
            temporary_path = Path(temporary_file.name)
        joblib.dump(pipeline, temporary_path)
        temporary_path.replace(destination)
        temporary_path = None
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)
    return f"models/{destination.name}"


def train_regression_model(
    *,
    dataset_id: UUID,
    dataset_path: Path,
    target_column: str,
    model_type: str,
    models_directory: Path,
    db: Session | None = None,
) -> TrainedModel:
    """Fit, evaluate, and persist a complete preprocessing-plus-regression pipeline."""
    features, target = _load_training_data(dataset_path, target_column)
    x_train, x_test, y_train, y_test = train_test_split(
        features, target, test_size=0.2, random_state=RANDOM_STATE
    )
    pipeline = Pipeline(
        steps=[
            ("preprocessing", build_preprocessing_pipeline()),
            ("model", _build_estimator(model_type)),
        ]
    )
    try:
        pipeline.fit(x_train, y_train)
        predictions = pipeline.predict(x_test)
    except (ValueError, TypeError) as error:
        raise ModelTrainingError("The selected model could not be trained with this dataset.") from error

    model_id = uuid4()
    model_path = _save_model(pipeline, models_directory, model_id)
    metrics = ModelMetrics(
        mae=float(mean_absolute_error(y_test, predictions)),
        rmse=float(root_mean_squared_error(y_test, predictions)),
        r2=float(r2_score(y_test, predictions)),
    )

    if db is not None:
        model_record = TrainedModelRecord(
            id=model_id,
            dataset_id=dataset_id,
            algorithm=model_type,
            model_path=model_path,
            metrics_json={
                "mae": metrics.mae,
                "rmse": metrics.rmse,
                "r2": metrics.r2,
            },
            feature_columns=list(features.columns),
            target_column=target_column,
            created_at=datetime.now(timezone.utc),
        )
        db.add(model_record)
        db.commit()
        db.refresh(model_record)

    return TrainedModel(
        model_id=model_id,
        dataset_id=dataset_id,
        model_type=model_type,
        target_column=target_column,
        training_rows=len(x_train),
        test_rows=len(x_test),
        metrics=metrics,
        model_path=model_path,
    )
