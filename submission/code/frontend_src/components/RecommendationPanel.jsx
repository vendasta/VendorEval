import React from 'react';

export default function RecommendationPanel({ recommendation }) {
  if (!recommendation) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '15px' }}>
        No recommendation available yet.
      </div>
    );
  }

  const winnerName = recommendation.vendor_name || recommendation.winner || 'N/A';
  const confidence = recommendation.confidence || recommendation.confidence_pct || 0;
  const overallScore = recommendation.overall_score || recommendation.score || 0;
  const reasoning = recommendation.reasoning || recommendation.summary || '';
  const negotiationTips = recommendation.negotiation_tips || recommendation.negotiation_points || [];
  const risks = recommendation.risks || recommendation.risks_to_watch || [];
  const runnerUp = recommendation.runner_up || recommendation.second_place || '';

  const styles = {
    container: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    winnerCard: {
      background: 'linear-gradient(135deg, #0f1b2d 0%, #1e3a5f 100%)',
      borderRadius: '16px',
      padding: '32px',
      color: '#ffffff',
      marginBottom: '24px',
      position: 'relative',
      overflow: 'hidden',
    },
    winnerGlow: {
      position: 'absolute',
      top: '-40px',
      right: '-40px',
      width: '160px',
      height: '160px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(74, 222, 128, 0.2) 0%, transparent 70%)',
    },
    winnerLabel: {
      fontSize: '12px',
      fontWeight: 700,
      color: '#4ade80',
      textTransform: 'uppercase',
      letterSpacing: '1.5px',
      marginBottom: '8px',
    },
    winnerName: {
      fontSize: '32px',
      fontWeight: 800,
      marginBottom: '16px',
    },
    winnerStats: {
      display: 'flex',
      gap: '32px',
      marginTop: '8px',
    },
    stat: {
      display: 'flex',
      flexDirection: 'column',
    },
    statValue: {
      fontSize: '28px',
      fontWeight: 700,
      color: '#4ade80',
    },
    statLabel: {
      fontSize: '12px',
      color: '#94a3b8',
      marginTop: '4px',
    },
    section: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: 700,
      color: '#0f1b2d',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    reasoning: {
      fontSize: '14px',
      lineHeight: '1.7',
      color: '#4b5563',
    },
    tipsList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      counterReset: 'tip',
    },
    tipItem: {
      display: 'flex',
      gap: '12px',
      padding: '10px 0',
      borderBottom: '1px solid #f3f4f6',
      fontSize: '14px',
      color: '#374151',
      lineHeight: '1.5',
    },
    tipNumber: {
      minWidth: '28px',
      height: '28px',
      borderRadius: '50%',
      backgroundColor: '#eff6ff',
      color: '#2563eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '13px',
      fontWeight: 600,
      flexShrink: 0,
    },
    riskItem: {
      display: 'flex',
      gap: '10px',
      padding: '8px 0',
      fontSize: '14px',
      color: '#374151',
      lineHeight: '1.5',
    },
    riskDot: {
      color: '#f59e0b',
      fontSize: '18px',
      flexShrink: 0,
      marginTop: '1px',
    },
    runnerUp: {
      backgroundColor: '#f8fafc',
      borderRadius: '10px',
      padding: '16px 20px',
      border: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    runnerUpBadge: {
      padding: '4px 12px',
      fontSize: '12px',
      fontWeight: 600,
      color: '#6b7280',
      backgroundColor: '#f3f4f6',
      borderRadius: '12px',
    },
    runnerUpName: {
      fontSize: '15px',
      fontWeight: 600,
      color: '#374151',
    },
  };

  return (
    <div style={styles.container}>
      {/* Winner Card */}
      <div style={styles.winnerCard}>
        <div style={styles.winnerGlow} />
        <div style={styles.winnerLabel}>Recommended Vendor</div>
        <div style={styles.winnerName}>{winnerName}</div>
        <div style={styles.winnerStats}>
          <div style={styles.stat}>
            <div style={styles.statValue}>{confidence}%</div>
            <div style={styles.statLabel}>Confidence</div>
          </div>
          <div style={styles.stat}>
            <div style={styles.statValue}>{overallScore}</div>
            <div style={styles.statLabel}>Overall Score</div>
          </div>
        </div>
      </div>

      {/* Reasoning */}
      {reasoning && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            <span style={{ color: '#2563eb' }}>&#9670;</span>
            Why We Recommend This Vendor
          </div>
          <div style={styles.reasoning}>{reasoning}</div>
        </div>
      )}

      {/* Negotiation Tips */}
      {negotiationTips.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            <span style={{ color: '#16a34a' }}>&#9670;</span>
            Negotiation Tips
          </div>
          <ol style={styles.tipsList}>
            {negotiationTips.map((tip, i) => (
              <li key={i} style={styles.tipItem}>
                <div style={styles.tipNumber}>{i + 1}</div>
                <div>{tip}</div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Risks to Watch */}
      {risks.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            <span style={{ color: '#f59e0b' }}>&#9670;</span>
            Risks to Watch
          </div>
          {risks.map((risk, i) => (
            <div key={i} style={styles.riskItem}>
              <span style={styles.riskDot}>&#9888;</span>
              <div>{risk}</div>
            </div>
          ))}
        </div>
      )}

      {/* Runner-up */}
      {runnerUp && (
        <div style={styles.runnerUp}>
          <span style={styles.runnerUpBadge}>Runner-up</span>
          <span style={styles.runnerUpName}>{runnerUp}</span>
        </div>
      )}
    </div>
  );
}
