import React from 'react';
import { Zap, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const JointMonitor = ({ joints = [] }) => {
  const extractStatus = (status) => {
    if (!status) return '';
    if (typeof status === 'string') return status;
    if (typeof status === 'object') {
      if (status.prediction) return status.prediction;
      if (status.class) return status.class;
      if (status.status) return status.status;
    }
    return String(status);
  };

  const getStatusIcon = (status) => {
    const statusStr = extractStatus(status);
    const statusUpper = (statusStr || '').toUpperCase();
    if (statusUpper === 'HEALTHY') return CheckCircle;
    if (statusUpper === 'WARNING') return AlertCircle;
    if (statusUpper === 'HIGH_RISK' || statusUpper === 'RUPTURE')
      return XCircle;
    return AlertCircle;
  };

  const getStatusClass = (status) => {
    const statusStr = extractStatus(status);
    const statusUpper = (statusStr || '').toUpperCase();
    if (statusUpper === 'HEALTHY') return 'healthy';
    if (statusUpper === 'WARNING') return 'warning';
    if (statusUpper === 'HIGH_RISK') return 'risk';
    if (statusUpper === 'RUPTURE') return 'rupture';
    return 'unknown';
  };

  if (!joints || joints.length === 0) {
    return (
      <div className="joint-monitor">
        <h2>Conveyor Joint Monitoring</h2>
        <div className="empty-state">
          <Zap size={48} />
          <p>No joints data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="joint-monitor">
      <h2>Conveyor Joint Monitoring</h2>
      <div className="joints-grid">
        {joints.map((joint, index) => {
          const latestPrediction = joint.latest_prediction || {};
          const predictionText = extractStatus(latestPrediction.prediction || joint.status || latestPrediction) || 'UNKNOWN';
          const confidence = Number(latestPrediction.confidence ?? joint.confidence ?? 0);
          const percentage = Math.min(Math.max(confidence * 100, 0), 100);
          const Icon = getStatusIcon(predictionText);
          const statusClass = getStatusClass(predictionText);

          return (
            <div key={index} className={`joint-card joint-${statusClass}`}>
              <div className="joint-header">
                <div className="joint-id">{joint.joint_id || `J${String(index + 1).padStart(3, '0')}`}</div>
                <div className="joint-icon">
                  <Icon size={24} />
                </div>
              </div>

              <div className="joint-status">
                <label>Status</label>
                <p>{predictionText}</p>
              </div>

              <div className="joint-prediction">
                <label>Latest Prediction</label>
                <p>{predictionText}</p>
              </div>

              <div className="joint-confidence">
                <label>Confidence</label>
                <div className="confidence-bar">
                  <div
                    className="confidence-fill"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span>{percentage.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default JointMonitor;
