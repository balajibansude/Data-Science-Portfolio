from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


class DatasetUploadMetadata(BaseModel):
    """Metadata emitted after a CSV file is safely stored and validated."""

    id: UUID
    original_filename: str
    stored_filename: str
    content_type: str
    size_bytes: int = Field(ge=0)
    row_count: int = Field(ge=0)
    columns: list[str]
    created_at: datetime


class DatasetShape(BaseModel):
    """The two-dimensional size of an uploaded dataset."""

    rows: int = Field(ge=0)
    columns: int = Field(ge=0)


class NumericColumnStatistics(BaseModel):
    """Descriptive statistics for one numeric column."""

    count: int = Field(ge=0)
    mean: float | None
    std: float | None
    min: float | None
    percentile_25: float | None
    median: float | None
    percentile_75: float | None
    max: float | None


class TargetSuggestion(BaseModel):
    """A heuristic suggestion, not a declaration of a dataset target."""

    column: str
    task_type: Literal["classification", "regression"]
    reason: str


class ExploratoryDataAnalysis(BaseModel):
    """JSON-safe exploratory profile produced from a stored CSV file."""

    shape: DatasetShape
    missing_values: dict[str, int]
    duplicate_rows: int = Field(ge=0)
    statistics: dict[str, NumericColumnStatistics]
    column_types: dict[str, str]
    correlation: dict[str, dict[str, float | None]]
    target_suggestions: list[TargetSuggestion]


class VisualizationReport(BaseModel):
    """One generated, dataset-scoped visualization artifact."""

    chart_type: Literal["histogram", "boxplot", "scatter_plot", "correlation_heatmap", "line_chart"]
    path: str


class PreprocessingSummary(BaseModel):
    """Metadata describing the fitted reusable feature-preprocessing pipeline."""

    input_features: list[str]
    engineered_features: list[str]
    output_feature_count: int = Field(ge=0)
    steps: list[str]


class TrainModelRequest(BaseModel):
    """User-selected inputs for one supervised regression training run."""

    target_column: str = Field(min_length=1)
    model_type: Literal["linear_regression", "decision_tree", "random_forest", "xgboost"]


class RegressionMetrics(BaseModel):
    """Held-out regression metrics for a fitted model."""

    mae: float = Field(ge=0)
    rmse: float = Field(ge=0)
    r2: float


class TrainedModelResponse(BaseModel):
    """Metadata for a safely persisted trained regression pipeline."""

    model_id: UUID
    dataset_id: UUID
    model_type: Literal["linear_regression", "decision_tree", "random_forest", "xgboost"]
    target_column: str
    training_rows: int = Field(ge=1)
    test_rows: int = Field(ge=1)
    metrics: RegressionMetrics
    model_path: str


class DatasetUploadResponse(DatasetUploadMetadata):
    """Stored dataset metadata plus its immediately generated EDA profile."""

    analysis: ExploratoryDataAnalysis
    visualizations: list[VisualizationReport]
    preprocessing: PreprocessingSummary


class PredictRequest(BaseModel):
    """Input payload for single or batch prediction."""

    inputs: dict[str, Any] | list[dict[str, Any]] = Field(
        ...,
        description="Single feature dictionary or list of feature dictionaries.",
    )


class PredictResponse(BaseModel):
    """Prediction output payload."""

    prediction_id: UUID
    model_id: UUID
    predictions: list[float]
