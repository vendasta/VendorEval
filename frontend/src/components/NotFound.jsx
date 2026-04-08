import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found">
      <div className="not-found__code">404</div>
      <div className="not-found__title">Page not found</div>
      <div className="not-found__text">
        The page you're looking for doesn't exist or has been moved.
      </div>
      <button className="btn btn--primary" onClick={() => navigate('/')}>
        Back to Dashboard
      </button>
    </div>
  );
}
