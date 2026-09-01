import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw } from 'lucide-react';

const Header = ({ onRefresh, isLoading, isOnline }) => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="header">
      <div className="header-left">
        <h1>Intelligent Conveyor Monitoring System</h1>
        <div className="header-status">
          <div className={`status-badge ${isOnline ? 'online' : 'offline'}`}>
            <span className="status-dot"></span>
            <span>{isOnline ? '● SYSTEM ONLINE' : '● SYSTEM OFFLINE'}</span>
          </div>
          <div className="datetime-display">
            <Clock size={16} />
            <span>{formatDateTime(currentDateTime)}</span>
          </div>
        </div>
      </div>

      <button
        className="btn-refresh"
        onClick={onRefresh}
        disabled={isLoading}
        title="Refresh data"
      >
        <RefreshCw size={20} className={isLoading ? 'spinning' : ''} />
        <span>Refresh</span>
      </button>
    </div>
  );
};

export default Header;
