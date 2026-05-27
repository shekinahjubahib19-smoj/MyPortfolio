import React, { useState } from 'react';
import '../assets/css/master-scheduler.css';

const MasterScheduler = () => {
  const [assignments, setAssignments] = useState([]);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [viewMode, setViewMode] = useState('student'); // 'student' | 'teacher'

  const runAllocation = async () => {
    setRunning(true); setMessage({ type: '', text: '' });
    try {
      const res = await fetch('http://localhost/MyPortfolio/academic-scheduler/backend/api/run_allocation.php', { method: 'POST' });
      const j = await res.json();
      if (j.success) {
        setAssignments(j.assignments || []);
        setMessage({ type: 'success', text: 'Allocation completed' });
      } else {
        setMessage({ type: 'error', text: j.message || 'Allocation failed' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Allocation error' });
    } finally {
      setRunning(false);
    }
  };

  const exportCsv = () => {
    if (assignments.length === 0) {
      setMessage({ type: 'error', text: 'No assignments to export' });
      return;
    }

    const rows = assignments.map((a) => ({
      student_code: a.student_code,
      student_name: `${a.first_name} ${a.last_name}`.trim(),
      teacher_name: a.teacher_name,
      day_of_week: a.day_of_week,
      slot_index: a.slot_index,
    }));

    const header = ['student_code', 'student_name', 'teacher_name', 'day_of_week', 'slot_index'];
    const csv = [header.join(',')]
      .concat(rows.map((r) => header.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schedule_${viewMode}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearView = () => {
    setAssignments([]);
    setMessage({ type: '', text: '' });
  };

  return (
    <div className="ms-root">
      <header className="ms-header">
        <div>
          <h1>Master Scheduler</h1>
          <p className="ms-sub">Run automatic allocation and review generated schedule</p>
        </div>
        <div className="ms-actions">
          <button className="btn" onClick={runAllocation} disabled={running}>{running ? 'Running…' : 'Run Allocation'}</button>
          <button className="btn ms-btn-outline" onClick={exportCsv}>Export CSV</button>
          <button className="btn ms-btn-outline" onClick={() => window.print()}>Print</button>
        </div>
      </header>

      <div className="ms-controls">
        <div className="ms-control">
          <label htmlFor="viewMode">View:</label>
          <select id="viewMode" value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
            <option value="student">By Student</option>
            <option value="teacher">By Teacher</option>
          </select>
        </div>
        <div className="ms-control-right">
          <button className="btn ms-btn-outline" onClick={clearView}>Clear</button>
        </div>
      </div>

      <section style={{ marginTop: '1rem' }}>
        {message.text && (
          <div className={`ms-message ${message.type}`} role="status" aria-live="polite">{message.text}</div>
        )}
        <div style={{ overflowX: 'auto' }}>
          {assignments.length === 0 && (
            <div className="ms-empty">No assignments yet</div>
          )}

          {viewMode === 'student' && assignments.length > 0 && (
            <div>
              {Object.values(assignments.reduce((acc, a) => {
                const sid = a.student_id;
                acc[sid] = acc[sid] || { student: `${a.student_code} - ${a.first_name} ${a.last_name}`, rows: [] };
                acc[sid].rows.push(a);
                return acc;
              }, {})).map((g) => (
                <div key={g.student} className="ms-group">
                  <div className="ms-group-title">{g.student}</div>
                  <table className="ms-table">
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>Slot</th>
                        <th>Teacher</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.rows.map((r, idx) => (
                        <tr key={idx}>
                          <td>{r.day_of_week}</td>
                          <td>{r.slot_index}</td>
                          <td>{r.teacher_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'teacher' && assignments.length > 0 && (
            <div>
              {Object.values(assignments.reduce((acc, a) => {
                const tid = a.teacher_id;
                acc[tid] = acc[tid] || { teacher: `${a.teacher_name}`, rows: [] };
                acc[tid].rows.push(a);
                return acc;
              }, {})).map((g) => (
                <div key={g.teacher} className="ms-group">
                  <div className="ms-group-title">{g.teacher}</div>
                  <table className="ms-table">
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>Slot</th>
                        <th>Student</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.rows.map((r, idx) => (
                        <tr key={idx}>
                          <td>{r.day_of_week}</td>
                          <td>{r.slot_index}</td>
                          <td>{r.student_code} - {r.first_name} {r.last_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MasterScheduler;
