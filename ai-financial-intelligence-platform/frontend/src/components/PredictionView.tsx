import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Cpu,
  FileSpreadsheet,
  Layers,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { predictModel } from '../services/api';
import type {
  DatasetUploadResponse,
  PredictResponse,
  TrainedModelResponse,
} from '../types/api';
import type { TabType } from './Header';

interface PredictionViewProps {
  models: TrainedModelResponse[];
  datasets: DatasetUploadResponse[];
  selectedModelId?: string;
  onNavigate: (tab: TabType, selectedId?: string) => void;
}

export const PredictionView: React.FC<PredictionViewProps> = ({
  models,
  datasets,
  selectedModelId,
  onNavigate,
}) => {
  const [activeModelId, setActiveModelId] = useState<string>(
    selectedModelId || (models.length > 0 ? models[0].model_id : '')
  );
  const [predictMode, setPredictMode] = useState<'single' | 'batch'>('single');
  const [singleInputs, setSingleInputs] = useState<Record<string, string>>({});
  const [batchRawJson, setBatchRawJson] = useState<string>('');
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<PredictResponse | null>(null);

  const currentModel = models.find((m) => m.model_id === activeModelId) || models[0];
  const matchingDataset = currentModel
    ? datasets.find((d) => d.id === currentModel.dataset_id)
    : undefined;

  // Extract feature columns (all dataset columns except target_column)
  const featureColumns = matchingDataset
    ? matchingDataset.columns.filter((c) => c !== currentModel?.target_column)
    : [];

  // Initialize single input fields when model/dataset changes
  useEffect(() => {
    if (featureColumns.length > 0) {
      const initial: Record<string, string> = {};
      featureColumns.forEach((col) => {
        initial[col] = singleInputs[col] || '0';
      });
      setSingleInputs(initial);

      // Pre-fill sample batch JSON
      const sampleBatch = [
        initial,
        Object.fromEntries(featureColumns.map((col) => [col, '10'])),
      ];
      setBatchRawJson(JSON.stringify(sampleBatch, null, 2));
    }
  }, [activeModelId, matchingDataset?.id]);

  if (!currentModel) {
    return (
      <div className="view-container">
        <div className="empty-state py-12">
          <Activity size={48} className="empty-icon" />
          <h2>No Trained Models Available</h2>
          <p>Please train a regression model before executing real-time predictions.</p>
          <button
            className="btn btn-primary mt-4"
            onClick={() => onNavigate('training')}
          >
            Go to Model Training
          </button>
        </div>
      </div>
    );
  }

  const handleSinglePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPredicting(true);
    setPredictionResult(null);

    // Convert string inputs to numeric where possible
    const formattedInputs: Record<string, any> = {};
    Object.entries(singleInputs).forEach(([col, val]) => {
      const num = Number(val);
      formattedInputs[col] = isNaN(num) ? val : num;
    });

    try {
      const result = await predictModel(currentModel.model_id, formattedInputs);
      setPredictionResult(result);
    } catch (err: any) {
      setError(err.message || 'Prediction request failed.');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleBatchPredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsPredicting(true);
    setPredictionResult(null);

    try {
      const parsed = JSON.parse(batchRawJson);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Batch input must be a non-empty JSON array of objects.');
      }
      const result = await predictModel(currentModel.model_id, parsed);
      setPredictionResult(result);
    } catch (err: any) {
      setError(err.message || 'Invalid batch JSON input format.');
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="view-container max-w-4xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Real-Time Model Inference & Prediction</h1>
        <p className="page-description">
          Run single or batch inference using trained scikit-learn regression pipelines with automatic feature preprocessing.
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Model Selector Card */}
      <div className="panel mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Cpu className="text-purple" size={24} />
            <div>
              <label htmlFor="model-select" className="text-xs text-muted block font-semibold uppercase">
                Active Prediction Model
              </label>
              <select
                id="model-select"
                className="form-select text-base font-bold"
                value={currentModel.model_id}
                onChange={(e) => {
                  setActiveModelId(e.target.value);
                  setPredictionResult(null);
                }}
              >
                {models.map((m) => (
                  <option key={m.model_id} value={m.model_id}>
                    {m.model_type.toUpperCase()} — Target: {m.target_column} (R²: {m.metrics.r2.toFixed(3)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="badge badge-indigo">
              {currentModel.model_type.replace('_', ' ')}
            </span>
            <span className="badge badge-cyan">
              Target: {currentModel.target_column}
            </span>
          </div>
        </div>
      </div>

      {/* Mode Sub-Tabs */}
      <div className="sub-nav-tabs mb-6">
        <button
          className={`sub-tab ${predictMode === 'single' ? 'active' : ''}`}
          onClick={() => setPredictMode('single')}
        >
          <Layers size={16} /> Single Prediction Form
        </button>
        <button
          className={`sub-tab ${predictMode === 'batch' ? 'active' : ''}`}
          onClick={() => setPredictMode('batch')}
        >
          <FileSpreadsheet size={16} /> Batch Prediction (JSON / Array)
        </button>
      </div>

      {/* Single Prediction Form */}
      {predictMode === 'single' && (
        <div className="panel mb-8">
          <form onSubmit={handleSinglePredict} className="space-y-4">
            <h3 className="panel-title mb-2">Input Feature Values</h3>
            <p className="text-xs text-muted mb-4">
              Enter target input feature parameters required by the preprocessing pipeline.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featureColumns.map((col) => (
                <div key={col}>
                  <label htmlFor={`input-${col}`} className="form-label font-mono text-cyan text-xs">
                    {col}
                  </label>
                  <input
                    type="text"
                    id={`input-${col}`}
                    className="form-input"
                    value={singleInputs[col] || ''}
                    onChange={(e) =>
                      setSingleInputs({
                        ...singleInputs,
                        [col]: e.target.value,
                      })
                    }
                    placeholder="e.g. 100.5"
                    disabled={isPredicting}
                  />
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-dark-700 flex justify-end">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={isPredicting}
                id="execute-single-predict-btn"
              >
                {isPredicting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Calculating...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} /> Run Single Prediction
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Batch Prediction Form */}
      {predictMode === 'batch' && (
        <div className="panel mb-8">
          <form onSubmit={handleBatchPredict} className="space-y-4">
            <h3 className="panel-title mb-2">Batch Feature Input (JSON Array)</h3>
            <p className="text-xs text-muted mb-4">
              Paste a JSON array of row objects for multi-sample batch inference.
            </p>

            <textarea
              id="batch-json-input"
              rows={8}
              className="form-textarea font-mono text-xs"
              value={batchRawJson}
              onChange={(e) => setBatchRawJson(e.target.value)}
              disabled={isPredicting}
            />

            <div className="pt-4 border-t border-dark-700 flex justify-end">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={isPredicting}
                id="execute-batch-predict-btn"
              >
                {isPredicting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Processing Batch...
                  </>
                ) : (
                  <>
                    <Activity size={18} /> Execute Batch Prediction
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Prediction Output Results Display Card */}
      {predictionResult && (
        <div className="panel border-cyan animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={28} className="text-cyan" />
              <div>
                <h3 className="text-lg font-bold">Prediction Generated</h3>
                <p className="text-xs text-muted font-mono">
                  Prediction Record ID: {predictionResult.prediction_id}
                </p>
              </div>
            </div>
            <span className="badge badge-emerald">
              {predictionResult.predictions.length} Result(s)
            </span>
          </div>

          <div className="prediction-output-box bg-dark-800 p-6 rounded-lg border border-dark-700">
            <span className="text-xs text-muted uppercase font-bold block mb-2">
              Predicted Target Value ({currentModel.target_column})
            </span>
            <div className="space-y-2">
              {predictionResult.predictions.map((val, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-dark-700 last:border-none">
                  <span className="text-sm font-mono text-muted">Sample #{idx + 1}</span>
                  <span className="text-2xl font-bold text-cyan font-mono">{val.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
