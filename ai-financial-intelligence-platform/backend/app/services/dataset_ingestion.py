from dataclasses import dataclass
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.models import Dataset
from app.services.csv_upload import StoredCsv, store_csv_upload
from app.services.eda import ExploratoryProfile, analyze_csv
from app.services.preprocessing import PreprocessingProfile, profile_preprocessing
from app.services.visualizations import GeneratedVisualization, generate_visualizations


@dataclass(frozen=True)
class AnalyzedDataset:
    """The result of the upload-and-profile application use case."""

    dataset: StoredCsv
    analysis: ExploratoryProfile
    visualizations: list[GeneratedVisualization]
    preprocessing: PreprocessingProfile


async def ingest_csv_dataset(
    upload: UploadFile,
    *,
    storage_directory: Path,
    reports_directory: Path,
    max_size_bytes: int,
    db: Session | None = None,
) -> AnalyzedDataset:
    """Store a CSV, profile it, generate reports, persist database record, and roll back on failure."""
    dataset = await store_csv_upload(upload, storage_directory=storage_directory, max_size_bytes=max_size_bytes)
    stored_path = storage_directory / dataset.stored_filename
    try:
        analysis = analyze_csv(stored_path)
        visualizations = generate_visualizations(stored_path, reports_directory, dataset.id)
        preprocessing = profile_preprocessing(stored_path)

        if db is not None:
            dataset_record = Dataset(
                id=dataset.id,
                filename=dataset.stored_filename,
                original_filename=dataset.original_filename,
                upload_timestamp=dataset.created_at,
                row_count=dataset.row_count,
                column_count=len(dataset.columns),
                status="processed",
                created_at=dataset.created_at,
                updated_at=dataset.created_at,
            )
            db.add(dataset_record)
            db.commit()
            db.refresh(dataset_record)
    except Exception:
        stored_path.unlink(missing_ok=True)
        raise

    return AnalyzedDataset(
        dataset=dataset,
        analysis=analysis,
        visualizations=visualizations,
        preprocessing=preprocessing,
    )
