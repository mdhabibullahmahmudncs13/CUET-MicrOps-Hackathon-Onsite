import { useState, useEffect, useCallback, useMemo } from "react";
import * as Sentry from "@sentry/react";

interface HealthStatusProps {
  apiUrl: string;
}

interface HealthData {
  status: string;
  checks: {
    storage: string;
  };
}

export default function HealthStatus({ apiUrl }: HealthStatusProps) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const fetchHealth = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${apiUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      setHealth(data);
      setError(null);
      setLastChecked(new Date());
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timeout');
      } else {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
      }
      Sentry.captureException(err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // Poll every 10 seconds (reduced frequency)
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const isHealthy = useMemo(
    () => health?.status === "healthy" && health?.checks?.storage === "ok",
    [health],
  );

  return (
    <div className="card health-status">
      <h2>🏥 System Health</h2>
      <div className="health-content">
        {loading && <p>Loading...</p>}
        {error && (
          <div className="error-message">
            <strong>❌ Error:</strong> {error}
          </div>
        )}
        {health && (
          <>
            <div
              className={`status-badge ${isHealthy ? "healthy" : "unhealthy"}`}
            >
              {isHealthy ? "✅ HEALTHY" : "⚠️ UNHEALTHY"}
            </div>
            <div className="health-details">
              <div className="health-item">
                <span className="label">API Status:</span>
                <span
                  className={`value ${health.status === "healthy" ? "success" : "error"}`}
                >
                  {health.status}
                </span>
              </div>
              <div className="health-item">
                <span className="label">Storage (S3):</span>
                <span
                  className={`value ${health.checks.storage === "ok" ? "success" : "error"}`}
                >
                  {health.checks.storage}
                </span>
              </div>
              <div className="health-item">
                <span className="label">Last Checked:</span>
                <span className="value">
                  {lastChecked.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
      <button
        onClick={fetchHealth}
        className="refresh-button"
        disabled={loading}
      >
        🔄 Refresh Now
      </button>
    </div>
  );
}
