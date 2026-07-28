from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db_session
from app.schemas.dataset import (
    DatasetUploadResponse,
    ExploratoryDataAnalysis,
    PreprocessingSummary,
    VisualizationReport,
)
from app.services.csv_upload import CsvUploadError
from app.services.dataset_ingestion import ingest_csv_dataset
from app.services.eda import DataAnalysisError
from app.services.preprocessing import DataPreprocessingError
from app.services.visualizations import VisualizationError

router = APIRouter()


@router.post("/uploads", response_model=DatasetUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db_session),
) -> DatasetUploadResponse:
    """Accept, profile, and persist one UTF-8 CSV file and store dataset metadata."""
    try:
        analyzed_dataset = await ingest_csv_dataset(
            file,
            storage_directory=settings.upload_dir,
            reports_directory=settings.reports_dir,
            max_size_bytes=settings.upload_max_size_bytes,
            db=db,
        )
    except CsvUploadError as error:
        raise HTTPException(status_code=error.status_code, detail=error.detail) from error
    except (DataAnalysisError, VisualizationError, DataPreprocessingError) as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error

    dataset = analyzed_dataset.dataset
    analysis = analyzed_dataset.analysis
    return DatasetUploadResponse(
        **dataset.__dict__,
        analysis=ExploratoryDataAnalysis(
            shape={"rows": analysis.rows, "columns": analysis.columns},
            missing_values=analysis.missing_values,
            duplicate_rows=analysis.duplicate_rows,
            statistics={column: values.__dict__ for column, values in analysis.statistics.items()},
            column_types=analysis.column_types,
            correlation=analysis.correlation,
            target_suggestions=[suggestion.__dict__ for suggestion in analysis.target_suggestions],
        ),
        visualizations=[VisualizationReport(**visualization.__dict__) for visualization in analyzed_dataset.visualizations],
        preprocessing=PreprocessingSummary(**analyzed_dataset.preprocessing.__dict__),
    )
