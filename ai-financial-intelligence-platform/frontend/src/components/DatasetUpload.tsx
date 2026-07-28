import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Upload,
} from 'lucide-react';
import { uploadDataset } from '../services/api';
import type { DatasetUploadResponse } from '../types/api';
import type { TabType } from './Header';

interface DatasetUploadProps {
  onUploadSuccess: (dataset: DatasetUploadResponse) => void;
  onNavigate: (tab: TabType, selectedId?: string) => void;
}

export const DatasetUpload: React.FC<DatasetUploadProps> = ({
  onUploadSuccess,
  onNavigate,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedResult, setUploadedResult] = useState<DatasetUploadResponse | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file (.csv extension).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10 MB limit.');
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadedResult(null);

    try {
      const result = await uploadDataset(file);
      setUploadedResult(result);
      onUploadSuccess(result);
    } catch (err: any) {
      setError(err.message || 'Failed to process and upload CSV dataset.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="view-container max-w-4xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">CSV Dataset Ingestion</h1>
        <p className="page-description">
          Upload financial datasets for automated exploratory profiling, feature engineering pipeline initialization, and visualization generation.
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Drag and Drop Zone */}
      <div
        className={`drop-zone ${dragActive ? 'active' : ''} ${isUploading ? 'loading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="csv-file-input"
          accept=".csv"
          className="file-input-hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        <div className="drop-zone-content">
          <div className="drop-icon-wrapper">
            <Upload size={36} className="drop-icon" />
          </div>

          <h3 className="drop-title">
            {isUploading ? 'Analyzing & Ingesting Dataset...' : 'Drag & Drop CSV File Here'}
          </h3>

          <p className="drop-sub">
            Supports UTF-8 CSV files up to 10 MB in size.
          </p>

          {!isUploading && (
            <label htmlFor="csv-file-input" className="btn btn-primary mt-4 cursor-pointer">
              Browse Local Files
            </label>
          )}

          {isUploading && (
            <div className="progress-bar-container mt-6">
              <div className="progress-bar-fill animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Immediate Ingestion Success Card */}
      {uploadedResult && (
        <div className="panel mt-8 animate-fade-in">
          <div className="success-header">
            <CheckCircle2 size={24} className="text-emerald" />
            <div>
              <h3 className="text-lg font-bold">Dataset Ingested & Profiled Successfully</h3>
              <p className="text-sm text-muted">
                Original filename: <strong className="text-white">{uploadedResult.original_filename}</strong>
              </p>
            </div>
          </div>

          <div className="stats-grid mt-6">
            <div className="mini-stat">
              <span className="mini-stat-lbl">Dataset ID</span>
              <span className="mini-stat-val text-xs font-mono truncate">{uploadedResult.id}</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-lbl">Rows Ingested</span>
              <span className="mini-stat-val">{uploadedResult.row_count.toLocaleString()}</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-lbl">Features/Columns</span>
              <span className="mini-stat-val">{uploadedResult.columns.length}</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-lbl">Visualizations</span>
              <span className="mini-stat-val">{uploadedResult.visualizations.length}</span>
            </div>
          </div>

          <div className="column-tags mt-4">
            <span className="text-xs text-muted block mb-2 font-semibold">Detected Dataset Columns:</span>
            <div className="flex flex-wrap gap-2">
              {uploadedResult.columns.map((col) => (
                <span key={col} className="tag-pill">
                  {col}
                </span>
              ))}
            </div>
          </div>

          <div className="panel-actions mt-6 flex gap-4">
            <button
              className="btn btn-primary"
              onClick={() => onNavigate('eda', uploadedResult.id)}
            >
              Explore EDA & Visualizations <ArrowRight size={16} />
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => onNavigate('training', uploadedResult.id)}
            >
              Train Model on Dataset <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
