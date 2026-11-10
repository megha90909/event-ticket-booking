import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Restricts access to authenticated users and optionally checks user role permissions.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, authLoading, user } = useAuth();
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

  if (
    Array.isArray(allowedRoles) &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user?.role)
  ) {
    return (
      <section className="state-box" role="alert">
        <span className="status-code-badge">403</span>
        <h2>Admin Access Required</h2>
        <p>
          You are signed in as <strong>{user?.email}</strong>, which does not
          have administrator permissions to manage events.
        </p>
        <div className="state-actions">
          <Link to="/" className="btn btn-primary">
            Back to Events
          </Link>
          <Link to="/my-bookings" className="btn btn-secondary">
            My Bookings
          </Link>
        </div>
      </section>
    );
  }

  return children;
}
