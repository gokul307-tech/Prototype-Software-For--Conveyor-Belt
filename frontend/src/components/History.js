import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jointFilter, setJointFilter] = useState('');
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (jointFilter) params.append('joint_id', jointFilter);
        params.append('limit', limit);

        const response = await axios.get(
          `${API_URL}/history?${params.toString()}`
        );
        setHistory(response.data.history || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching history:', error);
        setLoading(false);
      }
    };

    fetchHistory();
  }, [jointFilter, limit]);

  if (loading) {
    return <div className="loading">Loading history...</div>;
  }

  if (!history || history.length === 0) {
    return <div className="no-data">No history data available</div>;
  }

  const getStatusClass = (prediction) => {
    switch (prediction) {
      case 'HEALTHY':
        return 'healthy';
      case 'WARNING':
        return 'warning';
      case 'HIGH_RISK':
        return 'risk';
      case 'RUPTURE':
        return 'rupture';
      default:
        return 'unknown';
    }
  };

  const getStatusBadge = (prediction) => {
    switch (prediction) {
      case 'HEALTHY':
        return '✅';
      case 'WARNING':
        return '⚠️';
      case 'HIGH_RISK':
        return '🔴';
      case 'RUPTURE':
        return '⛔';
      default:
        return '❓';
    }
  };

  return (
    <div className="history-container">
      <div className="history-filters">
        <input
          type="text"
          className="history-filter-input"
          placeholder="Filter by Joint ID (e.g., joint_01)"
          value={jointFilter}
          onChange={(e) => setJointFilter(e.target.value)}
        />
        <select
          className="history-filter-input"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          style={{ maxWidth: '200px' }}
        >
          <option value={20}>Last 20</option>
          <option value={50}>Last 50</option>
          <option value={100}>Last 100</option>
          <option value={200}>Last 200</option>
        </select>
      </div>

      <div className="history-table">
        <div className="history-table-header">
          <div>Timestamp</div>
          <div>Joint ID</div>
          <div>Prediction</div>
          <div>Confidence</div>
          <div>Sensor Data</div>
        </div>

        {history.map((item, idx) => (
          <div key={idx} className="history-table-row">
            <div>
              {new Date(item.sensor_reading.timestamp).toLocaleString()}
            </div>
            <div>
              <strong>{item.sensor_reading.joint_id}</strong>
            </div>
            <div>
              <span className={`prediction-status ${getStatusClass(item.prediction?.prediction)}`}>
                {getStatusBadge(item.prediction?.prediction)} {item.prediction?.prediction || 'N/A'}
              </span>
            </div>
            <div>
              {item.prediction ? (
                <strong>{(item.prediction.confidence * 100).toFixed(2)}%</strong>
              ) : (
                'N/A'
              )}
            </div>
            <div>
              <details style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <summary>View</summary>
                <div style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace'
                }}>
                  <div>Accel: {item.sensor_reading.acceleration_rms.toFixed(3)}</div>
                  <div>Temp: {item.sensor_reading.temperature.toFixed(1)}°C</div>
                  <div>Current: {item.sensor_reading.current.toFixed(2)}A</div>
                  <div>Speed: {item.sensor_reading.belt_speed.toFixed(2)}m/s</div>
                </div>
              </details>
            </div>
          </div>
        ))}
      </div>

      <div className="stat-label" style={{ marginTop: '1rem', textAlign: 'center' }}>
        Showing {history.length} records
      </div>
    </div>
  );
}

export default History;
