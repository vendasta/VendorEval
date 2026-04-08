import React from 'react';

export default function ReportExport({ evaluation, vendors = [], recommendation }) {
  const handlePrint = () => {
    window.print();
  };

  const winnerName = recommendation?.recommended_vendor?.name || 'N/A';
  const winnerScore = recommendation?.recommended_vendor?.overall_score || 0;
  const confidence = recommendation?.confidence_score || 0;
  const reasoning = recommendation?.reasoning || '';
  const negotiationTips = recommendation?.negotiation_tips || [];
  const risks = recommendation?.risks || [];

  const formatCurrency = (cost, currency) => {
    if (cost == null) return 'N/A';
    const symbol = currency === 'EUR' ? '\u20AC' : currency === 'GBP' ? '\u00A3' : '$';
    return `${symbol}${Number(cost).toLocaleString()}`;
  };

  const severityBadgeClass = (severity) => {
    switch (severity) {
      case 'critical': return 'badge badge--danger';
      case 'high':     return 'badge badge--warning';
      case 'medium':   return 'badge badge--info';
      default:         return 'badge badge--neutral';
    }
  };

  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="report">
      <button className="btn btn--primary no-print" onClick={handlePrint}>
        Print / Download PDF
      </button>

      {/* Header */}
      <header className="report__header">
        <h1 className="report__title">VendorEval AI &mdash; Evaluation Report</h1>
        <p className="report__subtitle">{evaluation?.title || 'Vendor Evaluation'}</p>
      </header>

      {/* Executive Summary */}
      <section className="report__section">
        <h2 className="report__section-title">Executive Summary</h2>
        <p>
          This report evaluates {vendors.length} vendor proposal{vendors.length !== 1 ? 's' : ''} against
          the provided requirements. After comprehensive AI analysis across cost, SLA, timeline,
          team quality, and contract risk dimensions, <strong>{winnerName}</strong> is recommended
          as the top vendor with a confidence of {confidence}%.
        </p>
        {reasoning && <p>{reasoning}</p>}
      </section>

      {/* Recommendation Box */}
      <section className="report__section">
        <div className="report__rec-box">
          <h3>Recommended Vendor</h3>
          <p><strong>{winnerName}</strong></p>
          <p>
            <span>Score: {winnerScore}/100</span>
            {' \u2022 '}
            <span>Confidence: {confidence}%</span>
          </p>
        </div>
      </section>

      {/* Vendor Comparison Table */}
      <section className="report__section">
        <h2 className="report__section-title">Vendor Comparison</h2>
        <table className="report__table">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Cost</th>
              <th>Timeline</th>
              <th>SLA Uptime</th>
              <th>Overall Score</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v, i) => {
              const vendorName = v.name || v.vendor_name;
              return (
                <tr key={i}>
                  <td>
                    <strong>{vendorName}</strong>
                    {vendorName === winnerName ? ' \u2605' : ''}
                  </td>
                  <td>{formatCurrency(v.total_cost, v.currency)}</td>
                  <td>{v.timeline_weeks != null ? `${v.timeline_weeks} weeks` : 'N/A'}</td>
                  <td>{v.sla_uptime != null ? `${v.sla_uptime}%` : 'N/A'}</td>
                  <td>{v.overall_score != null ? `${v.overall_score}/100` : 'N/A'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Vendor Scores Breakdown */}
      <section className="report__section">
        <h2 className="report__section-title">Vendor Scores Breakdown</h2>
        {vendors.map((v, i) => {
          const vendorName = v.name || v.vendor_name;
          const scores = [
            { label: 'Cost', value: v.cost_score },
            { label: 'Timeline', value: v.timeline_score },
            { label: 'Quality', value: v.quality_score },
            { label: 'Risk', value: v.risk_score },
            { label: 'SLA', value: v.sla_score },
            { label: 'Overall', value: v.overall_score },
          ];
          return (
            <div key={i}>
              <h3>{vendorName}</h3>
              <table className="report__table">
                <thead>
                  <tr>
                    {scores.map((s) => (
                      <th key={s.label}>{s.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {scores.map((s) => (
                      <td key={s.label}>{s.value != null ? s.value : 'N/A'}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
              {v.strengths && v.strengths.length > 0 && (
                <p><strong>Strengths:</strong> {v.strengths.join(', ')}</p>
              )}
              {v.weaknesses && v.weaknesses.length > 0 && (
                <p><strong>Weaknesses:</strong> {v.weaknesses.join(', ')}</p>
              )}
            </div>
          );
        })}
      </section>

      {/* Red Flags */}
      <section className="report__section">
        <h2 className="report__section-title">Red Flags</h2>
        {vendors.map((v, i) => {
          const vendorName = v.name || v.vendor_name;
          const flags = v.red_flags || [];
          return (
            <div key={i}>
              <h3>{vendorName}</h3>
              {flags.length === 0 ? (
                <p>No red flags detected.</p>
              ) : (
                <ul>
                  {flags.map((flag, j) => (
                    <li key={j}>
                      <span className={severityBadgeClass(flag.severity)}>
                        {flag.severity}
                      </span>{' '}
                      {flag.description}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      {/* Negotiation Tips */}
      {negotiationTips.length > 0 && (
        <section className="report__section">
          <h2 className="report__section-title">Negotiation Tips</h2>
          <ol>
            {negotiationTips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ol>
        </section>
      )}

      {/* Risks to Watch */}
      {risks.length > 0 && (
        <section className="report__section">
          <h2 className="report__section-title">Risks to Watch</h2>
          <ul>
            {risks.map((risk, i) => (
              <li key={i}>{risk}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Footer */}
      <footer className="report__footer">
        Generated by VendorEval AI &mdash; {reportDate}
      </footer>
    </div>
  );
}
