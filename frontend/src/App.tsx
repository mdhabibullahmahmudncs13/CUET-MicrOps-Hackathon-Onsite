import { useState, useMemo } from "react";
import "./App.css";
import HealthStatus from "./components/HealthStatus";
import DownloadJobList from "./components/DownloadJobList";
import PerformanceMetrics from "./components/PerformanceMetrics";

function App() {
  const [apiUrl] = useState(
    import.meta.env.VITE_API_URL || "http://localhost:3000",
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "downloads">(
    "overview",
  );

  const externalLinks = useMemo(
    () => [
      {
        url: "http://36.255.71.37:16686",
        icon: "🔍",
        title: "Jaeger Tracing",
        subtitle: "Distributed Tracing",
      },
      {
        url: `${apiUrl}/docs`,
        icon: "📖",
        title: "API Docs",
        subtitle: "OpenAPI Spec",
      },
      {
        url: "http://36.255.71.37:9001",
        icon: "🪣",
        title: "MinIO",
        subtitle: "S3 Storage",
      },
    ],
    [apiUrl],
  );

  return (
    <div className="app">
      {/* Top Navigation Bar */}
      <header className="navbar">
        <div className="navbar-brand">
          <span className="brand-icon">🔍</span>
          <div className="brand-text">
            <h1>Delineate</h1>
            <span className="brand-subtitle">Observability Dashboard</span>
          </div>
        </div>

        <nav className="navbar-tabs">
          <button
            className={`nav-tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <span className="tab-icon">📊</span>
            Overview
          </button>
          <button
            className={`nav-tab ${activeTab === "downloads" ? "active" : ""}`}
            onClick={() => setActiveTab("downloads")}
          >
            <span className="tab-icon">📥</span>
            Downloads
          </button>
        </nav>

        <div className="navbar-actions">
          <a
            href={`${apiUrl}/health`}
            target="_blank"
            rel="noopener noreferrer"
            className="navbar-link"
            title="API Health"
          >
            <span className="link-icon">💚</span>
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="main-container">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? "→" : "←"}
          </button>

          {!sidebarCollapsed && (
            <>
              <div className="sidebar-section">
                <h3 className="sidebar-title">Quick Links</h3>
                <div className="sidebar-links">
                  {externalLinks.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sidebar-link"
                    >
                      <span className="sidebar-link-icon">{link.icon}</span>
                      <div className="sidebar-link-content">
                        <strong>{link.title}</strong>
                        <small>{link.subtitle}</small>
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              <div className="sidebar-section">
                <h3 className="sidebar-title">System Status</h3>
                <div className="sidebar-status">
                  <div className="status-item">
                    <span className="status-dot running"></span>
                    <span>API Server</span>
                  </div>
                  <div className="status-item">
                    <span className="status-dot running"></span>
                    <span>MinIO Storage</span>
                  </div>
                  <div className="status-item">
                    <span className="status-dot running"></span>
                    <span>Jaeger Tracing</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </aside>

        {/* Main Content */}
        <main className="content-area">
          {activeTab === "overview" && (
            <div className="overview-layout">
              <div className="metrics-grid">
                <div className="metric-card">
                  <HealthStatus apiUrl={apiUrl} />
                </div>
                <div className="metric-card">
                  <PerformanceMetrics apiUrl={apiUrl} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "downloads" && (
            <div className="downloads-layout">
              <DownloadJobList apiUrl={apiUrl} />
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <span>NITER_Config_Crew</span>
          <span className="footer-divider">•</span>
          <span>CUET MicrOps Hackathon 2025</span>
          <span className="footer-divider">•</span>
          <span className="footer-version">v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
