// Simple mock login module used by the frontend-only AuthContext
const MOCK_USERS = [
  { email: 'admin@example.com', password: 'adminpass', role: 'ADMIN' },
  { email: 'user@example.com', password: 'userpass', role: 'USER' },
];

export async function mockLogin(email, password) {
  // simulate network delay
  await new Promise((res) => setTimeout(res, 180));
  const found = MOCK_USERS.find((u) => u.email === email && u.password === password);
  if (!found) {
    const err = new Error('Invalid credentials');
    err.code = 'INVALID_CREDENTIALS';
    throw err;
  }
  return { email: found.email, role: found.role };
}

export { MOCK_USERS };

export async function submitLogin({ email, password, login, onBack, setError, setLoading }) {
  setError(null);
  setLoading(true);
  try {
    await login(email.trim(), password);
    if (typeof onBack === 'function') onBack();
  } catch (err) {
    setError(err?.message || 'Login failed');
  } finally {
    setLoading(false);
  }
}
