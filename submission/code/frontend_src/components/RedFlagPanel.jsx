import React, { useState, useMemo } from 'react';

const severityConfig = {
  critical: { bg: '#fef2f2', border: '#fecaca', badge: '#dc2626', badgeBg: '#fee2e2', label: 'Critical' },
  high: { bg: '#fff7ed', border: '#fed7aa', badge: '#ea580c', badgeBg: '#ffedd5', label: 'High' },
  medium: { bg: '#fefce8', border: '#fde68a', badge: '#ca8a04', badgeBg: '#fef9c3', label: 'Medium' },
  low: { bg: '#eff6ff', border: '#bfdbfe', badge: '#2563eb', badgeBg: '#dbeafe', label: 'Low' },
};

export default function RedFlagPanel({ vendors = [] }) {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');

  // Collect all red flags from vendors
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

  const styles = {
    container: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    summary: {
      display: 'flex',
      gap: '16px',
      marginBottom: '24px',
      flexWrap: 'wrap',
    },
    summaryCard: (color) => ({
      padding: '16px 24px',
      backgroundColor: '#ffffff',
      borderRadius: '10px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      borderLeft: `4px solid ${color}`,
      minWidth: '150px',
    }),
    summaryNumber: {
      fontSize: '28px',
      fontWeight: 700,
      color: '#0f1b2d',
    },
    summaryLabel: {
      fontSize: '13px',
      color: '#6b7280',
      marginTop: '4px',
    },
    filters: {
      display: 'flex',
      gap: '12px',
      marginBottom: '24px',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    filterGroup: {
      display: 'flex',
      gap: '6px',
    },
    filterBtn: (active) => ({
      padding: '6px 14px',
      fontSize: '13px',
      fontWeight: active ? 600 : 400,
      color: active ? '#2563eb' : '#6b7280',
      backgroundColor: active ? '#eff6ff' : '#ffffff',
      border: active ? '1px solid #bfdbfe' : '1px solid #e5e7eb',
      borderRadius: '20px',
      cursor: 'pointer',
      transition: 'all 0.15s',
    }),
    select: {
      padding: '6px 12px',
      fontSize: '13px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      backgroundColor: '#ffffff',
      color: '#374151',
      outline: 'none',
    },
    flagCard: (severity) => {
      const config = severityConfig[severity] || severityConfig.low;
      return {
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        borderLeft: `4px solid ${config.badge}`,
        border: `1px solid ${config.border}`,
      };
    },
    flagHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '10px',
      flexWrap: 'wrap',
    },
    severityBadge: (severity) => {
      const config = severityConfig[severity] || severityConfig.low;
      return {
        display: 'inline-block',
        padding: '3px 10px',
        fontSize: '11px',
        fontWeight: 700,
        color: config.badge,
        backgroundColor: config.badgeBg,
        borderRadius: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      };
    },
    categoryTag: {
      display: 'inline-block',
      padding: '3px 10px',
      fontSize: '11px',
      fontWeight: 500,
      color: '#6b7280',
      backgroundColor: '#f3f4f6',
      borderRadius: '12px',
    },
    vendorTag: {
      display: 'inline-block',
      padding: '3px 10px',
      fontSize: '11px',
      fontWeight: 500,
      color: '#7c3aed',
      backgroundColor: '#f5f3ff',
      borderRadius: '12px',
    },
    flagDescription: {
      fontSize: '14px',
      color: '#374151',
      lineHeight: '1.6',
      marginBottom: '10px',
    },
    clauseBlock: {
      backgroundColor: '#f8fafc',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      padding: '12px 16px',
      fontSize: '13px',
      color: '#64748b',
      fontFamily: '"SF Mono", "Fira Code", monospace',
      lineHeight: '1.5',
      whiteSpace: 'pre-wrap',
    },
    emptyState: {
      textAlign: 'center',
      padding: '48px',
      color: '#9ca3af',
      fontSize: '15px',
    },
  };

  return (
    <div style={styles.container}>
      {/* Summary Stats */}
      <div style={styles.summary}>
        <div style={styles.summaryCard('#dc2626')}>
          <div style={styles.summaryNumber}>{allFlags.length}</div>
          <div style={styles.summaryLabel}>Total Red Flags</div>
        </div>
        <div style={styles.summaryCard('#ea580c')}>
          <div style={styles.summaryNumber}>{criticalCount}</div>
          <div style={styles.summaryLabel}>Critical Flags</div>
        </div>
        <div style={styles.summaryCard('#f59e0b')}>
          <div style={styles.summaryNumber}>{highCount}</div>
          <div style={styles.summaryLabel}>High Severity</div>
        </div>
        <div style={styles.summaryCard('#6b7280')}>
          <div style={styles.summaryNumber}>{vendorNames.length}</div>
          <div style={styles.summaryLabel}>Vendors Flagged</div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
            <button
              key={sev}
              style={styles.filterBtn(severityFilter === sev)}
              onClick={() => setSeverityFilter(sev)}
            >
              {sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)}
            </button>
          ))}
        </div>
        <select
          style={styles.select}
          value={vendorFilter}
          onChange={(e) => setVendorFilter(e.target.value)}
        >
          <option value="all">All Vendors</option>
          {vendorNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Flag Cards */}
      {filteredFlags.length === 0 ? (
        <div style={styles.emptyState}>
          {allFlags.length === 0
            ? 'No red flags detected in vendor proposals.'
            : 'No flags match your current filter.'}
        </div>
      ) : (
        filteredFlags.map((flag, idx) => (
          <div key={idx} style={styles.flagCard(flag.severity)}>
            <div style={styles.flagHeader}>
              <span style={styles.severityBadge(flag.severity)}>
                {(severityConfig[flag.severity] || severityConfig.low).label}
              </span>
              {flag.category && <span style={styles.categoryTag}>{flag.category}</span>}
              <span style={styles.vendorTag}>{flag.vendor_name}</span>
            </div>
            <div style={styles.flagDescription}>{flag.description || flag.text || flag.message}</div>
            {(flag.clause || flag.evidence || flag.source_text) && (
              <div style={styles.clauseBlock}>
                {flag.clause || flag.evidence || flag.source_text}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
