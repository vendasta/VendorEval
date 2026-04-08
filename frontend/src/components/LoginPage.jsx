import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { login, register, demoLogin } from '../api/client';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [tab, setTab] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCompany, setRegCompany] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      loginUser(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const data = await register(regName, regEmail, regPassword, regCompany);
      loginUser(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await demoLogin();
      loginUser(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      {/* Left Brand Panel */}
      <div className="login__brand">
        <div className="login__brand-icon">
          <svg width="72" height="72" viewBox="0 0 80 80" fill="none">
            <rect x="12" y="4" width="48" height="64" rx="6" fill="#1e3a5f" stroke="#4ade80" strokeWidth="2" />
            <rect x="20" y="16" width="32" height="3" rx="1.5" fill="#4ade80" opacity="0.7" />
            <rect x="20" y="24" width="28" height="3" rx="1.5" fill="#ffffff" opacity="0.4" />
            <rect x="20" y="32" width="32" height="3" rx="1.5" fill="#ffffff" opacity="0.4" />
            <rect x="20" y="40" width="24" height="3" rx="1.5" fill="#ffffff" opacity="0.4" />
            <rect x="20" y="48" width="30" height="3" rx="1.5" fill="#ffffff" opacity="0.4" />
            <circle cx="56" cy="56" r="18" fill="#2563eb" stroke="#0f172a" strokeWidth="3" />
            <path d="M48 56l5 5 10-10" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="login__brand-title">VendorEval AI</h1>
        <p className="login__brand-tagline">Upload. Analyze. Decide. In 10 Minutes.</p>
        <ul className="login__features">
          <li className="login__feature" style={{ animationDelay: '0.1s' }}>
            <span className="login__feature-icon">&#10003;</span>
            AI-powered vendor proposal analysis and scoring
          </li>
          <li className="login__feature" style={{ animationDelay: '0.2s' }}>
            <span className="login__feature-icon">&#10003;</span>
            Automatic red flag detection and risk assessment
          </li>
          <li className="login__feature" style={{ animationDelay: '0.3s' }}>
            <span className="login__feature-icon">&#10003;</span>
            Side-by-side comparison with actionable recommendations
          </li>
        </ul>
      </div>

      {/* Right Form Panel */}
      <div className="login__form-panel">
        <div className="login__form-container">
          <div className="login__tabs">
            <button
              className={`login__tab ${tab === 'signin' ? 'login__tab--active' : ''}`}
              onClick={() => { setTab('signin'); setError(''); }}
            >
              Sign In
            </button>
            <button
              className={`login__tab ${tab === 'register' ? 'login__tab--active' : ''}`}
              onClick={() => { setTab('register'); setError(''); }}
            >
              Register
            </button>
          </div>

          {error && <div className="alert alert--error mb-4">{error}</div>}

          {tab === 'signin' ? (
            <form className="login__form" onSubmit={handleSignIn}>
              <input
                className="input"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                className="input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button className="btn btn--primary w-full" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form className="login__form" onSubmit={handleRegister}>
              <input
                className="input"
                type="text"
                placeholder="Full name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
              <input
                className="input"
                type="email"
                placeholder="Email address"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
              <input
                className="input"
                type="password"
                placeholder="Password (min 6 characters)"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                minLength={6}
              />
              <input
                className="input"
                type="text"
                placeholder="Company name"
                value={regCompany}
                onChange={(e) => setRegCompany(e.target.value)}
              />
              <button className="btn btn--primary w-full" type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Register'}
              </button>
            </form>
          )}

          <div className="login__divider">
            <div className="login__divider-line" />
            <span className="login__divider-text">or</span>
            <div className="login__divider-line" />
          </div>

          <button className="btn btn--dark w-full" onClick={handleDemo} disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1l2.1 4.3 4.9.7-3.5 3.4.8 4.6L8 11.8 3.7 14l.8-4.6L1 6l4.9-.7L8 1z" fill="#f59e0b" />
            </svg>
            {loading ? 'Loading demo...' : 'Try Demo — No signup needed'}
          </button>
          <p className="login__demo-hint">
            Loads a real cloud vendor evaluation instantly
          </p>
        </div>
      </div>
    </div>
  );
}
