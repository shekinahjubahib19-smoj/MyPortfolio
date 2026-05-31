import React, { useEffect, useMemo, useState } from "react";
import "../assets/css/teacher-allocation.css";

import Modal from "../components/Modal";

const TeacherAllocation = () => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [maxHours, setMaxHours] = useState(8);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [schedules, setSchedules] = useState([]);
  const [step, _setStep] = useState(1);
  const [teacherQuery, _setTeacherQuery] = useState("");
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [_lastRequest, setLastRequest] = useState(null);
  const [_lastResponse, setLastResponse] = useState(null);
  const [_lastError, setLastError] = useState(null);
  const defaultForm = {
    days: ["Monday"],
    start_time: "08:00",
    end_time: "09:00",
    subject_id: "",
    student_id: "",
    mode: "online",
    weeks: "1",
    zoom_id: "",
    zoom_pass: "",
    room_name: "Room 101",
    start_date: new Date().toISOString().slice(0, 10),
  };

  const [form, setForm] = useState(defaultForm);

  // modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // auto-hide success messages after 3 seconds
  React.useEffect(() => {
    if (message && (message.type === "success" || message.type === "error")) {
      const t = setTimeout(() => setMessage({ type: "", text: "" }), 3000);
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
    setSelectedSubjects(
      (teacher.profile?.subjects || []).map((s) => Number(s.id)),
    );
    setMaxHours(Number(teacher.profile?.max_hours_per_day ?? 8));
    setSchedules([]);
    setForm((f) => ({ ...f, subject_id: "", student_id: "" }));
    // load schedules for this teacher immediately
    loadSchedules(teacher.profile?.id);
  };

  // derive selected student object
  const selectedStudent =
    (form.student_id &&
      students.find((s) => String(s.id) === String(form.student_id))) ||
    null;

  // update student selection and clear subject when levels mismatch
  const handleStudentChange = (studentId) => {
    setForm((f) => {
      const newForm = { ...f, student_id: studentId };
      if (!studentId) return newForm;
      const stu = students.find((s) => String(s.id) === String(studentId));
      if (!stu) return newForm;
      const studentLevel = (stu.current_level || stu.level || "")
        .toString()
        .trim()
        .toLowerCase();
      const subj = subjects.find((s) => String(s.id) === String(f.subject_id));
      if (subj) {
        const subjLevel = (
          subj.level ??
          subj.level_name ??
          subj.levelName ??
          subj.default_level ??
          ""
        )
          .toString()
          .trim()
          .toLowerCase();
        if (studentLevel && subjLevel && studentLevel !== subjLevel) {
          newForm.subject_id = "";
        }
      }
      return newForm;
    });
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

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const dayNameToIndex = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const getNextDateForDay = (startDateStr, dayName) => {
    if (!startDateStr) return null;
    const sd = new Date(startDateStr);
    if (isNaN(sd)) return null;
    const target = dayNameToIndex[dayName];
    const startDay = sd.getDay();
    const delta = (target - startDay + 7) % 7;
    const d = new Date(sd);
    d.setDate(d.getDate() + delta);
    return d.toISOString().slice(0, 10);
  };

  const addDaysISO = (isoDateStr, days) => {
    const d = new Date(isoDateStr);
    if (isNaN(d)) return null;
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  // compute overall end date based on selected days and period (weeks)
  const computeEndDate = (startDateStr, weeks, daysArray) => {
    const n = Number(weeks) || 0;
    if (!startDateStr || n <= 0) return null;
    // if no days selected, fall back to simple weeks * 7 - 1
    if (!Array.isArray(daysArray) || daysArray.length === 0) {
      return addDaysISO(startDateStr, n * 7 - 1);
    }
    // compute the base date for the last week (start_date + (n-1)*7)
    const lastWeekBase = addDaysISO(startDateStr, (n - 1) * 7);
    if (!lastWeekBase) return null;
    // for each selected day, find the date on/after lastWeekBase matching that day
    let maxDate = null;
    for (const d of daysArray) {
      const candidate = getNextDateForDay(lastWeekBase, d);
      if (!candidate) continue;
      if (!maxDate || candidate > maxDate) maxDate = candidate;
    }
    return maxDate || addDaysISO(startDateStr, n * 7 - 1);
  };

  const getScheduledMinutesForDay = (day) => {
    if (!schedules || !day) return 0;
    const parts = schedules.filter((s) => s.day_of_week === day);
    const toMin = (t) => {
      if (!t) return 0;
      const p = String(t)
        .split(":")
        .map((x) => Number(x));
      if (p.length >= 2) return p[0] * 60 + p[1];
      return 0;
    };
    return parts.reduce((sum, s) => {
      const a = toMin(s.start_time);
      const b = toMin(s.end_time);
      return sum + Math.max(0, b - a);
    }, 0);
  };

  const _subjectHours = useMemo(() => {
    return selectedSubjects.reduce((sum, sid) => {
      const sub = subjects.find((s) => Number(s.id) === Number(sid));
      const hours = sub ? Number(sub.default_hours ?? sub.hours ?? 0) : 0;
      return sum + hours;
    }, 0);
  }, [selectedSubjects, subjects]);

  const _filteredTeachers = useMemo(() => {
    const q = teacherQuery.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) => {
      const name =
        `${t.profile?.first_name || ""} ${t.profile?.last_name || ""}`.toLowerCase();
      const code = String(t.profile?.teacher_code || "").toLowerCase();
      const username = String(t.username || "").toLowerCase();
      return name.includes(q) || code.includes(q) || username.includes(q);
    });
  }, [teacherQuery, teachers]);

  const _canGoStudent = Boolean(selectedTeacher);
  const _canGoSubject = Boolean(form.student_id);
  const _canGoDay = Boolean(form.subject_id);
  const _canGoTime = Boolean(form.days && form.days.length > 0);
  const isScheduleComplete = Boolean(
    selectedTeacher?.profile?.id &&
    form.days &&
    form.days.length > 0 &&
    form.start_time &&
    form.end_time &&
    form.subject_id &&
    form.student_id &&
    form.start_time < form.end_time &&
    Number(form.weeks) > 0 &&
    (form.mode === "online" ? form.zoom_id && form.zoom_pass : form.room_name),
  );

  const primaryDay =
    form.days && form.days.length > 0 ? form.days[0] : "Monday";
  const scheduledMinutesForSelectedDay = useMemo(
    () => getScheduledMinutesForDay(primaryDay),
    [schedules, primaryDay, getScheduledMinutesForDay],
  );

  const remainingMinutesForSelectedDay = Math.max(
    0,
    Number(maxHours || 8) * 60 - scheduledMinutesForSelectedDay,
  );

  const newSlotMinutes = useMemo(() => {
    if (!form.start_time || !form.end_time) return 0;
    const p1 = String(form.start_time)
      .split(":")
      .map((x) => Number(x));
    const p2 = String(form.end_time)
      .split(":")
      .map((x) => Number(x));
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
    if (!form.days || form.days.length === 0) missing.push("day");
    if (!form.start_time) missing.push("start time");
    if (!form.end_time) missing.push("end time");
    if (!form.subject_id) missing.push("subject");
    if (!form.student_id) missing.push("student");
    if (!form.weeks || Number(form.weeks) <= 0) missing.push("weeks (period)");

    if (missing.length > 0) {
      setMessage({ type: "error", text: `Missing: ${missing.join(", ")}` });
      return;
    }

    const timeToMinutes = (t) => {
      if (!t) return 0;
      const parts = String(t)
        .split(":")
        .map((p) => Number(p));
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      if (parts.length >= 3) return parts[0] * 60 + parts[1];
      return 0;
    };
    if (timeToMinutes(form.start_time) >= timeToMinutes(form.end_time)) {
      setMessage({ type: "error", text: "End time must be after start time" });
      return;
    }

    const newMinutes = Math.max(
      0,
      timeToMinutes(form.end_time) - timeToMinutes(form.start_time),
    );
    const teacherMaxMinutes = Number(maxHours || 8) * 60;
    // ensure for every selected day the teacher has capacity
    for (const d of form.days) {
      const scheduledMinutesForDay = getScheduledMinutesForDay(d);
      if (scheduledMinutesForDay + newMinutes > teacherMaxMinutes) {
        setMessage({
          type: "error",
          text: `Exceeds teacher's max hours on ${d}`,
        });
        return;
      }
    }

    const ensureSeconds = (t) => {
      if (!t) return t;
      const parts = String(t).split(":");
      if (parts.length === 2)
        return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:00`;
      return t;
    };

    // create schedule entries for each selected day
    setIsSavingSchedule(true);
    setMessage({ type: "info", text: "Saving schedule..." });
    try {
      for (const d of form.days) {
        // compute the first occurrence of this weekday on/after the chosen start_date
        const perDayStart = form.start_date
          ? getNextDateForDay(form.start_date, d)
          : null;
        const perDayEnd = perDayStart
          ? addDaysISO(perDayStart, (Number(form.weeks) - 1) * 7)
          : null;

        const payload = {
          teacher_profile_id: selectedTeacher.profile.id,
          subject_id: Number(form.subject_id),
          student_id: Number(form.student_id),
          day_of_week: d,
          start_time: ensureSeconds(form.start_time),
          end_time: ensureSeconds(form.end_time),
          mode: form.mode,
          weeks: Number(form.weeks) || 1,
          start_date: perDayStart,
          end_date: perDayEnd,
        };
        // include mode-specific fields so DB constraints are satisfied
        if (form.mode === "online") {
          payload.zoom_id = form.zoom_id || "";
          payload.zoom_pass = form.zoom_pass || "";
        } else {
          payload.room_name = form.room_name || "";
        }
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
          throw new Error(`Failed to add schedule (HTTP ${res.status})`);
        }
        const j = await res.json();
        setLastResponse(j);
        if (j.success) {
          const subject = subjects.find(
            (s) => Number(s.id) === Number(form.subject_id),
          );
          const student = students.find(
            (s) => Number(s.id) === Number(form.student_id),
          );
          const nextRow = {
            id: j.id || j.schedule_id || `local-${Date.now()}`,
            day_of_week: d,
            start_time: form.start_time,
            end_time: form.end_time,
            start_date: perDayStart,
            end_date: perDayEnd,
            subject_name: subject?.subject_name || "Subject",
            student_code: student?.student_code || "",
            student_first_name: student?.first_name || "",
            student_last_name: student?.last_name || "",
            mode: form.mode,
            weeks: Number(form.weeks) || 1,
          };
          setSchedules((prev) => prev.concat(nextRow));
        } else {
          const msg = j.message || "Failed to add schedule";
          if (
            typeof msg === "string" &&
            msg.toLowerCase().includes("not assigned")
          ) {
            throw new Error(
              "Teacher is not assigned to this subject. Please assign the subject to the teacher in the Teachers page before scheduling.",
            );
          }
          throw new Error(msg);
        }
      }
      // reload schedules
      await loadSchedules(selectedTeacher.profile?.id);
      setForm((f) => ({ ...f, subject_id: "", student_id: "" }));
      setMessage({ type: "success", text: "Weekly schedule(s) added" });
      // open success modal
      setShowSuccessModal(true);
    } catch (err) {
      console.error(err);
      setLastError(err.message || String(err));
      setMessage({
        type: "error",
        text: err.message || "Failed to add schedule",
      });
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

      {message.text && (
        <div className={`ta-message ${message.type}`}>{message.text}</div>
      )}

      <div className="ta-form-single">
        <section className="ta-panel ta-step">
          <div className="ta-panel-title">Schedule a session</div>

          <div className="ta-row">
            <label>Teacher</label>
            <select
              value={selectedTeacher?.id || ""}
              onChange={(e) => {
                const t = teachers.find((x) => String(x.id) === e.target.value);
                if (t) selectTeacher(t);
                else {
                  setSelectedTeacher(null);
                  setSchedules([]);
                }
              }}
            >
              <option value="">Select teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.profile?.first_name} {t.profile?.last_name} -{" "}
                  {t.profile?.teacher_code || t.username}
                </option>
              ))}
            </select>
          </div>

          <div className="ta-row">
            <label>Student</label>
            <select
              value={form.student_id}
              onChange={(e) => handleStudentChange(e.target.value)}
            >
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.student_code} - {s.first_name} {s.last_name}
                </option>
              ))}
            </select>
          </div>

          <div className="ta-row">
            <label>Subject</label>
            <select
              value={form.subject_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, subject_id: e.target.value }))
              }
            >
              <option value="">Select subject</option>
              {subjects
                .filter((s) =>
                  (selectedTeacher?.profile?.subjects || [])
                    .map((ss) => Number(ss.id))
                    .includes(Number(s.id)),
                )
                .filter((s) => {
                  // if no student selected, don't filter by level
                  if (!form.student_id) return true;
                  const stu = selectedStudent;
                  if (!stu) return true;
                  const studentLevel = (stu.current_level || stu.level || "")
                    .toString()
                    .trim()
                    .toLowerCase();
                  const subjLevel = (
                    s.level ??
                    s.level_name ??
                    s.levelName ??
                    s.default_level ??
                    ""
                  )
                    .toString()
                    .trim()
                    .toLowerCase();
                  if (!studentLevel) return true;
                  if (!subjLevel) return true;
                  return studentLevel === subjLevel;
                })
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subject_name || s.name || s.subject}
                  </option>
                ))}
            </select>
          </div>

          <div className="ta-row">
            <label>Mode</label>
            <select
              value={form.mode}
              onChange={(e) => setForm((f) => ({ ...f, mode: e.target.value }))}
            >
              <option value="online">Online</option>
              <option value="f2f">Face to face</option>
            </select>
          </div>

          {form.mode === "online" && (
            <div className="ta-row">
              <label>Zoom ID</label>
              <input
                type="text"
                value={form.zoom_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, zoom_id: e.target.value }))
                }
              />
              <label style={{ marginLeft: 12 }}>Zoom Pass</label>
              <input
                type="text"
                value={form.zoom_pass}
                onChange={(e) =>
                  setForm((f) => ({ ...f, zoom_pass: e.target.value }))
                }
              />
            </div>
          )}

          {form.mode === "f2f" && (
            <div className="ta-row">
              <label>Room</label>
              <select
                value={form.room_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, room_name: e.target.value }))
                }
              >
                <option value="Room 101">Room 101</option>
                <option value="Room 102">Room 102</option>
                <option value="Room 103">Room 103</option>
              </select>
            </div>
          )}

          <div className="ta-row">
            <label>Period (weeks)</label>
            <input
              type="number"
              min={1}
              style={{ marginLeft: 8, width: 160 }}
              value={String(form.weeks ?? "")}
              onChange={(e) =>
                setForm((f) => ({ ...f, weeks: e.target.value }))
              }
              placeholder="# weeks"
            />
          </div>

          <div className="ta-row">
            <label>Start Date</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, start_date: e.target.value }))
              }
            />
            <label style={{ marginLeft: 12 }}>End Date</label>
            <input
              type="date"
              value={(() => {
                if (!form.start_date || !form.weeks) return "";
                const ed = computeEndDate(
                  form.start_date,
                  form.weeks,
                  form.days,
                );
                return ed || "";
              })()}
              readOnly
            />
          </div>

          <div className="ta-row">
            <label>Days</label>
            <div>
              {daysOfWeek.map((d) => (
                <label key={d} style={{ marginRight: 8 }}>
                  <input
                    type="checkbox"
                    checked={(form.days || []).includes(d)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((f) => {
                        const cur = Array.isArray(f.days) ? f.days.slice() : [];
                        if (checked && !cur.includes(d)) cur.push(d);
                        if (!checked) {
                          const idx = cur.indexOf(d);
                          if (idx >= 0) cur.splice(idx, 1);
                        }
                        return { ...f, days: cur };
                      });
                    }}
                  />{" "}
                  {d}
                </label>
              ))}
            </div>
          </div>

          <div className="ta-row">
            <label>Start</label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) =>
                setForm((f) => ({ ...f, start_time: e.target.value }))
              }
            />
            <label style={{ marginLeft: 12 }}>End</label>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) =>
                setForm((f) => ({ ...f, end_time: e.target.value }))
              }
            />
          </div>

          <div className="ta-row ta-hours">
            Remaining hours today:{" "}
            <strong>{(remainingMinutesForSelectedDay / 60).toFixed(2)}</strong>{" "}
            / {Number(maxHours || 8).toFixed(2)}
          </div>

          <div className="ta-step-actions">
            <button
              className="btn"
              onClick={createSchedule}
              disabled={
                !isScheduleComplete ||
                isSavingSchedule ||
                newSlotMinutes > remainingMinutesForSelectedDay ||
                remainingMinutesForSelectedDay <= 0
              }
            >
              {isSavingSchedule ? "Saving..." : "Add Schedule"}
            </button>
            <button
              className="btn ta-btn-outline"
              onClick={() => {
                setForm(defaultForm);
              }}
            >
              Clear
            </button>
          </div>
        </section>

        {/* View table button removed — schedule modal can be opened from Master Scheduler */}

        {/* Success confirmation modal */}
        {showSuccessModal && (
          <Modal
            onClose={() => setShowSuccessModal(false)}
            dialogStyle={{ width: "min(520px, 90%)", padding: 16 }}
          >
            <div style={{ padding: 4 }}>
              <h3 style={{ marginTop: 0 }}>Schedule added</h3>
              <p>
                Weekly schedule(s) were successfully added to the teacher's
                schedule.
              </p>
              <div
                style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}
              >
                <button
                  className="btn"
                  onClick={() => setShowSuccessModal(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Schedules modal (table) */}
        {showScheduleModal && (
          <Modal onClose={() => setShowScheduleModal(false)}>
            <div style={{ padding: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <h3 style={{ margin: 0 }}>Weekly Schedules</h3>
                <div>
                  <button
                    className="btn ta-btn-outline"
                    onClick={() => setShowScheduleModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>

              <table className="ta-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Subject</th>
                    <th>Student</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.length === 0 && (
                    <tr>
                      <td colSpan={5} className="ta-empty">
                        No schedules yet
                      </td>
                    </tr>
                  )}
                  {schedules.map((r) => (
                    <tr key={r.id}>
                      <td>{r.day_of_week}</td>
                      <td>
                        {r.start_time} - {r.end_time}
                      </td>
                      <td>{r.subject_name}</td>
                      <td>
                        {r.student_code
                          ? `${r.student_code} - ${r.student_first_name} ${r.student_last_name}`
                          : "-"}
                      </td>
                      <td>
                        <button
                          className="btn ta-btn-outline"
                          onClick={() => deleteSchedule(r.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {schedules.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "0.75rem",
                  }}
                >
                  <button
                    className="btn"
                    onClick={() => {
                      // clear form and table for entering a new schedule
                      setSelectedTeacher(null);
                      setSchedules([]);
                      setForm(defaultForm);
                      setMessage({ type: "", text: "" });
                      setShowScheduleModal(false);
                    }}
                  >
                    Create new
                  </button>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default TeacherAllocation;
