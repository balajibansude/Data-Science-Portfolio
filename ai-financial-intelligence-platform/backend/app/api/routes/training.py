from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db_session
from app.schemas.dataset import TrainModelRequest, TrainedModelResponse
from app.services.training import ModelTrainingError, train_regression_model

router = APIRouter()


@router.post("/{dataset_id}/train", response_model=TrainedModelResponse, status_code=status.HTTP_201_CREATED)
def train_dataset_model(
    dataset_id: UUID,
    request: TrainModelRequest,
    db: Session = Depends(get_db_session),
) -> TrainedModelResponse:
    """Train and persist one user-selected regression model for a stored dataset."""
    dataset_path = settings.upload_dir / f"{dataset_id}.csv"
    if not dataset_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found.")

    try:
        trained_model = train_regression_model(
            dataset_id=dataset_id,
            dataset_path=dataset_path,
            target_column=request.target_column,
            model_type=request.model_type,
            models_directory=settings.models_dir,
            db=db,
        )
    except ModelTrainingError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error

    payload = trained_model.__dict__.copy()
    payload["metrics"] = trained_model.metrics.__dict__
    return TrainedModelResponse(**payload)
