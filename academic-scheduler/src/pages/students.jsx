import React, { useState, useEffect, useRef } from 'react';
import '../assets/css/students.css';
import EnrollStudent from '../assets/modals/enroll_student';
import StudentProfileModal from '../assets/modals/student_profile_modal';

const Students = () => {

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const fetchRef = useRef(null);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileReadOnly, setProfileReadOnly] = useState(true);

  useEffect(() => {
    fetchRef.current = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost/Portfolio/academic-scheduler/backend/api/list_students.php');
        const json = await res.json();
        if (json.success) setStudents(json.students || []);
        else setStudents([]);
      } catch (e) {
        console.error('Failed to load students', e);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRef.current();
  }, []);

  const openProfile = (s, readOnly = true) => { setSelectedStudent(s); setProfileReadOnly(readOnly); setProfileOpen(true); };

  return (
    <div className="students-root">
      <header className="um-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Students</h1>
          <p className="um-sub">View and manage student records</p>
        </div>
        <div>
          <button className="btn" onClick={() => setEnrollOpen(true)} style={{ position: 'relative', zIndex: 20 }}>Enroll</button>
        </div>
      </header>

      <EnrollStudent
        isOpen={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        onSaved={(res) => {
          setEnrollOpen(false);
          if (res.success) {
            if (fetchRef.current) fetchRef.current();
          }
        }}
      />

      <StudentProfileModal
        isOpen={profileOpen}
        onClose={() => { setProfileOpen(false); setSelectedStudent(null); setProfileReadOnly(true); }}
        student={selectedStudent}
        readOnly={profileReadOnly}
        onSaved={() => { if (fetchRef.current) fetchRef.current(); }}
      />

      <div className="students-list">
        <div style={{ padding: '0 0rem' }}>
          <p>Students count: {students.length}</p>

          <div style={{ marginTop: '0.5rem', maxHeight: '75vh', overflowY: 'auto', overflowX: 'auto' }}>
            <table className="um-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Student Code</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Name</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Level</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4} style={{ padding: '0.5rem 0.75rem', opacity: 0.6 }}>Loading…</td>
                  </tr>
                )}
                {!loading && students.map((s) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }} onClick={() => openProfile(s)}>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{s.student_code ?? '-'}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{(s.first_name || '') + (s.last_name ? ' ' + s.last_name : '')}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{s.current_level ?? ''}</td>
                    <td style={{ padding: '0.5rem 0.75rem' }}>{s.enrollment_status ?? ''}</td>
                  </tr>
                ))}
                {!loading && students.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: '0.5rem 0.75rem', opacity: 0.6 }}>No students found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Students;
