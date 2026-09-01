import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import SystemOverview from './components/SystemOverview';
import SensorCards from './components/SensorCards';
import PredictionPanel from './components/PredictionPanel';
import JointMonitor from './components/JointMonitor';
import SensorCharts from './components/SensorCharts';
import AlertsPanel from './components/AlertsPanel';
import VisionAI from './components/VisionAI';
import DigitalTwin from './components/DigitalTwin';
import apiService from './services/api';

function App() {
  const [dashboardData, setDashboardData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [joints, setJoints] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');

  // Fetch all data from backend
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Health check
      await apiService.getHealth();
      setIsOnline(true);

      // Parallel requests
      const [dashRes, alertsRes, jointsRes, historyRes] = await Promise.all([
        apiService.getDashboard(),
        apiService.getAlerts(true),
        apiService.getJoints(),
        apiService.getHistory(100),
      ]);

      const normalizedDashboard = {
        ...dashRes,
        predictions: dashRes.latest_predictions || [],
        latest_reading:
          (historyRes.history && historyRes.history[0]?.sensor_reading) ||
          (jointsRes.joints && jointsRes.joints[0]?.latest_reading) ||
          {},
      };

      setDashboardData(normalizedDashboard);
      setAlerts(alertsRes.alerts || []);
      setJoints(jointsRes.joints || []);
      setHistoryData(
        (historyRes.history || []).map((item) => item.sensor_reading).reverse()
      );
    } catch (err) {
      console.error('Data fetch error:', err);
      setError(err.message);
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAllData();
  }, []);

  // Auto-refresh every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllData();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Offline state rendering
  if (error && !dashboardData) {
    return (
      <div className="app offline-state">
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} isOnline={false} />
        <div className="main-content">
          <Header onRefresh={fetchAllData} isLoading={loading} isOnline={false} />
          <div className="content-area">
            <div className="error-container">
              <div className="error-icon">⚠️</div>
              <h2>Backend Connection Failed</h2>
              <p>{error}</p>
              <p className="error-hint">Make sure Flask backend is running at http://localhost:5000</p>
              <button className="btn-primary" onClick={fetchAllData}>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} isOnline={isOnline} />

      <div className="main-content">
        <Header onRefresh={fetchAllData} isLoading={loading} isOnline={isOnline} />

        <div className="content-area">
          {/* Dashboard Section */}
          {activeSection === 'dashboard' && (
            <div className="section dashboard-section">
              <SystemOverview dashboardData={dashboardData} alerts={alerts} joints={joints} />
              <PredictionPanel dashboardData={dashboardData} />
              <SensorCards dashboardData={dashboardData} />
              <SensorCharts historyData={historyData} />
            </div>
          )}

          {/* Conveyor Monitoring Section */}
          {activeSection === 'monitoring' && (
            <div className="section monitoring-section">
              <DigitalTwin dashboardData={dashboardData} latestReading={dashboardData?.latest_reading} />
              <SensorCards dashboardData={dashboardData} />
              <SensorCharts historyData={historyData} />
            </div>
          )}

          {/* Joint Health Section */}
          {activeSection === 'joints' && (
            <div className="section joints-section">
              <JointMonitor joints={joints} />
              <SensorCharts historyData={historyData} />
            </div>
          )}

          {/* Vision AI Section */}
          {activeSection === 'vision' && (
            <div className="section vision-section">
              <VisionAI />
            </div>
          )}

          {/* Alerts Section */}
          {activeSection === 'alerts' && (
            <div className="section alerts-section">
              <AlertsPanel alerts={alerts} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
