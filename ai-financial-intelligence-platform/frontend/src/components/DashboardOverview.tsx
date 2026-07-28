import React from 'react';
import {
  Activity,
  ArrowRight,
  Brain,
  Database,
  FileSpreadsheet,
  PlusCircle,
  Sparkles,
  Zap,
} from 'lucide-react';
import type {
  DatasetUploadResponse,
  StoredPredictionRecord,
  TrainedModelResponse,
} from '../types/api';
import type { TabType } from './Header';

interface DashboardOverviewProps {
  datasets: DatasetUploadResponse[];
  models: TrainedModelResponse[];
  predictions: StoredPredictionRecord[];
  onNavigate: (tab: TabType, selectedId?: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  datasets,
  models,
  predictions,
  onNavigate,
}) => {
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getAlgorithmLabel = (algo: string) => {
    switch (algo) {
      case 'linear_regression':
        return 'Linear Regression';
      case 'decision_tree':
        return 'Decision Tree';
      case 'random_forest':
        return 'Random Forest';
      case 'xgboost':
        return 'XGBoost Regressor';
      default:
        return algo;
    }
  };

  return (
    <div className="view-container">
      {/* Welcome & Quick Actions Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <div className="badge-glow">
            <Sparkles size={14} /> AI Financial Intelligence Engine
          </div>
          <h1 className="hero-title">Financial Data Analytics & Predictive ML</h1>
          <p className="hero-description">
            Upload financial transaction datasets, perform automated exploratory analysis, fit reusable scikit-learn pipelines, and run real-time predictions.
          </p>
          <div className="hero-actions">
            <button
              className="btn btn-primary"
              onClick={() => onNavigate('upload')}
              id="quick-action-upload"
            >
              <PlusCircle size={18} /> Upload New CSV Dataset
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => onNavigate('training')}
              id="quick-action-train"
            >
              <Brain size={18} /> Train Machine Learning Model
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper cyan">
            <Database size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{datasets.length}</span>
            <span className="stat-label">Ingested Datasets</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper indigo">
            <Brain size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{models.length}</span>
            <span className="stat-label">Active Trained Models</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper emerald">
            <Activity size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{predictions.length}</span>
            <span className="stat-label">Total Inference Runs</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper purple">
            <Zap size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">Scikit-Learn</span>
            <span className="stat-label">ML Pipeline Engine</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Datasets & Trained Models */}
      <div className="two-column-grid">
        {/* Datasets Column */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <FileSpreadsheet size={20} className="panel-icon" />
              <span>Recent Ingested Datasets</span>
            </div>
            <button
              className="link-btn"
              onClick={() => onNavigate('upload')}
            >
              + Ingest CSV
            </button>
          </div>

          {datasets.length === 0 ? (
            <div className="empty-state">
              <FileSpreadsheet size={40} className="empty-icon" />
              <p>No datasets uploaded yet.</p>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => onNavigate('upload')}
              >
                Upload your first dataset
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Rows</th>
                    <th>Cols</th>
                    <th>Size</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {datasets.slice(0, 5).map((d) => (
                    <tr key={d.id}>
                      <td className="font-semibold">{d.original_filename}</td>
                      <td>{d.row_count.toLocaleString()}</td>
                      <td>{d.columns.length}</td>
                      <td className="text-muted">{formatBytes(d.size_bytes)}</td>
                      <td>
                        <button
                          className="btn btn-xs btn-outline"
                          onClick={() => onNavigate('eda', d.id)}
                        >
                          EDA & Reports <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Models Column */}
        <div className="panel">
          <div className="panel-header">
            <div className="panel-title">
              <Brain size={20} className="panel-icon" />
              <span>Trained Machine Learning Models</span>
            </div>
            <button
              className="link-btn"
              onClick={() => onNavigate('training')}
            >
              + Train Model
            </button>
          </div>

          {models.length === 0 ? (
            <div className="empty-state">
              <Brain size={40} className="empty-icon" />
              <p>No trained models yet.</p>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => onNavigate('training')}
              >
                Train a model
              </button>
            </div>
          ) : (
            <div className="models-list">
              {models.slice(0, 4).map((m) => (
                <div key={m.model_id} className="model-item-card">
                  <div className="model-item-header">
                    <span className="badge badge-indigo">
                      {getAlgorithmLabel(m.model_type)}
                    </span>
                    <span className="target-pill">Target: {m.target_column}</span>
                  </div>

                  <div className="model-metrics-row">
                    <div className="metric-box">
                      <span className="metric-box-val">{m.metrics.r2.toFixed(3)}</span>
                      <span className="metric-box-lbl">R² Score</span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-box-val">{m.metrics.mae.toFixed(2)}</span>
                      <span className="metric-box-lbl">MAE</span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-box-val">{m.metrics.rmse.toFixed(2)}</span>
                      <span className="metric-box-lbl">RMSE</span>
                    </div>
                  </div>

                  <div className="model-item-footer">
                    <button
                      className="btn btn-xs btn-primary w-full"
                      onClick={() => onNavigate('prediction', m.model_id)}
                    >
                      Run Predictions <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
