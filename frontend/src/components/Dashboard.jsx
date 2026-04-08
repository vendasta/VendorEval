import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvaluations } from '../api/client';
import Layout from './Layout';

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getEvaluations();
        setEvaluations(data.evaluations || data || []);
      } catch (err) {
        console.error('Failed to load evaluations:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return evaluations;
    const q = search.toLowerCase();
    return evaluations.filter((e) => e.title?.toLowerCase().includes(q));
  }, [evaluations, search]);

  const stats = useMemo(() => ({
    total: evaluations.length,
    completed: evaluations.filter((e) => e.status === 'completed').length,
    inProgress: evaluations.filter((e) => ['analyzing', 'extracting', 'pending', 'draft'].includes(e.status)).length,
    failed: evaluations.filter((e) => ['failed', 'error'].includes(e.status)).length,
  }), [evaluations]);

  const skeletonCards = Array.from({ length: 3 }, (_, i) => (
    <div key={i} className="card" style={{ padding: 'var(--sp-6)' }}>
      <div className="skeleton skeleton--title" />
      <div className="skeleton skeleton--text" style={{ width: '40%' }} />
      <div className="skeleton skeleton--text mt-4" style={{ width: '30%' }} />
      <div className="skeleton skeleton--text mt-6" style={{ width: '50%' }} />
    </div>
  ));

  return (
    <Layout>
      <div className="dashboard__header">
        <h1 className="dashboard__title">Evaluations</h1>
        <button className="btn btn--primary" onClick={() => navigate('/upload')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          New Evaluation
        </button>
      </div>

      {/* Stats Row */}
      {!loading && evaluations.length > 0 && (
        <div className="dashboard__stats">
          <div className="dashboard__stat">
            <div className="dashboard__stat-value">{stats.total}</div>
            <div className="dashboard__stat-label">Total Evaluations</div>
          </div>
          <div className="dashboard__stat">
            <div className="dashboard__stat-value" style={{ color: 'var(--color-green-600)' }}>{stats.completed}</div>
            <div className="dashboard__stat-label">Completed</div>
          </div>
          <div className="dashboard__stat">
            <div className="dashboard__stat-value" style={{ color: 'var(--color-blue-600)' }}>{stats.inProgress}</div>
            <div className="dashboard__stat-label">In Progress</div>
          </div>
          <div className="dashboard__stat">
            <div className="dashboard__stat-value" style={{ color: 'var(--color-red-600)' }}>{stats.failed}</div>
            <div className="dashboard__stat-label">Failed</div>
          </div>
        </div>
      )}

      {/* Search */}
      {!loading && evaluations.length > 0 && (
        <div className="dashboard__search">
          <input
            className="input"
            type="text"
            placeholder="Search evaluations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 360 }}
          />
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && <div className="dashboard__grid">{skeletonCards}</div>}

      {/* Empty State */}
      {!loading && evaluations.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <rect x="10" y="10" width="60" height="60" rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
              <path d="M30 35h20M30 45h14" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="empty-state__title">Start your first vendor evaluation</div>
          <div className="empty-state__text">
            Upload vendor proposals and let AI analyze them for you
          </div>
          <button className="btn btn--primary" onClick={() => navigate('/upload')}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            New Evaluation
          </button>
        </div>
      )}

      {/* Evaluation Grid */}
      {!loading && filtered.length > 0 && (
        <div className="dashboard__grid">
          {filtered.map((ev) => (
            <div
              key={ev.id}
              className="eval-card"
              onClick={() => navigate(`/evaluation/${ev.id}`)}
            >
              <div className="eval-card__title">{ev.title}</div>
              <div className="eval-card__meta">
                {ev.vendor_count || 0} vendor{(ev.vendor_count || 0) !== 1 ? 's' : ''} &middot; {formatDate(ev.created_at)}
              </div>
              <div className="eval-card__status">
                <span className={`status-dot status-dot--${ev.status}`} />
                {ev.status}
              </div>
              <div className="eval-card__footer">
                <span className="text-sm text-gray-400">
                  {ev.status === 'completed' ? 'Analysis complete' : 'In progress'}
                </span>
                <button
                  className="btn btn--sm btn--secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/evaluation/${ev.id}`);
                  }}
                >
                  {ev.status === 'completed' ? 'View Results' : 'View Details'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {!loading && evaluations.length > 0 && filtered.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__title">No matching evaluations</div>
          <div className="empty-state__text">Try a different search term</div>
        </div>
      )}
    </Layout>
  );
}
