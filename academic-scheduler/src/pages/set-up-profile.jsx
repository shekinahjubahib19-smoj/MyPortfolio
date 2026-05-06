import React, { useEffect, useState, useRef } from 'react';
import '../assets/css/subject-list.css';
import '../assets/css/set-up-profile.css';
import { useAuth } from '../context/AuthContext';
import { fetchSubjects, fetchUserProfile, saveTeacherProfile } from '../assets/js/set-up-profile';

const SetUpProfile = () => {
  const { user } = useAuth();
  const [teacherCode, setTeacherCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [maxHours, setMaxHours] = useState(8);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState(false);
  const [step, setStep] = useState(1); // 1: inputs, 2: subjects, 3: preview
  const didLoad = useRef(false);

  useEffect(() => {
    // load available subjects once and prefill profile when possible
    if (didLoad.current) return;
    didLoad.current = true;
    (async () => {
      try {
        const subs = await fetchSubjects();
        setAvailableSubjects(subs || []);
      } catch (err) {
        console.warn('Failed to load subjects', err);
      }

      try {
        const profile = await fetchUserProfile(user?.id);
        if (profile) {
          setTeacherCode(profile.teacher_code || '');
          setFirstName((profile.first_name || '').toUpperCase());
          setLastName((profile.last_name || '').toUpperCase());
          setMaxHours(profile.max_hours_per_day ?? 8);
          setSelectedSubjects((profile.subjects || []).map(s => s.id));
        }
      } catch (err) {
        console.warn('Prefill users failed', err);
      }
    })();
  }, [user]);

  const toggleSubject = (id) => {
    setSelectedSubjects(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const clearInputs = () => {
    setTeacherCode('');
    setFirstName('');
    setLastName('');
    setMaxHours(8);
    setSelectedSubjects([]);
    setMessage('');
  };

  const clearSubjects = () => {
    setSelectedSubjects([]);
    setMessage('');
  };

  const validateStep1 = () => {
    if (!teacherCode || !firstName || !lastName) {
      setMessage('Please fill Teacher Code, First name and Last name.');
      return false;
    }
    if (!Number(maxHours) || Number(maxHours) <= 0) {
      setMessage('Max hours per day must be greater than zero.');
      return false;
    }
    setMessage('');
    return true;
  };

  const goNext = () => {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!selectedSubjects || selectedSubjects.length === 0) {
        setMessage('Please select at least one qualified subject to continue.');
        return;
      }
      setMessage('');
      setStep(3);
      return;
    }
  };

  const goPrev = () => {
    setMessage('');
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSave = async () => {
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
      const json = await saveTeacherProfile(payload);
      if (json && json.success) {
        setMessage('Profile saved. Redirecting...');
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
        <div style={{ padding: '0 0rem', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 520 }}>
            <div className="setup-steps">
              <div className={"setup-step " + (step === 1 ? 'active' : '')}>
                <div className="circle">1</div>
                <div className="label">Inputs</div>
              </div>
              <div className={"setup-step " + (step === 2 ? 'active' : '')}>
                <div className="circle">2</div>
                <div className="label">Subjects</div>
              </div>
              <div className={"setup-step " + (step === 3 ? 'active' : '')}>
                <div className="circle">3</div>
                <div className="label">Preview</div>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: (step === 3 ? 'center' : 'flex-start') }}>
              <form
                onSubmit={(e) => e.preventDefault()}
                style={{ width: 560, marginLeft: (step === 3 ? 0 : '-1rem') }}
              >
                {step === 1 && (
                  <div style={{ marginTop: 8 }}>
                    <div className="setup-section">
                      <label>Teacher Code</label>
                      <input className="setup-input" value={teacherCode} onChange={(e) => setTeacherCode(e.target.value)} placeholder="2026001" />
                    </div>

                    <div className="setup-section">
                      <label>First name</label>
                      <input className="setup-input" value={firstName} onChange={(e) => setFirstName(e.target.value.toUpperCase())} />
                    </div>

                    <div className="setup-section">
                      <label>Last name</label>
                      <input className="setup-input" value={lastName} onChange={(e) => setLastName(e.target.value.toUpperCase())} />
                    </div>

                    <div className="setup-section">
                      <label>Max hours per day</label>
                      <input type="number" className="setup-input" value={maxHours} onChange={(e) => setMaxHours(e.target.value)} />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <label>Qualified subjects</label>
                    <div style={{ marginTop: 0 }}>
                      <div className="setup-search">
                        <input
                          className="setup-input"
                          placeholder="Search by code or name..."
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                        />
                      </div>

                      <div className="setup-table-container" style={{ border: '1px solid rgba(255,255,255,0.04)', padding: '0.25rem' }}>
                        <table className="setup-table">
                          <thead>
                            <tr>
                              <th className="col-code">Code</th>
                              <th>Subject name</th>
                              <th className="col-hours">Hours</th>
                              <th className="col-check">Add</th>
                            </tr>
                          </thead>
                          <tbody>
                            {availableSubjects.filter(s => {
                              if (!query) return true;
                              const q = query.trim().toLowerCase();
                              const code = (s.code || '').toLowerCase();
                              const name = (s.name || '').toLowerCase();
                              return code.includes(q) || name.includes(q);
                            }).map(s => {
                              const hours = s.hours ?? s.default_hours ?? s.required_hours ?? '';
                              return (
                                <tr key={s.id}>
                                  <td className="col-code">{s.code || (s.name ? (s.name.toUpperCase().slice(0,3) + '-' + (100 + s.id)) : '')}</td>
                                  <td>{s.name}</td>
                                  <td className="col-hours">{hours}</td>
                                  <td className="col-check">
                                    <input type="checkbox" checked={selectedSubjects.includes(s.id)} onChange={() => toggleSubject(s.id)} />
                                  </td>
                                </tr>
                              );
                            })}
                            {availableSubjects.length === 0 && (
                              <tr><td colSpan={4} style={{ opacity: 0.7 }}>No subjects available yet.</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h3 style={{ textAlign: 'center' }}>Preview</h3>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <p><strong>Teacher Code:</strong> {teacherCode}</p>
                        <p><strong>First name:</strong> {firstName}</p>
                        <p><strong>Last name:</strong> {lastName}</p>
                        <p><strong>Max hours/day:</strong> {maxHours}</p>
                      </div>
                      <div style={{ flex: 1 }}>
                        <p><strong>Qualified subjects:</strong></p>
                        <ul>
                          {availableSubjects.filter(s => selectedSubjects.includes(s.id)).map(s => (
                            <li key={s.id}>{(s.code || s.name)} — {s.name} ({s.hours ?? s.default_hours ?? ''})</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
              {step === 1 && (
                <>
                  <button className="btn secondary" type="button" onClick={clearInputs}>Clear</button>
                  <button className="btn primary" type="button" onClick={goNext} disabled={working}>{working ? 'Working…' : 'Next'}</button>
                </>
              )}
              {step === 2 && (
                <>
                  <button className="btn secondary" type="button" onClick={clearSubjects}>Clear</button>
                  <button className="btn secondary" type="button" onClick={goPrev}>Prev</button>
                  <button className="btn primary" type="button" onClick={goNext} disabled={working}>{working ? 'Working…' : 'Next'}</button>
                </>
              )}
              {step === 3 && (
                <>
                  <button className="btn secondary" type="button" onClick={goPrev}>Prev</button>
                  <button className="btn primary" type="button" onClick={handleSave} disabled={working}>{working ? 'Saving…' : 'Save'}</button>
                </>
              )}
            </div>
            {message && <p style={{ textAlign: 'center', color: message.startsWith('Profile saved') ? '#47d147' : '#ff4d4d' }}>{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetUpProfile;
