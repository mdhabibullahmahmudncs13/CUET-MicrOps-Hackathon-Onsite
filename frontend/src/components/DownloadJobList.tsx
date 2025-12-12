import { useState, useCallback } from "react";
import * as Sentry from "@sentry/react";

interface DownloadJobListProps {
  apiUrl: string;
}

interface DownloadJob {
  id: string;
  file_id: number;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  completed_at?: string;
  download_url?: string;
  error?: string;
}

export default function DownloadJobList({ apiUrl }: DownloadJobListProps) {
  const [jobs, setJobs] = useState<DownloadJob[]>([]);
  const [fileId, setFileId] = useState("70000");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const checkFileAvailability = useCallback(async () => {
    if (!fileId) return;

    setLoading(true);
    setMessage("");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${apiUrl}/v1/download/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ file_id: parseInt(fileId) }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok) {
        setMessage(
          data.available
            ? `✅ File ${fileId} is available! Size: ${formatBytes(data.size)}`
            : `❌ File ${fileId} is not available`,
        );
      } else {
        setMessage(`❌ Error: ${data.message || "Request failed"}`);
        Sentry.captureException(
          new Error(`File check failed: ${data.message}`),
        );
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setMessage("❌ Error: Request timeout");
      } else {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setMessage(`❌ Error: ${errorMessage}`);
      }
      Sentry.captureException(err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, fileId]);

  const initiateDownload = useCallback(async () => {
    if (!fileId) return;

    setLoading(true);
    setMessage("");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${apiUrl}/v1/download/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ file_ids: [parseInt(fileId)] }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok) {
        const newJob: DownloadJob = {
          id: data.job_id || `job_${Date.now()}`,
          file_id: parseInt(fileId),
          status: "pending",
          created_at: new Date().toISOString(),
        };
        setJobs((prev) => [newJob, ...prev]);
        setMessage(`✅ Download initiated! Job ID: ${newJob.id}`);
      } else {
        setMessage(`❌ Error: ${data.message || "Request failed"}`);
        Sentry.captureException(
          new Error(`Download initiation failed: ${data.message}`),
        );
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setMessage("❌ Error: Request timeout");
      } else {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setMessage(`❌ Error: ${errorMessage}`);
      }
      Sentry.captureException(err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, fileId]);

  const testSentryError = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      // Simply throw an error to test Sentry integration
      const testError = new Error(
        "Test error from Delineate Dashboard - Sentry integration test",
      );
      Sentry.captureException(testError, {
        tags: {
          test: true,
          component: "DownloadJobList",
        },
        extra: {
          timestamp: new Date().toISOString(),
          fileId: fileId,
        },
      });

      setMessage(
        `✅ Test error sent to Sentry! Check your Sentry dashboard for error: "${testError.message}"`,
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setMessage(`❌ Failed to send test error: ${errorMessage}`);
      Sentry.captureException(err);
    } finally {
      setLoading(false);
    }
  }, [fileId]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "failed":
        return "error";
      case "processing":
        return "warning";
      default:
        return "info";
    }
  };

  return (
    <div className="card download-jobs">
      <h2>📥 Download Operations</h2>

      <div className="job-controls">
        <input
          type="number"
          value={fileId}
          onChange={(e) => setFileId(e.target.value)}
          placeholder="File ID (e.g., 70000)"
          className="file-id-input"
          disabled={loading}
        />
        <div className="button-group">
          <button
            onClick={checkFileAvailability}
            disabled={loading}
            className="button button-secondary"
          >
            🔍 Check Availability
          </button>
          <button
            onClick={initiateDownload}
            disabled={loading}
            className="button button-primary"
          >
            📥 Initiate Download
          </button>
          <button
            onClick={testSentryError}
            disabled={loading}
            className="button button-danger"
          >
            🔥 Test Sentry Error
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`message-box ${message.includes("✅") ? "success" : "error"}`}
        >
          {message}
        </div>
      )}

      {jobs.length > 0 && (
        <div className="jobs-table">
          <h3>Recent Jobs</h3>
          <table>
            <thead>
              <tr>
                <th>Job ID</th>
                <th>File ID</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="mono">{job.id}</td>
                  <td>{job.file_id}</td>
                  <td>
                    <span
                      className={`status-pill ${getStatusColor(job.status)}`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td>{new Date(job.created_at).toLocaleTimeString()}</td>
                  <td>
                    {job.download_url && (
                      <a href={job.download_url} className="button-small">
                        Download
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {jobs.length === 0 && (
        <div className="empty-state">
          <p>No download jobs yet. Try initiating a download above!</p>
          <p className="hint">
            💡 Hint: Files with IDs divisible by 7 are available
          </p>
        </div>
      )}
    </div>
  );
}
