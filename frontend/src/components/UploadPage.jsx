import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvaluation, uploadVendor, analyzeEvaluation } from '../api/client';
const ACCEPTED_FILE_TYPES = '.pdf,.docx,.doc,.txt,.text';
const loadExtractor = () => import('../utils/extractText');
import Layout from './Layout';

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

const STEP_LABELS = ['Requirements', 'Vendors', 'Review'];

const ANALYSIS_STEPS = [
  'Creating evaluation',
  'Uploading vendors',
  'Extracting data',
  'Scoring vendors',
  'Generating recommendation',
];

export default function UploadPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [requirements, setRequirements] = useState('');
  const [vendors, setVendors] = useState([{ name: '', text: '', fileName: '' }, { name: '', text: '', fileName: '' }]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [error, setError] = useState('');
  const [extracting, setExtracting] = useState({});
  const fileInputRefs = useRef({});
  const reqFileRef = useRef(null);

  const addVendor = () => {
    if (vendors.length < 8) {
      setVendors([...vendors, { name: '', text: '', fileName: '' }]);
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

  const handleVendorFileUpload = async (idx, file) => {
    if (!file) return;
    setExtracting((prev) => ({ ...prev, [idx]: true }));
    setError('');
    try {
      const { extractTextFromFile } = await loadExtractor();
      const text = await extractTextFromFile(file);
      const updated = [...vendors];
      updated[idx] = {
        ...updated[idx],
        text,
        fileName: file.name,
        name: updated[idx].name || file.name.replace(/\.[^/.]+$/, ''),
      };
      setVendors(updated);
    } catch (err) {
      setError(`Failed to extract text from ${file.name}: ${err.message}`);
    } finally {
      setExtracting((prev) => ({ ...prev, [idx]: false }));
    }
  };

  const handleRequirementsFileUpload = async (file) => {
    if (!file) return;
    setExtracting((prev) => ({ ...prev, req: true }));
    setError('');
    try {
      const { extractTextFromFile } = await loadExtractor();
      const text = await extractTextFromFile(file);
      setRequirements(text);
    } catch (err) {
      setError(`Failed to extract text from ${file.name}: ${err.message}`);
    } finally {
      setExtracting((prev) => ({ ...prev, req: false }));
    }
  };

  const canProceedStep1 = title.trim() && requirements.trim();
  const filledVendors = vendors.filter((v) => v.name.trim() && v.text.trim());
  const canProceedStep2 = filledVendors.length >= 2;

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError('');
    try {
      setAnalysisStep(0);
      const evalData = await createEvaluation(title, requirements);
      const evalId = evalData.evaluation?.id || evalData.id;

      setAnalysisStep(1);
      for (let i = 0; i < filledVendors.length; i++) {
        await uploadVendor(evalId, filledVendors[i].name, filledVendors[i].text);
      }

      setAnalysisStep(2);
      await new Promise((r) => setTimeout(r, 800));

      setAnalysisStep(3);
      await analyzeEvaluation(evalId);

      setAnalysisStep(4);
      await new Promise((r) => setTimeout(r, 600));

      navigate(`/evaluation/${evalId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Please try again.');
      setAnalyzing(false);
    }
  };

  const wordCount = (text) => text.trim() ? text.trim().split(/\s+/).length : 0;

  const renderStepper = () => (
    <div className="stepper">
      {STEP_LABELS.map((label, i) => {
        const stepNum = i + 1;
        const isActive = step === stepNum;
        const isCompleted = step > stepNum;
        return (
          <React.Fragment key={stepNum}>
            {i > 0 && (
              <div className={`stepper__line ${isCompleted ? 'stepper__line--completed' : ''}`} />
            )}
            <div className="stepper__step">
              <div className={`stepper__circle ${isActive ? 'stepper__circle--active' : ''} ${isCompleted ? 'stepper__circle--completed' : ''}`}>
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l3.5 3.5L12 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : stepNum}
              </div>
              <span className={`stepper__label ${isActive ? 'stepper__label--active' : ''} ${isCompleted ? 'stepper__label--completed' : ''}`}>
                {label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <Layout breadcrumb="New Evaluation">
      {renderStepper()}

      <div className="upload-form">
        {error && <div className="alert alert--error mb-6">{error}</div>}

        {/* Step 1: Requirements */}
        {step === 1 && (
          <div>
            <div className="upload-form__title">Define Requirements</div>
            <div className="upload-form__subtitle">
              Enter the evaluation title and paste your requirements document
            </div>

            <div className="upload-form__section">
              <label className="field-label">Evaluation Title</label>
              <input
                className="input"
                type="text"
                placeholder="e.g., Cloud Infrastructure Vendor Selection Q2 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="upload-form__section">
              <label className="field-label">Requirements Document</label>
              <div className="flex gap-3 mb-3">
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => reqFileRef.current?.click()}
                  disabled={extracting.req}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v8M3 5l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M1 10v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  {extracting.req ? 'Extracting...' : 'Upload File'}
                </button>
                <span className="text-sm text-gray-400 flex items-center">PDF, DOCX, or TXT</span>
                <input
                  ref={reqFileRef}
                  type="file"
                  accept={ACCEPTED_FILE_TYPES}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    handleRequirementsFileUpload(e.target.files[0]);
                    e.target.value = '';
                  }}
                />
              </div>
              <textarea
                className="textarea"
                style={{ minHeight: 200 }}
                placeholder={`Paste your RFP requirements here or upload a file above...\n\nExample format:\nMUST-HAVE: 24x7 support, 99.9%+ uptime\nIMPORTANT: Budget under INR 20,00,000\nCRITERIA: Cost 25%, SLA 25%, Timeline 20%`}
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
              />
              <div className="char-count">{wordCount(requirements)} words</div>
            </div>

            <div className="flex gap-3">
              <button
                className="btn btn--primary flex-1"
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
              >
                Continue
              </button>
              <button className="btn btn--ghost" onClick={loadDemoData}>
                Load Demo Data
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Vendor Proposals */}
        {step === 2 && (
          <div>
            <div className="upload-form__title">Add Vendor Proposals</div>
            <div className="upload-form__subtitle">
              Paste each vendor's proposal text ({filledVendors.length} of {vendors.length} filled, min 2 required)
            </div>

            {vendors.map((v, i) => (
              <div key={i} className="vendor-card">
                <div className="vendor-card__header">
                  <span className="vendor-card__number">Vendor {i + 1}</span>
                  <div className="flex items-center gap-2">
                    {v.fileName && (
                      <span className="badge badge--info">{v.fileName}</span>
                    )}
                    {vendors.length > 2 && (
                      <button className="vendor-card__remove" onClick={() => removeVendor(i)} title="Remove vendor">
                        &times;
                      </button>
                    )}
                  </div>
                </div>
                <input
                  className="input mb-3"
                  type="text"
                  placeholder="Vendor name"
                  value={v.name}
                  onChange={(e) => updateVendor(i, 'name', e.target.value)}
                />
                <div className="vendor-card__upload-row">
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={() => fileInputRefs.current[i]?.click()}
                    disabled={extracting[i]}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 1v8M3 5l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M1 10v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {extracting[i] ? 'Extracting...' : 'Upload Proposal'}
                  </button>
                  <span className="text-sm text-gray-400">PDF, DOCX, or TXT</span>
                  <input
                    ref={(el) => (fileInputRefs.current[i] = el)}
                    type="file"
                    accept={ACCEPTED_FILE_TYPES}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      handleVendorFileUpload(i, e.target.files[0]);
                      e.target.value = '';
                    }}
                  />
                </div>
                <textarea
                  className="textarea"
                  style={{ minHeight: 140 }}
                  placeholder="Or paste vendor proposal text here..."
                  value={v.text}
                  onChange={(e) => updateVendor(i, 'text', e.target.value)}
                />
                <div className="char-count">{wordCount(v.text)} words</div>
              </div>
            ))}

            {vendors.length < 8 && (
              <button className="vendor-add-btn" onClick={addVendor}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Add Another Vendor ({vendors.length}/8)
              </button>
            )}

            <div className="flex gap-3 mt-6">
              <button className="btn btn--secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <button
                className="btn btn--primary flex-1"
                disabled={!canProceedStep2}
                onClick={() => setStep(3)}
              >
                Continue to Review
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Analyze */}
        {step === 3 && (
          <div>
            <div className="upload-form__title">Review & Analyze</div>
            <div className="upload-form__subtitle">
              Confirm the details below and start the AI analysis
            </div>

            <div className="card mb-6" style={{ padding: 'var(--sp-5)' }}>
              <div className="text-sm font-semibold text-gray-500 mb-2">Evaluation</div>
              <div className="text-lg font-bold text-navy">{title}</div>
              <div className="text-sm text-gray-400 mt-1">{wordCount(requirements)} words in requirements</div>
            </div>

            <div className="card mb-6" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: 'var(--sp-4) var(--sp-5)', borderBottom: '1px solid var(--color-gray-100)' }}>
                <span className="text-sm font-semibold text-gray-500">
                  Vendors ({filledVendors.length})
                </span>
              </div>
              {filledVendors.map((v, i) => (
                <div key={i} className="review-item">
                  <span className="review-item__icon">&#10003;</span>
                  <div>
                    <div className="review-item__name">{v.name}</div>
                    <div className="review-item__meta">
                      {wordCount(v.text)} words
                      {v.fileName && <> &middot; {v.fileName}</>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="alert alert--info mb-6">
              The AI will extract key data, score each vendor, detect red flags, and generate a recommendation.
            </div>

            <div className="flex gap-3">
              <button className="btn btn--secondary" onClick={() => setStep(2)}>
                Back
              </button>
              <button className="btn btn--success btn--lg flex-1" onClick={handleAnalyze}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1l2.1 4.3 4.9.7-3.5 3.4.8 4.6L8 11.8 3.7 14l.8-4.6L1 6l4.9-.7L8 1z" fill="currentColor" />
                </svg>
                Start AI Analysis
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Overlay */}
      {analyzing && (
        <div className="analysis-overlay">
          <div className="analysis-overlay__spinner" />
          <div className="analysis-overlay__title">Analyzing Proposals</div>
          <div className="analysis-overlay__message">This usually takes 10-20 seconds</div>
          <div className="analysis-steps">
            {ANALYSIS_STEPS.map((label, i) => {
              const isDone = analysisStep > i;
              const isActive = analysisStep === i;
              return (
                <div key={i} className={`analysis-step ${isActive ? 'analysis-step--active' : ''} ${isDone ? 'analysis-step--done' : ''}`}>
                  <span className="analysis-step__icon">
                    {isDone ? '✓' : isActive ? '●' : '○'}
                  </span>
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Layout>
  );
}
