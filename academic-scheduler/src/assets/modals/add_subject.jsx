import React, { useState } from 'react';
import '../css/add_subject.css';
import { saveSubject } from '../js/subject-list';

const AddSubject = ({ isOpen, onClose, onSaved, initialData }) => {
  const levels = ['Level 1', 'Level 2', 'Level 3'];
  const [name, setName] = useState(() => initialData?.name || '');
  const [hours, setHours] = useState(() => (initialData?.hours ?? 1));
  const [level, setLevel] = useState(() => initialData?.level || levels[0]);
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState(false);

  if (!isOpen) return null;

  const stop = (e) => e.stopPropagation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setMessage('Please provide a subject name');
    setWorking(true);
    try {
      const res = await saveSubject({ id: initialData?.id, name: name.trim(), hours: Number(hours) || 1, level });
      if (res?.success) {
        setMessage('Saved');
        if (typeof onSaved === 'function') onSaved(res);
      } else {
        const msg = res?.message || 'Failed';
        setMessage('Error: ' + msg);
        if (typeof onSaved === 'function') onSaved(res || { success: false, message: msg });
      }
    } catch (err) {
      console.error('AddSubject submit error', err);
      setMessage('Failed to connect to server');
      if (typeof onSaved === 'function') onSaved({ success: false, message: 'Failed to connect' });
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="add-subject-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="add-subject-modal" onClick={stop}>
        <button className="add-subject-close" onClick={onClose} aria-label="Close">×</button>
        <h3 style={{ marginTop: 0 }}>{initialData?.id ? 'Edit Subject' : 'New'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label>Subject Name</label>
          <input
            type="text"
            placeholder="Subject name"
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label>Hours required</label>
          <input
            type="number"
            placeholder="1"
            className="input-field"
            value={hours}
            min={0}
            step={0.5}
            onChange={(e) => setHours(e.target.value)}
            required
          />

          <label>Level</label>
          <select
            className="input-field"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            required
          >
            {levels.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          <div className="actions">
            <button type="button" className="btn secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled={working}>{working ? 'Saving…' : (initialData?.id ? 'Update' : 'Create')}</button>
          </div>
          {message && <p style={{ fontSize: '0.85rem', color: message.startsWith('Error') ? '#ff4d4d' : '#47d147' }}>{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default AddSubject;
