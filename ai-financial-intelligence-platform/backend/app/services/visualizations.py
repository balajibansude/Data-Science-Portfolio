from dataclasses import dataclass
from pathlib import Path
import shutil
from uuid import UUID

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import pandas as pd


class VisualizationError(Exception):
    """Raised when report images cannot be generated for a stored dataset."""


@dataclass(frozen=True)
class GeneratedVisualization:
    chart_type: str
    path: str


CHART_FILENAMES = {
    "histogram": "histogram.png",
    "boxplot": "boxplot.png",
    "scatter_plot": "scatter_plot.png",
    "correlation_heatmap": "correlation_heatmap.png",
    "line_chart": "line_chart.png",
}


def _empty_chart(axis: plt.Axes, title: str, message: str) -> None:
    axis.set_title(title)
    axis.text(0.5, 0.5, message, ha="center", va="center", wrap=True)
    axis.set_axis_off()


def _save_chart(figure: plt.Figure, destination: Path) -> None:
    figure.tight_layout()
    figure.savefig(destination, format="png", dpi=150, bbox_inches="tight")
    plt.close(figure)


def _numeric_columns(dataframe: pd.DataFrame) -> list[str]:
    return [str(column) for column in dataframe.select_dtypes(include="number").columns]


def _render_histogram(dataframe: pd.DataFrame, destination: Path) -> None:
    figure, axis = plt.subplots(figsize=(8, 5))
    numeric_columns = _numeric_columns(dataframe)
    if numeric_columns and not dataframe[numeric_columns[0]].dropna().empty:
        column = numeric_columns[0]
        axis.hist(dataframe[column].dropna(), bins="auto", color="#2563eb", edgecolor="white")
        axis.set(title=f"Distribution of {column}", xlabel=column, ylabel="Frequency")
    else:
        _empty_chart(axis, "Histogram", "No numeric column is available for a histogram.")
    _save_chart(figure, destination)


def _render_boxplot(dataframe: pd.DataFrame, destination: Path) -> None:
    figure, axis = plt.subplots(figsize=(8, 5))
    numeric_columns = _numeric_columns(dataframe)
    if numeric_columns and not dataframe[numeric_columns[0]].dropna().empty:
        column = numeric_columns[0]
        axis.boxplot(dataframe[column].dropna(), tick_labels=[column])
        axis.set_title(f"Boxplot of {column}")
    else:
        _empty_chart(axis, "Boxplot", "No numeric column is available for a boxplot.")
    _save_chart(figure, destination)


def _render_scatter_plot(dataframe: pd.DataFrame, destination: Path) -> None:
    figure, axis = plt.subplots(figsize=(8, 5))
    numeric_columns = _numeric_columns(dataframe)
    if len(numeric_columns) >= 2:
        x_column, y_column = numeric_columns[:2]
        points = dataframe[[x_column, y_column]].dropna()
        if not points.empty:
            axis.scatter(points[x_column], points[y_column], alpha=0.7, color="#7c3aed")
            axis.set(title=f"{y_column} vs {x_column}", xlabel=x_column, ylabel=y_column)
        else:
            _empty_chart(axis, "Scatter plot", "The first two numeric columns have no complete paired values.")
    else:
        _empty_chart(axis, "Scatter plot", "At least two numeric columns are required for a scatter plot.")
    _save_chart(figure, destination)


def _render_correlation_heatmap(dataframe: pd.DataFrame, destination: Path) -> None:
    figure, axis = plt.subplots(figsize=(8, 6))
    numeric_columns = _numeric_columns(dataframe)
    if numeric_columns:
        matrix = dataframe[numeric_columns].corr()
        image = axis.imshow(matrix, cmap="coolwarm", vmin=-1, vmax=1)
        tick_positions = list(range(len(numeric_columns)))
        axis.set_title("Numeric column correlation")
        axis.set_xticks(tick_positions)
        axis.set_yticks(tick_positions)
        axis.set_xticklabels(numeric_columns, rotation=45, ha="right")
        axis.set_yticklabels(numeric_columns)
        figure.colorbar(image, ax=axis, label="Pearson correlation")
    else:
        _empty_chart(axis, "Correlation heatmap", "No numeric columns are available for correlation.")
    _save_chart(figure, destination)


def _render_line_chart(dataframe: pd.DataFrame, destination: Path) -> None:
    figure, axis = plt.subplots(figsize=(8, 5))
    numeric_columns = _numeric_columns(dataframe)
    if numeric_columns and not dataframe[numeric_columns[0]].dropna().empty:
        column = numeric_columns[0]
        axis.plot(dataframe.index, dataframe[column], marker="o", markersize=3, color="#059669")
        axis.set(title=f"{column} by row order", xlabel="Row", ylabel=column)
    else:
        _empty_chart(axis, "Line chart", "No numeric column is available for a line chart.")
    _save_chart(figure, destination)


def generate_visualizations(file_path: Path, reports_directory: Path, dataset_id: UUID) -> list[GeneratedVisualization]:
    """Create five PNG report images in a UUID-scoped reports directory."""
    dataset_report_directory = reports_directory / str(dataset_id)
    try:
        dataframe = pd.read_csv(file_path, encoding="utf-8-sig", on_bad_lines="error")
        dataset_report_directory.mkdir(mode=0o750, parents=True, exist_ok=True)

        renderers = {
            "histogram": _render_histogram,
            "boxplot": _render_boxplot,
            "scatter_plot": _render_scatter_plot,
            "correlation_heatmap": _render_correlation_heatmap,
            "line_chart": _render_line_chart,
        }
        generated: list[GeneratedVisualization] = []
        for chart_type, renderer in renderers.items():
            destination = dataset_report_directory / CHART_FILENAMES[chart_type]
            renderer(dataframe, destination)
            generated.append(GeneratedVisualization(chart_type, f"reports/{dataset_id}/{destination.name}"))
        return generated
    except (OSError, UnicodeDecodeError, pd.errors.ParserError, ValueError) as error:
        if dataset_report_directory.exists():
            shutil.rmtree(dataset_report_directory)
        raise VisualizationError("Visualizations could not be generated for the uploaded CSV.") from error
