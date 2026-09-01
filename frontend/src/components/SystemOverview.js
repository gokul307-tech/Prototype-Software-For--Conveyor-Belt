import React from 'react';
import { Activity, AlertTriangle, Zap, Brain } from 'lucide-react';

const SystemOverview = ({ dashboardData, alerts, joints }) => {
  const getHealthColor = (prediction) => {
    if (!prediction) return 'unknown';
    const pred = prediction.toUpperCase();
    if (pred === 'HEALTHY') return 'healthy';
    if (pred === 'WARNING') return 'warning';
    if (pred === 'HIGH_RISK') return 'risk';
    if (pred === 'RUPTURE') return 'rupture';
    return 'unknown';
  };

  const systemHealth =
    dashboardData?.predictions?.[0]?.prediction || 'UNKNOWN';
  const healthColor = getHealthColor(systemHealth);
  const activeAlerts = alerts.length;
  const activeJoints = joints?.length || 0;
  const aiConfidence = dashboardData?.predictions?.[0]?.confidence || 0;

  const cards = [
    {
      title: 'Overall System Health',
      value: systemHealth,
      icon: Activity,
      className: `card-${healthColor}`,
      metric: 'Current Status',
    },
    {
      title: 'Active Joints',
      value: activeJoints,
      icon: Zap,
      className: 'card-primary',
      metric: 'Monitored Units',
    },
    {
      title: 'Active Alerts',
      value: activeAlerts,
      icon: AlertTriangle,
      className: activeAlerts > 0 ? 'card-warning' : 'card-success',
      metric: 'Requiring Attention',
    },
    {
      title: 'AI Model Status',
      value: `${(aiConfidence * 100).toFixed(1)}%`,
      icon: Brain,
      className: 'card-primary',
      metric: 'Prediction Confidence',
    },
  ];

  return (
    <div className="system-overview">
      <div className="cards-grid">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className={`overview-card ${card.className}`}>
              <div className="card-header">
                <div className="card-icon">
                  <Icon size={24} />
                </div>
                <h3>{card.title}</h3>
              </div>
              <div className="card-value">{card.value}</div>
              <p className="card-metric">{card.metric}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SystemOverview;
