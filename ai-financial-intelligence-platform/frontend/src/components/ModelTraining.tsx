import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Cpu,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { trainModel } from '../services/api';
import type { AlgorithmType, DatasetUploadResponse, TrainedModelResponse } from '../types/api';
import type { TabType } from './Header';

interface ModelTrainingProps {
  datasets: DatasetUploadResponse[];
  selectedDatasetId?: string;
  onModelTrained: (model: TrainedModelResponse) => void;
  onNavigate: (tab: TabType, selectedId?: string) => void;
}

export const ModelTraining: React.FC<ModelTrainingProps> = ({
  datasets,
  selectedDatasetId,
  onModelTrained,
  onNavigate,
}) => {
  const [activeDatasetId, setActiveDatasetId] = useState<string>(
    selectedDatasetId || (datasets.length > 0 ? datasets[0].id : '')
  );
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [algorithm, setAlgorithm] = useState<AlgorithmType>('random_forest');
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [trainedResult, setTrainedResult] = useState<TrainedModelResponse | null>(null);

  const currentDataset = datasets.find((d) => d.id === activeDatasetId) || datasets[0];

  // Auto set default target column when current dataset changes if not set
  React.useEffect(() => {
    if (currentDataset && currentDataset.columns.length > 0 && !targetColumn) {
      // Pick last column or numeric column as reasonable default target
      const lastCol = currentDataset.columns[currentDataset.columns.length - 1];
      setTargetColumn(lastCol);
    }
  }, [currentDataset, targetColumn]);

  if (!currentDataset) {
    return (
      <div className="view-container">
        <div className="empty-state py-12">
          <Cpu size={48} className="empty-icon" />
          <h2>No Datasets Available for Training</h2>
          <p>Please upload a CSV dataset before initiating supervised model training.</p>
          <button
            className="btn btn-primary mt-4"
            onClick={() => onNavigate('upload')}
          >
            Upload CSV Dataset
          </button>
        </div>
      </div>
    );
  }

  const handleTrainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetColumn) {
      setError('Please select a target column for regression training.');
      return;
    }

    setError(null);
    setIsTraining(true);
    setTrainedResult(null);

    try {
      const result = await trainModel(currentDataset.id, targetColumn, algorithm);
      setTrainedResult(result);
      onModelTrained(result);
    } catch (err: any) {
      setError(err.message || 'Model training execution failed.');
    } finally {
      setIsTraining(false);
    }
  };

  const getAlgorithmDescription = (algo: AlgorithmType) => {
    switch (algo) {
      case 'linear_regression':
        return 'Fast baseline linear estimator using standard ordinary least squares.';
      case 'decision_tree':
        return 'Non-linear tree partitioning estimator using MSE criteria (random_state=42).';
      case 'random_forest':
        return 'Ensemble of 200 decision trees built on bootstrap samples for robust regression.';
      case 'xgboost':
        return 'Gradient boosted decision trees with regularized objective function (colsample=0.8).';
    }
  };

  return (
    <div className="view-container max-w-4xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Supervised Regression Model Training</h1>
        <p className="page-description">
          Fit, evaluate, and persist a complete feature-preprocessing and regression pipeline using cross-validation on holdout test sets.
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Training Configuration Form */}
      <div className="panel mb-8">
        <form onSubmit={handleTrainSubmit} className="space-y-6">
          {/* Step 1: Select Dataset */}
          <div>
            <label htmlFor="train-dataset-select" className="form-label">
              1. Select Training Dataset
            </label>
            <select
              id="train-dataset-select"
              className="form-select"
              value={currentDataset.id}
              onChange={(e) => {
                setActiveDatasetId(e.target.value);
                setTargetColumn('');
              }}
              disabled={isTraining}
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.original_filename} ({d.row_count.toLocaleString()} rows, {d.columns.length} cols)
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Target Column */}
          <div>
            <label htmlFor="target-column-select" className="form-label">
              2. Select Target Column (y variable)
            </label>
            <select
              id="target-column-select"
              className="form-select"
              value={targetColumn}
              onChange={(e) => setTargetColumn(e.target.value)}
              disabled={isTraining}
            >
              {currentDataset.columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted mt-1 block">
              Regression target column must contain numeric or coercible values.
            </span>
          </div>

          {/* Step 3: Choose Algorithm */}
          <div>
            <label className="form-label mb-3 block">
              3. Select Regression Algorithm
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(
                [
                  { id: 'linear_regression', name: 'Linear Regression' },
                  { id: 'decision_tree', name: 'Decision Tree Regressor' },
                  { id: 'random_forest', name: 'Random Forest Regressor' },
                  { id: 'xgboost', name: 'XGBoost Regressor' },
                ] as const
              ).map((algo) => (
                <label
                  key={algo.id}
                  className={`algo-card ${algorithm === algo.id ? 'active' : ''}`}
                >
                  <input
                    type="radio"
                    name="algorithm"
                    value={algo.id}
                    checked={algorithm === algo.id}
                    onChange={() => setAlgorithm(algo.id)}
                    className="sr-only"
                    disabled={isTraining}
                  />
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-cyan">{algo.name}</span>
                    {algorithm === algo.id && <Sparkles size={16} className="text-cyan" />}
                  </div>
                  <p className="text-xs text-muted">{getAlgorithmDescription(algo.id)}</p>
                </label>
              ))}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-4 border-t border-dark-700 flex justify-end">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isTraining}
              id="start-training-btn"
            >
              {isTraining ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Fitting Pipeline...
                </>
              ) : (
                <>
                  <Brain size={20} /> Start Model Training
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Training Results Card */}
      {trainedResult && (
        <div className="panel border-emerald animate-fade-in space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={28} className="text-emerald" />
              <div>
                <h3 className="text-lg font-bold">Model Trained & Serialized Successfully</h3>
                <p className="text-xs text-muted font-mono">Model ID: {trainedResult.model_id}</p>
              </div>
            </div>
            <span className="badge badge-emerald uppercase">{trainedResult.model_type.replace('_', ' ')}</span>
          </div>

          {/* Metrics Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-details">
                <span className="stat-label">Coefficient of Determination (R²)</span>
                <span className="stat-value text-emerald font-bold">
                  {trainedResult.metrics.r2.toFixed(4)}
                </span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-details">
                <span className="stat-label">Mean Absolute Error (MAE)</span>
                <span className="stat-value text-cyan">
                  {trainedResult.metrics.mae.toFixed(4)}
                </span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-details">
                <span className="stat-label">Root Mean Squared Error (RMSE)</span>
                <span className="stat-value text-purple">
                  {trainedResult.metrics.rmse.toFixed(4)}
                </span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-details">
                <span className="stat-label">Train / Test Samples</span>
                <span className="stat-value text-sm font-mono">
                  {trainedResult.training_rows} / {trainedResult.test_rows}
                </span>
              </div>
            </div>
          </div>

          {/* Model File Metadata */}
          <div className="bg-dark-800 p-4 rounded-lg border border-dark-700 text-xs space-y-1">
            <div>
              <span className="text-muted">Joblib Artifact Path: </span>
              <span className="font-mono text-cyan">{trainedResult.model_path}</span>
            </div>
            <div>
              <span className="text-muted">Target Column: </span>
              <span className="font-mono text-white">{trainedResult.target_column}</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              className="btn btn-primary"
              onClick={() => onNavigate('prediction', trainedResult.model_id)}
            >
              Run Predictions with Model <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
