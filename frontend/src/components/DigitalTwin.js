import React from 'react';

const DigitalTwin = ({ dashboardData, latestReading }) => {
  const prediction = dashboardData?.predictions?.[0]?.prediction || 'UNKNOWN';
  const status = (prediction || '').toUpperCase();

  const getStatusColor = (st) => {
    if (st === 'HEALTHY') return '#10b981';
    if (st === 'WARNING') return '#f59e0b';
    if (st === 'HIGH_RISK') return '#ef4444';
    if (st === 'RUPTURE') return '#dc2626';
    return '#94a3b8';
  };

  const getStatusLabel = (st) => {
    if (st === 'HEALTHY') return 'Normal Operation';
    if (st === 'WARNING') return 'Caution - Monitor Closely';
    if (st === 'HIGH_RISK') return 'High Risk - Action Required';
    if (st === 'RUPTURE') return 'Critical - Immediate Action Required';
    return 'Unknown Status';
  };

  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);

  // Extract values
  const temperature = latestReading?.temperature || 0;
  const current = latestReading?.current || 0;
  const vibration = latestReading?.acceleration_rms || 0;
  const speed = latestReading?.belt_speed || 0;

  // Calculate visual indicators (0-100%)
  const getTempIndicator = () => Math.min((temperature / 100) * 100, 100);
  const getCurrentIndicator = () => Math.min((current / 15) * 100, 100);
  const getVibrationIndicator = () => Math.min((vibration / 10) * 100, 100);

  const tempIndicator = getTempIndicator();
  const currentIndicator = getCurrentIndicator();
  const vibrationIndicator = getVibrationIndicator();

  return (
    <div className="digital-twin-section">
      <div className="twin-header">
        <h2>Live Data-Connected Digital Twin</h2>
        <p>Real-time visualization of conveyor system with live sensor data</p>
      </div>

      <div className="twin-container">
        <div className="twin-visualization">
          <svg
            width="100%"
            height="400"
            viewBox="0 0 800 400"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Background */}
            <rect width="800" height="400" fill="rgba(15, 23, 42, 0.5)" />

            {/* Base Line */}
            <line x1="50" y1="350" x2="750" y2="350" stroke="#475569" strokeWidth="2" />

            {/* Motor Housing */}
            <g>
              <rect
                x="50"
                y="280"
                width="80"
                height="70"
                fill="rgba(100, 100, 100, 0.3)"
                stroke={statusColor}
                strokeWidth="2"
              />
              <text
                x="90"
                y="325"
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="bold"
              >
                Motor
              </text>
              {/* Motor rotation indicator */}
              <circle
                cx="90"
                cy="300"
                r="15"
                fill="none"
                stroke={statusColor}
                strokeWidth="2"
                opacity="0.7"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 90 300"
                  to="360 90 300"
                  dur={speed > 0 ? `${3 / speed}s` : '3s'}
                  repeatCount="indefinite"
                />
              </circle>
            </g>

            {/* Drive Pulley */}
            <g>
              <circle
                cx="150"
                cy="330"
                r="30"
                fill="rgba(150, 150, 150, 0.3)"
                stroke={statusColor}
                strokeWidth="2"
              />
              <text
                x="150"
                y="335"
                textAnchor="middle"
                fill="white"
                fontSize="10"
              >
                Pulley
              </text>
              <circle
                cx="150"
                cy="330"
                r="20"
                fill="none"
                stroke={statusColor}
                strokeWidth="1"
                opacity="0.5"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 150 330"
                  to="360 150 330"
                  dur={speed > 0 ? `${3 / speed}s` : '3s'}
                  repeatCount="indefinite"
                />
              </circle>
            </g>

            {/* Conveyor Belt */}
            <g>
              <rect
                x="200"
                y="310"
                width="400"
                height="40"
                fill="rgba(200, 200, 200, 0.2)"
                stroke={statusColor}
                strokeWidth="2"
              />
              <text
                x="400"
                y="340"
                textAnchor="middle"
                fill="white"
                fontSize="14"
                fontWeight="bold"
              >
                Conveyor Belt
              </text>
              {/* Moving pattern for belt */}
              <defs>
                <pattern
                  id="beltPattern"
                  x="0"
                  y="0"
                  width="20"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="20"
                    y2="40"
                    stroke={statusColor}
                    strokeWidth="1"
                    opacity="0.5"
                  />
                </pattern>
              </defs>
              <rect
                x="200"
                y="310"
                width="400"
                height="40"
                fill="url(#beltPattern)"
                opacity="0.6"
              >
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  from="0 0"
                  to="20 0"
                  dur={speed > 0 ? `${1 / speed}s` : '1s'}
                  repeatCount="indefinite"
                />
              </rect>
            </g>

            {/* Inspection Zone */}
            <g>
              <rect
                x="350"
                y="280"
                width="100"
                height="30"
                fill="rgba(255, 200, 0, 0.1)"
                stroke="#fbbf24"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              <text
                x="400"
                y="300"
                textAnchor="middle"
                fill="#fbbf24"
                fontSize="11"
                fontWeight="bold"
              >
                Inspection Zone
              </text>
            </g>

            {/* Idler Pulley */}
            <g>
              <circle
                cx="650"
                cy="330"
                r="30"
                fill="rgba(150, 150, 150, 0.3)"
                stroke={statusColor}
                strokeWidth="2"
              />
              <text
                x="650"
                y="335"
                textAnchor="middle"
                fill="white"
                fontSize="10"
              >
                Idler
              </text>
              <circle
                cx="650"
                cy="330"
                r="20"
                fill="none"
                stroke={statusColor}
                strokeWidth="1"
                opacity="0.5"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 650 330"
                  to="360 650 330"
                  dur={speed > 0 ? `${3 / speed}s` : '3s'}
                  repeatCount="indefinite"
                />
              </circle>
            </g>

            {/* Status Label */}
            <text
              x="400"
              y="40"
              textAnchor="middle"
              fill={statusColor}
              fontSize="20"
              fontWeight="bold"
            >
              {statusLabel}
            </text>
            <text
              x="400"
              y="65"
              textAnchor="middle"
              fill="rgba(255, 255, 255, 0.7)"
              fontSize="14"
            >
              Status: {status}
            </text>
          </svg>
        </div>

        {/* Sensor Indicators */}
        <div className="twin-sensors">
          <div className="sensor-indicator">
            <div className="indicator-label">Temperature</div>
            <div className="indicator-bar">
              <div
                className="indicator-fill"
                style={{
                  width: `${tempIndicator}%`,
                  backgroundColor:
                    tempIndicator > 80
                      ? '#ef4444'
                      : tempIndicator > 60
                        ? '#f59e0b'
                        : '#10b981',
                }}
              ></div>
            </div>
            <div className="indicator-value">{temperature.toFixed(1)}°C</div>
          </div>

          <div className="sensor-indicator">
            <div className="indicator-label">Motor Current</div>
            <div className="indicator-bar">
              <div
                className="indicator-fill"
                style={{
                  width: `${currentIndicator}%`,
                  backgroundColor:
                    currentIndicator > 80
                      ? '#ef4444'
                      : currentIndicator > 60
                        ? '#f59e0b'
                        : '#10b981',
                }}
              ></div>
            </div>
            <div className="indicator-value">{current.toFixed(2)}A</div>
          </div>

          <div className="sensor-indicator">
            <div className="indicator-label">Vibration</div>
            <div className="indicator-bar">
              <div
                className="indicator-fill"
                style={{
                  width: `${vibrationIndicator}%`,
                  backgroundColor:
                    vibrationIndicator > 80
                      ? '#ef4444'
                      : vibrationIndicator > 60
                        ? '#f59e0b'
                        : '#10b981',
                }}
              ></div>
            </div>
            <div className="indicator-value">
              {vibration.toFixed(2)}m/s²
            </div>
          </div>

          <div className="sensor-indicator">
            <div className="indicator-label">Belt Speed</div>
            <div className="indicator-value">{speed.toFixed(2)}m/s</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalTwin;
