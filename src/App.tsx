import React, { useEffect, useRef } from 'react';
import { useStore } from './store/useStore';
import { Sidebar } from './components/layout/Sidebar';
import { RequestBuilder } from './components/client/RequestBuilder';
import { ResponseViewer } from './components/client/ResponseViewer';
import { CollectionsView } from './components/collections/CollectionsView';
import { MonitorView } from './components/monitor/MonitorView';
import { DashboardView } from './components/dashboard/DashboardView';
import { AlertsView } from './components/alerts/AlertsView';
import './App.css';

const App: React.FC = () => {
  const { activeTab, endpoints, startMonitoring, isMonitorRunning } = useStore();
  const initialized = useRef(false);

  // Auto-start monitoring for endpoints that had monitoring enabled
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const monitorEnabled = endpoints.filter(e => e.monitoringEnabled);
    monitorEnabled.forEach(ep => {
      if (!isMonitorRunning(ep.id)) {
        startMonitoring(ep.id);
      }
    });
  }, []);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* API Client */}
        {activeTab === 'client' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel: Collections sidebar */}
            <div className="w-64 shrink-0 border-r border-slate-800 overflow-hidden">
              <CollectionsView />
            </div>

            {/* Middle Panel: Request Builder */}
            <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-800">
              <RequestBuilder />
            </div>

            {/* Right Panel: Response */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <ResponseViewer />
            </div>
          </div>
        )}

        {/* Collections Full View */}
        {activeTab === 'collections' && (
          <div className="flex-1 overflow-hidden">
            <CollectionsView />
          </div>
        )}

        {/* Monitor */}
        {activeTab === 'monitor' && (
          <div className="flex-1 overflow-hidden">
            <MonitorView />
          </div>
        )}

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <DashboardView />
          </div>
        )}

        {/* Alerts */}
        {activeTab === 'alerts' && (
          <div className="flex-1 overflow-hidden">
            <AlertsView />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
