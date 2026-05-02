import React from 'react';
import '../assets/css/student-assignments.css';

const Dashboard = () => {
  return (
    <div className="sa-root">
      <header className="sa-header">
        <h1>Schedule</h1>
        <p className="sa-sub">View and manage class schedules.</p>
      </header>

      <div className="sa-list">
        <div className="sa-card">
          <div className="sa-title">Schedule</div>
          <div className="sa-status">View and manage class schedules.</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
