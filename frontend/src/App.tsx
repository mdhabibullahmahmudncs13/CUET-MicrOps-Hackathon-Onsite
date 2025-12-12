import { useState, useMemo } from "react";
import "./App.css";
import HealthStatus from "./components/HealthStatus";
import DownloadJobList from "./components/DownloadJobList";
import PerformanceMetrics from "./components/PerformanceMetrics";

function App() {
  const [apiUrl] = useState(
    import.meta.env.VITE_API_URL || "http://localhost:3000",
  );

  const externalLinks = useMemo(
    () => [
      {
        url: "http://localhost:16686",
        icon: "🔍",
        title: "Jaeger UI",
        subtitle: "Distributed Tracing",
      },
      {
        url: `${apiUrl}/docs`,
        icon: "📖",
        title: "API Documentation",
        subtitle: "OpenAPI Spec",
      },
      {
        url: "http://localhost:9001",
        icon: "🪣",
        title: "MinIO Console",
        subtitle: "S3 Storage",
      },
    ],
    [apiUrl],
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
              {externalLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="monitor-link"
                >
                  <span className="icon">{link.icon}</span>
                  <div>
                    <strong>{link.title}</strong>
                    <small>{link.subtitle}</small>
                  </div>
                </a>
              ))}
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
