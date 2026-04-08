import React from 'react';

export default function RecommendationPanel({ recommendation }) {
  if (!recommendation) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">&#128203;</div>
        <div className="empty-state__title">No Recommendation Yet</div>
        <div className="empty-state__text">
          Upload vendor proposals and run an evaluation to see AI-powered recommendations.
        </div>
      </div>
    );
  }

  const winnerName =
    recommendation.recommended_vendor?.name ||
    recommendation.vendor_name ||
    recommendation.winner ||
    'N/A';
  const confidence =
    recommendation.confidence_score ||
    recommendation.confidence ||
    recommendation.confidence_pct ||
    0;
  const overallScore =
    recommendation.recommended_vendor?.overall_score ||
    recommendation.overall_score ||
    recommendation.score ||
    0;
  const reasoning = recommendation.reasoning || recommendation.summary || '';
  const negotiationTips =
    recommendation.negotiation_tips || recommendation.negotiation_points || [];
  const risks = recommendation.risks || recommendation.risks_to_watch || [];
  const runnerUp = recommendation.runner_up || recommendation.second_place || '';

  return (
    <div>
      {/* Recommended Vendor Card */}
      <div className="rec-card">
        <div className="rec-card__glow" />
        <div className="rec-card__label">Recommended Vendor</div>
        <div className="rec-card__name">{winnerName}</div>
        <div className="rec-card__stats">
          <div className="winner-stat">
            <div className="winner-stat__value">{confidence}%</div>
            <div className="winner-stat__label">Confidence</div>
          </div>
          <div className="winner-stat">
            <div className="winner-stat__value">{overallScore}</div>
            <div className="winner-stat__label">Overall Score</div>
          </div>
        </div>
      </div>

      {/* Why We Recommend This Vendor */}
      {reasoning && (
        <div className="rec-section">
          <div className="rec-section__title">
            <span className="rec-section__title-dot rec-section__title-dot--blue" />
            Why We Recommend This Vendor
          </div>
          <p className="rec-reasoning">{reasoning}</p>
        </div>
      )}

      {/* Negotiation Tips */}
      {negotiationTips.length > 0 && (
        <div className="rec-section">
          <div className="rec-section__title">
            <span className="rec-section__title-dot rec-section__title-dot--green" />
            Negotiation Tips
          </div>
          <ol className="tip-list">
            {negotiationTips.map((tip, i) => (
              <li key={i} className="tip-item">
                <span className="tip-number">{i + 1}</span>
                <span>{tip}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Risks to Watch */}
      {risks.length > 0 && (
        <div className="rec-section">
          <div className="rec-section__title">
            <span className="rec-section__title-dot rec-section__title-dot--amber" />
            Risks to Watch
          </div>
          {risks.map((risk, i) => (
            <div key={i} className="risk-item">
              <span className="risk-icon">&#9888;</span>
              <span>{risk}</span>
            </div>
          ))}
        </div>
      )}

      {/* Runner-up */}
      {runnerUp && (
        <div className="runner-up">
          <span className="badge badge--neutral">Runner-up</span>
          <span>{runnerUp}</span>
        </div>
      )}
    </div>
  );
}
