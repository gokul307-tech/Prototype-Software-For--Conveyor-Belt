import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const AlertsPanel = ({ alerts = [] }) => {
  const getSeverityIcon = (severity) => {
    const sev = (severity || '').toUpperCase();
    if (sev === 'CRITICAL' || sev === 'HIGH_RISK')
      return AlertTriangle;
    if (sev === 'WARNING') return AlertCircle;
    return CheckCircle;
  };

  const getSeverityClass = (severity) => {
    const sev = (severity || '').toUpperCase();
    if (sev === 'CRITICAL' || sev === 'HIGH_RISK') return 'critical';
    if (sev === 'WARNING') return 'warning';
    return 'info';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (!alerts || alerts.length === 0) {
    return (
      <div className="alerts-panel">
        <h2>Active Alerts</h2>
        <div className="empty-state success">
          <CheckCircle size={48} />
          <p>No active alerts - System operating normally</p>
        </div>
      </div>
    );
  }

  return (
    <div className="alerts-panel">
      <h2>Active Alerts ({alerts.length})</h2>

      <div className="alerts-list">
        {alerts.map((alert, index) => {
          const Icon = getSeverityIcon(alert.severity);
          const severityClass = getSeverityClass(alert.severity);

          return (
            <div key={index} className={`alert-item alert-${severityClass}`}>
              <div className="alert-icon">
                <Icon size={24} />
              </div>

              <div className="alert-details">
                <div className="alert-header">
                  <h4>{alert.message || 'System Alert'}</h4>
                  <span className={`severity-badge severity-${severityClass}`}>
                    {alert.severity || 'UNKNOWN'}
                  </span>
                </div>

                <div className="alert-meta">
                  <span className="meta-item">
                    <strong>Joint:</strong> {alert.joint_id || 'N/A'}
                  </span>
                  <span className="meta-item">
                    <Clock size={14} />
                    {formatDateTime(alert.timestamp)}
                  </span>
                </div>

                {alert.details && (
                  <p className="alert-description">{alert.details}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsPanel;
