import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const BAR_COLORS = [
  '#2563eb', '#16a34a', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];

/**
 * Metric row definitions.
 *
 * `higherIsBetter` controls color-coding logic:
 *   true  -> highest numeric value is best (green), lowest is worst (red)
 *   false -> lowest numeric value is best (green), highest is worst (red)
 *   null  -> no color-coding (text-only rows)
 */
const METRIC_ROWS = [
  {
    key: 'total_cost',
    label: 'Total Cost (Year 1)',
    higherIsBetter: false,
    extract: (v) => v.total_cost ?? null,
    format: (v, vendor) => {
      if (v == null) return 'N/A';
      const currency = vendor.currency || '';
      return `${currency} ${Number(v).toLocaleString()}`.trim();
    },
  },
  {
    key: 'timeline_weeks',
    label: 'Implementation Timeline',
    higherIsBetter: false,
    extract: (v) => v.timeline_weeks ?? null,
    format: (v) => (v != null ? `${v} weeks` : 'N/A'),
  },
  {
    key: 'payment_terms',
    label: 'Payment Terms',
    higherIsBetter: null,
    extract: (v) => v.payment_terms ?? null,
    format: (v) => v || 'N/A',
  },
  {
    key: 'sla_uptime',
    label: 'SLA Uptime',
    higherIsBetter: true,
    extract: (v) => {
      const raw = v.sla_uptime;
      if (raw == null) return null;
      const num = parseFloat(String(raw).replace('%', ''));
      return isNaN(num) ? null : num;
    },
    format: (v) => (v != null ? `${v}%` : 'N/A'),
  },
  {
    key: 'sla_response_time',
    label: 'P1 Response Time',
    higherIsBetter: false,
    extract: (v) => {
      const raw = v.sla_response_time;
      if (raw == null) return null;
      if (typeof raw === 'number') return raw;
      const match = String(raw).match(/(\d+(\.\d+)?)/);
      return match ? parseFloat(match[1]) : null;
    },
    format: (v, vendor) => {
      const raw = vendor.sla_response_time;
      if (raw == null) return 'N/A';
      return typeof raw === 'string' ? raw : `${raw} hrs`;
    },
  },
  {
    key: 'overall_score',
    label: 'Overall Score',
    higherIsBetter: true,
    extract: (v) => v.overall_score ?? null,
    format: (v) => (v != null ? `${v}/100` : 'N/A'),
  },
  {
    key: 'cost_score',
    label: 'Cost Score',
    higherIsBetter: true,
    extract: (v) => v.cost_score ?? null,
    format: (v) => (v != null ? `${v}/100` : 'N/A'),
  },
  {
    key: 'timeline_score',
    label: 'Timeline Score',
    higherIsBetter: true,
    extract: (v) => v.timeline_score ?? null,
    format: (v) => (v != null ? `${v}/100` : 'N/A'),
  },
  {
    key: 'quality_score',
    label: 'Quality Score',
    higherIsBetter: true,
    extract: (v) => v.quality_score ?? null,
    format: (v) => (v != null ? `${v}/100` : 'N/A'),
  },
  {
    key: 'risk_score',
    label: 'Risk Score',
    higherIsBetter: true,
    extract: (v) => v.risk_score ?? null,
    format: (v) => (v != null ? `${v}/100` : 'N/A'),
  },
  {
    key: 'sla_score',
    label: 'SLA Score',
    higherIsBetter: true,
    extract: (v) => v.sla_score ?? null,
    format: (v) => (v != null ? `${v}/100` : 'N/A'),
  },
  {
    key: 'red_flags',
    label: 'Red Flags',
    higherIsBetter: false,
    extract: (v) => {
      if (Array.isArray(v.red_flags)) return v.red_flags.length;
      return null;
    },
    format: (v) => (v != null ? String(v) : '0'),
  },
];

/**
 * Determines the CSS class for a comparison cell based on whether its value is
 * the best or worst among all vendors for that row.
 */
function getCellClassName(numericValue, allNumericValues, higherIsBetter) {
  if (higherIsBetter == null || numericValue == null) return '';

  const valid = allNumericValues.filter((v) => v != null);
  if (valid.length < 2) return '';

  const best = higherIsBetter ? Math.max(...valid) : Math.min(...valid);
  const worst = higherIsBetter ? Math.min(...valid) : Math.max(...valid);

  if (best === worst) return '';
  if (numericValue === best) return 'comparison-cell--best';
  if (numericValue === worst) return 'comparison-cell--worst';
  return '';
}

export default function ComparisonMatrix({ vendors = [], recommendation }) {
  const winnerId = recommendation?.recommended_vendor?.id;
  const winnerName = recommendation?.recommended_vendor?.name;

  // ---------- chart data ----------
  const chartData = vendors.map((v, i) => ({
    name: v.vendor_name || v.name || `Vendor ${i + 1}`,
    score: v.overall_score ?? 0,
  }));

  if (vendors.length === 0) {
    return (
      <div className="card card--elevated">
        <p className="badge badge--neutral">No vendors to compare</p>
      </div>
    );
  }

  return (
    <div>
      {/* ---------- Comparison table ---------- */}
      <div className="comparison-table-wrapper">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Criteria</th>
              {vendors.map((v, i) => {
                const name = v.vendor_name || v.name || `Vendor ${i + 1}`;
                const isWinner = (winnerId && v.id === winnerId) || name === winnerName;
                return (
                  <th key={v.id || i}>
                    {name}
                    {isWinner && (
                      <span className="badge badge--success" style={{ marginLeft: 8 }}>
                        Winner
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {METRIC_ROWS.map((row) => {
              const numericValues = vendors.map((v) => row.extract(v));
              return (
                <tr key={row.key}>
                  <td>{row.label}</td>
                  {vendors.map((v, i) => {
                    const numeric = numericValues[i];
                    const cellClass = getCellClassName(
                      numeric,
                      numericValues,
                      row.higherIsBetter,
                    );
                    return (
                      <td key={v.id || i} className={cellClass || undefined}>
                        {row.format(numeric, v)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ---------- Bar chart ---------- */}
      <div className="radar-card">
        <div className="radar-card__title">Overall Scores Comparison</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#64748b' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 13, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
              formatter={(value) => [`${value}/100`, 'Score']}
            />
            <Bar dataKey="score" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
