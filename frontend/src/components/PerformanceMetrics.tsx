import { useState, useEffect } from "react";
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
  const [avgResponseTime, setAvgResponseTime] = useState(0);
  const [successRate, setSuccessRate] = useState(100);

  const measurePerformance = async () => {
    const startTime = performance.now();
    try {
      const response = await fetch(`${apiUrl}/health`);
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      const newDataPoint: MetricDataPoint = {
        time: new Date().toLocaleTimeString(),
        responseTime,
        success: response.ok,
      };

      setMetrics((prev) => {
        const updated = [...prev, newDataPoint];
        // Keep only last 20 data points
        return updated.slice(-20);
      });

      // Calculate averages
      const recentMetrics = [...metrics, newDataPoint].slice(-20);
      const avgTime = Math.round(
        recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) /
          recentMetrics.length,
      );
      const successCount = recentMetrics.filter((m) => m.success).length;
      const rate = Math.round((successCount / recentMetrics.length) * 100);

      setAvgResponseTime(avgTime);
      setSuccessRate(rate);
    } catch (err) {
      Sentry.captureException(err);
      const newDataPoint: MetricDataPoint = {
        time: new Date().toLocaleTimeString(),
        responseTime: 0,
        success: false,
      };
      setMetrics((prev) => [...prev, newDataPoint].slice(-20));
    }
  };

  useEffect(() => {
    measurePerformance();
    const interval = setInterval(measurePerformance, 3000); // Measure every 3 seconds
    return () => clearInterval(interval);
  }, [apiUrl]);

  return (
    <div className="card performance-metrics">
      <h2>📈 Performance Metrics</h2>

      <div className="metrics-summary">
        <div className="metric-box">
          <div className="metric-value">{avgResponseTime}ms</div>
          <div className="metric-label">Avg Response Time</div>
        </div>
        <div className="metric-box">
          <div className="metric-value">{successRate}%</div>
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
