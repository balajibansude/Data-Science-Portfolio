import type {
  DatasetUploadResponse,
  PredictResponse,
  StoredPredictionRecord,
  TrainedModelResponse,
} from '../types/api';

const API_BASE = '/api/v1';
const DATASETS_STORAGE_KEY = 'financial_ai_datasets';
const MODELS_STORAGE_KEY = 'financial_ai_models';
const PREDICTIONS_STORAGE_KEY = 'financial_ai_predictions';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new ApiError(response.status, 'Health check failed');
  }
  return response.json();
}

export async function uploadDataset(file: File): Promise<DatasetUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/datasets/uploads`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
    throw new ApiError(response.status, errorData.detail || 'Upload failed');
  }

  const result: DatasetUploadResponse = await response.json();
  saveDatasetToCache(result);
  return result;
}

export async function trainModel(
  datasetId: string,
  targetColumn: string,
  modelType: string
): Promise<TrainedModelResponse> {
  const response = await fetch(`${API_BASE}/datasets/${datasetId}/train`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      target_column: targetColumn,
      model_type: modelType,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Model training failed' }));
    throw new ApiError(response.status, errorData.detail || 'Model training failed');
  }

  const result: TrainedModelResponse = await response.json();
  saveModelToCache(result);
  return result;
}

export async function predictModel(
  modelId: string,
  inputs: Record<string, any> | Record<string, any>[]
): Promise<PredictResponse> {
  const response = await fetch(`${API_BASE}/models/${modelId}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Prediction failed' }));
    throw new ApiError(response.status, errorData.detail || 'Prediction failed');
  }

  const result: PredictResponse = await response.json();
  savePredictionToCache({
    prediction_id: result.prediction_id,
    model_id: result.model_id,
    timestamp: new Date().toISOString(),
    input_count: Array.isArray(inputs) ? inputs.length : 1,
    predictions: result.predictions,
  });
  return result;
}

// Storage helpers
export function getCachedDatasets(): DatasetUploadResponse[] {
  try {
    const raw = localStorage.getItem(DATASETS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDatasetToCache(dataset: DatasetUploadResponse): void {
  const existing = getCachedDatasets().filter((d) => d.id !== dataset.id);
  localStorage.setItem(DATASETS_STORAGE_KEY, JSON.stringify([dataset, ...existing]));
}

export function getCachedModels(): TrainedModelResponse[] {
  try {
    const raw = localStorage.getItem(MODELS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveModelToCache(model: TrainedModelResponse): void {
  const existing = getCachedModels().filter((m) => m.model_id !== model.model_id);
  localStorage.setItem(MODELS_STORAGE_KEY, JSON.stringify([model, ...existing]));
}

export function getCachedPredictions(): StoredPredictionRecord[] {
  try {
    const raw = localStorage.getItem(PREDICTIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function savePredictionToCache(record: StoredPredictionRecord): void {
  const existing = getCachedPredictions();
  localStorage.setItem(PREDICTIONS_STORAGE_KEY, JSON.stringify([record, ...existing].slice(0, 50)));
}
