import React, { useState, useEffect } from "react";
import "../css/registration.css";
import { useAuth } from "../../context/AuthContext";

const StudentProfileModal = ({
  isOpen,
  onClose,
  student,
  onSaved,
  readOnly = false,
}) => {
  const [form, setForm] = useState(() => ({
    studentCode: student?.student_code || "",
    firstName: student?.first_name || "",
    lastName: student?.last_name || "",
    level: student?.current_level || "",
    email: student?.email || "",
    status: student?.enrollment_status || "Active",
  }));
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const { isAdmin } = useAuth();

  useEffect(() => {
    // schedule form populate to avoid synchronous setState in effect
    const id = setTimeout(() => {
      setForm({
        studentCode: student?.student_code || "",
        firstName: student?.first_name || "",
        lastName: student?.last_name || "",
        level: student?.current_level || "",
        email: student?.email || "",
        status: student?.enrollment_status || "Active",
      });
    }, 0);
    return () => clearTimeout(id);
  }, [student, isOpen]);

  if (!isOpen) return null;

  const stop = (e) => e.stopPropagation();

  const handleSave = async () => {
    if (readOnly) {
      onClose();
      return;
    }
    setWorking(true);
    setMessage("");
    try {
      const payload = {
        id: student?.id,
        student_code: form.studentCode,
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        current_level: form.level,
        enrollment_status: form.status,
      };
      const res = await fetch(
        "http://localhost/MyPortfolio/academic-scheduler/backend/api/update_student.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (json.success) {
        setMessage("Saved");
        if (onSaved) onSaved(json);
        if (onClose) onClose();
      } else setMessage(json.message || "Save failed");
    } catch (err) {
      console.error(err);
      setMessage("Failed to save");
    } finally {
      setWorking(false);
    }
  };

  const handleDelete = async () => {
    if (!student?.id) return;
    if (!confirm("Delete this student? This cannot be undone.")) return;
    setWorking(true);
    setMessage("");
    try {
      const res = await fetch(
        "http://localhost/MyPortfolio/academic-scheduler/backend/api/delete_student.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: student.id }),
        },
      );
      const json = await res.json();
      if (json.success) {
        setMessage("Deleted");
        if (onSaved) onSaved({ success: true, deleted: true });
        onClose();
      } else {
        setMessage(json.message || "Delete failed");
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to delete");
    } finally {
      setWorking(false);
    }
  };

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
        <h3 style={{ marginTop: 0, textAlign: "center" }}>
          {readOnly ? "Student Profile" : "Edit Student"}
        </h3>
        <div style={{ display: "flex", gap: "1rem", flexDirection: "column" }}>
          <label>Student Code</label>
          <input
            className="input-field"
            value={form.studentCode}
            onChange={(e) =>
              setForm((f) => ({ ...f, studentCode: e.target.value }))
            }
            readOnly={readOnly}
          />
          <label>First name</label>
          <input
            className="input-field"
            value={form.firstName}
            onChange={(e) =>
              setForm((f) => ({ ...f, firstName: e.target.value }))
            }
            readOnly={readOnly}
          />
          <label>Last name</label>
          <input
            className="input-field"
            value={form.lastName}
            onChange={(e) =>
              setForm((f) => ({ ...f, lastName: e.target.value }))
            }
            readOnly={readOnly}
          />
          <label>Level</label>
          <select
            className="input-field"
            value={form.level}
            onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
            disabled={readOnly}
          >
            <option>Level 1</option>
            <option>Level 2</option>
            <option>Level 3</option>
          </select>
          <label>Email</label>
          <input
            className="input-field"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            readOnly={readOnly}
          />
          <label>Status</label>
          <select
            className="input-field"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            disabled={readOnly}
          >
            <option>Active</option>
            <option>Graduated</option>
            <option>Inactive</option>
          </select>

          <div
            className="actions"
            style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}
          >
            <button className="btn secondary" onClick={onClose}>
              Close
            </button>
            {!readOnly && (
              <button
                className="btn primary"
                onClick={handleSave}
                disabled={working}
              >
                {working ? "Saving…" : "Save"}
              </button>
            )}
            {/* show delete for admins only when not readOnly */}
            {!readOnly && isAdmin && (
              <button
                className="btn danger"
                onClick={handleDelete}
                disabled={working}
              >
                Delete
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
    </div>
  );
};

export default StudentProfileModal;
