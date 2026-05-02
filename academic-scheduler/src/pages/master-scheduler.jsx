import React from 'react';
import '../assets/css/master-scheduler.css';

const MasterScheduler = () => {
  return (
    <div className="ms-root">
      <header className="ms-header">
        <h1>Master Scheduler</h1>
        <p className="ms-sub">Timetable overview and quick actions (mock)</p>
      </header>

      <section className="ms-grid">
        <div className="ms-card">
          <div className="ms-card-title">Unassigned Classes</div>
          <div className="ms-card-value">12</div>
        </div>
        <div className="ms-card">
          <div className="ms-card-title">Scheduled Today</div>
          <div className="ms-card-value">24</div>
        </div>
        <div className="ms-card">
          <div className="ms-card-title">Conflicts</div>
          <div className="ms-card-value">1</div>
        </div>
      </section>
    </div>
  );
};

export default MasterScheduler;
