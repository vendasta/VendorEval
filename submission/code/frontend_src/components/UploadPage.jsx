import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { createEvaluation, uploadVendor, analyzeEvaluation } from '../api/client';

const DEMO_REQUIREMENTS = `REQUIREMENTS: Cloud Infrastructure Vendor Selection for Acme Corp
MUST-HAVE: 24x7 support, 99.9%+ uptime, P1 response <2 hours, Fixed pricing 18+ months, Dedicated resources, Data migration covered, No auto-renewal traps
IMPORTANT: Timeline 10-12 weeks, Year 1 cost under INR 20,00,000, Monthly payments, Security specialist, Delay penalties
NICE-TO-HAVE: Weekend support, Slack channel, All licenses included
CRITERIA: Cost 25%, SLA 25%, Timeline 20%, Team 15%, Contract Risk 15%`;

const DEMO_VENDORS = [
  {
    name: 'TechSolutions India',
    text: `VENDOR PROPOSAL \u2014 TechSolutions India Pvt Ltd
Project: Cloud Infrastructure Setup & Support
Date: March 2026
PRICING: One-time Setup Fee: INR 8,50,000, Monthly: INR 1,20,000/month, Annual: INR 22,90,000
Payment Terms: 40% advance, 30% midpoint, 30% completion. Price Lock: 18 months, then 15% escalation
TIMELINE: 10 weeks. Subject to change based on client responsiveness
SLA: 99.5% uptime, Critical Response: 4 hours, Standard: 48 hours
Support: Business hours only 9AM-6PM IST, Weekend support extra charges
Team: 1 PM, 2 Senior Cloud Engineers, 1 DevOps (shared)
Terms: Not liable for data loss, Auto-renews with 90-day notice, Early termination: 6 months charges`,
  },
  {
    name: 'CloudForce Systems',
    text: `VENDOR PROPOSAL \u2014 CloudForce Systems
Project: Cloud Infrastructure and DevOps Services
Date: March 2026
PRICING: Setup: INR 6,80,000, Monthly: INR 95,000/month, Year 1 Total: INR 18,20,000
Payment: 25% advance, balance monthly. Fixed pricing 24 months. All licenses included
TIMELINE: 10 weeks with penalty of INR 50,000/week delay
SLA: 99.9% uptime, P1: 1 hour response/4 hour resolution, P2: 2 hours/24 hours
Support: 24x7 included, Dedicated Slack channel, Monthly reviews
Team: Dedicated PM, 3 Cloud Engineers (dedicated), 1 Security Specialist
Terms: 30-day notice after year 1, No early termination fee first 6 months, Data migration covered`,
  },
];

export default function UploadPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [requirements, setRequirements] = useState('');
  const [vendors, setVendors] = useState([{ name: '', text: '' }, { name: '', text: '' }]);
  const [analyzing, setAnalyzing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState('');

  const addVendor = () => {
    if (vendors.length < 8) {
      setVendors([...vendors, { name: '', text: '' }]);
    }
  };

  const removeVendor = (idx) => {
    if (vendors.length > 2) {
      setVendors(vendors.filter((_, i) => i !== idx));
    }
  };

  const updateVendor = (idx, field, value) => {
    const updated = [...vendors];
    updated[idx] = { ...updated[idx], [field]: value };
    setVendors(updated);
  };

  const loadDemoData = () => {
    setTitle('Cloud Infrastructure Vendor Selection - Acme Corp');
    setRequirements(DEMO_REQUIREMENTS);
    setVendors(DEMO_VENDORS.map((v) => ({ name: v.name, text: v.text })));
  };

  const canProceedStep1 = title.trim() && requirements.trim();
  const filledVendors = vendors.filter((v) => v.name.trim() && v.text.trim());
  const canProceedStep2 = filledVendors.length >= 2;

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError('');
    try {
      setProgressMsg('Creating evaluation...');
      const evalData = await createEvaluation(title, requirements);
      const evalId = evalData.evaluation?.id || evalData.id;

      setProgressMsg('Uploading vendor proposals...');
      for (let i = 0; i < filledVendors.length; i++) {
        setProgressMsg(`Uploading vendor ${i + 1} of ${filledVendors.length}...`);
        await uploadVendor(evalId, filledVendors[i].name, filledVendors[i].text);
      }

      setProgressMsg('Extracting data...');
      await new Promise((r) => setTimeout(r, 800));

      setProgressMsg('Scoring vendors...');
      await analyzeEvaluation(evalId);
      await new Promise((r) => setTimeout(r, 600));

      setProgressMsg('Generating recommendation...');
      await new Promise((r) => setTimeout(r, 600));

      setProgressMsg('Analysis complete! Redirecting...');
      await new Promise((r) => setTimeout(r, 500));

      navigate(`/evaluation/${evalId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Please try again.');
      setAnalyzing(false);
    }
  };

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
    content: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '32px',
    },
    stepIndicator: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '40px',
    },
    stepDot: (active, completed) => ({
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: 600,
      backgroundColor: completed ? '#16a34a' : active ? '#2563eb' : '#e5e7eb',
      color: completed || active ? '#ffffff' : '#9ca3af',
      transition: 'all 0.2s',
    }),
    stepLine: (active) => ({
      width: '60px',
      height: '2px',
      backgroundColor: active ? '#2563eb' : '#e5e7eb',
      transition: 'background-color 0.2s',
    }),
    stepLabel: {
      textAlign: 'center',
      fontSize: '13px',
      color: '#6b7280',
      marginTop: '8px',
    },
    card: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '32px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
    },
    sectionTitle: {
      fontSize: '22px',
      fontWeight: 700,
      color: '#0f1b2d',
      marginBottom: '8px',
    },
    sectionSub: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '24px',
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: 600,
      color: '#374151',
      marginBottom: '8px',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      fontSize: '14px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      marginBottom: '20px',
      outline: 'none',
      fontFamily: 'inherit',
    },
    textarea: {
      width: '100%',
      padding: '12px 16px',
      fontSize: '14px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      marginBottom: '20px',
      outline: 'none',
      fontFamily: 'inherit',
      resize: 'vertical',
      minHeight: '160px',
    },
    btnRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '8px',
    },
    primaryBtn: {
      padding: '12px 28px',
      fontSize: '15px',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: '#2563eb',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
    },
    primaryBtnDisabled: {
      padding: '12px 28px',
      fontSize: '15px',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: '#93c5fd',
      border: 'none',
      borderRadius: '8px',
      cursor: 'not-allowed',
    },
    secondaryBtn: {
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: 500,
      color: '#6b7280',
      backgroundColor: '#f3f4f6',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      cursor: 'pointer',
    },
    demoDataBtn: {
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: 600,
      color: '#2563eb',
      backgroundColor: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    vendorCard: {
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '16px',
      border: '1px solid #e5e7eb',
      position: 'relative',
    },
    removeBtn: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      border: '1px solid #e5e7eb',
      backgroundColor: '#ffffff',
      color: '#9ca3af',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      fontWeight: 'bold',
    },
    addBtn: {
      padding: '10px 20px',
      fontSize: '14px',
      fontWeight: 500,
      color: '#2563eb',
      backgroundColor: '#ffffff',
      border: '1px dashed #93c5fd',
      borderRadius: '8px',
      cursor: 'pointer',
      width: '100%',
      marginBottom: '20px',
    },
    vendorCount: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '20px',
    },
    analyzeBtn: {
      padding: '16px 40px',
      fontSize: '16px',
      fontWeight: 700,
      color: '#ffffff',
      backgroundColor: '#16a34a',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      width: '100%',
      marginTop: '16px',
      transition: 'background-color 0.2s',
    },
    progressOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 27, 45, 0.85)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    spinner: {
      width: '48px',
      height: '48px',
      border: '4px solid rgba(255,255,255,0.2)',
      borderTopColor: '#4ade80',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
      marginBottom: '24px',
    },
    progressText: {
      fontSize: '18px',
      color: '#ffffff',
      fontWeight: 500,
    },
    errorBox: {
      padding: '12px 16px',
      backgroundColor: '#fef2f2',
      color: '#dc2626',
      borderRadius: '8px',
      marginBottom: '16px',
      fontSize: '14px',
      border: '1px solid #fecaca',
    },
    checkItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 0',
      fontSize: '15px',
      color: '#374151',
      borderBottom: '1px solid #f3f4f6',
    },
    checkIcon: {
      color: '#16a34a',
      fontSize: '18px',
      fontWeight: 'bold',
    },
  };

  const renderStepIndicator = () => (
    <div style={styles.stepIndicator}>
      {[1, 2, 3].map((s, i) => (
        <React.Fragment key={s}>
          {i > 0 && <div style={styles.stepLine(step >= s)} />}
          <div style={styles.stepDot(step === s, step > s)}>
            {step > s ? '\u2713' : s}
          </div>
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div style={styles.page}>
      {/* Spinner keyframe via style tag */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={styles.header}>
        <div style={styles.logo} onClick={() => navigate('/')}>VendorEval AI</div>
        <button style={styles.secondaryBtn} onClick={() => navigate('/')}>Back to Dashboard</button>
      </div>

      <div style={styles.content}>
        {renderStepIndicator()}

        {/* Step 1: Setup */}
        {step === 1 && (
          <div style={styles.card}>
            <div style={styles.sectionTitle}>Setup Your Evaluation</div>
            <div style={styles.sectionSub}>Give your evaluation a title and paste your requirements document.</div>

            <label style={styles.label}>Evaluation Title</label>
            <input
              style={styles.input}
              placeholder="e.g., Cloud Infrastructure Vendor Selection Q1 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <label style={styles.label}>Requirements Document</label>
            <textarea
              style={styles.textarea}
              placeholder="Paste your requirements, evaluation criteria, must-haves, nice-to-haves..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
            />

            <div style={styles.btnRow}>
              <button style={styles.demoDataBtn} onClick={loadDemoData}>
                <span>&#10024;</span> Load Demo Data
              </button>
              <button
                style={canProceedStep1 ? styles.primaryBtn : styles.primaryBtnDisabled}
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Upload Vendors */}
        {step === 2 && (
          <div style={styles.card}>
            <div style={styles.sectionTitle}>Upload Vendor Proposals</div>
            <div style={styles.sectionSub}>Add 2-8 vendor proposals for comparison.</div>

            <div style={styles.vendorCount}>
              {filledVendors.length} vendor{filledVendors.length !== 1 ? 's' : ''} added
            </div>

            {vendors.map((v, idx) => (
              <div key={idx} style={styles.vendorCard}>
                {vendors.length > 2 && (
                  <button style={styles.removeBtn} onClick={() => removeVendor(idx)} title="Remove vendor">
                    &times;
                  </button>
                )}
                <label style={styles.label}>Vendor {idx + 1} Name</label>
                <input
                  style={{ ...styles.input, marginBottom: '12px' }}
                  placeholder="e.g., TechSolutions India"
                  value={v.name}
                  onChange={(e) => updateVendor(idx, 'name', e.target.value)}
                />
                <label style={styles.label}>Proposal Text</label>
                <textarea
                  style={{ ...styles.textarea, minHeight: '120px' }}
                  placeholder="Paste the vendor's proposal text here..."
                  value={v.text}
                  onChange={(e) => updateVendor(idx, 'text', e.target.value)}
                />
              </div>
            ))}

            {vendors.length < 8 && (
              <button style={styles.addBtn} onClick={addVendor}>
                + Add Another Vendor
              </button>
            )}

            <div style={styles.btnRow}>
              <button style={styles.secondaryBtn} onClick={() => setStep(1)}>Back</button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={styles.demoDataBtn} onClick={loadDemoData}>
                  <span>&#10024;</span> Load Demo Data
                </button>
                <button
                  style={canProceedStep2 ? styles.primaryBtn : styles.primaryBtnDisabled}
                  disabled={!canProceedStep2}
                  onClick={() => setStep(3)}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Analyze */}
        {step === 3 && (
          <div style={styles.card}>
            <div style={styles.sectionTitle}>Ready to Analyze</div>
            <div style={styles.sectionSub}>
              You're evaluating {filledVendors.length} vendor{filledVendors.length !== 1 ? 's' : ''} against your requirements.
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            <div style={{ marginBottom: '24px' }}>
              {filledVendors.map((v, idx) => (
                <div key={idx} style={styles.checkItem}>
                  <span style={styles.checkIcon}>&#10003;</span>
                  {v.name}
                </div>
              ))}
            </div>

            <div style={{
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              border: '1px solid #bbf7d0',
              fontSize: '14px',
              color: '#166534',
            }}>
              AI will extract key data, score each vendor, detect red flags, and generate a recommendation.
            </div>

            <div style={styles.btnRow}>
              <button style={styles.secondaryBtn} onClick={() => setStep(2)}>Back</button>
              <button
                style={styles.analyzeBtn}
                onClick={handleAnalyze}
                disabled={analyzing}
              >
                {analyzing ? 'Analyzing...' : 'Start AI Analysis'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Progress Overlay */}
      {analyzing && (
        <div style={styles.progressOverlay}>
          <div style={styles.spinner} />
          <div style={styles.progressText}>{progressMsg}</div>
        </div>
      )}
    </div>
  );
}
