import React, { useState, useEffect, useRef } from 'react';
import '../assets/css/subject-list.css';
import { useAuth } from '../context/AuthContext';
import { loadSubjects } from '../assets/js/subject-list';
import AddSubject from '../assets/modals/add_subject';
import AddSubjectResult from '../assets/modals/add_subject_result';

const SubjectList = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const fetchRef = useRef(null);

  useEffect(() => {
    fetchRef.current = async () => {
      setLoading(true);
      const items = await loadSubjects();
      setSubjects(items || []);
      setLoading(false);
    };

    fetchRef.current();
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [createKey, setCreateKey] = useState(0);

  const handleCreate = () => {
    setEditingSubject(null);
    setCreateKey((k) => k + 1);
    setModalOpen(true);
  };

  const handleEdit = (s) => {
    setEditingSubject(s);
    setModalOpen(true);
  };

  return (
    <div className="um-root">
      <header className="um-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Subject List</h1>
          <p className="um-sub">View and manage subjects</p>
        </div>
        <div>
          {isAdmin && <button className="btn" onClick={handleCreate} style={{ position: 'relative', zIndex: 20 }}>New</button>}
        </div>
      </header>

      <div className="um-list">
        <div style={{ padding: '0 0rem' }}>
          <p>Subjects count: {subjects.length}</p>

          <div style={{ marginTop: '0.5rem', maxHeight: '75vh', overflowY: 'auto', overflowX: 'auto' }}>
            <table className="um-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Code</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Subject</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Hours</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Level</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} style={{ padding: '0.5rem 0.75rem', opacity: 0.6 }}>Loading…</td>
                  </tr>
                )}
                {!loading && subjects.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{s.code || (s.name ? s.name.toUpperCase().slice(0,3) + '-' + (100 + s.id) : 100 + s.id)}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{s.name}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{s.hours ?? s.h ?? 1}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{s.level ?? s.level_name ?? s.levelName ?? ''}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>
                      {isAdmin ? (
                        <button className="btn small" onClick={() => handleEdit(s)}>Edit</button>
                      ) : (
                        <span style={{ opacity: 0.75 }}>View only</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!loading && subjects.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '0.5rem 0.75rem', opacity: 0.6 }}>No subjects found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <AddSubject
        key={editingSubject?.id ?? `new-${createKey}`}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editingSubject}
        onSaved={(result) => {
          // close the add form and show a result modal. keep result data so parent can reopen add modal if needed
          setModalOpen(false);
          setResultData(result);
          setResultOpen(true);

          if (!result?.success) return;
          const s = result.subject;
            if (s) {
            const normalized = {
              id: s.id,
              name: s.name ?? s.subject_name ?? s.subjectName,
              hours: s.hours ?? s.default_hours ?? s.defaultHours,
              code: s.code ?? s.subject_code ?? s.subjectCode,
              level: s.level ?? s.default_level ?? s.levelName ?? s.level_name,
            };
            setSubjects((prev) => {
              const exists = prev.find((x) => String(x.id) === String(normalized.id));
              if (exists) {
                return prev.map((x) => (String(x.id) === String(normalized.id) ? { ...x, ...normalized } : x));
              }
              return [normalized, ...(prev || [])];
            });
            return;
          }
          if (fetchRef.current) fetchRef.current();
        }}
      />

      <AddSubjectResult
        isOpen={resultOpen}
        onClose={() => {
          setResultOpen(false);
          // clear editing state; keep add modal closed so New opens empty next time
          if (resultData?.success) {
            setEditingSubject(null);
            setModalOpen(false);
          }
          setResultData(null);
        }}
        title={resultData?.success ? 'Success' : 'Notice'}
        message={resultData?.message || ''}
        isError={!resultData?.success}
      />
    </div>
  );
};

export default SubjectList;

