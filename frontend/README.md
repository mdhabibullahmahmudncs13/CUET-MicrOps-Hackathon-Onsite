# Delineate Observability Dashboard

React-based observability dashboard for the Delineate download microservice with real-time monitoring, performance metrics, and job management.

## 🎯 Features

### Health Monitoring

- Real-time status updates (polls every 5s)
- Storage connectivity check
- Visual status badges
- Manual refresh capability

### Performance Metrics

- Live response time tracking
- Interactive charts (last 20 requests)
- Average response time calculation
- Success rate percentage

### Download Job Management

- File availability check
- Download initiation
- Job status tracking table
- Real-time updates

### Error Tracking

- Sentry integration
- ErrorBoundary wrapper
- Manual error testing
- Session replay

## 🚀 Quick Start

### Docker (Recommended)

```bash
# Start entire stack
cd ..
npm run docker:dev

# Dashboard: http://localhost:5173
```

### Local Development

```bash
# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:3000" > .env

# Start dev server
npm run dev
```

## 📁 Structure

```
frontend/
├── Dockerfile              # Node 24-alpine container
├── src/
│   ├── main.tsx            # Entry point with Sentry
│   ├── App.tsx             # Dashboard layout
│   ├── App.css             # Complete styling
│   └── components/
│       ├── HealthStatus.tsx
│       ├── PerformanceMetrics.tsx
│       └── DownloadJobList.tsx
```

## 🛠️ Tech Stack

- React 19 + Vite 7 + TypeScript
- Recharts for visualization
- @sentry/react for error tracking
- CSS with dark theme

## 🌐 Access Points

- **Dashboard:** http://localhost:5173
- **Jaeger UI:** http://localhost:16686
- **MinIO Console:** http://localhost:9001
- **API Docs:** http://localhost:3000/docs

## 📊 Components

### HealthStatus

Polls `/health` every 5 seconds, displays system status and storage connectivity.

### PerformanceMetrics

Measures API response time every 3 seconds, shows charts and calculates averages.

### DownloadJobList

Manages download operations: check files, start downloads, track jobs, test Sentry.

## 🎨 Styling

Dark theme with CSS variables, responsive grid layout, mobile-friendly (< 768px).

## 📝 License

MIT License - Part of CUET Fest 2025 Hackathon

---

**Challenge Status:** ✅ Complete (10/10 points)
