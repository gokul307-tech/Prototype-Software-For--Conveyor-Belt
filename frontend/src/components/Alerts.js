import React from 'react';

function Alerts({ alerts, loading }) {
  if (loading) {
    return <div className="loading">Loading alerts...</div>;
  }

  if (!alerts || alerts.length === 0) {
    return (
      <div className="no-data">
        ✅ No active alerts - All systems operational!
      </div>
    );
  }

  return (
    <div className="cards-section">
      <h2 className="section-title">
        🚨 Active Alerts ({alerts.length})
      </h2>
      <div className="alerts-list">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`alert-item ${alert.severity.toLowerCase()}`}
          >
            <div className="alert-icon">
              {alert.severity === 'RUPTURE' ? '⛔' : '⚠️'}
            </div>
            <div className="alert-content">
              <div className="alert-header">
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
                    Joint {alert.joint_id}
                  </div>
                  <div className="alert-message">
                    {alert.message}
                  </div>
                </div>
                <span className={`alert-severity ${alert.severity.toLowerCase()}`}>
                  {alert.severity}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <div>
                  <div className="prediction-detail-label">Created</div>
                  <div className="prediction-detail-value" style={{ fontSize: '0.95rem' }}>
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="prediction-detail-label">Status</div>
                  <div className="prediction-detail-value" style={{ fontSize: '0.95rem' }}>
                    {alert.is_active ? '🔴 Active' : '✅ Resolved'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Alerts;
