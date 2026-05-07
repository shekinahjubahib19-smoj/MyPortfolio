import React, { useEffect, useState, useRef } from 'react';
import '../assets/css/set-up-profile.css';
import { useAuth } from '../context/AuthContext';
import { fetchSubjects, fetchUserProfile, saveTeacherProfile } from '../assets/js/set-up-profile';
import SetupProfileResult from '../assets/modals/setup-profile-result';
const SetUpProfile = () => {
  const { user, updateUser } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
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
  const [resultOpen, setResultOpen] = useState(false);
  const [resultError, setResultError] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [resultRedirect, setResultRedirect] = useState(false);
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
      setMessage(`Please fill ${isAdmin ? 'User Code' : 'Teacher Code'}, First name and Last name.`);
      return false;
    }
    if (!isAdmin && (!Number(maxHours) || Number(maxHours) <= 0)) {
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
        max_hours_per_day: isAdmin ? 8 : (Number(maxHours) || 0),
        subjects: isAdmin ? [] : selectedSubjects,
      };
      const json = await saveTeacherProfile(payload);
      if (json && json.success) {
        setResultError(false);
        setResultMessage(isAdmin ? 'Saved successfully.' : 'Saved successfully. Only admins can view or update profile details.');
        setResultRedirect(true);
        setResultOpen(true);
      } else {
        setResultError(true);
        setResultMessage(json?.message || 'Failed to save. Please try again.');
        setResultRedirect(false);
        setResultOpen(true);
      }
    } catch (err) {
      console.error(err);
      setResultError(true);
      setResultMessage('Failed to save. Please try again.');
      setResultRedirect(false);
      setResultOpen(true);
    } finally {
      setWorking(false);
    }
  };

  const handleResultOk = () => {
    const shouldRedirect = resultRedirect && !resultError;
    setResultOpen(false);
    if (shouldRedirect) {
      try {
        const raw = window.localStorage.getItem('mock_auth_user');
        if (raw) {
          const obj = JSON.parse(raw);
          obj.is_profile_complete = true;
          window.localStorage.setItem('mock_auth_user', JSON.stringify(obj));
        }
      } catch (err) {
        console.warn('localStorage update failed', err);
      }

      if (typeof updateUser === 'function') {
        updateUser({ is_profile_complete: true });
      }

      setTimeout(() => {
        window.location.hash = '#/dashboard';
      }, 0);
    }
  };

  return (
    <div className="setup-root">
      <SetupProfileResult
        isOpen={resultOpen}
        isError={resultError}
        message={resultMessage}
        onOk={handleResultOk}
      />
      <header className="setup-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Set Up Profile</h1>
          <p className="setup-sub">
            {isAdmin ? 'Complete your admin profile before using the system' : 'Complete your teacher profile before using the system'}
          </p>
        </div>
      </header>

      <div className="setup-list">
        <div style={{ padding: '0 0rem', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 520 }}>
            {!isAdmin && (
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
            )}

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: (step === 3 ? 'center' : 'flex-start') }}>
              <form
                onSubmit={(e) => e.preventDefault()}
                className={isAdmin ? 'setup-admin-form' : ''}
                style={{ width: 560, marginLeft: (step === 3 ? 0 : '-1rem') }}
              >
                {(isAdmin || step === 1) && (
                  <div style={{ marginTop: 8 }}>
                    <div className="setup-section">
                      <label>{isAdmin ? 'User Code' : 'Teacher Code'}</label>
                      <input className="setup-input" value={teacherCode} onChange={(e) => setTeacherCode(e.target.value)} placeholder="e.g., 2026001" />
                    </div>

                    <div className="setup-section">
                      <label>First name</label>
                      <input className="setup-input" value={firstName} onChange={(e) => setFirstName(e.target.value.toUpperCase())} placeholder="e.g., John" />
                    </div>

                    <div className="setup-section">
                      <label>Last name</label>
                      <input className="setup-input" value={lastName} onChange={(e) => setLastName(e.target.value.toUpperCase())} placeholder="e.g., Doe" />
                    </div>

                    {!isAdmin && (
                      <div className="setup-section">
                        <label>Max hours per day</label>
                        <input type="number" className="setup-input" value={maxHours} onChange={(e) => setMaxHours(e.target.value)} placeholder="e.g., 8" />
                      </div>
                    )}
                  </div>
                )}

                {!isAdmin && step === 2 && (
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

                {!isAdmin && step === 3 && (
                  <div>
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
                              <td>{teacherCode}</td>
                              <td>{(firstName || '') + (lastName ? ' ' + lastName : '')}</td>
                              <td>{maxHours ? `${maxHours} hours` : ''}</td>
                            </tr>
                          </tbody>
                        </table>

                        <div className="setup-preview-subjects-container" style={{ marginTop: 12 }}>
                          <table className="setup-preview-subjects-table">
                            <thead>
                              <tr className="setup-preview-subtitle-row">
                                <th colSpan={3}>Qualified Subject/s</th>
                              </tr>
                              <tr>
                                <th>Subject Code</th>
                                <th>Subject Name</th>
                                <th>Duration</th>
                              </tr>
                            </thead>
                            <tbody>
                              {availableSubjects.filter(s => selectedSubjects.includes(s.id)).map(s => (
                                <tr key={s.id}>
                                  <td>{s.code || s.name}</td>
                                  <td>{s.name}</td>
                                  <td>{(s.hours ?? s.default_hours ?? '') ? `${s.hours ?? s.default_hours ?? ''} hour` : ''}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
              {isAdmin ? (
                <>
                  <button className="btn secondary" type="button" onClick={clearInputs}>Clear</button>
                  <button className="btn primary" type="button" onClick={handleSave} disabled={working}>{working ? 'Saving…' : 'Save'}</button>
                </>
              ) : (
                <>
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
