import React from 'react';
import '../assets/css/teacher-allocation.css';

const TeacherAllocation = () => {
  const mock = [
    { name: 'Ms. Rivera', load: 'Full' },
    { name: 'Mr. Santos', load: 'Partial' },
    { name: 'Ms. Cruz', load: 'Available' },
  ];

  return (
    <div className="ta-root">
      <header className="ta-header">
        <h1>Teacher Allocation</h1>
        <p className="ta-sub">Quick view of teacher loads (mock)</p>
      </header>

      <ul className="ta-list">
        {mock.map((t) => (
          <li key={t.name} className="ta-item">
            <div className="ta-name">{t.name}</div>
            <div className="ta-load">{t.load}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TeacherAllocation;
