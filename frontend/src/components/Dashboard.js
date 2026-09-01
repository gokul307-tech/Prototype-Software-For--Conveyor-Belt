import React from 'react';

function Dashboard({ data, loading }) {
  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  if (!data || !data.summary) {
    return <div className="no-data">No data available</div>;
  }

  const summary = data.summary;
  const statusMap = {
    HEALTHY: 'healthy',
    WARNING: 'warning',
    HIGH_RISK: 'risk',
    RUPTURE: 'rupture'
  };

  return (
    <div className="dashboard">
      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Sensor Readings</div>
          <div className="stat-value">{summary.total_sensor_readings}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Predictions</div>
          <div className="stat-value">{summary.total_predictions}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Alerts</div>
          <div className="stat-value" style={{
            color: summary.active_alerts > 0 ? '#ef4444' : '#10b981'
          }}>
            {summary.active_alerts}
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="stat-card">
        <div className="stat-label">Health Status Breakdown</div>
        <div className="status-breakdown">
          <div className={`status-item healthy`}>
            <div className="status-item-label">Healthy</div>
            <div className="status-item-value">
              {summary.status_breakdown?.HEALTHY || 0}
            </div>
          </div>
          <div className={`status-item warning`}>
            <div className="status-item-label">Warning</div>
            <div className="status-item-value">
              {summary.status_breakdown?.WARNING || 0}
            </div>
          </div>
          <div className={`status-item risk`}>
            <div className="status-item-label">High Risk</div>
            <div className="status-item-value">
              {summary.status_breakdown?.HIGH_RISK || 0}
            </div>
          </div>
          <div className={`status-item rupture`}>
            <div className="status-item-label">Rupture</div>
            <div className="status-item-value">
              {summary.status_breakdown?.RUPTURE || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Latest Predictions */}
      <div className="cards-section">
        <h2 className="section-title">📊 Latest Predictions</h2>
        {data.latest_predictions && data.latest_predictions.length > 0 ? (
          <div className="predictions-list">
            {data.latest_predictions.slice(0, 10).map((pred) => (
              <div key={pred.id} className="prediction-item">
                <div className="prediction-info">
                  <div className="prediction-header">
                    <div className="prediction-joint">Joint {pred.joint_id}</div>
                    <span className={`prediction-status ${statusMap[pred.prediction] || 'unknown'}`}>
                      {pred.prediction}
                    </span>
                  </div>
                  <div className="prediction-time">
                    {new Date(pred.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="prediction-details">
                  <div className="prediction-detail-item">
                    <div className="prediction-detail-label">Confidence</div>
                    <div className="prediction-detail-value">
                      {(pred.confidence * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="prediction-detail-item">
                    <div className="prediction-detail-label">Model</div>
                    <div className="prediction-detail-value">
                      {pred.model_type}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">No predictions yet</div>
        )}
      </div>

      {/* Active Alerts Preview */}
      {data.active_alerts && data.active_alerts.length > 0 && (
        <div className="cards-section">
          <h2 className="section-title">🚨 Active Alerts Preview</h2>
          <div className="alerts-list">
            {data.active_alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className={`alert-item ${alert.severity.toLowerCase()}`}>
                <div className="alert-icon">
                  {alert.severity === 'RUPTURE' ? '⛔' : '⚠️'}
                </div>
                <div className="alert-content">
                  <div className="alert-header">
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                        {alert.message}
                      </div>
                    </div>
                    <span className={`alert-severity ${alert.severity.toLowerCase()}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <div className="alert-time">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
