import React from 'react';

function JointStatus({ joints, loading, getStatusColor }) {
  if (loading) {
    return <div className="loading">Loading joint statuses...</div>;
  }

  if (!joints || joints.length === 0) {
    return <div className="no-data">No joints configured yet</div>;
  }

  return (
    <div className="cards-section">
      <h2 className="section-title">🔧 Joint Status Overview</h2>
      <div className="joints-grid">
        {joints.map((joint) => (
          <div key={joint.joint_id} className="joint-card">
            <div className="joint-header">
              <div className="joint-id">{joint.joint_id}</div>
              <span className={`joint-status-badge ${joint.status || 'UNKNOWN'}`}>
                {joint.status || 'UNKNOWN'}
              </span>
            </div>

            <div className="joint-details">
              {joint.latest_prediction && (
                <>
                  <div className="joint-detail-row">
                    <span className="joint-detail-label">Last Prediction</span>
                    <span className="joint-detail-value">
                      {new Date(joint.latest_prediction.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="joint-detail-row">
                    <span className="joint-detail-label">Confidence</span>
                    <span className="joint-detail-value">
                      {(joint.latest_prediction.confidence * 100).toFixed(2)}%
                    </span>
                  </div>
                </>
              )}

              {joint.latest_reading && (
                <>
                  <div className="joint-detail-row">
                    <span className="joint-detail-label">Temperature</span>
                    <span className="joint-detail-value">
                      {joint.latest_reading.temperature.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="joint-detail-row">
                    <span className="joint-detail-label">Vibration (Accel)</span>
                    <span className="joint-detail-value">
                      {joint.latest_reading.acceleration_rms.toFixed(2)} m/s²
                    </span>
                  </div>
                  <div className="joint-detail-row">
                    <span className="joint-detail-label">Belt Speed</span>
                    <span className="joint-detail-value">
                      {joint.latest_reading.belt_speed.toFixed(2)} m/s
                    </span>
                  </div>
                  <div className="joint-detail-row">
                    <span className="joint-detail-label">Belt Tension</span>
                    <span className="joint-detail-value">
                      {joint.latest_reading.belt_tension.toFixed(1)} N
                    </span>
                  </div>
                  <div className="joint-detail-row">
                    <span className="joint-detail-label">Current</span>
                    <span className="joint-detail-value">
                      {joint.latest_reading.current.toFixed(2)} A
                    </span>
                  </div>
                </>
              )}

              {joint.active_alerts > 0 && (
                <div className="joint-alerts-badge">
                  🚨 {joint.active_alerts} Active Alert{joint.active_alerts !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default JointStatus;
