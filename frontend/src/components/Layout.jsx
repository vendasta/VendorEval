import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

export default function Layout({ children, sidebar, breadcrumb, actions }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isDemo = user?.role === 'demo';

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="layout">
      <header className="layout__header no-print">
        <div className="flex items-center gap-4">
          <div className="layout__logo" onClick={() => navigate('/')}>
            VendorEval AI
          </div>
          {breadcrumb && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>/</span>
              <span>{breadcrumb}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {actions}
          <div className="layout__user" ref={dropdownRef}>
            <button
              className="layout__user-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="avatar avatar--sm avatar--navy">{initials}</div>
              <span className="layout__user-name">
                {user?.name || user?.email || 'User'}
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="layout__dropdown">
                <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                  <div className="text-sm font-semibold text-gray-700">
                    {user?.name || 'User'}
                  </div>
                  <div className="text-xs text-gray-400">{user?.email}</div>
                </div>
                <button
                  className="layout__dropdown-item layout__dropdown-item--danger"
                  onClick={handleLogout}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {isDemo && (
        <div className="demo-banner no-print">
          Demo Mode — You are viewing sample data. Create an account for full access.
        </div>
      )}

      <div className="layout__body">
        {sidebar && (
          <nav className="layout__sidebar no-print">{sidebar}</nav>
        )}
        <main className={`layout__main ${sidebar ? '' : 'layout__main--wide'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
