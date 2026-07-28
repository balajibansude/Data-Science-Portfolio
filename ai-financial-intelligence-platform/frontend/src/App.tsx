import React, { useEffect, useState } from 'react';
import { Header, type TabType } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { DatasetUpload } from './components/DatasetUpload';
import { DatasetDetails } from './components/DatasetDetails';
import { ModelTraining } from './components/ModelTraining';
import { PredictionView } from './components/PredictionView';
import {
  checkHealth,
  getCachedDatasets,
  getCachedModels,
  getCachedPredictions,
} from './services/api';
import type {
  DatasetUploadResponse,
  StoredPredictionRecord,
  TrainedModelResponse,
} from './types/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedEntityId, setSelectedEntityId] = useState<string | undefined>();
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  const [datasets, setDatasets] = useState<DatasetUploadResponse[]>([]);
  const [models, setModels] = useState<TrainedModelResponse[]>([]);
  const [predictions, setPredictions] = useState<StoredPredictionRecord[]>([]);

  useEffect(() => {
    // Load local storage cache
    setDatasets(getCachedDatasets());
    setModels(getCachedModels());
    setPredictions(getCachedPredictions());

    // Check backend health
    checkHealth()
      .then(() => setApiConnected(true))
      .catch(() => setApiConnected(false));
  }, []);

  const handleNavigate = (tab: TabType, entityId?: string) => {
    setActiveTab(tab);
    if (entityId) {
      setSelectedEntityId(entityId);
    }
  };

  const handleUploadSuccess = (newDataset: DatasetUploadResponse) => {
    setDatasets((prev) => [newDataset, ...prev.filter((d) => d.id !== newDataset.id)]);
  };

  const handleModelTrained = (newModel: TrainedModelResponse) => {
    setModels((prev) => [newModel, ...prev.filter((m) => m.model_id !== newModel.model_id)]);
  };

  return (
    <div className="app-shell">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiConnected={apiConnected}
      />

      <main className="app-main">
        {activeTab === 'overview' && (
          <DashboardOverview
            datasets={datasets}
            models={models}
            predictions={predictions}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'upload' && (
          <DatasetUpload
            onUploadSuccess={handleUploadSuccess}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'eda' && (
          <DatasetDetails
            datasets={datasets}
            selectedDatasetId={selectedEntityId}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'training' && (
          <ModelTraining
            datasets={datasets}
            selectedDatasetId={selectedEntityId}
            onModelTrained={handleModelTrained}
            onNavigate={handleNavigate}
          />
        )}

        {activeTab === 'prediction' && (
          <PredictionView
            models={models}
            datasets={datasets}
            selectedModelId={selectedEntityId}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <span>AI Financial Intelligence Platform &copy; 2026</span>
          <span className="footer-pill">FastAPI • Scikit-Learn • React + Vite</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
