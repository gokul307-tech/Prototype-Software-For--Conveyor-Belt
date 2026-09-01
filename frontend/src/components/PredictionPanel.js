import React from 'react';
import { Brain, TrendingDown } from 'lucide-react';

const PredictionPanel = ({ dashboardData }) => {
  const prediction = dashboardData?.predictions?.[0];
  const healthStatus = prediction?.prediction || 'UNKNOWN';
  const confidence = prediction?.confidence || 0;
  const timestamp = prediction?.timestamp;

  // Map health status to health score
  const getHealthScore = (status) => {
    const statusUpper = (status || '').toUpperCase();
    if (statusUpper === 'HEALTHY') return 95;
    if (statusUpper === 'WARNING') return 65;
    if (statusUpper === 'HIGH_RISK') return 40;
    if (statusUpper === 'RUPTURE') return 10;
    return 50;
  };

  // Get color based on status
  const getStatusColor = (status) => {
    const statusUpper = (status || '').toUpperCase();
    if (statusUpper === 'HEALTHY') return '#10b981';
    if (statusUpper === 'WARNING') return '#f59e0b';
    if (statusUpper === 'HIGH_RISK') return '#ef4444';
    if (statusUpper === 'RUPTURE') return '#dc2626';
    return '#94a3b8';
  };

  const healthScore = getHealthScore(healthStatus);
  const statusColor = getStatusColor(healthStatus);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

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

  return (
    <div className="prediction-panel">
      <div className="prediction-card">
        <div className="prediction-header">
          <div className="prediction-icon">
            <Brain size={28} />
          </div>
          <div>
            <h2>Random Forest AI Prediction</h2>
            <p>ML-Based Health Assessment</p>
          </div>
        </div>

        <div className="prediction-content">
          <div className="health-gauge">
            <svg width="200" height="200" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="45"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="100"
                cy="100"
                r="45"
                fill="none"
                stroke={statusColor}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: '100px 100px',
                  transition: 'stroke-dashoffset 0.5s ease',
                }}
              />
              {/* Center text */}
              <text
                x="100"
                y="100"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="24"
                fontWeight="bold"
                fill={statusColor}
              >
                {healthScore}
              </text>
              <text
                x="100"
                y="125"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fill="rgba(255, 255, 255, 0.6)"
              >
                Health Score
              </text>
            </svg>
          </div>

          <div className="prediction-stats">
            <div className="stat-box">
              <label>Health Status</label>
              <div className="status-badge" style={{ borderColor: statusColor }}>
                <span
                  className="status-indicator"
                  style={{ backgroundColor: statusColor }}
                ></span>
                {healthStatus}
              </div>
            </div>

            <div className="stat-box">
              <label>AI Confidence</label>
              <div className="confidence-bar">
                <div
                  className="confidence-fill"
                  style={{
                    width: `${confidence * 100}%`,
                    backgroundColor: statusColor,
                  }}
                ></div>
              </div>
              <span className="confidence-text">
                {(confidence * 100).toFixed(1)}%
              </span>
            </div>

            <div className="stat-box">
              <label>Prediction Timestamp</label>
              <p className="timestamp">{formatDateTime(timestamp)}</p>
            </div>
          </div>
        </div>

        <div className="prediction-note">
          <TrendingDown size={16} />
          <p>Based on Random Forest machine learning model with real-time sensor data analysis</p>
        </div>
      </div>
    </div>
  );
};

export default PredictionPanel;
