import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvaluation, getComparison, getRecommendation, getReport, getVendors } from '../api/client';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, Tooltip,
} from 'recharts';
import ComparisonMatrix from './ComparisonMatrix';
import RedFlagPanel from './RedFlagPanel';
import RecommendationPanel from './RecommendationPanel';
import ChatInterface from './ChatInterface';
import ReportExport from './ReportExport';

const RADAR_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const DIMENSION_LABELS = {
  cost: 'Cost',
  timeline: 'Timeline',
  quality: 'Quality',
  risk: 'Risk',
  sla: 'SLA',
  cost_score: 'Cost',
  timeline_score: 'Timeline',
  quality_score: 'Quality',
  risk_score: 'Risk',
  sla_score: 'SLA',
  team: 'Team',
  contract_risk: 'Contract Risk',
};

export default function AnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [evalData, compData, recData] = await Promise.allSettled([
        getEvaluation(id),
        getComparison(id),
        getRecommendation(id),
      ]);

      if (evalData.status === 'fulfilled') {
        const ev = evalData.value;
        setEvaluation(ev.evaluation || ev);
        setVendors(ev.vendors || ev.evaluation?.vendors || []);
      }
      if (compData.status === 'fulfilled') {
        setComparison(compData.value);
        if (compData.value?.vendors) {
          setVendors((prev) => prev.length ? prev : compData.value.vendors);
        }
      }
      if (recData.status === 'fulfilled') {
        setRecommendation(recData.value.recommendation || recData.value);
      }

      // Also try loading vendors separately if not yet loaded
      try {
        const vendorData = await getVendors(id);
        if (vendorData?.vendors?.length) {
          setVendors(vendorData.vendors);
        }
      } catch (_) {
        // vendor endpoint may not exist separately
      }
    } catch (err) {
      setError('Failed to load evaluation data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    setShowReport(true);
  };

  const winnerName = recommendation?.vendor_name || recommendation?.winner || '';
  const winnerScore = recommendation?.overall_score || recommendation?.score || 0;
  const winnerConfidence = recommendation?.confidence || recommendation?.confidence_pct || 0;
  const winnerReason = recommendation?.reasoning || recommendation?.summary || '';

  // Build radar chart data
  const radarData = (() => {
    const dimensions = ['cost', 'timeline', 'quality', 'risk', 'sla'];
    // Try to find available score keys from first vendor
    const firstVendor = vendors[0];
    if (!firstVendor?.scores) return [];

    const scoreKeys = Object.keys(firstVendor.scores).filter((k) => k !== 'overall' && k !== 'total');
    const keys = scoreKeys.length > 0 ? scoreKeys : dimensions;

    return keys.map((dim) => {
      const entry = { dimension: DIMENSION_LABELS[dim] || dim.replace(/_/g, ' ') };
      vendors.forEach((v) => {
        const name = v.vendor_name || v.name || 'Vendor';
        entry[name] = v.scores?.[dim] || 0;
      });
      return entry;
    });
  })();

  const vendorNames = vendors.map((v) => v.vendor_name || v.name || 'Vendor');

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'comparison', label: 'Comparison' },
    { key: 'redflags', label: 'Red Flags' },
    { key: 'chat', label: 'AI Chat' },
  ];

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
      cursor: 'pointer',
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    backBtn: {
      padding: '8px 16px',
      fontSize: '13px',
      fontWeight: 500,
      color: '#6b7280',
      backgroundColor: '#f3f4f6',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      cursor: 'pointer',
    },
    exportBtn: {
      padding: '8px 18px',
      fontSize: '13px',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: '#2563eb',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px 32px',
    },
    evalTitle: {
      fontSize: '24px',
      fontWeight: 700,
      color: '#0f1b2d',
      marginBottom: '4px',
    },
    evalSub: {
      fontSize: '14px',
      color: '#9ca3af',
      marginBottom: '24px',
    },
    tabRow: {
      display: 'flex',
      gap: '4px',
      marginBottom: '24px',
      borderBottom: '2px solid #e5e7eb',
    },
    tab: (active) => ({
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: active ? 600 : 400,
      color: active ? '#2563eb' : '#6b7280',
      backgroundColor: 'transparent',
      border: 'none',
      borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
      marginBottom: '-2px',
      cursor: 'pointer',
      transition: 'all 0.15s',
    }),
    winnerBanner: {
      background: 'linear-gradient(135deg, #0f1b2d 0%, #1e3a5f 100%)',
      borderRadius: '16px',
      padding: '28px 32px',
      color: '#ffffff',
      marginBottom: '24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    winnerGlow: {
      position: 'absolute',
      top: '-30px',
      right: '-30px',
      width: '140px',
      height: '140px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(74, 222, 128, 0.15) 0%, transparent 70%)',
    },
    winnerLeft: {
      zIndex: 1,
    },
    winnerLabel: {
      fontSize: '12px',
      fontWeight: 700,
      color: '#4ade80',
      textTransform: 'uppercase',
      letterSpacing: '1.5px',
      marginBottom: '6px',
    },
    winnerName: {
      fontSize: '28px',
      fontWeight: 800,
      marginBottom: '4px',
    },
    winnerReason: {
      fontSize: '14px',
      color: '#94a3b8',
      maxWidth: '500px',
    },
    winnerRight: {
      display: 'flex',
      gap: '24px',
      zIndex: 1,
    },
    winnerStat: {
      textAlign: 'center',
    },
    winnerStatValue: {
      fontSize: '32px',
      fontWeight: 700,
      color: '#4ade80',
    },
    winnerStatLabel: {
      fontSize: '11px',
      color: '#94a3b8',
      marginTop: '2px',
    },
    scoreCardsRow: {
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(vendors.length, 4)}, 1fr)`,
      gap: '16px',
      marginBottom: '24px',
    },
    scoreCard: (isWinner) => ({
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: isWinner ? '2px solid #16a34a' : '1px solid #e5e7eb',
      textAlign: 'center',
      position: 'relative',
    }),
    scoreVendorName: {
      fontSize: '15px',
      fontWeight: 600,
      color: '#0f1b2d',
      marginBottom: '8px',
    },
    scoreBigNumber: (isWinner) => ({
      fontSize: '42px',
      fontWeight: 800,
      color: isWinner ? '#16a34a' : '#0f1b2d',
    }),
    scoreOutOf: {
      fontSize: '14px',
      color: '#9ca3af',
    },
    winnerTag: {
      position: 'absolute',
      top: '-1px',
      right: '12px',
      padding: '3px 10px',
      fontSize: '11px',
      fontWeight: 700,
      color: '#16a34a',
      backgroundColor: '#dcfce7',
      borderRadius: '0 0 8px 8px',
    },
    radarCard: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      marginBottom: '24px',
    },
    radarTitle: {
      fontSize: '18px',
      fontWeight: 600,
      color: '#0f1b2d',
      marginBottom: '16px',
    },
    loadingContainer: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '400px',
      color: '#9ca3af',
      fontSize: '16px',
    },
    errorBox: {
      padding: '16px 20px',
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '14px',
      border: '1px solid #fecaca',
    },
  };

  if (showReport) {
    return (
      <div>
        <div style={{ padding: '16px 32px', backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
          <button
            style={styles.backBtn}
            onClick={() => setShowReport(false)}
            className="no-print"
          >
            &larr; Back to Analysis
          </button>
        </div>
        <ReportExport evaluation={evaluation} vendors={vendors} recommendation={recommendation} />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <div style={styles.logo} onClick={() => navigate('/')}>VendorEval AI</div>
        </div>
        <div style={styles.loadingContainer}>Loading analysis results...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.logo} onClick={() => navigate('/')}>VendorEval AI</div>
        <div style={styles.headerRight}>
          <button style={styles.backBtn} onClick={() => navigate('/')}>Dashboard</button>
          <button style={styles.exportBtn} onClick={handleExportReport}>
            <span>&#128196;</span> Download Report
          </button>
        </div>
      </div>

      <div style={styles.content}>
        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.evalTitle}>{evaluation?.title || 'Evaluation Results'}</div>
        <div style={styles.evalSub}>
          {vendors.length} vendor{vendors.length !== 1 ? 's' : ''} analyzed &middot;{' '}
          {evaluation?.created_at ? new Date(evaluation.created_at).toLocaleDateString() : ''}
        </div>

        {/* Tabs */}
        <div style={styles.tabRow}>
          {tabs.map((t) => (
            <button
              key={t.key}
              style={styles.tab(activeTab === t.key)}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            {/* Winner Banner */}
            {winnerName && (
              <div style={styles.winnerBanner}>
                <div style={styles.winnerGlow} />
                <div style={styles.winnerLeft}>
                  <div style={styles.winnerLabel}>Recommended Vendor</div>
                  <div style={styles.winnerName}>{winnerName}</div>
                  <div style={styles.winnerReason}>
                    {winnerReason ? (winnerReason.length > 150 ? winnerReason.slice(0, 150) + '...' : winnerReason) : 'Top-scoring vendor across all evaluation dimensions'}
                  </div>
                </div>
                <div style={styles.winnerRight}>
                  <div style={styles.winnerStat}>
                    <div style={styles.winnerStatValue}>{winnerScore}</div>
                    <div style={styles.winnerStatLabel}>Overall Score</div>
                  </div>
                  <div style={styles.winnerStat}>
                    <div style={styles.winnerStatValue}>{winnerConfidence}%</div>
                    <div style={styles.winnerStatLabel}>Confidence</div>
                  </div>
                </div>
              </div>
            )}

            {/* Score Cards */}
            <div style={styles.scoreCardsRow}>
              {vendors.map((v, i) => {
                const name = v.vendor_name || v.name || `Vendor ${i + 1}`;
                const score = v.scores?.overall || v.scores?.total || v.overall_score || 0;
                const isWinner = name === winnerName;
                return (
                  <div key={i} style={styles.scoreCard(isWinner)}>
                    {isWinner && <div style={styles.winnerTag}>Winner</div>}
                    <div style={styles.scoreVendorName}>{name}</div>
                    <div style={styles.scoreBigNumber(isWinner)}>{score}</div>
                    <div style={styles.scoreOutOf}>/100</div>
                  </div>
                );
              })}
            </div>

            {/* Radar Chart */}
            {radarData.length > 0 && (
              <div style={styles.radarCard}>
                <div style={styles.radarTitle}>Multi-Dimensional Comparison</div>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis
                      dataKey="dimension"
                      tick={{ fontSize: 13, fill: '#6b7280' }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                    />
                    {vendorNames.map((name, i) => (
                      <Radar
                        key={name}
                        name={name}
                        dataKey={name}
                        stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
                        fill={RADAR_COLORS[i % RADAR_COLORS.length]}
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    ))}
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Recommendation Panel */}
            <RecommendationPanel recommendation={recommendation} />
          </div>
        )}

        {activeTab === 'comparison' && (
          <ComparisonMatrix vendors={vendors} recommendation={recommendation} />
        )}

        {activeTab === 'redflags' && (
          <RedFlagPanel vendors={vendors} />
        )}

        {activeTab === 'chat' && (
          <ChatInterface
            evaluationId={id}
            vendors={vendors}
            recommendation={recommendation}
          />
        )}
      </div>
    </div>
  );
}
