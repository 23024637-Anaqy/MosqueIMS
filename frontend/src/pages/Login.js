import React, { useState, useEffect } from 'react';
import { useLogin } from '../hooks/useLogin';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [manualUserId, setManualUserId] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [testUsers, setTestUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showManual, setShowManual] = useState(false);

  const { login, error, isLoading } = useLogin();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTestUsers = async () => {
      try {
        const res = await fetch('/api/test-users');
        if (res.ok) {
          const data = await res.json();
          setTestUsers(data.testUsers || []);
        }
      } catch (err) {
        console.error('Failed to fetch test users', err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchTestUsers();
  }, []);

  const handleManual = async (e) => {
    e.preventDefault();
    const u = await login(manualUserId, manualPassword);
    if (u) navigate('/dashboard');
  };

  const handleQuick = async (userId) => {
    const u = await login(userId, '');
    if (u) navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fbfdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 720 }}>
        <header style={{ marginBottom: 20, textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 28, color: '#065f46' }}>Mosque Inventory — Demo Login</h1>
          <p style={{ margin: '8px 0 0', color: '#09623a' }}>Click a demo user to sign in instantly (prototype mode).</p>
        </header>

        <section style={{ background: 'white', borderRadius: 8, padding: 20, boxShadow: '0 6px 24px rgba(2,6,23,0.04)' }}>
          {loadingUsers ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#6b7280' }}>Loading demo users…</div>
          ) : (
            <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
              {testUsers.length === 0 ? (
                <div style={{ color: '#6b7280', textAlign: 'center', padding: 12 }}>No demo users available.</div>
              ) : (
                testUsers.map((u) => (
                  <button
                    key={u.userId}
                    onClick={() => handleQuick(u.userId)}
                    disabled={isLoading}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: 6,
                      border: '1px solid #e6e6e6',
                      background: '#f8fafb',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      color: '#09231a',
                      fontWeight: 600
                    }}
                  >
                    <span>{u.name} ({u.role})</span>
                    <small style={{ color: '#6b7280' }}>Use token</small>
                  </button>
                ))
              )}

              <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
                <button onClick={() => setShowManual((s) => !s)} style={{ padding: '8px 12px', background: '#065f46', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                  {showManual ? 'Hide manual login' : 'Show manual login'}
                </button>
                <Link to="/" style={{ padding: '8px 12px', background: '#d4af37', color: '#072017', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>Back</Link>
              </div>
            </div>
          )}

          {showManual && (
            <form onSubmit={handleManual} style={{ marginTop: 18, display: 'grid', gap: 12 }}>
              <label style={{ fontSize: 13, color: '#374151' }}>User ID</label>
              <input value={manualUserId} onChange={(e) => setManualUserId(e.target.value)} placeholder="Paste user ID token" style={{ padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }} />

              <label style={{ fontSize: 13, color: '#374151' }}>Password</label>
              <input type="password" value={manualPassword} onChange={(e) => setManualPassword(e.target.value)} placeholder="Password (not required for demo)" style={{ padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }} />

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={isLoading} style={{ padding: '10px 12px', background: '#065f46', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>{isLoading ? 'Signing in…' : 'Sign in'}</button>
                <button type="button" onClick={() => { setManualUserId(''); setManualPassword(''); }} style={{ padding: '10px 12px', background: '#f3f4f6', border: '1px solid #e6e6e6', borderRadius: 6, cursor: 'pointer' }}>Clear</button>
              </div>

              {error && <div style={{ marginTop: 8, color: '#991B1B', background: '#FEE2E2', padding: 8, borderRadius: 6 }}>{error}</div>}
            </form>
          )}
        </section>

        <footer style={{ marginTop: 16, color: '#6b7280', textAlign: 'center', fontSize: 13 }}>
          Prototype mode — seeded demo users rotate on server restart.
        </footer>
      </div>
    </div>
  );
};

export default Login;
