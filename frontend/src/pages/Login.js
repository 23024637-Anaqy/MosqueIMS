import React, { useState } from 'react';
import { useLogin } from '../hooks/useLogin';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { login, error, isLoading } = useLogin();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const u = await login(email, password);
    if (u) navigate('/dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fbfdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <header style={{ marginBottom: 20, textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 28, color: '#065f46' }}>Mosque Inventory Login</h1>
          <p style={{ margin: '8px 0 0', color: '#09623a' }}>Sign in with your email and password.</p>
        </header>

        <section style={{ background: 'white', borderRadius: 8, padding: 20, boxShadow: '0 6px 24px rgba(2,6,23,0.04)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
            <label style={{ fontSize: 13, color: '#374151' }}>User</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user" style={{ padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }} />

            <label style={{ fontSize: 13, color: '#374151' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" style={{ padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }} />

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={isLoading} style={{ padding: '10px 12px', background: '#065f46', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>{isLoading ? 'Signing in…' : 'Sign in'}</button>
              <Link to="/" style={{ padding: '10px 12px', background: '#d4af37', color: '#072017', borderRadius: 6, textDecoration: 'none', fontWeight: 600, display: 'inline-block' }}>Back</Link>
            </div>

            {error && <div style={{ marginTop: 8, color: '#991B1B', background: '#FEE2E2', padding: 8, borderRadius: 6 }}>{error}</div>}
          </form>
        </section>
      </div>
    </div>
  );
};

export default Login;
