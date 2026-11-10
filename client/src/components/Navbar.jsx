import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { isAuthenticated, authLoading, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Collapse the mobile menu whenever the user navigates to another route
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-dot" aria-hidden="true" />
          EventBook
        </Link>

        <button
          type="button"
          className="navbar-toggle"
          aria-expanded={menuOpen}
          aria-label="Toggle navigation menu"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span className="toggle-bar" />
          <span className="toggle-bar" />
          <span className="toggle-bar" />
        </button>

        <nav className={`navbar-links ${menuOpen ? "is-open" : ""}`}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `nav-link ${isActive ? "is-active" : ""}`
            }
          >
            Events
          </NavLink>

          {!authLoading && isAuthenticated && (
            <>
              <NavLink
                to="/my-bookings"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "is-active" : ""}`
                }
              >
                My Bookings
              </NavLink>

              <div className="navbar-user-group">
                <span className="navbar-user-name" title={user?.email}>
                  {user?.name}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                >
                  Logout
                </button>
              </div>
            </>
          )}

          {!authLoading && !isAuthenticated && (
            <div className="navbar-auth-group">
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "is-active" : ""}`
                }
              >
                Login
              </NavLink>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

