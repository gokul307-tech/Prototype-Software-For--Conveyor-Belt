import React from 'react';
import {
  Zap,
  Thermometer,
  Wind,
  Gauge,
  Activity,
} from 'lucide-react';

const SensorCards = ({ dashboardData }) => {
  const latestReading = dashboardData?.latest_reading || {};

  const getStatusClass = (value, thresholds) => {
    if (!thresholds) return 'normal';
    if (value > thresholds.critical) return 'critical';
    if (value > thresholds.warning) return 'warning';
    return 'normal';
  };

  const sensors = [
    {
      name: 'Acceleration RMS',
      value: latestReading.acceleration_rms,
      unit: 'm/s²',
      icon: Activity,
      thresholds: { warning: 3, critical: 5 },
    },
    {
      name: 'Gyro RMS',
      value: latestReading.gyro_rms,
      unit: '°/s',
      icon: Gauge,
      thresholds: { warning: 2, critical: 4 },
    },
    {
      name: 'Temperature',
      value: latestReading.temperature,
      unit: '°C',
      icon: Thermometer,
      thresholds: { warning: 60, critical: 80 },
    },
    {
      name: 'Motor Current',
      value: latestReading.current,
      unit: 'A',
      icon: Zap,
      thresholds: { warning: 8, critical: 12 },
    },
    {
      name: 'Belt Speed',
      value: latestReading.belt_speed,
      unit: 'm/s',
      icon: Wind,
      thresholds: null,
    },
    {
      name: 'Belt Tension',
      value: latestReading.belt_tension,
      unit: 'N',
      icon: Gauge,
      thresholds: { warning: 400, critical: 500 },
    },
  ];

  return (
    <div className="sensor-cards-section">
      <h2>Live Sensor Monitoring</h2>
      <div className="sensor-cards-grid">
        {sensors.map((sensor, index) => {
          const Icon = sensor.icon;
          const statusClass = getStatusClass(
            sensor.value || 0,
            sensor.thresholds
          );
          const displayValue =
            sensor.value !== undefined
              ? typeof sensor.value === 'number'
                ? sensor.value.toFixed(2)
                : sensor.value
              : 'N/A';

          return (
            <div
              key={index}
              className={`sensor-card sensor-${statusClass}`}
            >
              <div className="sensor-header">
                <div className="sensor-icon">
                  <Icon size={20} />
                </div>
                <h4>{sensor.name}</h4>
              </div>
              <div className="sensor-value">
                {displayValue}
                <span className="unit">{sensor.unit}</span>
              </div>
              <div className="sensor-status">
                <span className={`status-indicator status-${statusClass}`}></span>
                <span className="status-text">
                  {statusClass === 'critical'
                    ? 'Critical'
                    : statusClass === 'warning'
                      ? 'Warning'
                      : 'Normal'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SensorCards;
