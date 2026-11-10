import { Link, useNavigate } from "react-router-dom";
import "./NotFound.css";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <section className="not-found-page">
      <div className="state-box not-found-box">
        <span className="status-code-badge not-found-code">404</span>
        <h1>Page Not Found</h1>
        <p>
          The page you&apos;re looking for doesn&apos;t exist or may have been
          moved.
        </p>
        <div className="state-actions">
          <Link to="/" className="btn btn-primary">
            Browse Events
          </Link>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    </section>
  );
}

