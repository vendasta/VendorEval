import React from 'react';

export default function ReportExport({ evaluation, vendors = [], recommendation }) {
  const handlePrint = () => {
    window.print();
  };

  const winnerName = recommendation?.vendor_name || recommendation?.winner || 'N/A';
  const confidence = recommendation?.confidence || recommendation?.confidence_pct || 0;
  const overallScore = recommendation?.overall_score || recommendation?.score || 0;
  const reasoning = recommendation?.reasoning || recommendation?.summary || '';
  const negotiationTips = recommendation?.negotiation_tips || recommendation?.negotiation_points || [];
  const risks = recommendation?.risks || recommendation?.risks_to_watch || [];

  const styles = {
    container: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '900px',
      margin: '0 auto',
      padding: '40px',
      backgroundColor: '#ffffff',
    },
    printBtn: {
      padding: '12px 24px',
      fontSize: '15px',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: '#2563eb',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      marginBottom: '32px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    header: {
      borderBottom: '3px solid #0f1b2d',
      paddingBottom: '20px',
      marginBottom: '32px',
    },
    title: {
      fontSize: '28px',
      fontWeight: 800,
      color: '#0f1b2d',
      marginBottom: '4px',
    },
    subtitle: {
      fontSize: '16px',
      color: '#6b7280',
    },
    date: {
      fontSize: '13px',
      color: '#9ca3af',
      marginTop: '8px',
    },
    sectionHeader: {
      fontSize: '20px',
      fontWeight: 700,
      color: '#0f1b2d',
      marginTop: '32px',
      marginBottom: '16px',
      paddingBottom: '8px',
      borderBottom: '1px solid #e5e7eb',
    },
    recBox: {
      backgroundColor: '#f0fdf4',
      border: '2px solid #16a34a',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
    },
    recTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#16a34a',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginBottom: '8px',
    },
    recVendor: {
      fontSize: '24px',
      fontWeight: 700,
      color: '#0f1b2d',
      marginBottom: '8px',
    },
    recStats: {
      display: 'flex',
      gap: '24px',
      fontSize: '14px',
      color: '#374151',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: '24px',
    },
    th: {
      padding: '10px 14px',
      fontSize: '13px',
      fontWeight: 600,
      color: '#374151',
      backgroundColor: '#f8fafc',
      borderBottom: '2px solid #e5e7eb',
      textAlign: 'left',
    },
    td: {
      padding: '10px 14px',
      fontSize: '13px',
      color: '#4b5563',
      borderBottom: '1px solid #f3f4f6',
    },
    flagItem: {
      padding: '10px 0',
      borderBottom: '1px solid #f3f4f6',
    },
    flagSeverity: (severity) => ({
      display: 'inline-block',
      padding: '2px 8px',
      fontSize: '11px',
      fontWeight: 600,
      borderRadius: '10px',
      marginRight: '8px',
      color:
        severity === 'critical' ? '#dc2626' :
        severity === 'high' ? '#ea580c' :
        severity === 'medium' ? '#ca8a04' : '#2563eb',
      backgroundColor:
        severity === 'critical' ? '#fee2e2' :
        severity === 'high' ? '#ffedd5' :
        severity === 'medium' ? '#fef9c3' : '#dbeafe',
    }),
    tipItem: {
      padding: '6px 0',
      fontSize: '14px',
      color: '#374151',
      lineHeight: '1.5',
    },
    footer: {
      marginTop: '48px',
      paddingTop: '16px',
      borderTop: '2px solid #0f1b2d',
      fontSize: '12px',
      color: '#9ca3af',
      textAlign: 'center',
    },
    paragraph: {
      fontSize: '14px',
      lineHeight: '1.7',
      color: '#4b5563',
      marginBottom: '16px',
    },
    scoreCard: {
      display: 'inline-block',
      padding: '12px 20px',
      margin: '0 12px 12px 0',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      textAlign: 'center',
    },
    scoreValue: {
      fontSize: '24px',
      fontWeight: 700,
      color: '#0f1b2d',
    },
    scoreLabel: {
      fontSize: '12px',
      color: '#6b7280',
      marginTop: '4px',
    },
  };

  return (
    <div style={styles.container}>
      <button style={styles.printBtn} onClick={handlePrint} className="no-print">
        <span>&#128438;</span> Print / Download PDF
      </button>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>VendorEval AI - Analysis Report</div>
        <div style={styles.subtitle}>{evaluation?.title || 'Vendor Evaluation'}</div>
        <div style={styles.date}>
          Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Executive Summary */}
      <div style={styles.sectionHeader}>Executive Summary</div>
      <div style={styles.paragraph}>
        This report evaluates {vendors.length} vendor proposal{vendors.length !== 1 ? 's' : ''} against the provided requirements.
        After comprehensive AI analysis across cost, SLA, timeline, team quality, and contract risk dimensions,{' '}
        <strong>{winnerName}</strong> is recommended as the top vendor with a confidence of {confidence}%.
      </div>

      {/* Recommendation Box */}
      <div style={styles.recBox}>
        <div style={styles.recTitle}>Recommended Vendor</div>
        <div style={styles.recVendor}>{winnerName}</div>
        <div style={styles.recStats}>
          <span><strong>Score:</strong> {overallScore}/100</span>
          <span><strong>Confidence:</strong> {confidence}%</span>
        </div>
      </div>

      {reasoning && (
        <div style={styles.paragraph}>{reasoning}</div>
      )}

      {/* Comparison Table */}
      <div style={styles.sectionHeader}>Vendor Comparison</div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Vendor</th>
            <th style={styles.th}>Overall Score</th>
            <th style={styles.th}>Red Flags</th>
            <th style={styles.th}>Cost</th>
            <th style={styles.th}>SLA</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((v, i) => {
            const scores = v.scores || {};
            const extracted = v.extracted_data || v.extraction || {};
            return (
              <tr key={i}>
                <td style={{ ...styles.td, fontWeight: 600 }}>
                  {v.vendor_name || v.name}
                  {(v.vendor_name || v.name) === winnerName ? ' *' : ''}
                </td>
                <td style={styles.td}>{scores.overall || scores.total || v.overall_score || 'N/A'}</td>
                <td style={styles.td}>{v.red_flags?.length || 0}</td>
                <td style={styles.td}>{extracted.pricing?.total_year1 || extracted.total_cost || 'N/A'}</td>
                <td style={styles.td}>{extracted.sla?.uptime || extracted.sla_uptime || 'N/A'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Scores */}
      <div style={styles.sectionHeader}>Vendor Scores</div>
      <div style={{ marginBottom: '24px' }}>
        {vendors.map((v, i) => (
          <div key={i} style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f1b2d', marginBottom: '8px' }}>
              {v.vendor_name || v.name}
            </div>
            <div>
              {Object.entries(v.scores || {}).map(([key, val]) => (
                <div key={key} style={styles.scoreCard}>
                  <div style={styles.scoreValue}>{val}</div>
                  <div style={styles.scoreLabel}>{key.replace(/_/g, ' ')}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Red Flags */}
      <div style={styles.sectionHeader}>Red Flags</div>
      {vendors.map((v, i) => (
        <div key={i} style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
            {v.vendor_name || v.name}
          </div>
          {(v.red_flags || []).length === 0 ? (
            <div style={{ fontSize: '13px', color: '#9ca3af', fontStyle: 'italic' }}>No red flags detected</div>
          ) : (
            (v.red_flags || []).map((flag, j) => (
              <div key={j} style={styles.flagItem}>
                <span style={styles.flagSeverity(flag.severity)}>
                  {flag.severity}
                </span>
                <span style={{ fontSize: '13px', color: '#374151' }}>
                  {flag.description || flag.text || flag.message}
                </span>
              </div>
            ))
          )}
        </div>
      ))}

      {/* Negotiation Tips */}
      {negotiationTips.length > 0 && (
        <>
          <div style={styles.sectionHeader}>Negotiation Tips</div>
          {negotiationTips.map((tip, i) => (
            <div key={i} style={styles.tipItem}>{i + 1}. {tip}</div>
          ))}
        </>
      )}

      {/* Risks */}
      {risks.length > 0 && (
        <>
          <div style={styles.sectionHeader}>Risks to Watch</div>
          {risks.map((risk, i) => (
            <div key={i} style={styles.tipItem}>&bull; {risk}</div>
          ))}
        </>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        VendorEval AI &mdash; Automated Vendor Proposal Analysis &mdash; Report generated on{' '}
        {new Date().toLocaleDateString()} &mdash; Confidential
      </div>
    </div>
  );
}
