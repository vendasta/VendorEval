import React, { useState, useMemo } from 'react';

const SEVERITIES = ['all', 'critical', 'high', 'medium', 'low'];

const SEVERITY_LABELS = {
  all: 'All',
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const SEVERITY_BADGE_CLASS = {
  critical: 'badge badge--danger',
  high: 'badge badge--warning',
  medium: 'badge badge--info',
  low: 'badge badge--info',
};

const SEVERITY_CARD_CLASS = {
  critical: 'flag-card flag-card--critical',
  high: 'flag-card flag-card--high',
  medium: 'flag-card flag-card--medium',
  low: 'flag-card flag-card--low',
};

export default function RedFlagPanel({ vendors = [] }) {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [expanded, setExpanded] = useState(new Set());

  const allFlags = useMemo(() => {
    const flags = [];
    vendors.forEach((v) => {
      const vendorName = v.vendor_name || v.name || 'Unknown';
      const vendorFlags = v.red_flags || [];
      vendorFlags.forEach((flag) => {
        flags.push({ ...flag, vendor_name: vendorName });
      });
    });
    return flags;
  }, [vendors]);

  const filteredFlags = useMemo(() => {
    return allFlags.filter((flag) => {
      if (severityFilter !== 'all' && flag.severity !== severityFilter) return false;
      if (vendorFilter !== 'all' && flag.vendor_name !== vendorFilter) return false;
      return true;
    });
  }, [allFlags, severityFilter, vendorFilter]);

  const criticalCount = allFlags.filter((f) => f.severity === 'critical').length;
  const highCount = allFlags.filter((f) => f.severity === 'high').length;
  const vendorNames = [...new Set(vendors.map((v) => v.vendor_name || v.name || 'Unknown'))];

  const toggleExpanded = (idx) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  return (
    <div>
      {/* Summary Stats */}
      <div className="redflags__summary">
        <div className="redflags__stat redflags__stat--red">
          <div className="redflags__stat-value">{allFlags.length}</div>
          <div className="redflags__stat-label">Total Red Flags</div>
        </div>
        <div className="redflags__stat redflags__stat--orange">
          <div className="redflags__stat-value">{criticalCount}</div>
          <div className="redflags__stat-label">Critical Flags</div>
        </div>
        <div className="redflags__stat redflags__stat--amber">
          <div className="redflags__stat-value">{highCount}</div>
          <div className="redflags__stat-label">High Severity</div>
        </div>
        <div className="redflags__stat redflags__stat--gray">
          <div className="redflags__stat-value">{vendorNames.length}</div>
          <div className="redflags__stat-label">Vendors Flagged</div>
        </div>
      </div>

      {/* Filters */}
      <div className="redflags__filters">
        <div className="redflags__filter-group">
          {SEVERITIES.map((sev) => (
            <button
              key={sev}
              className={
                severityFilter === sev
                  ? 'filter-chip filter-chip--active'
                  : 'filter-chip'
              }
              onClick={() => setSeverityFilter(sev)}
            >
              {SEVERITY_LABELS[sev]}
            </button>
          ))}
        </div>
        <select
          className="select"
          value={vendorFilter}
          onChange={(e) => setVendorFilter(e.target.value)}
        >
          <option value="all">All Vendors</option>
          {vendorNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Flag Cards */}
      {filteredFlags.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__text">
            {allFlags.length === 0
              ? 'No red flags detected in vendor proposals.'
              : 'No flags match your current filter.'}
          </p>
        </div>
      ) : (
        filteredFlags.map((flag, idx) => {
          const isOpen = expanded.has(idx);
          const cardClass =
            SEVERITY_CARD_CLASS[flag.severity] || 'flag-card flag-card--low';
          const badgeClass =
            SEVERITY_BADGE_CLASS[flag.severity] || 'badge badge--info';
          const clauseText = flag.clause_text;

          return (
            <div key={idx} className={cardClass}>
              <div
                className="flag-card__header"
                onClick={() => toggleExpanded(idx)}
              >
                <span className={badgeClass}>
                  {SEVERITY_LABELS[flag.severity] || 'Low'}
                </span>
                {flag.category && (
                  <span className="badge badge--neutral">{flag.category}</span>
                )}
                <span className="badge badge--purple">{flag.vendor_name}</span>
              </div>
              {isOpen && (
                <div className="flag-card__body">
                  <div className="flag-card__description">
                    {flag.description}
                  </div>
                  {clauseText && (
                    <div className="flag-card__clause">{clauseText}</div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
