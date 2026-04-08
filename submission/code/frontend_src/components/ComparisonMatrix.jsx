import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const COMPARE_ROWS = [
  { key: 'total_cost', label: 'Total Cost (Year 1)', format: (v) => v || 'N/A' },
  { key: 'timeline', label: 'Timeline', format: (v) => v || 'N/A' },
  { key: 'payment_terms', label: 'Payment Terms', format: (v) => v || 'N/A' },
  { key: 'sla_uptime', label: 'SLA Uptime', format: (v) => v || 'N/A' },
  { key: 'p1_response', label: 'P1 Response Time', format: (v) => v || 'N/A' },
  { key: 'support_type', label: 'Support Type', format: (v) => v || 'N/A' },
  { key: 'overall_score', label: 'Overall Score', format: (v) => v != null ? `${v}/100` : 'N/A' },
  { key: 'red_flags_count', label: 'Red Flags', format: (v) => v != null ? v : 'N/A' },
];

function getCellStyle(key, value, allValues, recommendation) {
  const base = {
    padding: '12px 16px',
    fontSize: '14px',
    borderBottom: '1px solid #f3f4f6',
    textAlign: 'center',
  };

  if (key === 'overall_score' && value != null) {
    const max = Math.max(...allValues.filter((v) => v != null));
    if (value === max) return { ...base, backgroundColor: '#f0fdf4', color: '#16a34a', fontWeight: 600 };
  }
  if (key === 'red_flags_count' && value != null) {
    const min = Math.min(...allValues.filter((v) => v != null));
    const max = Math.max(...allValues.filter((v) => v != null));
    if (value === min && min !== max) return { ...base, backgroundColor: '#f0fdf4', color: '#16a34a', fontWeight: 600 };
    if (value === max && min !== max) return { ...base, backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 600 };
  }
  return base;
}

export default function ComparisonMatrix({ vendors = [], recommendation }) {
  const winnerId = recommendation?.vendor_id || recommendation?.winner_id;
  const winnerName = recommendation?.vendor_name || recommendation?.winner;

  // Build comparison data from vendor extracted_data or scores
  const getVendorField = (vendor, key) => {
    const extracted = vendor.extracted_data || vendor.extraction || {};
    const scores = vendor.scores || {};
    const pricing = extracted.pricing || {};

    switch (key) {
      case 'total_cost':
        return pricing.total_year1 || pricing.annual_cost || extracted.total_cost || 'N/A';
      case 'timeline':
        return extracted.timeline || extracted.delivery_timeline || 'N/A';
      case 'payment_terms':
        return pricing.payment_terms || extracted.payment_terms || 'N/A';
      case 'sla_uptime':
        return extracted.sla?.uptime || extracted.sla_uptime || 'N/A';
      case 'p1_response':
        return extracted.sla?.p1_response || extracted.p1_response || 'N/A';
      case 'support_type':
        return extracted.support?.type || extracted.support_type || extracted.support_hours || 'N/A';
      case 'overall_score':
        return scores.overall || scores.total || vendor.overall_score || null;
      case 'red_flags_count':
        return vendor.red_flags?.length || vendor.red_flags_count || 0;
      default:
        return 'N/A';
    }
  };

  // Chart data
  const chartData = vendors.map((v, i) => ({
    name: v.vendor_name || v.name || `Vendor ${i + 1}`,
    score: v.scores?.overall || v.scores?.total || v.overall_score || 0,
  }));

  const styles = {
    container: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    tableWrapper: {
      overflowX: 'auto',
      marginBottom: '32px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    headerCell: {
      padding: '14px 16px',
      fontSize: '13px',
      fontWeight: 700,
      color: '#0f1b2d',
      backgroundColor: '#f8fafc',
      borderBottom: '2px solid #e5e7eb',
      textAlign: 'center',
      position: 'relative',
    },
    rowLabel: {
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: 600,
      color: '#374151',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #f3f4f6',
      textAlign: 'left',
      whiteSpace: 'nowrap',
    },
    winnerBadge: {
      display: 'inline-block',
      padding: '2px 10px',
      fontSize: '11px',
      fontWeight: 700,
      color: '#16a34a',
      backgroundColor: '#dcfce7',
      borderRadius: '12px',
      marginLeft: '8px',
    },
    chartTitle: {
      fontSize: '18px',
      fontWeight: 600,
      color: '#0f1b2d',
      marginBottom: '16px',
    },
    chartCard: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.headerCell, textAlign: 'left', minWidth: '160px' }}>Criteria</th>
              {vendors.map((v, i) => {
                const name = v.vendor_name || v.name || `Vendor ${i + 1}`;
                const isWinner = v.id === winnerId || name === winnerName;
                return (
                  <th key={i} style={styles.headerCell}>
                    {name}
                    {isWinner && <span style={styles.winnerBadge}>Winner</span>}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row) => {
              const allValues = vendors.map((v) => getVendorField(v, row.key));
              return (
                <tr key={row.key}>
                  <td style={styles.rowLabel}>{row.label}</td>
                  {vendors.map((v, i) => {
                    const val = getVendorField(v, row.key);
                    return (
                      <td key={i} style={getCellStyle(row.key, val, allValues, recommendation)}>
                        {row.format(val)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={styles.chartCard}>
        <div style={styles.chartTitle}>Overall Scores Comparison</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#6b7280' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 13, fill: '#6b7280' }} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
              formatter={(value) => [`${value}/100`, 'Score']}
            />
            <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
