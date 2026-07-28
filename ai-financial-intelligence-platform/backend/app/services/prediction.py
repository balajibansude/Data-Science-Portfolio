from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

import joblib
import pandas as pd
from sqlalchemy.orm import Session

from app.models import Prediction as PredictionRecord


class ModelNotFoundError(Exception):
    """Raised when a requested model artifact is not found."""


class InvalidPredictionInputError(Exception):
    """Raised when input features are invalid for inference."""


@dataclass(frozen=True)
class PredictionResult:
    prediction_id: UUID
    model_id: UUID
    predictions: list[float]


def predict_with_model(
    *,
    model_id: UUID,
    inputs: dict[str, Any] | list[dict[str, Any]],
    models_directory: Path,
    db: Session | None = None,
) -> PredictionResult:
    """Load a saved joblib model pipeline, run prediction on single or batch inputs, and persist results."""
    model_file = models_directory / f"{model_id}.joblib"
    if not model_file.is_file():
        raise ModelNotFoundError(f"Trained model '{model_id}' was not found.")

    if isinstance(inputs, dict):
        input_rows = [inputs]
    elif isinstance(inputs, list):
        input_rows = inputs
    else:
        raise InvalidPredictionInputError("Inputs must be an object or list of objects.")

    if not input_rows:
        raise InvalidPredictionInputError("Input data cannot be empty.")

    try:
        input_df = pd.DataFrame(input_rows)
        pipeline = joblib.load(model_file)
        raw_predictions = pipeline.predict(input_df)
        predictions_list = [float(p) for p in raw_predictions]
    except Exception as error:
        raise InvalidPredictionInputError(f"Prediction failed: {str(error)}") from error

    prediction_id = uuid4()
    if db is not None:
        prediction_record = PredictionRecord(
            id=prediction_id,
            model_id=model_id,
            input_json={"inputs": inputs},
            prediction_json={"predictions": predictions_list},
            created_at=datetime.now(timezone.utc),
        )
        db.add(prediction_record)
        db.commit()
        db.refresh(prediction_record)

    return PredictionResult(
        prediction_id=prediction_id,
        model_id=model_id,
        predictions=predictions_list,
    )
