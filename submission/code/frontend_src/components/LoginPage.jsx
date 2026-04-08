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

  // Sign In fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
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

  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    leftPanel: {
      flex: '0 0 60%',
      background: 'linear-gradient(135deg, #0f1b2d 0%, #1a2d4a 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '60px',
      color: '#ffffff',
    },
    docIcon: {
      fontSize: '80px',
      marginBottom: '24px',
      opacity: 0.9,
    },
    brandTitle: {
      fontSize: '48px',
      fontWeight: 800,
      marginBottom: '16px',
      letterSpacing: '-1px',
    },
    tagline: {
      fontSize: '20px',
      opacity: 0.85,
      marginBottom: '48px',
      fontWeight: 300,
    },
    featureList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    featureItem: {
      fontSize: '16px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      opacity: 0.9,
    },
    checkIcon: {
      color: '#4ade80',
      fontSize: '20px',
      fontWeight: 'bold',
    },
    rightPanel: {
      flex: '0 0 40%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '60px 48px',
      backgroundColor: '#ffffff',
    },
    formContainer: {
      width: '100%',
      maxWidth: '380px',
    },
    tabRow: {
      display: 'flex',
      marginBottom: '32px',
      borderBottom: '2px solid #e5e7eb',
    },
    tab: {
      flex: 1,
      padding: '12px 0',
      textAlign: 'center',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: 600,
      color: '#9ca3af',
      border: 'none',
      background: 'none',
      borderBottom: '2px solid transparent',
      marginBottom: '-2px',
      transition: 'all 0.2s',
    },
    activeTab: {
      color: '#0f1b2d',
      borderBottom: '2px solid #2563eb',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      fontSize: '14px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      marginBottom: '16px',
      outline: 'none',
      transition: 'border-color 0.2s',
      fontFamily: 'inherit',
    },
    primaryBtn: {
      width: '100%',
      padding: '14px',
      fontSize: '15px',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: '#2563eb',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      marginBottom: '16px',
      transition: 'background-color 0.2s',
    },
    demoBtn: {
      width: '100%',
      padding: '14px',
      fontSize: '15px',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: '#0f1b2d',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      marginTop: '8px',
      transition: 'background-color 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
    },
    demoHint: {
      fontSize: '12px',
      color: '#9ca3af',
      textAlign: 'center',
      marginTop: '12px',
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      margin: '24px 0',
      gap: '12px',
    },
    dividerLine: {
      flex: 1,
      height: '1px',
      backgroundColor: '#e5e7eb',
    },
    dividerText: {
      fontSize: '12px',
      color: '#9ca3af',
      fontWeight: 500,
    },
    errorBox: {
      padding: '12px 16px',
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '14px',
      border: '1px solid #fecaca',
    },
  };

  return (
    <div style={styles.container}>
      {/* Left Panel */}
      <div style={styles.leftPanel}>
        <div style={styles.docIcon}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <rect x="12" y="4" width="48" height="64" rx="6" fill="#1e3a5f" stroke="#4ade80" strokeWidth="2" />
            <rect x="20" y="16" width="32" height="3" rx="1.5" fill="#4ade80" opacity="0.7" />
            <rect x="20" y="24" width="28" height="3" rx="1.5" fill="#ffffff" opacity="0.4" />
            <rect x="20" y="32" width="32" height="3" rx="1.5" fill="#ffffff" opacity="0.4" />
            <rect x="20" y="40" width="24" height="3" rx="1.5" fill="#ffffff" opacity="0.4" />
            <rect x="20" y="48" width="30" height="3" rx="1.5" fill="#ffffff" opacity="0.4" />
            <circle cx="56" cy="56" r="18" fill="#2563eb" stroke="#0f1b2d" strokeWidth="3" />
            <path d="M48 56l5 5 10-10" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={styles.brandTitle}>VendorEval AI</div>
        <div style={styles.tagline}>Upload. Analyze. Decide. In 10 Minutes.</div>
        <ul style={styles.featureList}>
          <li style={styles.featureItem}>
            <span style={styles.checkIcon}>&#10003;</span>
            AI-powered vendor proposal analysis and scoring
          </li>
          <li style={styles.featureItem}>
            <span style={styles.checkIcon}>&#10003;</span>
            Automatic red flag detection and risk assessment
          </li>
          <li style={styles.featureItem}>
            <span style={styles.checkIcon}>&#10003;</span>
            Side-by-side comparison with actionable recommendations
          </li>
        </ul>
      </div>

      {/* Right Panel */}
      <div style={styles.rightPanel}>
        <div style={styles.formContainer}>
          {/* Tabs */}
          <div style={styles.tabRow}>
            <button
              style={{ ...styles.tab, ...(tab === 'signin' ? styles.activeTab : {}) }}
              onClick={() => { setTab('signin'); setError(''); }}
            >
              Sign In
            </button>
            <button
              style={{ ...styles.tab, ...(tab === 'register' ? styles.activeTab : {}) }}
              onClick={() => { setTab('register'); setError(''); }}
            >
              Register
            </button>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          {tab === 'signin' ? (
            <form onSubmit={handleSignIn}>
              <input
                style={styles.input}
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                style={styles.input}
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button style={styles.primaryBtn} type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <input
                style={styles.input}
                type="text"
                placeholder="Full name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
              />
              <input
                style={styles.input}
                type="email"
                placeholder="Email address"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
              <input
                style={styles.input}
                type="password"
                placeholder="Password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
              />
              <input
                style={styles.input}
                type="text"
                placeholder="Company name"
                value={regCompany}
                onChange={(e) => setRegCompany(e.target.value)}
              />
              <button style={styles.primaryBtn} type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Register'}
              </button>
            </form>
          )}

          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>OR</span>
            <div style={styles.dividerLine} />
          </div>

          <button style={styles.demoBtn} onClick={handleDemo} disabled={loading}>
            <span style={{ fontSize: '18px' }}>&#10024;</span>
            {loading ? 'Loading demo...' : 'Try Demo \u2014 No signup needed'}
          </button>
          <div style={styles.demoHint}>Loads a real cloud vendor evaluation instantly</div>
        </div>
      </div>
    </div>
  );
}
