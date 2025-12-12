import { useState } from "react";
import "./App.css";
import HealthStatus from "./components/HealthStatus";
import DownloadJobList from "./components/DownloadJobList";
import PerformanceMetrics from "./components/PerformanceMetrics";

function App() {
  const [apiUrl] = useState(
    import.meta.env.VITE_API_URL || "http://localhost:3000",
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔍 Delineate Observability Dashboard</h1>
        <p className="subtitle">Monitor download operations in real-time</p>
      </header>

      <main className="dashboard">
        <section className="dashboard-section">
          <HealthStatus apiUrl={apiUrl} />
        </section>

        <section className="dashboard-section">
          <PerformanceMetrics apiUrl={apiUrl} />
        </section>

        <section className="dashboard-section full-width">
          <DownloadJobList apiUrl={apiUrl} />
        </section>

        <section className="dashboard-section full-width">
          <div className="info-panel">
            <h2>📊 Additional Monitoring</h2>
            <div className="links-grid">
              <a
                href="http://localhost:16686"
                target="_blank"
                rel="noopener noreferrer"
                className="monitor-link"
              >
                <span className="icon">🔍</span>
                <div>
                  <strong>Jaeger UI</strong>
                  <small>Distributed Tracing</small>
                </div>
              </a>
              <a
                href={`${apiUrl}/docs`}
                target="_blank"
                rel="noopener noreferrer"
                className="monitor-link"
              >
                <span className="icon">📖</span>
                <div>
                  <strong>API Documentation</strong>
                  <small>OpenAPI Spec</small>
                </div>
              </a>
              <a
                href="http://localhost:9001"
                target="_blank"
                rel="noopener noreferrer"
                className="monitor-link"
              >
                <span className="icon">🪣</span>
                <div>
                  <strong>MinIO Console</strong>
                  <small>S3 Storage</small>
                </div>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>Develop by NITER_Config_Crew | CUET MicrOps Hackathon Onsite 2025</p>
      </footer>
    </div>
  );
}

export default App;
