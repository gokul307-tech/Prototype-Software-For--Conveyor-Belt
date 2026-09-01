import React from 'react';
import {
  BarChart3,
  Activity,
  AlertCircle,
  Home,
  Zap,
} from 'lucide-react';

const Sidebar = ({ activeSection, onSectionChange, isOnline }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'monitoring', label: 'Conveyor Monitoring', icon: Activity },
    { id: 'joints', label: 'Joint Health', icon: Zap },
    { id: 'vision', label: 'Vision AI', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: AlertCircle },
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <Zap size={32} className="logo-icon" />
          <div>
            <h1>ConveyorAI</h1>
            <p>Health Monitor</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => onSectionChange(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
          <span className="status-dot"></span>
          <span className="status-text">
            {isOnline ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
