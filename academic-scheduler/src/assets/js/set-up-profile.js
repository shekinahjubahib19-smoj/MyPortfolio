export async function fetchSubjects() {
  const url = 'http://localhost/MyPortfolio/academic-scheduler/backend/api/list_subjects.php';
  const res = await fetch(url);
  const j = await res.json().catch(() => ({}));
  if (j && j.success) return j.subjects || [];
  throw new Error(j && j.message ? j.message : 'Failed to load subjects');
}

export async function fetchUserProfile(userId) {
  const url = 'http://localhost/MyPortfolio/academic-scheduler/backend/api/list_users.php';
  const res = await fetch(url);
  const j = await res.json().catch(() => ({}));
  if (j && j.success) {
    const me = (j.users || []).find(u => String(u.id) === String(userId));
    return me && me.profile ? me.profile : null;
  }
  return null;
}

export async function saveTeacherProfile(payload) {
  const url = 'http://localhost/MyPortfolio/academic-scheduler/backend/api/update_teacher_profile.php';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const j = await res.json().catch(() => ({}));
  return j;
}
