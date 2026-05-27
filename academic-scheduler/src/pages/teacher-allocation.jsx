import React, { useEffect, useMemo, useState } from "react";
import "../assets/css/teacher-allocation.css";

const TeacherAllocation = () => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [maxHours, setMaxHours] = useState(8);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [schedules, setSchedules] = useState([]);
  const [step, setStep] = useState(1);
  const [teacherQuery, setTeacherQuery] = useState("");
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [lastRequest, setLastRequest] = useState(null);
  const [lastResponse, setLastResponse] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [form, setForm] = useState({
    day_of_week: "Monday",
    start_time: "08:00",
    end_time: "09:00",
    subject_id: "",
    student_id: "",
  });

  // auto-hide success messages after 3 seconds
  React.useEffect(() => {
    if (message && (message.type === 'success' || message.type === 'error')) {
      const t = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [message]);

  useEffect(() => {
    (async () => {
      try {
        const [usersRes, subjectsRes, studentsRes] = await Promise.all([
          fetch(
            "http://localhost/MyPortfolio/academic-scheduler/backend/api/list_users.php",
          ),
          fetch(
            "http://localhost/MyPortfolio/academic-scheduler/backend/api/list_subjects.php",
          ),
          fetch(
            "http://localhost/MyPortfolio/academic-scheduler/backend/api/list_students.php",
          ),
        ]);
        const usersJson = await usersRes.json();
        const subjectsJson = await subjectsRes.json();
        const studentsJson = await studentsRes.json();

        if (usersJson.success) {
          const teacherRows = (usersJson.users || []).filter(
            (u) => String(u.role).toUpperCase() === "TEACHER" && u.profile,
          );
          setTeachers(teacherRows);
        }

        if (subjectsJson.success) setSubjects(subjectsJson.subjects || []);
        if (studentsJson.success) setStudents(studentsJson.students || []);
      } catch (err) {
        console.error(err);
        setMessage({ type: "error", text: "Failed to load teacher data" });
      }
    })();
  }, []);

  const selectTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setSelectedSubjects((teacher.profile?.subjects || []).map((s) => Number(s.id)));
    setMaxHours(Number(teacher.profile?.max_hours_per_day ?? 8));
    setSchedules([]);
    setForm((f) => ({ ...f, subject_id: "", student_id: "" }));
    // load schedules for this teacher immediately
    loadSchedules(teacher.profile?.id);
  };

  const loadSchedules = async (teacherProfileId) => {
    if (!teacherProfileId) return [];
    try {
      const url = `http://localhost/MyPortfolio/academic-scheduler/backend/api/list_weekly_schedules.php?teacher_profile_id=${teacherProfileId}`;
      const res = await fetch(url);
      const j = await res.json();
      setLastResponse(j);
      if (j.success) {
        setSchedules(j.schedules || []);
        return j.schedules || [];
      }
      return [];
    } catch (err) {
      console.error(err);
      setLastError(err.message || String(err));
      return [];
    }
  };

  useEffect(() => {
    if (step === 5 && selectedTeacher?.profile?.id) {
      loadSchedules(selectedTeacher.profile.id);
    }
  }, [step, selectedTeacher?.profile?.id]);

  const subjectHours = useMemo(() => {
    return selectedSubjects.reduce((sum, sid) => {
      const sub = subjects.find((s) => Number(s.id) === Number(sid));
      const hours = sub ? Number(sub.default_hours ?? sub.hours ?? 0) : 0;
      return sum + hours;
    }, 0);
  }, [selectedSubjects, subjects]);

  const filteredTeachers = useMemo(() => {
    const q = teacherQuery.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) => {
      const name = `${t.profile?.first_name || ""} ${t.profile?.last_name || ""}`.toLowerCase();
      const code = String(t.profile?.teacher_code || "").toLowerCase();
      const username = String(t.username || "").toLowerCase();
      return name.includes(q) || code.includes(q) || username.includes(q);
    });
  }, [teacherQuery, teachers]);

  const canGoStudent = Boolean(selectedTeacher);
  const canGoSubject = Boolean(form.student_id);
  const canGoDay = Boolean(form.subject_id);
  const canGoTime = Boolean(form.day_of_week);
  const isScheduleComplete = Boolean(
    selectedTeacher?.profile?.id &&
      form.day_of_week &&
      form.start_time &&
      form.end_time &&
      form.subject_id &&
      form.student_id &&
      form.start_time < form.end_time,
  );

  const scheduledMinutesForSelectedDay = useMemo(() => {
    if (!schedules || !form?.day_of_week) return 0;
    const parts = schedules.filter((s) => s.day_of_week === form.day_of_week);
    const toMin = (t) => {
      if (!t) return 0;
      const p = String(t).split(":").map((x) => Number(x));
      if (p.length >= 2) return p[0] * 60 + p[1];
      return 0;
    };
    return parts.reduce((sum, s) => {
      const a = toMin(s.start_time);
      const b = toMin(s.end_time);
      return sum + Math.max(0, b - a);
    }, 0);
  }, [schedules, form.day_of_week]);

  const remainingMinutesForSelectedDay = Math.max(0, Number(maxHours || 8) * 60 - scheduledMinutesForSelectedDay);

  const newSlotMinutes = useMemo(() => {
    if (!form.start_time || !form.end_time) return 0;
    const p1 = String(form.start_time).split(":").map((x) => Number(x));
    const p2 = String(form.end_time).split(":").map((x) => Number(x));
    const a = p1.length >= 2 ? p1[0] * 60 + p1[1] : 0;
    const b = p2.length >= 2 ? p2[0] * 60 + p2[1] : 0;
    return Math.max(0, b - a);
  }, [form.start_time, form.end_time]);

  const createSchedule = async () => {
    if (!selectedTeacher?.profile?.id) {
      setMessage({ type: "error", text: "Select a teacher first" });
      return;
    }

    const missing = [];
    if (!form.day_of_week) missing.push("day");
    if (!form.start_time) missing.push("start time");
    if (!form.end_time) missing.push("end time");
    if (!form.subject_id) missing.push("subject");
    if (!form.student_id) missing.push("student");

    if (missing.length > 0) {
      setMessage({ type: "error", text: `Missing: ${missing.join(", ")}` });
      return;
    }

    const timeToMinutes = (t) => {
      if (!t) return 0;
      const parts = String(t).split(":").map((p) => Number(p));
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      if (parts.length >= 3) return parts[0] * 60 + parts[1];
      return 0;
    };
    if (timeToMinutes(form.start_time) >= timeToMinutes(form.end_time)) {
      setMessage({ type: "error", text: "End time must be after start time" });
      return;
    }

    const scheduledMinutesForDay = schedules.filter((s) => s.day_of_week === form.day_of_week).reduce((sum, s) => {
      const a = timeToMinutes(s.start_time);
      const b = timeToMinutes(s.end_time);
      return sum + Math.max(0, b - a);
    }, 0);
    const newMinutes = Math.max(0, timeToMinutes(form.end_time) - timeToMinutes(form.start_time));
    const teacherMaxMinutes = Number(maxHours || 8) * 60;
    if (scheduledMinutesForDay + newMinutes > teacherMaxMinutes) {
      setMessage({ type: "error", text: "Exceeds teacher's max hours per day" });
      return;
    }

    const ensureSeconds = (t) => {
      if (!t) return t;
      const parts = String(t).split(":");
      if (parts.length === 2) return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:00`;
      return t;
    };

    const payload = {
      teacher_profile_id: selectedTeacher.profile.id,
      subject_id: Number(form.subject_id),
      student_id: Number(form.student_id),
      day_of_week: form.day_of_week,
      start_time: ensureSeconds(form.start_time),
      end_time: ensureSeconds(form.end_time),
    };

    setIsSavingSchedule(true);
    setMessage({ type: "info", text: "Saving schedule..." });
    try {
      setLastRequest(payload);
      const res = await fetch(
        "http://localhost/MyPortfolio/academic-scheduler/backend/api/create_weekly_schedule.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        setLastResponse(text);
        setMessage({ type: "error", text: `Failed to add schedule (HTTP ${res.status})` });
        return;
      }
      const j = await res.json();
      setLastResponse(j);
      if (j.success) {
        setMessage({ type: "success", text: "Weekly schedule added" });
        const subject = subjects.find((s) => Number(s.id) === Number(form.subject_id));
        const student = students.find((s) => Number(s.id) === Number(form.student_id));
        const nextRow = {
          id: j.id || j.schedule_id || `local-${Date.now()}`,
          day_of_week: form.day_of_week,
          start_time: form.start_time,
          end_time: form.end_time,
          subject_name: subject?.subject_name || "Subject",
          student_code: student?.student_code || "",
          student_first_name: student?.first_name || "",
          student_last_name: student?.last_name || "",
        };
        setSchedules((prev) => prev.concat(nextRow));
        setForm((f) => ({ ...f, subject_id: "", student_id: "" }));
        let got = await loadSchedules(selectedTeacher.profile?.id);
        if (selectedTeacher?.profile?.id && Array.isArray(got) && got.length === 0) {
          await new Promise((r) => setTimeout(r, 300));
          got = await loadSchedules(selectedTeacher.profile?.id);
        }
      } else {
        const msg = j.message || "Failed to add schedule";
        // Don't auto-assign subjects here. Instruct admin to assign subjects via Teachers page.
        if (typeof msg === 'string' && msg.toLowerCase().includes('not assigned')) {
          setMessage({ type: 'error', text: 'Teacher is not assigned to this subject. Please assign the subject to the teacher in the Teachers page before scheduling.' });
        } else {
          setMessage({ type: "error", text: msg });
        }
      }
    } catch (err) {
      console.error(err);
      setLastError(err.message || String(err));
      setMessage({ type: "error", text: "Failed to add schedule" });
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const deleteSchedule = async (id) => {
    try {
      const res = await fetch(
        "http://localhost/MyPortfolio/academic-scheduler/backend/api/delete_weekly_schedule.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        },
      );
      const j = await res.json();
      if (j.success) loadSchedules(selectedTeacher.profile?.id);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="ta-root">
      <header className="ta-header">
        <h1>Teacher Allocation</h1>
        <p className="ta-sub">Schedule sessions for teachers</p>
      </header>

      {message.text && <div className={`ta-message ${message.type}`}>{message.text}</div>}

      <div className="ta-form-single">
        <section className="ta-panel ta-step">
          <div className="ta-panel-title">Schedule a session</div>

          <div className="ta-row">
            <label>Teacher</label>
            <select value={selectedTeacher?.id || ""} onChange={(e) => {
              const t = teachers.find(x => String(x.id) === e.target.value);
              if (t) selectTeacher(t); else { setSelectedTeacher(null); setSchedules([]); }
            }}>
              <option value="">Select teacher</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.profile?.first_name} {t.profile?.last_name} - {t.profile?.teacher_code || t.username}</option>)}
            </select>
          </div>

          <div className="ta-row">
            <label>Student</label>
            <select value={form.student_id} onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}>
              <option value="">Select student</option>
              {students.map((s) => (<option key={s.id} value={s.id}>{s.student_code} - {s.first_name} {s.last_name}</option>))}
            </select>
          </div>

          <div className="ta-row">
            <label>Subject</label>
            <select value={form.subject_id} onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))}>
              <option value="">Select subject</option>
              {subjects.filter((s) => (selectedTeacher?.profile?.subjects || []).map(ss => Number(ss.id)).includes(Number(s.id))).map((s) => (
                <option key={s.id} value={s.id}>{s.subject_name}</option>
              ))}
            </select>
          </div>

          <div className="ta-row">
            <label>Day</label>
            <select value={form.day_of_week} onChange={(e) => setForm((f) => ({ ...f, day_of_week: e.target.value }))}>
              {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map((d) => (<option key={d} value={d}>{d}</option>))}
            </select>
          </div>

          <div className="ta-row">
            <label>Start</label>
            <input type="time" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} />
            <label style={{ marginLeft: 12 }}>End</label>
            <input type="time" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} />
          </div>

          <div className="ta-row ta-hours">
            Remaining hours today: <strong>{(remainingMinutesForSelectedDay / 60).toFixed(2)}</strong> / {Number(maxHours || 8).toFixed(2)}
          </div>

          <div className="ta-step-actions">
            <button className="btn" onClick={createSchedule} disabled={!isScheduleComplete || isSavingSchedule || newSlotMinutes > remainingMinutesForSelectedDay || remainingMinutesForSelectedDay <= 0}>{isSavingSchedule ? "Saving..." : "Add Schedule"}</button>
            <button className="btn ta-btn-outline" onClick={() => { setForm({ day_of_week: "Monday", start_time: "08:00", end_time: "09:00", subject_id: "", student_id: "" }); }}>Clear</button>
          </div>
        </section>

        <div className="ta-table-wrap">
          <table className="ta-table">
            <thead>
              <tr><th>Day</th><th>Time</th><th>Subject</th><th>Student</th><th></th></tr>
            </thead>
            <tbody>
              {schedules.length === 0 && (<tr><td colSpan={5} className="ta-empty">No schedules yet</td></tr>)}
              {schedules.map((r) => (<tr key={r.id}><td>{r.day_of_week}</td><td>{r.start_time} - {r.end_time}</td><td>{r.subject_name}</td><td>{r.student_code ? `${r.student_code} - ${r.student_first_name} ${r.student_last_name}` : "-"}</td><td><button className="btn ta-btn-outline" onClick={() => deleteSchedule(r.id)}>Delete</button></td></tr>))}
            </tbody>
          </table>
        </div>
        {schedules.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '0.75rem' }}>
            <button className="btn" onClick={() => {
              // clear form and table for entering a new schedule
              setSelectedTeacher(null);
              setSchedules([]);
              setForm({ day_of_week: "Monday", start_time: "08:00", end_time: "09:00", subject_id: "", student_id: "" });
              setMessage({ type: '', text: '' });
            }}>Create new</button>
          </div>
        )}

        
      </div>
    </div>
  );
};

export default TeacherAllocation;
