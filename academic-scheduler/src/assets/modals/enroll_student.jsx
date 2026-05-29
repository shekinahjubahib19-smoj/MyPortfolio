import React, { useState } from "react";
import "../css/registration.css";

const EnrollStudent = ({ isOpen, onClose, onSaved, initialData }) => {
  const [studentCode, setStudentCode] = useState(
    () => initialData?.student_code || "",
  );
  const [firstName, setFirstName] = useState(
    () => initialData?.first_name || "",
  );
  const [lastName, setLastName] = useState(() => initialData?.last_name || "");
  const [level, setLevel] = useState(
    () => initialData?.current_level || "Level 1",
  );
  const [email, setEmail] = useState(() => initialData?.email || "");
  const [status, setStatus] = useState(
    () => initialData?.enrollment_status || "Active",
  );
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const stop = (e) => e.stopPropagation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setWorking(true);
    setMessage("");
    try {
      const payload = {
        id: initialData?.id,
        student_code: studentCode.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        current_level: level,
        enrollment_status: status,
      };
      const url = initialData?.id
        ? "/backend/api/update_student.php"
        : "/backend/api/create_student.php";
      const res = await fetch(
        `http://localhost/MyPortfolio/academic-scheduler${url}`,
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
      } else {
        setMessage(json.message || "Save failed");
        if (onSaved) onSaved(json);
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to save");
      if (onSaved) onSaved({ success: false, message: "Failed to save" });
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
          {initialData?.id ? "Edit Student" : "Enroll Student"}
        </h3>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <label>Student Code</label>
          <input
            className="input-field"
            value={studentCode}
            onChange={(e) => setStudentCode(e.target.value)}
          />
          <label>First name</label>
          <input
            className="input-field"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <label>Last name</label>
          <input
            className="input-field"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <label>Level</label>
          <select
            className="input-field"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            <option>Level 1</option>
            <option>Level 2</option>
            <option>Level 3</option>
          </select>
          <label>Email</label>
          <input
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
          <label>Status</label>
          <select
            className="input-field"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>Active</option>
            <option>Graduated</option>
            <option>Inactive</option>
          </select>

          <div className="actions">
            <button type="button" className="btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={working}>
              {working ? "Saving…" : initialData?.id ? "Update" : "Enroll"}
            </button>
          </div>
          {message && (
            <p
              style={{
                fontSize: "0.85rem",
                color: message.startsWith("Saved") ? "#47d147" : "#ff4d4d",
              }}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default EnrollStudent;
