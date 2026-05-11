// Helpers for SubjectList page: load, create, update subjects
const API_BASE = 'http://localhost/Portfolio/academic-scheduler/backend/api';

export async function loadSubjects() {
  try {
    const res = await fetch(`${API_BASE}/list_subjects.php`);
    const json = await res.json();
    if (json && json.success) return json.subjects || [];
    return [];
  } catch (e) {
    console.error('loadSubjects error', e);
    return [];
  }
}
export async function saveSubject({ id, name, hours, level }) {
  // Wrapper that chooses create or update based on presence of id
  if (id) return updateSubject(id, name, hours, level);
  return createSubject(name, hours, level);
}

// Update create/update to accept hours param (backwards compatible)
export async function createSubject(name, hours = 1, level = '') {
  try {
    const res = await fetch(`${API_BASE}/create_subject.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, hours, level }),
    });
    const json = await res.json();
    return json || { success: false };
  } catch (e) {
    console.error('createSubject error', e);
    return { success: false, message: e.message };
  }
}

export async function updateSubject(id, name, hours = 1, level = null) {
  try {
    const res = await fetch(`${API_BASE}/update_subject.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, hours, level }),
    });
    const json = await res.json();
    return json || { success: false };
  } catch (e) {
    console.error('updateSubject error', e);
    return { success: false, message: e.message };
  }
}
export default { loadSubjects, createSubject, updateSubject, saveSubject };
