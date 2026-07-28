import React, { useState } from 'react';
import {
  BarChart2,
  Brain,
  FileSpreadsheet,
  Image as ImageIcon,
  Layers,
  Table as TableIcon,
} from 'lucide-react';
import type { DatasetUploadResponse } from '../types/api';
import type { TabType } from './Header';

interface DatasetDetailsProps {
  datasets: DatasetUploadResponse[];
  selectedDatasetId?: string;
  onNavigate: (tab: TabType, selectedId?: string) => void;
}

export const DatasetDetails: React.FC<DatasetDetailsProps> = ({
  datasets,
  selectedDatasetId,
  onNavigate,
}) => {
  const [activeDatasetId, setActiveDatasetId] = useState<string>(
    selectedDatasetId || (datasets.length > 0 ? datasets[0].id : '')
  );
  const [activeSubTab, setActiveSubTab] = useState<'eda' | 'visualizations' | 'preprocessing'>('eda');

  const currentDataset = datasets.find((d) => d.id === activeDatasetId) || datasets[0];

  if (!currentDataset) {
    return (
      <div className="view-container">
        <div className="empty-state py-12">
          <FileSpreadsheet size={48} className="empty-icon" />
          <h2>No Datasets Available</h2>
          <p>Please upload a CSV dataset to explore EDA summaries and generated charts.</p>
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

  const { analysis, visualizations, preprocessing } = currentDataset;

  return (
    <div className="view-container">
      {/* Top Selector Bar */}
      <div className="panel mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="text-cyan" size={24} />
            <div>
              <label htmlFor="dataset-select" className="text-xs text-muted block font-semibold uppercase">
                Active Dataset
              </label>
              <select
                id="dataset-select"
                className="form-select text-base font-bold"
                value={currentDataset.id}
                onChange={(e) => setActiveDatasetId(e.target.value)}
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.original_filename} ({d.row_count.toLocaleString()} rows, {d.columns.length} cols)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigate('training', currentDataset.id)}
            >
              <Brain size={16} /> Train Model on Dataset
            </button>
          </div>
        </div>
      </div>

      {/* Dataset Sub Nav Tabs */}
      <div className="sub-nav-tabs mb-6">
        <button
          className={`sub-tab ${activeSubTab === 'eda' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('eda')}
        >
          <TableIcon size={16} /> Exploratory Profile & Statistics
        </button>
        <button
          className={`sub-tab ${activeSubTab === 'visualizations' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('visualizations')}
        >
          <ImageIcon size={16} /> Generated Visualizations ({visualizations.length})
        </button>
        <button
          className={`sub-tab ${activeSubTab === 'preprocessing' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('preprocessing')}
        >
          <Layers size={16} /> Preprocessing Pipeline
        </button>
      </div>

      {/* Sub Tab 1: EDA Summary & Statistics */}
      {activeSubTab === 'eda' && (
        <div className="space-y-6">
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="stat-details">
                <span className="stat-label">Shape (Rows × Columns)</span>
                <span className="stat-value text-xl font-mono">
                  {analysis.shape.rows.toLocaleString()} × {analysis.shape.columns}
                </span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-details">
                <span className="stat-label">Duplicate Rows</span>
                <span className={`stat-value text-xl ${analysis.duplicate_rows > 0 ? 'text-warning' : 'text-emerald'}`}>
                  {analysis.duplicate_rows}
                </span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-details">
                <span className="stat-label">Total Missing Values</span>
                <span className="stat-value text-xl">
                  {Object.values(analysis.missing_values).reduce((a, b) => a + b, 0)}
                </span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-details">
                <span className="stat-label">Numeric Columns</span>
                <span className="stat-value text-xl">
                  {Object.keys(analysis.statistics).length}
                </span>
              </div>
            </div>
          </div>

          {/* Target Suggestions */}
          {analysis.target_suggestions.length > 0 && (
            <div className="panel">
              <h3 className="panel-title mb-4">
                <Brain size={18} className="text-purple" /> Target Column Recommendations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.target_suggestions.map((sug, idx) => (
                  <div key={idx} className="card-item bg-dark-800 border-dark-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-cyan font-bold">{sug.column}</span>
                      <span className="badge badge-indigo uppercase text-xs">{sug.task_type}</span>
                    </div>
                    <p className="text-xs text-muted">{sug.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Values Breakdown Table */}
          <div className="panel">
            <h3 className="panel-title mb-4">Column Data Types & Missing Values</h3>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Column Name</th>
                    <th>Data Type</th>
                    <th>Missing Count</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analysis.column_types).map(([col, dtype]) => {
                    const missingCount = analysis.missing_values[col] || 0;
                    return (
                      <tr key={col}>
                        <td className="font-mono text-cyan">{col}</td>
                        <td>
                          <span className="tag-pill">{dtype}</span>
                        </td>
                        <td className={missingCount > 0 ? 'text-warning font-bold' : 'text-muted'}>
                          {missingCount}
                        </td>
                        <td>
                          {missingCount === 0 ? (
                            <span className="badge badge-emerald">Complete</span>
                          ) : (
                            <span className="badge badge-warning">Imputed in Pipeline</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Descriptive Statistics Table */}
          {Object.keys(analysis.statistics).length > 0 && (
            <div className="panel">
              <h3 className="panel-title mb-4">Descriptive Statistics (Numeric Features)</h3>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th>Count</th>
                      <th>Mean</th>
                      <th>Std</th>
                      <th>Min</th>
                      <th>25%</th>
                      <th>Median</th>
                      <th>75%</th>
                      <th>Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(analysis.statistics).map(([col, stat]) => (
                      <tr key={col}>
                        <td className="font-mono text-cyan">{col}</td>
                        <td>{stat.count}</td>
                        <td>{stat.mean !== null ? stat.mean.toFixed(2) : '-'}</td>
                        <td>{stat.std !== null ? stat.std.toFixed(2) : '-'}</td>
                        <td>{stat.min !== null ? stat.min.toFixed(2) : '-'}</td>
                        <td>{stat.percentile_25 !== null ? stat.percentile_25.toFixed(2) : '-'}</td>
                        <td>{stat.median !== null ? stat.median.toFixed(2) : '-'}</td>
                        <td>{stat.percentile_75 !== null ? stat.percentile_75.toFixed(2) : '-'}</td>
                        <td>{stat.max !== null ? stat.max.toFixed(2) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub Tab 2: Visualizations Gallery */}
      {activeSubTab === 'visualizations' && (
        <div className="space-y-6">
          {visualizations.length === 0 ? (
            <div className="empty-state py-8">
              <BarChart2 size={40} className="empty-icon" />
              <p>No visualization reports generated for this dataset.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visualizations.map((vis, idx) => (
                <div key={idx} className="panel hover-glow">
                  <div className="panel-header mb-3">
                    <span className="font-bold text-sm uppercase tracking-wider text-cyan">
                      {vis.chart_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-muted font-mono">{vis.path}</span>
                  </div>
                  <div className="vis-img-wrapper">
                    {/* Visual representation card */}
                    <div className="vis-mock-card">
                      <BarChart2 size={48} className="text-indigo mb-2" />
                      <span className="text-sm font-semibold">{vis.chart_type.toUpperCase()} REPORT</span>
                      <span className="text-xs text-muted">Generated Artifact Path: {vis.path}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub Tab 3: Preprocessing Pipeline */}
      {activeSubTab === 'preprocessing' && (
        <div className="panel space-y-6">
          <h3 className="panel-title">Scikit-Learn Feature Engineering Pipeline Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="mini-stat">
              <span className="mini-stat-lbl">Input Features</span>
              <span className="mini-stat-val">{preprocessing.input_features.length}</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-lbl">Engineered Features</span>
              <span className="mini-stat-val">{preprocessing.engineered_features.length}</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-lbl">Output Feature Count</span>
              <span className="mini-stat-val">{preprocessing.output_feature_count}</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-muted uppercase mb-3">Pipeline Transformations</h4>
            <div className="space-y-2">
              {preprocessing.steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg border border-dark-700">
                  <span className="w-6 h-6 rounded-full bg-indigo text-white text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-mono text-cyan">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
