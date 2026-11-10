import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Restricts access to authenticated users, preserving the requested route on redirect.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="state-box" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <p>Checking your session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

