import { useState, useMemo } from "react";
import "./App.css";
import HealthStatus from "./components/HealthStatus";
import DownloadJobList from "./components/DownloadJobList";
import PerformanceMetrics from "./components/PerformanceMetrics";

function App() {
  const [apiUrl] = useState(
    import.meta.env.VITE_API_URL || "http://localhost:3000",
  );
  const [activeView, setActiveView] = useState<"dashboard" | "downloads">(
    "dashboard",
  );

  const quickLinks = useMemo(
    () => [
      {
        url: "http://36.255.71.37:16686",
        icon: "📊",
        label: "Jaeger",
        color: "#00d4ff",
      },
      {
        url: `${apiUrl}/docs`,
        icon: "📚",
        label: "API Docs",
        color: "#00ff88",
      },
      {
        url: "http://36.255.71.37:9001",
        icon: "💾",
        label: "MinIO",
        color: "#ff6b9d",
      },
    ],
    [apiUrl],
  );

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <div className="brand-logo">
            <svg viewBox="0 0 24 24" fill="none" className="logo-icon">
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="brand-name">Delineate</span>
          </div>
        </div>

        <nav className="header-nav">
          <button
            className={`nav-button ${activeView === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveView("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`nav-button ${activeView === "downloads" ? "active" : ""}`}
            onClick={() => setActiveView("downloads")}
          >
            Downloads
          </button>
        </nav>

        <div className="header-actions">
          {quickLinks.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="quick-link"
              title={link.label}
              style={{ "--link-color": link.color } as React.CSSProperties}
            >
              <span>{link.icon}</span>
            </a>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        {activeView === "dashboard" && (
          <div className="dashboard-view">
            <div className="view-header">
              <h1 className="view-title">Dashboard Overview</h1>
              <p className="view-subtitle">
                Real-time system health and performance metrics
              </p>
            </div>

            <div className="cards-grid">
              <div className="card-wrapper">
                <HealthStatus apiUrl={apiUrl} />
              </div>
              <div className="card-wrapper">
                <PerformanceMetrics apiUrl={apiUrl} />
              </div>
            </div>
          </div>
        )}

        {activeView === "downloads" && (
          <div className="downloads-view">
            <div className="view-header">
              <h1 className="view-title">Download Operations</h1>
              <p className="view-subtitle">
                Manage and monitor file download jobs
              </p>
            </div>

            <div className="card-wrapper">
              <DownloadJobList apiUrl={apiUrl} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <span className="footer-team">NITER_Config_Crew</span>
          <span className="footer-event">CUET MicrOps Hackathon 2025</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
