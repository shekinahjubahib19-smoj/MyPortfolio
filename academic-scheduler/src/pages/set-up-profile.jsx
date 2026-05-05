import React, { useEffect, useState, useRef } from 'react';
import '../assets/css/subject-list.css';
import { useAuth } from '../context/AuthContext';

const SetUpProfile = () => {
  const { user } = useAuth();
  const [teacherCode, setTeacherCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [maxHours, setMaxHours] = useState(8);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState(false);
  const didLoad = useRef(false);

  useEffect(() => {
    // load available subjects once
    if (didLoad.current) return;
    didLoad.current = true;
    fetch('http://localhost/Portfolio/academic-scheduler/backend/api/list_subjects.php')
      .then(r => r.json())
      .then(j => {
        if (j && j.success) setAvailableSubjects(j.subjects || []);
      })
      .catch((err) => { console.warn('Failed to load subjects', err); });

    // try to prefill from users list (backend returns profile info with users)
    (async () => {
      try {
        const res = await fetch('http://localhost/Portfolio/academic-scheduler/backend/api/list_users.php');
        const j = await res.json();
        if (j && j.success) {
          const me = (j.users || []).find(u => String(u.id) === String(user?.id));
          if (me && me.profile) {
            setTeacherCode(me.profile.teacher_code || '');
            setFirstName(me.profile.first_name || '');
            setLastName(me.profile.last_name || '');
            setMaxHours(me.profile.max_hours_per_day ?? 8);
            setSelectedSubjects((me.profile.subjects || []).map(s => s.id));
          }
        }
      } catch (err) { console.warn('Prefill users failed', err); }
    })();
  }, [user]);

  const toggleSubject = (id) => {
    setSelectedSubjects(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setWorking(true);
    setMessage('');
    try {
      const payload = {
        user_id: user.id,
        teacher_code: teacherCode,
        first_name: firstName,
        last_name: lastName,
        max_hours_per_day: Number(maxHours) || 0,
        subjects: selectedSubjects,
      };
      const res = await fetch('http://localhost/Portfolio/academic-scheduler/backend/api/update_teacher_profile.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setMessage('Profile saved. Redirecting...');
        // mark profile complete in local storage user record so redirect logic works
        try {
          const raw = window.localStorage.getItem('mock_auth_user');
          if (raw) {
            const obj = JSON.parse(raw);
            obj.is_profile_complete = true;
            window.localStorage.setItem('mock_auth_user', JSON.stringify(obj));
          }
        } catch (err) { console.warn('localStorage update failed', err); }
        setTimeout(() => { window.location.hash = '#/dashboard'; }, 700);
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

  return (
    <div className="um-root">
      <header className="um-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Set Up Profile</h1>
          <p className="um-sub">Complete your teacher profile before using the system</p>
        </div>
      </header>

      <div className="um-list">
        <div style={{ padding: '0 1rem', maxWidth: 720 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label>Teacher Code</label>
            <input className="input-field" value={teacherCode} onChange={(e) => setTeacherCode(e.target.value)} placeholder="2026001" />

            <label>First name</label>
            <input className="input-field" value={firstName} onChange={(e) => setFirstName(e.target.value)} />

            <label>Last name</label>
            <input className="input-field" value={lastName} onChange={(e) => setLastName(e.target.value)} />

            <label>Max hours per day</label>
            <input type="number" className="input-field" value={maxHours} onChange={(e) => setMaxHours(e.target.value)} />

            <label>Qualified subjects</label>
            <div style={{ border: '1px solid rgba(255,255,255,0.04)', padding: '0.5rem', maxHeight: 240, overflowY: 'auto' }}>
              {availableSubjects.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.25rem 0' }}>
                  <input type="checkbox" checked={selectedSubjects.includes(s.id)} onChange={() => toggleSubject(s.id)} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong style={{ fontSize: '0.95rem' }}>{s.code || (s.name ? (s.name.toUpperCase().slice(0,3) + '-' + (100 + s.id)) : '')}</strong>
                    <span style={{ opacity: 0.8, fontSize: '0.85rem' }}>{s.name}</span>
                  </div>
                </div>
              ))}
              {availableSubjects.length === 0 && <p style={{ opacity: 0.7 }}>No subjects available yet.</p>}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="btn secondary" type="button" onClick={() => { window.location.hash = '#/dashboard'; }}>Skip</button>
              <button className="btn primary" type="submit" disabled={working}>{working ? 'Saving…' : 'Save & Continue'}</button>
            </div>
            {message && <p style={{ color: message.startsWith('Profile saved') ? '#47d147' : '#ff4d4d' }}>{message}</p>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default SetUpProfile;
