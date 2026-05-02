import React from 'react';
import '../assets/css/student-assignments.css';

const StudentAssignments = () => {
  const tasks = [
    { id: 1, title: 'Math Leveling', status: 'Open' },
    { id: 2, title: 'Science Project', status: 'In Review' },
    { id: 3, title: 'History Essay', status: 'Assigned' },
  ];

  return (
    <div className="sa-root">
      <header className="sa-header">
        <h1>Student Assignments</h1>
        <p className="sa-sub">Requests and assignment status (mock)</p>
      </header>

      <div className="sa-list">
        {tasks.map((t) => (
          <div className="sa-card" key={t.id}>
            <div className="sa-title">{t.title}</div>
            <div className="sa-status">{t.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentAssignments;
