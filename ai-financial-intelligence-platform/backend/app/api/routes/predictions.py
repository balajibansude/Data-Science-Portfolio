from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db_session
from app.schemas.dataset import PredictRequest, PredictResponse
from app.services.prediction import (
    InvalidPredictionInputError,
    ModelNotFoundError,
    predict_with_model,
)

router = APIRouter()


@router.post("/{model_id}/predict", response_model=PredictResponse, status_code=status.HTTP_200_OK)
def predict_model_endpoint(
    model_id: UUID,
    request: PredictRequest,
    db: Session = Depends(get_db_session),
) -> PredictResponse:
    """Execute single or batch prediction using a trained joblib model pipeline."""
    try:
        result = predict_with_model(
            model_id=model_id,
            inputs=request.inputs,
            models_directory=settings.models_dir,
            db=db,
        )
    except ModelNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except InvalidPredictionInputError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error

    return PredictResponse(
        prediction_id=result.prediction_id,
        model_id=result.model_id,
        predictions=result.predictions,
    )
