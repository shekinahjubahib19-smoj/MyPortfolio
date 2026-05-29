import React, { useState } from "react";
import "../assets/css/master-scheduler.css";

const MasterScheduler = () => {
  const [assignments, _setAssignments] = useState([]);
  const [message, _setMessage] = useState({ type: "", text: "" });
  const viewMode = "student";

  return (
    <div className="ms-root">
      <header className="ms-header">
        <div>
          <h1>Master Scheduler</h1>
          <p className="ms-sub">
            Run automatic allocation and review generated schedule
          </p>
        </div>
      </header>

      <section style={{ marginTop: "1rem" }}>
        {message.text && (
          <div
            className={`ms-message ${message.type}`}
            role="status"
            aria-live="polite"
          >
            {message.text}
          </div>
        )}
        <div style={{ overflowX: "auto" }}>
          {viewMode === "student" && assignments.length > 0 && (
            <div>
              {Object.values(
                assignments.reduce((acc, a) => {
                  const sid = a.student_id;
                  acc[sid] = acc[sid] || {
                    student: `${a.student_code} - ${a.first_name} ${a.last_name}`,
                    rows: [],
                  };
                  acc[sid].rows.push(a);
                  return acc;
                }, {}),
              ).map((g) => (
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

          {viewMode === "teacher" && assignments.length > 0 && (
            <div>
              {Object.values(
                assignments.reduce((acc, a) => {
                  const tid = a.teacher_id;
                  acc[tid] = acc[tid] || {
                    teacher: `${a.teacher_name}`,
                    rows: [],
                  };
                  acc[tid].rows.push(a);
                  return acc;
                }, {}),
              ).map((g) => (
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
                          <td>
                            {r.student_code} - {r.first_name} {r.last_name}
                          </td>
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
