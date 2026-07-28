import asyncio
from pathlib import Path
from uuid import UUID, uuid4

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db_session
from app.main import app
from app.models import Dataset, Prediction, TrainedModel


def _post_upload(filename: str, content: bytes, content_type: str = "text/csv") -> httpx.Response:
    async def request() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.post(
                "/api/v1/datasets/uploads",
                files={"file": (filename, content, content_type)},
            )

    return asyncio.run(request())


def _post_train(dataset_id: str, target_column: str, model_type: str = "random_forest") -> httpx.Response:
    async def request() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.post(
                f"/api/v1/datasets/{dataset_id}/train",
                json={"target_column": target_column, "model_type": model_type},
            )

    return asyncio.run(request())


def _post_predict(model_id: str, inputs: dict | list) -> httpx.Response:
    async def request() -> httpx.Response:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
            return await client.post(
                f"/api/v1/models/{model_id}/predict",
                json={"inputs": inputs},
            )

    return asyncio.run(request())


def test_prediction_single_batch_and_db_persistence(tmp_path: Path) -> None:
    previous_upload_dir = settings.upload_dir
    previous_reports_dir = settings.reports_dir
    previous_models_dir = settings.models_dir
    settings.upload_dir = tmp_path
    settings.reports_dir = tmp_path / "reports"
    settings.models_dir = tmp_path / "models"
    try:
        # 1. Upload dataset (creating 12 usable rows)
        csv_lines = ["feature1,feature2,revenue"]
        for i in range(12):
            csv_lines.append(f"{i*10},{i*2},{100 + i*5}")
        upload_resp = _post_upload("data.csv", "\n".join(csv_lines).encode("utf-8"))
        assert upload_resp.status_code == 201
        dataset_id_str = upload_resp.json()["id"]

        # 2. Train model
        train_resp = _post_train(dataset_id_str, "revenue", "linear_regression")
        assert train_resp.status_code == 201
        model_id_str = train_resp.json()["model_id"]

        # 3. Single prediction
        single_resp = _post_predict(model_id_str, {"feature1": 15, "feature2": 3})
        assert single_resp.status_code == 200
        single_data = single_resp.json()
        assert len(single_data["predictions"]) == 1
        assert isinstance(single_data["predictions"][0], float)

        # 4. Batch prediction
        batch_resp = _post_predict(
            model_id_str,
            [
                {"feature1": 15, "feature2": 3},
                {"feature1": 25, "feature2": 5},
            ],
        )
        assert batch_resp.status_code == 200
        batch_data = batch_resp.json()
        assert len(batch_data["predictions"]) == 2

        # 5. Verify database persistence in test session
        db: Session = next(app.dependency_overrides[get_db_session]())
        dataset_rec = db.query(Dataset).filter_by(id=UUID(dataset_id_str)).first()
        assert dataset_rec is not None
        assert dataset_rec.row_count == 12

        model_rec = db.query(TrainedModel).filter_by(id=UUID(model_id_str)).first()
        assert model_rec is not None
        assert model_rec.algorithm == "linear_regression"
        assert model_rec.target_column == "revenue"

        pred_records = db.query(Prediction).filter_by(model_id=UUID(model_id_str)).all()
        assert len(pred_records) == 2
    finally:
        settings.upload_dir = previous_upload_dir
        settings.reports_dir = previous_reports_dir
        settings.models_dir = previous_models_dir


def test_predict_returns_404_for_nonexistent_model(tmp_path: Path) -> None:
    previous_models_dir = settings.models_dir
    settings.models_dir = tmp_path / "models"
    try:
        response = _post_predict(str(uuid4()), {"feature1": 10})
        assert response.status_code == 404
    finally:
        settings.models_dir = previous_models_dir


def test_predict_rejects_empty_inputs(tmp_path: Path) -> None:
    previous_upload_dir = settings.upload_dir
    previous_reports_dir = settings.reports_dir
    previous_models_dir = settings.models_dir
    settings.upload_dir = tmp_path
    settings.reports_dir = tmp_path / "reports"
    settings.models_dir = tmp_path / "models"
    try:
        csv_lines = ["f1,target"] + [f"{i},{i*2}" for i in range(12)]
        upload_resp = _post_upload("data.csv", "\n".join(csv_lines).encode("utf-8"))
        dataset_id = upload_resp.json()["id"]

        train_resp = _post_train(dataset_id, "target", "linear_regression")
        model_id = train_resp.json()["model_id"]

        resp = _post_predict(model_id, [])
        assert resp.status_code == 422
    finally:
        settings.upload_dir = previous_upload_dir
        settings.reports_dir = previous_reports_dir
        settings.models_dir = previous_models_dir
