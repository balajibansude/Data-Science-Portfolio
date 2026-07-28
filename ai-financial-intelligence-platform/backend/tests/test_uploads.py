import asyncio
from pathlib import Path

import httpx

from app.core.config import settings
from app.main import app


def _post_upload(
    filename: str, content: bytes, content_type: str = "text/csv"
) -> httpx.Response:
    async def request() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.post(
                "/api/v1/datasets/uploads",
                files={"file": (filename, content, content_type)},
            )

    return asyncio.run(request())


def test_upload_csv_stores_file_and_returns_metadata(tmp_path: Path) -> None:
    previous_directory = settings.upload_dir
    previous_reports_directory = settings.reports_dir
    settings.upload_dir = tmp_path
    settings.reports_dir = tmp_path / "reports"
    try:
        response = _post_upload("transactions.csv", b"date,amount\n2026-01-01,99.50\n")
    finally:
        settings.upload_dir = previous_directory
        settings.reports_dir = previous_reports_directory

    assert response.status_code == 201
    payload = response.json()
    assert payload["original_filename"] == "transactions.csv"
    assert payload["size_bytes"] == 29
    assert payload["row_count"] == 1
    assert payload["columns"] == ["date", "amount"]
    assert Path(tmp_path, payload["stored_filename"]).read_bytes() == b"date,amount\n2026-01-01,99.50\n"
    assert payload["analysis"]["shape"] == {"rows": 1, "columns": 2}
    assert payload["analysis"]["missing_values"] == {"date": 0, "amount": 0}
    assert payload["analysis"]["statistics"]["amount"]["mean"] == 99.5
    assert [item["chart_type"] for item in payload["visualizations"]] == [
        "histogram", "boxplot", "scatter_plot", "correlation_heatmap", "line_chart"
    ]
    for visualization in payload["visualizations"]:
        assert (tmp_path / visualization["path"]).is_file()
    assert payload["preprocessing"] == {
        "input_features": ["date", "amount"],
        "engineered_features": ["missing_value_count", "date_year", "date_month", "date_day", "date_day_of_week"],
        "output_feature_count": 6,
        "steps": ["feature_engineering", "numeric_imputation_and_scaling", "categorical_imputation_and_encoding"],
    }


def test_upload_returns_complete_exploratory_analysis(tmp_path: Path) -> None:
    previous_directory = settings.upload_dir
    previous_reports_directory = settings.reports_dir
    settings.upload_dir = tmp_path
    settings.reports_dir = tmp_path / "reports"
    try:
        response = _post_upload(
            "portfolio.csv",
            b"customer_id,revenue,segment,target\n1,100,A,0\n2,,B,1\n2,,B,1\n4,400,A,0\n",
        )
    finally:
        settings.upload_dir = previous_directory
        settings.reports_dir = previous_reports_directory

    assert response.status_code == 201
    analysis = response.json()["analysis"]
    assert analysis["shape"] == {"rows": 4, "columns": 4}
    assert analysis["missing_values"] == {"customer_id": 0, "revenue": 2, "segment": 0, "target": 0}
    assert analysis["duplicate_rows"] == 1
    assert analysis["column_types"] == {"customer_id": "int64", "revenue": "float64", "segment": "object", "target": "int64"}
    assert analysis["statistics"]["revenue"]["count"] == 2
    assert analysis["statistics"]["revenue"]["mean"] == 250.0
    assert analysis["correlation"]["customer_id"]["target"] is not None
    assert {suggestion["column"] for suggestion in analysis["target_suggestions"]} >= {"target", "segment"}
    preprocessing = response.json()["preprocessing"]
    assert preprocessing["input_features"] == ["customer_id", "revenue", "segment", "target"]
    assert preprocessing["engineered_features"] == ["missing_value_count"]
    assert preprocessing["output_feature_count"] == 6


def test_upload_rejects_non_csv_extension(tmp_path: Path) -> None:
    previous_directory = settings.upload_dir
    settings.upload_dir = tmp_path
    try:
        response = _post_upload("transactions.txt", b"date,amount\n2026-01-01,99.50\n")
    finally:
        settings.upload_dir = previous_directory

    assert response.status_code == 400
    assert response.json()["detail"] == "Only files with a .csv extension are accepted."
    assert not list(tmp_path.iterdir())


def test_upload_rejects_malformed_csv_without_leaving_partial_file(tmp_path: Path) -> None:
    previous_directory = settings.upload_dir
    settings.upload_dir = tmp_path
    try:
        response = _post_upload("broken.csv", b"date,amount\n2026-01-01,\"99.50\n")
    finally:
        settings.upload_dir = previous_directory

    assert response.status_code == 400
    assert response.json()["detail"] == "The uploaded file is not a valid CSV document."
    assert not list(tmp_path.iterdir())


def test_upload_rejects_files_that_exceed_the_configured_size_limit(tmp_path: Path) -> None:
    previous_directory = settings.upload_dir
    previous_limit = settings.upload_max_size_bytes
    settings.upload_dir = tmp_path
    settings.upload_max_size_bytes = 10
    try:
        response = _post_upload("large.csv", b"header\nthis row exceeds the limit\n")
    finally:
        settings.upload_dir = previous_directory
        settings.upload_max_size_bytes = previous_limit

    assert response.status_code == 413
    assert response.json()["detail"] == "CSV files cannot exceed 10 bytes."
    assert not list(tmp_path.iterdir())
