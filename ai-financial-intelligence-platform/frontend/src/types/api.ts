export interface DatasetShape {
  rows: number;
  columns: number;
}

export interface NumericColumnStatistics {
  count: number;
  mean: number | null;
  std: number | null;
  min: number | null;
  percentile_25: number | null;
  median: number | null;
  percentile_75: number | null;
  max: number | null;
}

export interface TargetSuggestion {
  column: string;
  task_type: 'classification' | 'regression';
  reason: string;
}

export interface ExploratoryDataAnalysis {
  shape: DatasetShape;
  missing_values: Record<string, number>;
  duplicate_rows: number;
  statistics: Record<string, NumericColumnStatistics>;
  column_types: Record<string, string>;
  correlation: Record<string, Record<string, number | null>>;
  target_suggestions: TargetSuggestion[];
}

export interface VisualizationReport {
  chart_type: 'histogram' | 'boxplot' | 'scatter_plot' | 'correlation_heatmap' | 'line_chart';
  path: string;
}

export interface PreprocessingSummary {
  input_features: string[];
  engineered_features: string[];
  output_feature_count: number;
  steps: string[];
}

export interface DatasetUploadResponse {
  id: string;
  original_filename: string;
  stored_filename: string;
  content_type: string;
  size_bytes: number;
  row_count: number;
  columns: string[];
  created_at: string;
  analysis: ExploratoryDataAnalysis;
  visualizations: VisualizationReport[];
  preprocessing: PreprocessingSummary;
}

export type AlgorithmType = 'linear_regression' | 'decision_tree' | 'random_forest' | 'xgboost';

export interface TrainModelRequest {
  target_column: string;
  model_type: AlgorithmType;
}

export interface RegressionMetrics {
  mae: number;
  rmse: number;
  r2: number;
}

export interface TrainedModelResponse {
  model_id: string;
  dataset_id: string;
  model_type: AlgorithmType;
  target_column: string;
  training_rows: number;
  test_rows: number;
  metrics: RegressionMetrics;
  model_path: string;
}

export interface PredictRequest {
  inputs: Record<string, any> | Record<string, any>[];
}

export interface PredictResponse {
  prediction_id: string;
  model_id: string;
  predictions: number[];
}

export interface StoredPredictionRecord {
  prediction_id: string;
  model_id: string;
  timestamp: string;
  input_count: number;
  predictions: number[];
}
