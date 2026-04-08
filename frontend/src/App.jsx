import React, { useState, createContext, useContext, useCallback, useReducer, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import UploadPage from './components/UploadPage';
import AnalysisPage from './components/AnalysisPage';
import NotFound from './components/NotFound';

// ---- Auth Context ----
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// ---- Toast Context ----
const ToastContext = createContext(null);

let toastIdCounter = 0;

function toastReducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [...state, action.toast];
    case 'REMOVE':
      return state.filter((t) => t.id !== action.id);
    default:
      return state;
  }
}

function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const showToast = useCallback((message, type = 'success') => {
    const id = ++toastIdCounter;
    dispatch({ type: 'ADD', toast: { id, message, type } });
    setTimeout(() => dispatch({ type: 'REMOVE', id }), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    dispatch({ type: 'REMOVE', id });
  }, []);

  const icons = {
    success: (
      <svg className="toast__icon" viewBox="0 0 20 20" fill="#10b981">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="toast__icon" viewBox="0 0 20 20" fill="#ef4444">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="toast__icon" viewBox="0 0 20 20" fill="#f59e0b">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            {icons[t.type] || icons.success}
            <div className="toast__content">{t.message}</div>
            <button className="toast__close" onClick={() => removeToast(t.id)}>
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

// ---- Error Boundary ----
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__title">Something went wrong</div>
          <div className="error-boundary__text">
            An unexpected error occurred. Please refresh the page to try again.
          </div>
          <button
            className="btn btn--primary"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ---- App ----
export default function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('vendoreval_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('vendoreval_token'));

  const loginUser = (userData, tokenStr) => {
    setUser(userData);
    setToken(tokenStr);
    localStorage.setItem('vendoreval_token', tokenStr);
    localStorage.setItem('vendoreval_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('vendoreval_token');
    localStorage.removeItem('vendoreval_user');
  };

  return (
    <ErrorBoundary>
      <AuthContext.Provider value={{ user, token, loginUser, logout }}>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <UploadPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/evaluation/:id"
              element={
                <ProtectedRoute>
                  <AnalysisPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthContext.Provider>
    </ErrorBoundary>
  );
}
