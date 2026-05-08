import React, { useState, useEffect } from 'react';
import '../css/registration.css';

const TeacherProfileModal = ({ isOpen, onClose, user, onSaved, readOnly = false }) => {
  const [form, setForm] = useState(() => {
    const p = user?.profile || null;
    return {
      teacherCode: String(p?.teacher_code ?? ''),
      firstName: p?.first_name || '',
      lastName: p?.last_name || '',
      maxHours: p?.max_hours_per_day ?? 8,
      subjects: (p?.subjects || []).map(s => Number(s.id)),
    };
  });
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    // load available subjects
    fetch('http://localhost/Portfolio/academic-scheduler/backend/api/list_subjects.php')
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          // ensure subject ids are numbers and normalize keys used by the component
          const subs = (j.subjects || []).map(s => ({
            ...s,
            id: Number(s.id),
            name: s.name ?? s.subject_name ?? s.subjectName,
            code: s.code ?? s.subject_code ?? s.subjectCode,
            hours: s.hours ?? s.default_hours,
          }));
          setAvailableSubjects(subs);
        }
      })
      .catch(() => {});
  }, [isOpen, user]);

  if (!isOpen) return null;

  const stop = (e) => e.stopPropagation();

  const toggleSubject = (id) => {
    if (readOnly) return;
    setForm(prev => {
      const has = prev.subjects.includes(id);
      return { ...prev, subjects: has ? prev.subjects.filter(x => x !== id) : [...prev.subjects, id] };
    });
  };

  const handleSave = async () => {
    setWorking(true);
    setMessage('');
    try {
      const payload = {
        user_id: user.id,
        teacher_code: form.teacherCode,
        first_name: form.firstName,
        last_name: form.lastName,
        max_hours_per_day: Number(form.maxHours) || 0,
        subjects: form.subjects,
      };
      const res = await fetch('http://localhost/Portfolio/academic-scheduler/backend/api/update_teacher_profile.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setMessage('Saved');
        if (onSaved) onSaved(json.profile);
      } else {
        setMessage(json.message || 'Save failed');
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to save');
    } finally {
      setWorking(false);
    }
  };
  if (readOnly) {
    // render a read-only preview similar to setup preview
    return (
      <div className="registration-overlay" role="dialog" aria-modal="true" onClick={onClose}>
        <div className="registration-modal" onClick={stop} style={{ width: 'min(90vw, 760px)' }}>
          <button className="registration-close" onClick={onClose} aria-label="Close">×</button>
          <h3 style={{ marginTop: 0, textAlign: 'center' }}>Profile Preview</h3>
          <div className="setup-preview" style={{ marginTop: -5 }}>
            <div className="setup-preview-card">
              <table className="setup-preview-summary-table">
                <thead>
                  <tr>
                    <th>Teacher Code</th>
                    <th>Full Name</th>
                    <th>Hours Available</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{form.teacherCode || '-'}</td>
                    <td>{(form.firstName || '') + (form.lastName ? ' ' + form.lastName : '')}</td>
                    <td>{form.maxHours ? `${form.maxHours} hours` : '-'}</td>
                  </tr>
                </tbody>
              </table>

              <div className="setup-preview-subjects-container" style={{ marginTop: 12 }}>
                <table className="setup-preview-subjects-table">
                  <thead>
                    <tr>
                      <th>Subject Code</th>
                      <th>Subject Name</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(availableSubjects || []).filter(s => form.subjects.includes(s.id)).map(s => (
                      <tr key={s.id}>
                        <td>{s.code || s.name}</td>
                        <td>{s.name}</td>
                        <td>{(s.hours ?? s.default_hours ?? '') ? `${s.hours ?? s.default_hours ?? ''} hour` : ''}</td>
                      </tr>
                    ))}
                    {((availableSubjects || []).filter(s => form.subjects.includes(s.id)).length === 0) && (
                      <tr>
                        <td colSpan={3} style={{ opacity: 0.7, textAlign: 'center' }}>No subjects selected</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="actions" style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
              <button className="btn secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-overlay" role="dialog" aria-modal="true" onClick={onClose}>
    <div className="registration-modal" onClick={stop} style={{ width: 'min(90vw, 620px)' }}>
        <button className="registration-close" onClick={onClose} aria-label="Close">×</button>
        <h3 style={{ marginTop: 0, textAlign: 'center' }}>Teacher Profile</h3>
        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
          <label>Teacher Code</label>
          <input className="input-field" value={form.teacherCode} onChange={(e) => setForm(f => ({ ...f, teacherCode: e.target.value }))} />
          <label>First name</label>
          <input className="input-field" value={form.firstName} onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))} />
          <label>Last name</label>
          <input className="input-field" value={form.lastName} onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))} />
          <label>Max hours per day</label>
          <input type="number" className="input-field" value={form.maxHours} onChange={(e) => setForm(f => ({ ...f, maxHours: Number(e.target.value) }))} />

          <label>Qualified subjects</label>
          <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.04)', padding: '0.5rem' }}>
            {availableSubjects.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={form.subjects.includes(s.id)} onChange={() => toggleSubject(s.id)} />
                <span>{s.code || s.name} — {s.name}</span>
              </div>
            ))}
            {availableSubjects.length === 0 && <p style={{ opacity: 0.7 }}>No subjects available</p>}
          </div>

          <div className="actions" style={{ marginTop: '0.5rem' }}>
            <button className="btn secondary" onClick={onClose}>Cancel</button>
            <button className="btn primary" onClick={handleSave} disabled={working}>{working ? 'Saving…' : 'Save'}</button>
          </div>
          {message && <p style={{ color: message.startsWith('Saved') ? '#47d147' : '#ff4d4d' }}>{message}</p>}
        </div>
      </div>
    </div>
  );
};

export default TeacherProfileModal;
