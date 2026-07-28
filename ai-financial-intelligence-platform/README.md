# AI Financial Intelligence Platform

Production-oriented starter architecture for an AI-powered financial intelligence platform. The API currently includes operational health metadata and a secure CSV ingestion boundary; financial domain logic remains intentionally out of scope.

## Stack

- **API:** FastAPI, SQLAlchemy, Pydantic Settings
- **Web:** React, Vite, TypeScript
- **Data:** PostgreSQL 16
- **Operations:** Docker Compose, health checks, environment-based configuration

## Repository layout

```text
.
├── backend/                 # FastAPI service
├── frontend/                # React + Vite application
├── docker-compose.yml       # Local multi-container environment
├── Makefile                 # Common development commands
└── .env.example             # Configuration template
```

See the [file guide](#file-guide) for the role of every starter file.

## Run locally

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16+ (or Docker)

### Backend

```bash
cp .env.example .env
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --app-dir backend --reload
```

The API is available at `http://localhost:8000`; interactive API docs are at `/docs`.

### Upload a CSV dataset

`POST /api/v1/datasets/uploads` accepts a multipart form field named `file`.

```bash
curl -X POST http://localhost:8000/api/v1/datasets/uploads \
  -F 'file=@transactions.csv;type=text/csv'
```

The response contains an opaque dataset ID, the original and generated filenames, byte size, header columns, record count, creation timestamp, and an `analysis` object. Files are stored in `UPLOAD_DIR` using generated UUID filenames; the original filename is never used as a filesystem path.

The upload boundary validates the `.csv` extension and declared CSV MIME type, enforces `UPLOAD_MAX_SIZE_BYTES` while streaming to a temporary file, requires UTF-8 CSV with a non-empty unique header row and consistent column counts, and atomically renames only validated files into storage. Invalid, malformed, or oversized uploads return a clear `4xx` response and remove any temporary file.

### Automatic exploratory data analysis

Each successful upload is profiled with pandas before the API responds. `analysis` is JSON-safe and includes:

- `shape`: data-row and column counts
- `missing_values`: null count for every column
- `duplicate_rows`: complete duplicate-record count
- `statistics`: count, mean, standard deviation, quartiles, minimum, and maximum for numeric columns
- `column_types`: pandas-inferred dtype for every column
- `correlation`: pairwise Pearson correlation for numeric columns; unavailable values are `null`
- `target_suggestions`: up to five heuristic classification/regression candidates; they are suggestions, not an automatic target selection

The route has no pandas logic: the API layer translates HTTP concerns, `dataset_ingestion.py` coordinates the upload-and-profile use case, and `eda.py` contains the framework-independent analysis implementation. If pandas cannot profile a stored file, the use case deletes it before reporting the error.

### Automatic visualization reports

The same upload workflow generates five PNG artifacts with matplotlib and records their relative paths in `visualizations` in the response:

- Histogram and boxplot of the first usable numeric column
- Scatter plot of the first two numeric columns
- Pearson correlation heatmap of numeric columns
- Line chart of the first usable numeric column by source row order

Images are safely written under `REPORTS_DIR/<dataset-uuid>/` (by default, `data/reports/<dataset-uuid>/`) as `histogram.png`, `boxplot.png`, `scatter_plot.png`, `correlation_heatmap.png`, and `line_chart.png`. If a dataset does not provide enough numeric data for a chart, the corresponding PNG contains an explanatory placeholder so every upload still produces the complete report set. Docker persists reports in its `api_reports` volume.

### Preprocessing pipeline

Every successful upload is also fit through a reusable scikit-learn `Pipeline`. Its `preprocessing` response field reports the original input columns, engineered columns, final feature count, and the applied step groups. The pipeline intentionally does not choose or remove a target column: target selection belongs to the future training workflow.

The preprocessing steps are:

1. **Feature engineering:** a custom sklearn transformer adds `missing_value_count`, the number of null values in each source row. It also detects date-like columns whose names contain `date`, `time`, or `timestamp` and whose non-null values parse successfully. Each is replaced with year, month, day, and day-of-week numeric features.
2. **Numeric missing values:** `SimpleImputer(strategy="median")` replaces missing numeric values with the median from the fit data. Median imputation is less sensitive to outliers than mean imputation.
3. **Numeric scaling:** `StandardScaler` standardizes every imputed numeric feature to zero mean and unit variance, so differently scaled measurements do not dominate downstream estimators.
4. **Categorical missing values:** `SimpleImputer(strategy="most_frequent")` fills missing categorical values with the modal value learned during fitting.
5. **Categorical encoding:** `OneHotEncoder(handle_unknown="ignore")` turns categories into binary indicator features. Unseen categories at inference are safely ignored instead of causing an error.

The pipeline is defined in `build_preprocessing_pipeline()`, so a training service can fit the same object on its training split and reuse it unchanged for validation and inference. The upload-time fit only validates the schema and produces metadata; it must not be reused as a trained production artifact, which would risk leakage.

### Regression model training

Training is explicit because a target column must be selected by the caller. After uploading a dataset, call `POST /api/v1/datasets/{dataset_id}/train` with a numeric target and a model type:

```bash
curl -X POST http://localhost:8000/api/v1/datasets/<dataset-id>/train \
  -H 'Content-Type: application/json' \
  -d '{"target_column":"revenue","model_type":"random_forest"}'
```

Supported regression models are `linear_regression`, `decision_tree`, `random_forest`, and `xgboost`. The service removes rows without a target value, requires at least ten usable rows, performs a deterministic 80/20 train/test split, and fits the complete preprocessing-plus-estimator pipeline on the training split only.

The response provides held-out metrics:

- **MAE:** average absolute prediction error; lower is better.
- **RMSE:** root mean squared error, which penalizes large errors more strongly; lower is better.
- **R²:** proportion of held-out target variance explained by the model; higher is better, and it can be negative for a poor model.

Each complete fitted pipeline—including preprocessing and the estimator—is saved atomically as `MODELS_DIR/<model-uuid>.joblib` (default `data/models/`). Docker persists it in the `api_models` volume. The model ID and relative `model_path` are returned for future prediction or registry features.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The web app is available at `http://localhost:5173`.

### Docker

```bash
cp .env.example .env
docker compose up --build
```

This starts PostgreSQL, the API at `http://localhost:8000`, and the web app at `http://localhost:5173`.

## Configuration

Copy `.env.example` to `.env` before running the platform. Never commit `.env`: it may hold credentials. Docker Compose supplies safe local defaults where appropriate.

## Quality checks

```bash
make api-test
make web-lint
```

## File guide

| File | Purpose |
| --- | --- |
| `.env.example` | Safe, documented environment variable template. |
| `.gitignore` | Excludes dependencies, virtual environments, secrets, builds, and editor files. |
| `docker-compose.yml` | Coordinates the database, API, and frontend containers for local development. |
| `Makefile` | Shortcuts for starting and validating the services. |
| `requirements.txt` | Root-level convenience entry point to the backend Python dependencies. |
| `backend/Dockerfile` | Builds a minimal, non-root Python API container. |
| `backend/.dockerignore` | Keeps local virtual environments, caches, and tests out of the API image context. |
| `backend/requirements.txt` | Pins direct Python runtime and test dependencies. |
| `backend/app/__init__.py` | Marks the root API source directory as a Python package. |
| `backend/app/main.py` | FastAPI application factory and router registration. |
| `backend/app/core/__init__.py` | Marks the cross-cutting configuration directory as a Python package. |
| `backend/app/core/config.py` | Typed environment configuration. |
| `backend/app/api/__init__.py` | Marks the HTTP routing directory as a Python package. |
| `backend/app/api/router.py` | Versioned API router boundary for future endpoints. |
| `backend/app/api/routes/__init__.py` | Marks the endpoint-module directory as a Python package. |
| `backend/app/api/routes/health.py` | Operational liveness endpoint; no domain logic. |
| `backend/app/api/routes/uploads.py` | Multipart CSV upload endpoint and HTTP error translation. |
| `backend/app/api/routes/training.py` | User-directed regression-training endpoint for stored dataset IDs. |
| `backend/app/db/__init__.py` | Marks the database integration directory as a Python package. |
| `backend/app/db/session.py` | SQLAlchemy engine and request-session dependency. |
| `backend/app/schemas/__init__.py` | Marks the API-schema directory as a Python package. |
| `backend/app/schemas/dataset.py` | Validated response shape for uploaded dataset metadata. |
| `backend/app/services/__init__.py` | Marks the application-service directory as a Python package. |
| `backend/app/services/csv_upload.py` | CSV validation, bounded streaming write, atomic storage, and cleanup service. |
| `backend/app/services/dataset_ingestion.py` | Application use case that coordinates storage, EDA, and rollback on analysis failure. |
| `backend/app/services/eda.py` | Pandas-based, JSON-safe exploratory data analysis and target-candidate heuristics. |
| `backend/app/services/visualizations.py` | Matplotlib report generation for the five automatic visualization types. |
| `backend/app/services/preprocessing.py` | Reusable scikit-learn feature-engineering, imputation, scaling, and encoding pipeline. |
| `backend/app/services/training.py` | Regression model selection, held-out evaluation, and atomic joblib model persistence. |
| `backend/tests/__init__.py` | Marks the API test directory as a Python package. |
| `backend/tests/test_health.py` | Smoke test for the health endpoint. |
| `backend/tests/test_uploads.py` | Endpoint tests for upload validation and the complete EDA JSON response. |
| `backend/tests/test_training.py` | Tests all four supported regressors, their metrics, and saved pipeline artifacts. |
| `frontend/Dockerfile` | Builds the Vite web application and serves it through Nginx. |
| `frontend/.dockerignore` | Keeps local dependencies and build artifacts out of the web image context. |
| `frontend/package.json` | Frontend scripts and dependency definitions. |
| `frontend/package-lock.json` | Generated, committed dependency lockfile for reproducible npm installs. |
| `frontend/vite.config.ts` | Vite development server configuration, including API proxying. |
| `frontend/tsconfig*.json` | TypeScript compiler configuration for application and build tooling. |
| `frontend/eslint.config.js` | ESLint rules for the React TypeScript source. |
| `frontend/index.html` | HTML mount document for Vite. |
| `frontend/src/main.tsx` | React browser entry point. |
| `frontend/src/App.tsx` | Presentational starter shell; future product screens begin here. |
| `frontend/src/styles.css` | Global visual baseline for the starter shell. |
| `frontend/src/vite-env.d.ts` | Vite client type declarations. |
| `frontend/nginx.conf` | Static-server and SPA fallback configuration for the production container. |

## Next implementation steps

1. Add authentication and authorization.
2. Create database models, migrations, and repositories.
3. Add domain APIs, AI orchestration, observability, and CI/CD.
