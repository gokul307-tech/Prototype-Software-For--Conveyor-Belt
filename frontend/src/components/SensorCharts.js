import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const SensorCharts = ({ historyData = [] }) => {
  if (!historyData || historyData.length === 0) {
    return (
      <div className="sensor-charts-section">
        <h2>Sensor History</h2>
        <div className="empty-state">
          <p>No historical data available yet. Data will appear after a few readings.</p>
        </div>
      </div>
    );
  }

  // Format data for charts
  const chartData = historyData.map((reading, index) => ({
    timestamp: new Date(reading.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    temperature: parseFloat(reading.temperature || 0),
    acceleration: parseFloat(reading.acceleration_rms || 0),
    gyro: parseFloat(reading.gyro_rms || 0),
    current: parseFloat(reading.current || 0),
    index: index,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value.toFixed(2)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="sensor-charts-section">
      <h2>Sensor History Analysis</h2>

      <div className="charts-container">
        {/* Temperature Chart */}
        <div className="chart-card">
          <h3>Temperature Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="timestamp"
                stroke="rgba(255,255,255,0.5)"
                tick={{ fontSize: 12 }}
              />
              <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="temperature"
                stroke="#f59e0b"
                fillOpacity={1}
                fill="url(#colorTemp)"
                name="Temperature (°C)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Vibration Chart */}
        <div className="chart-card">
          <h3>Vibration Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="timestamp"
                stroke="rgba(255,255,255,0.5)"
                tick={{ fontSize: 12 }}
              />
              <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="acceleration"
                stroke="#3b82f6"
                dot={false}
                name="Acceleration RMS (m/s²)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="gyro"
                stroke="#06b6d4"
                dot={false}
                name="Gyro RMS (°/s)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Current Chart */}
        <div className="chart-card">
          <h3>Motor Current</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="timestamp"
                stroke="rgba(255,255,255,0.5)"
                tick={{ fontSize: 12 }}
              />
              <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="current"
                stroke="#8b5cf6"
                fillOpacity={1}
                fill="url(#colorCurrent)"
                name="Motor Current (A)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SensorCharts;
