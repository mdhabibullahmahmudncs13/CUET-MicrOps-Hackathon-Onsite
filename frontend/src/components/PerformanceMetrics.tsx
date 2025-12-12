import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import * as Sentry from "@sentry/react";

interface PerformanceMetricsProps {
  apiUrl: string;
}

interface MetricDataPoint {
  time: string;
  responseTime: number;
  success: boolean;
}

export default function PerformanceMetrics({
  apiUrl,
}: PerformanceMetricsProps) {
  const [metrics, setMetrics] = useState<MetricDataPoint[]>([]);

  const measurePerformance = useCallback(async () => {
    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${apiUrl}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      const newDataPoint: MetricDataPoint = {
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        responseTime,
        success: response.ok,
      };

      setMetrics((prev) => {
        const updated = [...prev, newDataPoint];
        // Keep only last 20 data points
        return updated.slice(-20);
      });
    } catch (err) {
      Sentry.captureException(err);
      const newDataPoint: MetricDataPoint = {
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        responseTime: 0,
        success: false,
      };
      setMetrics((prev) => [...prev, newDataPoint].slice(-20));
    }
  }, [apiUrl]);

  useEffect(() => {
    measurePerformance();
    const interval = setInterval(measurePerformance, 5000); // Measure every 5 seconds (reduced frequency)
    return () => clearInterval(interval);
  }, [measurePerformance]);

  const stats = useMemo(() => {
    if (metrics.length === 0) {
      return { avgResponseTime: 0, successRate: 100 };
    }

    const avgTime = Math.round(
      metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length,
    );
    const successCount = metrics.filter((m) => m.success).length;
    const rate = Math.round((successCount / metrics.length) * 100);

    return { avgResponseTime: avgTime, successRate: rate };
  }, [metrics]);

  return (
    <div className="card performance-metrics">
      <h2>📈 Performance Metrics</h2>

      <div className="metrics-summary">
        <div className="metric-box">
          <div className="metric-value">{stats.avgResponseTime}ms</div>
          <div className="metric-label">Avg Response Time</div>
        </div>
        <div className="metric-box">
          <div className="metric-value">{stats.successRate}%</div>
          <div className="metric-label">Success Rate</div>
        </div>
        <div className="metric-box">
          <div className="metric-value">{metrics.length}</div>
          <div className="metric-label">Samples</div>
        </div>
      </div>

      <div className="chart-container">
        <h3>Response Time (Last 20 Requests)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={metrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} />
            <YAxis
              label={{ value: "ms", angle: -90, position: "insideLeft" }}
            />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="responseTime"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
