import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { getEvaluations } from '../api/client';

const statusColors = {
  pending: { bg: '#f3f4f6', text: '#6b7280' },
  extracting: { bg: '#dbeafe', text: '#2563eb' },
  analyzing: { bg: '#dbeafe', text: '#2563eb' },
  completed: { bg: '#dcfce7', text: '#16a34a' },
  failed: { bg: '#fef2f2', text: '#dc2626' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    try {
      const data = await getEvaluations();
      setEvaluations(data.evaluations || []);
    } catch (err) {
      console.error('Failed to load evaluations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isDemo = user?.role === 'demo';

  const styles = {
    page: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 32px',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    logo: {
      fontSize: '22px',
      fontWeight: 800,
      color: '#0f1b2d',
      letterSpacing: '-0.5px',
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    userName: {
      fontSize: '14px',
      color: '#6b7280',
    },
    logoutBtn: {
      padding: '8px 16px',
      fontSize: '13px',
      color: '#6b7280',
      backgroundColor: '#f3f4f6',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: 500,
    },
    demoBanner: {
      padding: '10px 32px',
      backgroundColor: '#fef9c3',
      color: '#854d0e',
      fontSize: '14px',
      fontWeight: 600,
      textAlign: 'center',
      borderBottom: '1px solid #fde68a',
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '32px',
    },
    topRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '32px',
    },
    pageTitle: {
      fontSize: '28px',
      fontWeight: 700,
      color: '#0f1b2d',
    },
    newBtn: {
      padding: '12px 24px',
      fontSize: '15px',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: '#2563eb',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'background-color 0.2s',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: '20px',
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      transition: 'box-shadow 0.2s',
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: 600,
      color: '#0f1b2d',
      marginBottom: '8px',
    },
    cardMeta: {
      fontSize: '13px',
      color: '#9ca3af',
      marginBottom: '16px',
    },
    statusBadge: (status) => {
      const color = statusColors[status] || statusColors.pending;
      return {
        display: 'inline-block',
        padding: '4px 12px',
        fontSize: '12px',
        fontWeight: 600,
        borderRadius: '20px',
        backgroundColor: color.bg,
        color: color.text,
        textTransform: 'capitalize',
      };
    },
    cardBottom: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '16px',
    },
    viewBtn: {
      padding: '8px 16px',
      fontSize: '13px',
      fontWeight: 600,
      color: '#2563eb',
      backgroundColor: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    emptyState: {
      textAlign: 'center',
      padding: '80px 20px',
    },
    emptyIcon: {
      fontSize: '64px',
      marginBottom: '16px',
      opacity: 0.3,
    },
    emptyTitle: {
      fontSize: '22px',
      fontWeight: 600,
      color: '#374151',
      marginBottom: '8px',
    },
    emptyText: {
      fontSize: '15px',
      color: '#9ca3af',
      marginBottom: '24px',
    },
    loadingText: {
      textAlign: 'center',
      padding: '60px',
      color: '#9ca3af',
      fontSize: '16px',
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.logo}>VendorEval AI</div>
        <div style={styles.headerRight}>
          <span style={styles.userName}>{user?.name || user?.email || 'User'}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {isDemo && (
        <div style={styles.demoBanner}>
          DEMO MODE — You are viewing sample data. Create an account for full access.
        </div>
      )}

      <div style={styles.content}>
        <div style={styles.topRow}>
          <h1 style={styles.pageTitle}>Evaluations</h1>
          <button style={styles.newBtn} onClick={() => navigate('/upload')}>
            <span style={{ fontSize: '18px' }}>+</span>
            New Evaluation
          </button>
        </div>

        {loading ? (
          <div style={styles.loadingText}>Loading evaluations...</div>
        ) : evaluations.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <rect x="10" y="10" width="60" height="60" rx="8" fill="#f3f4f6" stroke="#d1d5db" strokeWidth="2" />
                <path d="M30 35h20M30 45h14" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
                <circle cx="40" cy="40" r="3" fill="#9ca3af" />
              </svg>
            </div>
            <div style={styles.emptyTitle}>Start your first vendor evaluation</div>
            <div style={styles.emptyText}>
              Upload vendor proposals and let AI analyze them for you
            </div>
            <button style={styles.newBtn} onClick={() => navigate('/upload')}>
              <span style={{ fontSize: '18px' }}>+</span>
              New Evaluation
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {evaluations.map((ev) => (
              <div key={ev.id} style={styles.card}>
                <div style={styles.cardTitle}>{ev.title}</div>
                <div style={styles.cardMeta}>
                  {ev.vendor_count || 0} vendor{(ev.vendor_count || 0) !== 1 ? 's' : ''} &middot;{' '}
                  {new Date(ev.created_at).toLocaleDateString()}
                </div>
                <span style={styles.statusBadge(ev.status)}>{ev.status}</span>
                <div style={styles.cardBottom}>
                  <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                    {ev.status === 'completed' ? 'Analysis complete' : 'In progress'}
                  </span>
                  <button
                    style={styles.viewBtn}
                    onClick={() => navigate(`/evaluation/${ev.id}`)}
                  >
                    {ev.status === 'completed' ? 'View Results' : 'View Details'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
