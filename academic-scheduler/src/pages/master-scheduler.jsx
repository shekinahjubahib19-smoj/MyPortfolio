import React, { useEffect, useState } from "react";
import "../assets/css/master-scheduler.css";

const MasterScheduler = () => {
  const [assignments, _setAssignments] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [viewMode, setViewMode] = useState("student");

  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [displayMode, setDisplayMode] = useState("monthly"); // monthly | weekly
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date();
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return last.toISOString().slice(0, 10);
  });

  const [weekStartMonday, setWeekStartMonday] = useState(true);

  const parseYMD = (s) => (s ? new Date(s + "T00:00:00") : null);

  const getDatesInRange = (startDate, endDate) => {
    const dates = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      dates.push(new Date(d));
    }
    return dates;
  };

  const addDays = (d, days) => {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
  };

  const startOfWeek = (d, mondayFirst = true) => {
    const dt = new Date(d);
    const day = dt.getDay(); // 0 Sun .. 6 Sat
    const diff = mondayFirst ? (day === 0 ? -6 : 1 - day) : -day;
    return addDays(dt, diff);
  };

  const mapSchedulesToDates = (schedulesArr, from, to) => {
    if (!from || !to) return [];
    const dates = getDatesInRange(new Date(from), new Date(to));
    const map = dates.map((dt) => {
      const dayName = dt.toLocaleDateString(undefined, { weekday: "long" });
      const entries = (schedulesArr || []).filter(
        (s) => s.day_of_week === dayName,
      );
      return { date: new Date(dt), entries };
    });
    return map;
  };

  const formatTime = (t) => {
    if (!t) return "";
    // accept HH:MM or HH:MM:SS
    const parts = String(t).split(":");
    const hh = Number(parts[0] || 0);
    const mm = Number(parts[1] || 0);
    const ampm = hh >= 12 ? "PM" : "AM";
    const hour12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${hour12}:${String(mm).padStart(2, "0")} ${ampm}`;
  };

  useEffect(() => {
    (async () => {
      try {
        const [usersRes, studentsRes] = await Promise.all([
          fetch(
            "http://localhost/MyPortfolio/academic-scheduler/backend/api/list_users.php",
          ),
          fetch(
            "http://localhost/MyPortfolio/academic-scheduler/backend/api/list_students.php",
          ),
        ]);
        const usersJson = await usersRes.json();
        const studentsJson = await studentsRes.json();
        if (usersJson.success) {
          const teacherRows = (usersJson.users || []).filter(
            (u) => String(u.role).toUpperCase() === "TEACHER" && u.profile,
          );
          setTeachers(teacherRows);
        }
        if (studentsJson.success) setStudents(studentsJson.students || []);
      } catch (err) {
        console.error(err);
        setMessage({ type: "error", text: "Failed to load users/students" });
      }
    })();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!selectedId) return setSchedules([]);
      setLoadingSchedules(true);
      try {
        const param =
          viewMode === "teacher"
            ? `teacher_profile_id=${selectedId}`
            : `student_id=${selectedId}`;
        const url = `http://localhost/MyPortfolio/academic-scheduler/backend/api/list_weekly_schedules.php?${param}`;
        const res = await fetch(url);
        const j = await res.json();
        if (j.success) setSchedules(j.schedules || []);
        else setSchedules([]);
      } catch (err) {
        console.error(err);
        setSchedules([]);
      } finally {
        setLoadingSchedules(false);
      }
    };
    load();
  }, [selectedId, viewMode]);

  // Week snapping is handled in UI event handlers to avoid setState-in-effect warnings

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
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            margin: "0.5rem 0",
          }}
        >
          <label style={{ marginRight: 8 }}>View</label>
          <select
            value={viewMode}
            onChange={(e) => {
              setViewMode(e.target.value);
              setSelectedId("");
              setSchedules([]);
            }}
          >
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
          </select>

          <div style={{ marginLeft: 12 }}>
            <label style={{ marginRight: 8 }}>
              {viewMode === "teacher" ? "Teacher" : "Student"}
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">Select</option>
              {viewMode === "teacher" &&
                teachers.map((t) => (
                  <option key={t.id} value={t.profile?.id || t.id}>
                    {t.profile?.first_name} {t.profile?.last_name} -{" "}
                    {t.profile?.teacher_code || t.username}
                  </option>
                ))}
              {viewMode === "student" &&
                students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.student_code} - {s.first_name} {s.last_name}
                  </option>
                ))}
            </select>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          {/* Inline schedule view for selected teacher/student */}
          {selectedId && (
            <div style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <div>
                  <label style={{ marginRight: 8 }}>Display</label>
                  <select
                    value={displayMode}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDisplayMode(v);
                      if (v === "weekly") {
                        const base = parseYMD(dateFrom) || new Date();
                        const start = startOfWeek(base, weekStartMonday);
                        const end = addDays(start, 6);
                        setDateFrom(start.toISOString().slice(0, 10));
                        setDateTo(end.toISOString().slice(0, 10));
                      }
                    }}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ marginRight: 6 }}>Week start Monday</label>
                  <input
                    type="checkbox"
                    checked={weekStartMonday}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setWeekStartMonday(checked);
                      if (displayMode === "weekly") {
                        const base = parseYMD(dateFrom) || new Date();
                        const start = startOfWeek(base, checked);
                        const end = addDays(start, 6);
                        setDateFrom(start.toISOString().slice(0, 10));
                        setDateTo(end.toISOString().slice(0, 10));
                      }
                    }}
                  />
                </div>
                <div>
                  <label style={{ marginRight: 6 }}>From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ marginRight: 6 }}>To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
                {displayMode === "weekly" && (
                  <div style={{ marginLeft: 12, display: "flex", gap: 8 }}>
                    <button
                      className="btn ta-btn-outline"
                      onClick={() => {
                        // prev week: move dateFrom/dateTo back by 7 days
                        const f = parseYMD(dateFrom);
                        const t = parseYMD(dateTo);
                        const nf = addDays(f, -7);
                        const nt = addDays(t, -7);
                        setDateFrom(nf.toISOString().slice(0, 10));
                        setDateTo(nt.toISOString().slice(0, 10));
                      }}
                    >
                      ◀
                    </button>
                    <button
                      className="btn ta-btn-outline"
                      onClick={() => {
                        const f = parseYMD(dateFrom);
                        const t = parseYMD(dateTo);
                        const nf = addDays(f, 7);
                        const nt = addDays(t, 7);
                        setDateFrom(nf.toISOString().slice(0, 10));
                        setDateTo(nt.toISOString().slice(0, 10));
                      }}
                    >
                      ▶
                    </button>
                  </div>
                )}
              </div>

              {loadingSchedules ? (
                <div>Loading schedules...</div>
              ) : (
                (() => {
                  const from = parseYMD(dateFrom);
                  const to = parseYMD(dateTo);

                  // For monthly view, expand the range to full weeks (Mon-Sun or Sun-Sat based on weekStartMonday)
                  let rangeFrom = from;
                  let rangeTo = to;
                  if (displayMode === "monthly") {
                    const monthStart = new Date(from.getFullYear(), from.getMonth(), 1);
                    const monthEnd = new Date(from.getFullYear(), from.getMonth() + 1, 0);
                    const start = startOfWeek(monthStart, weekStartMonday);
                    const lastWeekStart = startOfWeek(monthEnd, weekStartMonday);
                    const end = addDays(lastWeekStart, 6);
                    rangeFrom = start;
                    rangeTo = end;
                  }
                  const mapped = mapSchedulesToDates(schedules, rangeFrom, rangeTo);
                  if (displayMode === "monthly") {
                    // render simple grid: rows of 7 days
                    const rows = [];
                    for (let i = 0; i < mapped.length; i += 7)
                      rows.push(mapped.slice(i, i + 7));
                    return (
                      <div>
                        {rows.map((week, wi) => (
                          <div
                            key={wi}
                            style={{ display: "flex", gap: 8, marginBottom: 8 }}
                          >
                            {week.map((cell) => (
                              <div
                                key={cell.date.toISOString()}
                                style={{
                                  flex: 1,
                                  border: "1px solid rgba(255,255,255,0.08)",
                                  padding: 8,
                                  borderRadius: 6,
                                  background: "transparent",
                                  color: "#ddd",
                                }}
                              >
                                <div style={{ fontWeight: 600 }}>
                                  {cell.date.toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </div>
                                <div style={{ marginTop: 6 }}>
                                  {cell.entries.length === 0 ? (
                                    <div style={{ color: "#777" }}>Day Off</div>
                                  ) : (
                                    cell.entries.map((e, idx) => (
                                      <div
                                        key={idx}
                                        style={{
                                          fontSize: 12,
                                          padding: "2px 0",
                                        }}
                                      >
                                        {formatTime(e.start_time)} -{" "}
                                        {formatTime(e.end_time)}
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  // weekly table view — show only the first 7 days (first week)
                  const weekCells = mapped.slice(0, 7);
                  return (
                    <table className="ms-table" style={{ width: "100%" }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Day</th>
                          <th>Time</th>
                          <th>Subject</th>
                          <th>Student</th>
                          <th>Room / Info</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weekCells.map((cell) =>
                          cell.entries.length === 0 ? (
                            <tr key={cell.date.toISOString()}>
                              <td>{cell.date.toLocaleDateString()}</td>
                              <td>
                                {cell.date.toLocaleDateString(undefined, {
                                  weekday: "long",
                                })}
                              </td>
                              <td>-</td>
                              <td>-</td>
                              <td>-</td>
                              <td>-</td>
                            </tr>
                          ) : (
                            cell.entries.map((e, i) => (
                              <tr key={`${cell.date.toISOString()}-${i}`}>
                                <td>{cell.date.toLocaleDateString()}</td>
                                <td>
                                  {cell.date.toLocaleDateString(undefined, {
                                    weekday: "long",
                                  })}
                                </td>
                                <td>
                                  {e.start_time} - {e.end_time}
                                </td>
                                <td>{e.subject_name || e.subject || "-"}</td>
                                <td>
                                  {e.student_code
                                    ? `${e.student_code} - ${e.student_first_name} ${e.student_last_name}`
                                    : "-"}
                                </td>
                                <td>{e.room_name || e.zoom_id || "-"}</td>
                              </tr>
                            ))
                          ),
                        )}
                      </tbody>
                    </table>
                  );
                })()
              )}
            </div>
          )}

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
