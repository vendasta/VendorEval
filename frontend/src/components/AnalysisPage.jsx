import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvaluation, getComparison, getRecommendation, getVendors } from '../api/client';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, Tooltip,
} from 'recharts';
import Layout from './Layout';
import ComparisonMatrix from './ComparisonMatrix';
import RedFlagPanel from './RedFlagPanel';
import RecommendationPanel from './RecommendationPanel';
import ChatInterface from './ChatInterface';
import ReportExport from './ReportExport';

const RADAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const DIMENSION_LABELS = {
  cost: 'Cost', timeline: 'Timeline', quality: 'Quality', risk: 'Risk', sla: 'SLA',
  cost_score: 'Cost', timeline_score: 'Timeline', quality_score: 'Quality', risk_score: 'Risk', sla_score: 'SLA',
};

const SIDEBAR_ITEMS = [
  { key: 'overview', label: 'Overview', icon: '◉' },
  { key: 'comparison', label: 'Comparison', icon: '⊞' },
  { key: 'redflags', label: 'Red Flags', icon: '⚑' },
  { key: 'chat', label: 'AI Chat', icon: '◎' },
];

function ScoreGauge({ score, size = 120, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="score-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle className="score-gauge__circle-bg" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
        <circle
          className="score-gauge__circle-fill"
          cx={size / 2} cy={size / 2} r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="score-gauge__text">
        <div className="score-gauge__value">{score}</div>
        <div className="score-gauge__label">/100</div>
      </div>
    </div>
  );
}

function DimensionBars({ vendor }) {
  const dimensions = [
    { key: 'cost_score', label: 'Cost' },
    { key: 'timeline_score', label: 'Timeline' },
    { key: 'quality_score', label: 'Quality' },
    { key: 'risk_score', label: 'Risk' },
    { key: 'sla_score', label: 'SLA' },
  ];

  const getColor = (val) => {
    if (val >= 70) return 'var(--color-green-500)';
    if (val >= 40) return 'var(--color-amber-500)';
    return 'var(--color-red-500)';
  };

  return (
    <div className="dimension-bars">
      {dimensions.map(({ key, label }) => {
        const val = vendor[key] || vendor.scores?.[key] || 0;
        return (
          <div key={key} className="dimension-bar">
            <span className="dimension-bar__label">{label}</span>
            <div className="dimension-bar__track">
              <div className="dimension-bar__fill" style={{ width: `${val}%`, backgroundColor: getColor(val) }} />
            </div>
            <span className="dimension-bar__value">{val}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalysisPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
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

        try {
          const vendorData = await getVendors(id);
          if (vendorData?.vendors?.length) setVendors(vendorData.vendors);
        } catch (_) {}
      } catch (_) {}
      setLoading(false);
    })();
  }, [id]);

  const winnerName = recommendation?.recommended_vendor?.name || recommendation?.vendor_name || '';
  const winnerScore = recommendation?.recommended_vendor?.overall_score || recommendation?.overall_score || 0;
  const winnerConfidence = recommendation?.confidence_score || recommendation?.confidence || 0;
  const winnerReason = recommendation?.reasoning || recommendation?.summary || '';

  const radarData = (() => {
    const dimensions = ['cost', 'timeline', 'quality', 'risk', 'sla'];
    const firstVendor = vendors[0];
    if (!firstVendor) return [];

    const getScore = (v, dim) => {
      if (v.scores?.[dim] != null) return v.scores[dim];
      if (v[dim + '_score'] != null) return v[dim + '_score'];
      return 0;
    };

    const hasScores = dimensions.some((d) => getScore(firstVendor, d) > 0);
    if (!hasScores) return [];

    return dimensions.map((dim) => {
      const entry = { dimension: DIMENSION_LABELS[dim] || dim };
      vendors.forEach((v) => {
        entry[v.vendor_name || v.name || 'Vendor'] = getScore(v, dim);
      });
      return entry;
    });
  })();

  const vendorNames = vendors.map((v) => v.vendor_name || v.name || 'Vendor');

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  if (showReport) {
    return (
      <div>
        <div className="no-print" style={{ padding: '16px 32px', backgroundColor: 'var(--color-white)', borderBottom: '1px solid var(--color-gray-200)' }}>
          <button className="btn btn--secondary" onClick={() => setShowReport(false)}>
            &larr; Back to Analysis
          </button>
        </div>
        <ReportExport evaluation={evaluation} vendors={vendors} recommendation={recommendation} />
      </div>
    );
  }

  const sidebar = (
    <>
      {SIDEBAR_ITEMS.map((item) => (
        <button
          key={item.key}
          className={`layout__sidebar-item ${activeTab === item.key ? 'layout__sidebar-item--active' : ''}`}
          onClick={() => setActiveTab(item.key)}
        >
          <span>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </>
  );

  const headerActions = (
    <button className="btn btn--primary btn--sm" onClick={() => setShowReport(true)}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3 1h5l3 3v8a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M8 1v3h3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
      Export Report
    </button>
  );

  return (
    <Layout sidebar={sidebar} breadcrumb={evaluation?.title || 'Analysis'} actions={headerActions}>
      {loading ? (
        <div>
          <div className="skeleton skeleton--banner mb-6" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--sp-4)' }}>
            <div className="skeleton skeleton--card" />
            <div className="skeleton skeleton--card" />
          </div>
        </div>
      ) : (
        <div>
          <div className="analysis__title-row">
            <div>
              <h1 className="analysis__title">{evaluation?.title || 'Evaluation Results'}</h1>
              <div className="analysis__subtitle">
                {vendors.length} vendor{vendors.length !== 1 ? 's' : ''} analyzed &middot; {formatDate(evaluation?.created_at)}
              </div>
            </div>
          </div>

          {activeTab === 'overview' && (
            <div>
              {/* Winner Banner */}
              {winnerName && (
                <div className="winner-banner">
                  <div className="winner-banner__glow" />
                  <div className="winner-banner__info">
                    <div className="winner-banner__label">Recommended Vendor</div>
                    <div className="winner-banner__name">{winnerName}</div>
                    <div className="winner-banner__reason">
                      {winnerReason ? (winnerReason.length > 160 ? winnerReason.slice(0, 160) + '...' : winnerReason) : 'Top-scoring vendor across all evaluation dimensions'}
                    </div>
                  </div>
                  <div className="winner-banner__stats">
                    <div className="winner-stat">
                      <div className="winner-stat__value">{winnerScore}</div>
                      <div className="winner-stat__label">Overall Score</div>
                    </div>
                    <div className="winner-stat">
                      <div className="winner-stat__value">{winnerConfidence}%</div>
                      <div className="winner-stat__label">Confidence</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Score Cards */}
              <div className="score-cards" style={{ gridTemplateColumns: `repeat(${Math.min(vendors.length, 4)}, 1fr)` }}>
                {vendors.map((v, i) => {
                  const name = v.vendor_name || v.name || `Vendor ${i + 1}`;
                  const score = v.overall_score || v.scores?.overall || 0;
                  const isWinner = name === winnerName;
                  return (
                    <div key={i} className={`score-card ${isWinner ? 'score-card--winner' : ''}`}>
                      {isWinner && <div className="score-card__winner-tag">Winner</div>}
                      <div className="score-card__name">{name}</div>
                      <div className="flex justify-center mt-2 mb-2">
                        <ScoreGauge score={score} size={100} strokeWidth={7} />
                      </div>
                      <DimensionBars vendor={v} />
                    </div>
                  );
                })}
              </div>

              {/* Radar Chart */}
              {radarData.length > 0 && (
                <div className="radar-card">
                  <div className="radar-card__title">Multi-Dimensional Comparison</div>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 13, fill: '#64748b' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      {vendorNames.map((name, i) => (
                        <Radar
                          key={name} name={name} dataKey={name}
                          stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
                          fill={RADAR_COLORS[i % RADAR_COLORS.length]}
                          fillOpacity={0.12} strokeWidth={2}
                        />
                      ))}
                      <Legend wrapperStyle={{ fontSize: 13 }} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

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
            <ChatInterface evaluationId={id} vendors={vendors} recommendation={recommendation} />
          )}
        </div>
      )}
    </Layout>
  );
}
