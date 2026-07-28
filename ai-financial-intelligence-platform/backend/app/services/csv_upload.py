import csv
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from tempfile import NamedTemporaryFile
from uuid import UUID, uuid4

from fastapi import UploadFile

ALLOWED_CONTENT_TYPES = {"text/csv", "application/csv", "application/vnd.ms-excel"}
CHUNK_SIZE = 1024 * 1024


class CsvUploadError(Exception):
    """A user-correctable error encountered while accepting a CSV upload."""

    def __init__(self, detail: str, status_code: int = 400) -> None:
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


@dataclass(frozen=True)
class StoredCsv:
    """Validated CSV metadata before it is converted to an API response."""

    id: UUID
    original_filename: str
    stored_filename: str
    content_type: str
    size_bytes: int
    row_count: int
    columns: list[str]
    created_at: datetime


def _validate_filename(filename: str | None) -> str:
    if not filename:
        raise CsvUploadError("A filename is required.")

    safe_filename = Path(filename).name
    if safe_filename != filename or Path(safe_filename).suffix.lower() != ".csv":
        raise CsvUploadError("Only files with a .csv extension are accepted.")
    return safe_filename


def _validate_csv(file_path: Path) -> tuple[list[str], int]:
    try:
        with file_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
            reader = csv.reader(csv_file, strict=True)
            headers = next(reader, None)
            if not headers or not any(header.strip() for header in headers):
                raise CsvUploadError("CSV files must include a non-empty header row.")

            normalized_headers = [header.strip() for header in headers]
            if any(not header for header in normalized_headers):
                raise CsvUploadError("CSV column names cannot be empty.")
            if len(set(normalized_headers)) != len(normalized_headers):
                raise CsvUploadError("CSV column names must be unique.")

            row_count = 0
            for row in reader:
                if len(row) != len(headers):
                    raise CsvUploadError("Every CSV row must contain the same number of columns as the header.")
                row_count += 1
    except UnicodeDecodeError as error:
        raise CsvUploadError("CSV files must use UTF-8 encoding.") from error
    except csv.Error as error:
        raise CsvUploadError("The uploaded file is not a valid CSV document.") from error

    return normalized_headers, row_count


async def store_csv_upload(
    upload: UploadFile, *, storage_directory: Path, max_size_bytes: int
) -> StoredCsv:
    """Save a validated CSV atomically, never trusting a client-provided path."""
    original_filename = _validate_filename(upload.filename)
    content_type = upload.content_type or "application/octet-stream"
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise CsvUploadError("The uploaded file must have a CSV content type.")

    storage_directory.mkdir(mode=0o750, parents=True, exist_ok=True)
    temporary_path: Path | None = None
    size_bytes = 0

    try:
        with NamedTemporaryFile(dir=storage_directory, prefix=".upload-", suffix=".tmp", delete=False) as temporary_file:
            temporary_path = Path(temporary_file.name)
            while chunk := await upload.read(CHUNK_SIZE):
                size_bytes += len(chunk)
                if size_bytes > max_size_bytes:
                    raise CsvUploadError(
                        f"CSV files cannot exceed {max_size_bytes} bytes.", status_code=413
                    )
                temporary_file.write(chunk)

        columns, row_count = _validate_csv(temporary_path)
        dataset_id = uuid4()
        stored_filename = f"{dataset_id}.csv"
        temporary_path.replace(storage_directory / stored_filename)
        temporary_path = None
        return StoredCsv(
            id=dataset_id,
            original_filename=original_filename,
            stored_filename=stored_filename,
            content_type=content_type,
            size_bytes=size_bytes,
            row_count=row_count,
            columns=columns,
            created_at=datetime.now(timezone.utc),
        )
    finally:
        await upload.close()
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)
