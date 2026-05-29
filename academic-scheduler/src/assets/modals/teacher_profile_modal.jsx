import React, { useState, useEffect, useMemo } from "react";
import "../css/registration.css";

const TeacherProfileModal = ({
  isOpen,
  onClose,
  user,
  onSaved,
  readOnly = false,
}) => {
  const [form, setForm] = useState(() => {
    const p = user?.profile || null;
    return {
      teacherCode: String(p?.teacher_code ?? ""),
      teacherEmail: p?.teacher_email || user?.email || "",
      firstName: p?.first_name || "",
      lastName: p?.last_name || "",
      maxHours: p?.max_hours_per_day ?? 8,
      subjects: (p?.subjects || []).map((s) => Number(s.id)),
      dayOffs: p?.day_off
        ? String(p.day_off)
            .split(",")
            .map((x) => x.trim())
        : [],
    };
  });
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [errorModalMsg, setErrorModalMsg] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const assignedTotal = useMemo(() => {
    return (availableSubjects || [])
      .filter((s) => form.subjects.includes(s.id))
      .reduce((a, b) => a + (Number(b.hours ?? b.default_hours ?? 0) || 0), 0);
  }, [availableSubjects, form.subjects]);
  const remaining = Math.max(0, Number(form.maxHours || 0) - assignedTotal);
  const [editing, setEditing] = useState(() => {
    const p = user?.profile || null;
    const hasSubjects = (p?.subjects || []).length > 0;
    const hasDayOff = !!(p?.day_off || p?.dayOff);
    return !(hasSubjects || hasDayOff);
  });

  useEffect(() => {
    if (!isOpen) return;
    // load available subjects
    fetch(
      "http://localhost/MyPortfolio/academic-scheduler/backend/api/list_subjects.php",
    )
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          // ensure subject ids are numbers and normalize keys used by the component
          const subs = (j.subjects || []).map((s) => ({
            ...s,
            id: Number(s.id),
            name: s.name ?? s.subject_name ?? s.subjectName,
            code: s.code ?? s.subject_code ?? s.subjectCode,
            hours: s.hours ?? s.default_hours,
          }));
          setAvailableSubjects(subs);
        }
      })
      .catch((err) => {
        console.warn("list_subjects error", err);
      });
  }, [isOpen, user]);

  if (!isOpen) return null;

  const stop = (e) => e.stopPropagation();

  const toggleSubject = (id) => {
    if (readOnly) return;
    const has = form.subjects.includes(id);
    const subj = availableSubjects.find((s) => s.id === id) || {};
    const hours = Number(subj.hours ?? subj.default_hours ?? 0);
    if (has) {
      // remove
      setForm((prev) => ({
        ...prev,
        subjects: prev.subjects.filter((x) => x !== id),
      }));
      return;
    }
    // adding: compute current total
    const currentTotal = (availableSubjects || [])
      .filter((s) => form.subjects.includes(s.id))
      .reduce((a, b) => a + (Number(b.hours ?? b.default_hours ?? 0) || 0), 0);
    const newTotal = currentTotal + hours;
    const max = Number(form.maxHours || 0);
    if (newTotal > max) {
      setErrorModalMsg(`Cannot assign subjects exceeding ${max} hours`);
      setShowErrorModal(true);
      return;
    }
    setForm((prev) => ({ ...prev, subjects: [...prev.subjects, id] }));
  };

  const dayOptions = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const toggleDayOff = (d) => {
    setForm((prev) => {
      const has = prev.dayOffs.includes(d);
      let next = has
        ? prev.dayOffs.filter((x) => x !== d)
        : [...prev.dayOffs, d];
      if (next.length > 2) next = next.slice(0, 2);
      return { ...prev, dayOffs: next };
    });
  };

  const handleSave = async () => {
    setWorking(true);
    setMessage("");
    setErrorModalMsg("");
    setShowErrorModal(false);
    try {
      const payload = {
        user_id: user.id,
        teacher_code: form.teacherCode,
        teacher_email: form.teacherEmail,
        first_name: form.firstName,
        last_name: form.lastName,
        max_hours_per_day: Number(form.maxHours) || 0,
        subjects: form.subjects,
        day_offs: form.dayOffs,
      };
      const res = await fetch(
        "http://localhost/MyPortfolio/academic-scheduler/backend/api/update_teacher_profile.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (json.success) {
        setMessage("Saved");
        // update local form from server response and lock editing
        try {
          const resp = json.profile || {};
          const prof = resp.profile || resp;
          const subs = resp.subjects || [];
          setForm((prev) => ({
            ...prev,
            subjects: (subs || []).map((s) => Number(s.id)),
            dayOffs: prof?.day_off
              ? String(prof.day_off)
                  .split(",")
                  .map((x) => x.trim())
              : [],
            maxHours: prof?.max_hours_per_day ?? prev.maxHours,
          }));
        } catch (e) {
          console.warn(e);
        }
        setEditing(false);
        if (onSaved) onSaved(json.profile);
      } else {
        setMessage(json.message || "Save failed");
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to save");
    } finally {
      setWorking(false);
    }
  };
  if (readOnly) {
    // render a compact read-only preview showing only subjects and day-offs
    return (
      <div
        className="registration-overlay"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          className="registration-modal"
          onClick={stop}
          style={{ width: "min(90vw, 620px)" }}
        >
          <button
            className="registration-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
          <h3 style={{ marginTop: 0, textAlign: "center" }}>Profile Preview</h3>
          <div className="setup-preview" style={{ marginTop: 0 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <strong>Availability</strong>
                <div style={{ marginTop: 6 }}>{form.maxHours} hours</div>
              </div>
              <div>
                <strong>Assigned</strong>
                <div style={{ marginTop: 6 }}>{assignedTotal} hours</div>
              </div>
              <div>
                <strong>Day Off</strong>
                <div style={{ marginTop: 6 }}>
                  {(form.dayOffs || []).length ? form.dayOffs.join(", ") : "-"}
                </div>
              </div>
            </div>

            <div
              className="setup-preview-subjects-container"
              style={{ marginTop: 12 }}
            >
              <table className="setup-preview-subjects-table">
                <thead>
                  <tr>
                    <th>Subject Code</th>
                    <th>Subject Name</th>
                    <th>Duration (hrs)</th>
                  </tr>
                </thead>
                <tbody>
                  {(availableSubjects || [])
                    .filter((s) => form.subjects.includes(s.id))
                    .map((s) => (
                      <tr key={s.id}>
                        <td>{s.code || s.name}</td>
                        <td>{s.name}</td>
                        <td>{s.hours ?? s.default_hours ?? ""}</td>
                      </tr>
                    ))}
                  {(availableSubjects || []).filter((s) =>
                    form.subjects.includes(s.id),
                  ).length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        style={{ opacity: 0.7, textAlign: "center" }}
                      >
                        No subjects selected
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div
              className="actions"
              style={{
                marginTop: "0.75rem",
                display: "flex",
                justifyContent: "center",
                gap: "0.75rem",
              }}
            >
              <button className="btn secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="registration-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="registration-modal"
        onClick={stop}
        style={{ width: "min(90vw, 620px)" }}
      >
        <button
          className="registration-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h3 style={{ marginTop: 0, textAlign: "center" }}>Teacher Profile</h3>
        <div style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
          <div style={{ marginBottom: 6 }}>
            <strong>Email</strong>
            <div style={{ marginTop: 6 }}>
              {editing ? (
                <input
                  className="input-field"
                  type="email"
                  value={form.teacherEmail}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      teacherEmail: e.target.value,
                    }))
                  }
                />
              ) : (
                user?.email || user?.profile?.teacher_email || "-"
              )}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <strong>Availability</strong>
              <div style={{ marginTop: 6 }}>{form.maxHours} hours</div>
            </div>
            <div>
              <strong>Assigned</strong>
              <div style={{ marginTop: 6 }}>{assignedTotal} hours</div>
            </div>
            <div>
              <strong>Remaining</strong>
              <div style={{ marginTop: 6 }}>{remaining} hours</div>
            </div>
          </div>
          <label style={{ marginTop: 0 }}>
            {editing ? "Assign subjects" : "Assigned subjects"}
          </label>
          <div
            style={{
              maxHeight: 160,
              overflowY: "auto",
              border: "1px solid rgba(255,255,255,0.04)",
              padding: "0.5rem",
            }}
          >
            {editing
              ? (availableSubjects || []).map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      justifyContent: "space-between",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        flex: 1,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.subjects.includes(s.id)}
                        onChange={() => toggleSubject(s.id)}
                      />
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ minWidth: 90, opacity: 0.95 }}>
                          {s.code || s.name}
                        </div>
                        <div style={{ opacity: 0.9 }}>{s.name}</div>
                      </div>
                    </label>
                    <div
                      style={{ minWidth: 60, textAlign: "right", opacity: 0.9 }}
                    >
                      {s.hours ?? s.default_hours ?? ""}
                    </div>
                  </div>
                ))
              : (availableSubjects || [])
                  .filter((s) => form.subjects.includes(s.id))
                  .map((s) => (
                    <div
                      key={s.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 0",
                      }}
                    >
                      <div style={{ display: "flex", gap: 12 }}>
                        <div style={{ minWidth: 90, opacity: 0.95 }}>
                          {s.code || s.name}
                        </div>
                        <div style={{ opacity: 0.9 }}>{s.name}</div>
                      </div>
                      <div
                        style={{
                          minWidth: 60,
                          textAlign: "right",
                          opacity: 0.9,
                        }}
                      >
                        {s.hours ?? s.default_hours ?? ""}
                      </div>
                    </div>
                  ))}
            {availableSubjects.length === 0 && (
              <p style={{ opacity: 0.7 }}>No subjects available</p>
            )}
          </div>

          {/* error modal shown separately; no inline error text */}

          <label>Day off (max 2)</label>
          {editing ? (
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                flexWrap: "wrap",
                marginTop: 8,
              }}
            >
              {dayOptions.map((d) => (
                <label
                  key={d}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.dayOffs.includes(d)}
                    onChange={() => toggleDayOff(d)}
                  />
                  <span>{d}</span>
                </label>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 8 }}>
              {(form.dayOffs || []).length ? form.dayOffs.join(", ") : "-"}
            </div>
          )}

          <div className="actions" style={{ marginTop: "0.5rem" }}>
            <button className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            {editing ? (
              <button
                className="btn primary"
                onClick={handleSave}
                disabled={working}
              >
                {working ? "Saving…" : "Save"}
              </button>
            ) : (
              <button
                className="btn primary"
                onClick={() => {
                  setEditing(true);
                  setErrorModalMsg("");
                  setShowErrorModal(false);
                }}
              >
                Edit
              </button>
            )}
          </div>
          {message && (
            <p
              style={{
                color: message.startsWith("Saved") ? "#47d147" : "#ff4d4d",
              }}
            >
              {message}
            </p>
          )}
        </div>
      </div>
      {showErrorModal && (
        <div className="registration-overlay" style={{ zIndex: 90 }}>
          <div
            className="registration-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(80vw,420px)" }}
          >
            <h3 style={{ marginTop: 0, textAlign: "center" }}>Error</h3>
            <div style={{ padding: "0.5rem 0" }}>
              <p style={{ color: "#ff4d4d", textAlign: "center" }}>
                {errorModalMsg}
              </p>
              <div
                className="actions"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: 12,
                }}
              >
                <button
                  className="btn primary"
                  onClick={() => setShowErrorModal(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherProfileModal;
