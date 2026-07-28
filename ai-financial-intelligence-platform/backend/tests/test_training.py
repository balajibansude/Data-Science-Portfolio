from uuid import uuid4

import joblib
import pytest

from app.services.training import train_regression_model


@pytest.mark.parametrize("model_type", ["linear_regression", "decision_tree", "random_forest", "xgboost"])
def test_train_regression_model_saves_each_supported_model(tmp_path, model_type: str) -> None:
    dataset_path = tmp_path / "dataset.csv"
    dataset_path.write_text(
        "date,segment,amount,target\n"
        "2026-01-01,A,10,25\n"
        "2026-01-02,B,20,45\n"
        "2026-01-03,A,30,65\n"
        "2026-01-04,B,40,85\n"
        "2026-01-05,A,50,105\n"
        "2026-01-06,B,60,125\n"
        "2026-01-07,A,70,145\n"
        "2026-01-08,B,80,165\n"
        "2026-01-09,A,90,185\n"
        "2026-01-10,B,100,205\n"
        "2026-01-11,A,110,225\n"
        "2026-01-12,B,120,245\n",
        encoding="utf-8",
    )
    dataset_id = uuid4()

    trained = train_regression_model(
        dataset_id=dataset_id,
        dataset_path=dataset_path,
        target_column="target",
        model_type=model_type,
        models_directory=tmp_path / "models",
    )

    saved_model = tmp_path / trained.model_path
    assert trained.dataset_id == dataset_id
    assert trained.model_type == model_type
    assert trained.training_rows == 9
    assert trained.test_rows == 3
    assert trained.metrics.mae >= 0
    assert trained.metrics.rmse >= 0
    assert saved_model.is_file()
    assert "model" in joblib.load(saved_model).named_steps
