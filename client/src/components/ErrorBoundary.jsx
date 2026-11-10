import { Component } from "react";
import { Link } from "react-router-dom";

/**
 * Catches unexpected rendering errors so the UI shows a recovery screen instead of a blank page.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || "An unexpected rendering error occurred.",
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <section className="state-box" role="alert">
          <span className="status-code-badge">Error</span>
          <h2>Something went wrong</h2>
          <p>{this.state.errorMessage}</p>
          <div className="state-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
            <Link
              to="/"
              className="btn btn-secondary"
              onClick={this.handleReset}
            >
              Back to Events
            </Link>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}

