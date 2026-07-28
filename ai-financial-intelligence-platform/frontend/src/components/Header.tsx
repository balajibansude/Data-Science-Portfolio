import React from 'react';
import {
  Activity,
  BarChart3,
  BrainCircuit,
  Cpu,
  FileSpreadsheet,
  Upload,
} from 'lucide-react';

export type TabType = 'overview' | 'upload' | 'eda' | 'training' | 'prediction';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  apiConnected: boolean | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  apiConnected,
}) => {
  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'upload', label: 'Upload Dataset', icon: Upload },
    { id: 'eda', label: 'EDA & Reports', icon: FileSpreadsheet },
    { id: 'training', label: 'Model Training', icon: Cpu },
    { id: 'prediction', label: 'Predictions', icon: Activity },
  ] as const;

  return (
    <header className="header-bar">
      <div className="header-brand">
        <div className="brand-logo">
          <BrainCircuit className="logo-icon" size={24} />
        </div>
        <div className="brand-text">
          <span className="brand-title">FinAI Intelligence</span>
          <span className="brand-subtitle">Automated ML & Financial Analytics</span>
        </div>
      </div>

      <nav className="header-nav" aria-label="Main Navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              className={`nav-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as TabType)}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="header-status">
        <span className="status-label">API Status</span>
        <span
          className={`status-badge ${
            apiConnected === true
              ? 'online'
              : apiConnected === false
              ? 'offline'
              : 'checking'
          }`}
        >
          <span className="status-dot" />
          {apiConnected === true
            ? 'Connected'
            : apiConnected === false
            ? 'Offline'
            : 'Checking...'}
        </span>
      </div>
    </header>
  );
};
