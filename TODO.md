# Delineate Hackathon Challenge - TODO List

## 📋 Overview

This document outlines the step-by-step tasks for completing the CUET Fest 2025 Microservices Operations Hackathon Challenge. The challenge involves building a production-ready file download microservice with long-running operation handling, observability, and CI/CD.

**Total Available Points: 50**

- Challenge 1: 15 points (S3 Storage Integration)
- Challenge 2: 15 points (Architecture Design)
- Challenge 3: 10 points (CI/CD Pipeline)
- Challenge 4: 10 points (Observability Dashboard - Bonus)

---

## 🎯 Challenge 1: S3 Storage Integration (15 Points)

### Goal

Set up a self-hosted S3-compatible storage service and integrate it with the API.

### Tasks

#### 1.1 Choose and Set Up S3-Compatible Storage

- [ ] **Option A: MinIO (Recommended)**
  - Research MinIO documentation: https://min.io/docs/minio/container/index.html
  - Note default ports: 9000 (API), 9001 (Console)
- [ ] **Option B: RustFS (Alternative)**
  - Research RustFS documentation: https://github.com/rustfs/rustfs
  - Check compatibility with S3 SDK

#### 1.2 Update Docker Compose Configuration

- [ ] Open `docker/compose.dev.yml`
- [ ] Add MinIO/RustFS service definition:

  ```yaml
  services:
    minio:
      image: minio/minio:latest
      ports:
        - "9000:9000"
        - "9001:9001"
      environment:
        - MINIO_ROOT_USER=minioadmin
        - MINIO_ROOT_PASSWORD=minioadmin
      command: server /data --console-address ":9001"
      volumes:
        - minio_data:/data
      networks:
        - app-network

  volumes:
    minio_data:
  ```

- [ ] Add network configuration if not present:
  ```yaml
  networks:
    app-network:
      driver: bridge
  ```

#### 1.3 Create Bucket Initialization Script

- [ ] Create `scripts/init-s3.sh` to create the `downloads` bucket

  ```bash
  #!/bin/bash
  # Wait for MinIO to be ready
  # Use mc (MinIO Client) to create bucket
  ```

- [ ] Update Docker Compose to run init script
- [ ] Alternative: Use an init container with AWS CLI

#### 1.4 Update API Service Configuration

- [ ] Modify `docker/compose.dev.yml` to add environment variables to API service:

  ```yaml
  api:
    environment:
      - S3_ENDPOINT=http://minio:9000
      - S3_ACCESS_KEY_ID=minioadmin
      - S3_SECRET_ACCESS_KEY=minioadmin
      - S3_BUCKET_NAME=downloads
      - S3_REGION=us-east-1
      - S3_FORCE_PATH_STYLE=true
  ```

- [ ] Add `depends_on` to ensure storage starts before API:

  ```yaml
  depends_on:
    - minio
  ```

- [ ] Connect API to the same network as storage service

#### 1.5 Populate Test Data

- [ ] Create script to upload test files to S3 bucket
- [ ] Use file IDs that are divisible by 7 (as per mock logic)
- [ ] Upload files with pattern: `downloads/{file_id}.zip`
- [ ] Verify files are accessible via MinIO console

#### 1.6 Test Integration

- [ ] Start services: `npm run docker:dev`
- [ ] Check health endpoint:

  ```bash
  curl http://localhost:3000/health
  # Expected: {"status":"healthy","checks":{"storage":"ok"}}
  ```

- [ ] Test file availability check:

  ```bash
  curl -X POST http://localhost:3000/v1/download/check \
    -H "Content-Type: application/json" \
    -d '{"file_id": 70000}'
  ```

- [ ] Run E2E tests: `npm run test:e2e`

#### 1.7 Update Production Configuration

- [ ] Replicate changes to `docker/compose.prod.yml`
- [ ] Use stronger credentials for production
- [ ] Add persistent volumes for data storage
- [ ] Configure resource limits

#### 1.8 Documentation

- [ ] Update README with S3 setup instructions
- [ ] Document how to access MinIO console (http://localhost:9001)
- [ ] Add troubleshooting section for common S3 issues

---

## 🏗️ Challenge 2: Architecture Design for Long-Running Operations (15 Points)

### Goal

Design a complete architecture that handles downloads taking 10-120+ seconds gracefully.

### Understanding the Problem

#### 2.1 Experience the Timeout Issue

- [ ] Start production server: `npm run start`
- [ ] Attempt a download that will timeout:
  ```bash
  curl -X POST http://localhost:3000/v1/download/start \
    -H "Content-Type: application/json" \
    -d '{"file_id": 70000}'
  ```
- [ ] Note the timeout behavior (30 seconds by default)
- [ ] Check server logs to see the actual processing time

#### 2.2 Research Patterns

- [ ] **Polling Pattern**
  - Research: RESTful job queues, status endpoints
  - Examples: AWS S3 Transfer Acceleration, GitHub Actions
- [ ] **WebSocket/SSE Pattern**
  - Research: Real-time communication, Server-Sent Events
  - Examples: Slack, Discord, real-time dashboards
- [ ] **Webhook/Callback Pattern**
  - Research: Asynchronous notifications, webhook security
  - Examples: Stripe webhooks, GitHub webhooks
- [ ] **Message Queue Pattern**
  - Research: BullMQ, AWS SQS, RabbitMQ, Redis Queue
  - Examples: Background job processing, task scheduling

#### 2.3 Create Architecture Document

- [ ] Create file: `ARCHITECTURE.md`
- [ ] Add sections (see template below)

#### 2.4 Architecture Diagram

- [ ] Use draw.io, Excalidraw, or Mermaid
- [ ] Show components:
  - Frontend (React/Next.js)
  - API Gateway / Load Balancer
  - API Server (Hono)
  - Message Queue (Redis/BullMQ)
  - Worker Processes
  - S3 Storage
  - Database (Job Status)
  - Observability (Jaeger, Sentry)

- [ ] Show data flow:
  - Initiate request flow
  - Status polling flow
  - Download completion flow
  - Error handling flow

#### 2.5 Technical Approach Section

- [ ] **Choose your pattern** (Polling, WebSocket, Webhook, or Hybrid)
- [ ] Document decision reasoning
- [ ] List pros and cons
- [ ] Consider scale and cost implications

#### 2.6 API Contract Design

- [ ] Define new endpoints:

  ```
  POST /v1/download/initiate -> Returns jobId immediately
  GET  /v1/download/status/:jobId -> Returns job status
  GET  /v1/download/result/:jobId -> Returns download URL when ready
  POST /v1/download/cancel/:jobId -> Cancel a job
  ```

- [ ] Define request/response schemas
- [ ] Add OpenAPI/Swagger definitions
- [ ] Document error codes and retry strategies

#### 2.7 Database Schema Design

- [ ] Design job tracking table:

  ```sql
  CREATE TABLE download_jobs (
    job_id UUID PRIMARY KEY,
    user_id VARCHAR(255),
    file_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL, -- queued, processing, completed, failed
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    download_url TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    metadata JSONB
  );
  ```

- [ ] Add indexes for query optimization
- [ ] Consider TTL for completed jobs

#### 2.8 Background Job Processing

- [ ] Document queue setup:
  - Queue library choice (BullMQ recommended)
  - Worker configuration
  - Concurrency settings
  - Retry logic (exponential backoff)
- [ ] Define job processing flow:
  1. Receive job from queue
  2. Update status to "processing"
  3. Check S3 availability
  4. If available: generate presigned URL
  5. If not available: retry or mark as failed
  6. Update job status
  7. Send notification (if webhook)

#### 2.9 Proxy Configuration

- [ ] **Cloudflare Configuration**

  ```
  - Increase timeout (Enterprise plan needed for >100s)
  - Or use Cloudflare Workers with fetch() for async operations
  - WebSocket routing rules
  ```

- [ ] **Nginx Configuration**

  ```nginx
  location /v1/download/initiate {
    proxy_pass http://backend;
    proxy_read_timeout 5s;  # Quick response
  }

  location /v1/download/status {
    proxy_pass http://backend;
    proxy_cache downloads_cache;
    proxy_cache_valid 200 5s;
  }
  ```

- [ ] Document timeout settings at each layer

#### 2.10 Frontend Integration

- [ ] Design React hooks:

  ```typescript
  const { initiateDownload, status, downloadUrl, error } = useDownload();
  ```

- [ ] Create status polling component
- [ ] Design progress indicator UI
- [ ] Implement retry logic
- [ ] Handle browser close/reload scenarios

#### 2.11 Error Handling Strategy

- [ ] Transient errors: Automatic retry with exponential backoff
- [ ] Permanent errors: User notification
- [ ] Timeout errors: Continue processing, notify when ready
- [ ] Duplicate request prevention: Idempotency keys

#### 2.12 Review and Polish

- [ ] Read through entire document
- [ ] Add diagrams and code examples
- [ ] Spell check and formatting
- [ ] Get peer review if possible

### ARCHITECTURE.md Template

```markdown
# Long-Running Download Architecture

## Problem Statement

[Describe the timeout issues and requirements]

## Architecture Overview

[High-level diagram and description]

## Chosen Approach: [Pattern Name]

[Detailed explanation of why you chose this pattern]

### Pros

- ...

### Cons

- ...

## Component Details

### API Layer

[Endpoints, schemas, middleware]

### Queue System

[Queue choice, configuration, worker setup]

### Database Schema

[Tables, indexes, queries]

### Storage Layer

[S3 integration, presigned URLs, cleanup]

## Data Flow Diagrams

### Happy Path

[Step-by-step flow]

### Error Scenarios

[Handling failures]

## Proxy Configuration

### Cloudflare

[Settings and rules]

### Nginx

[Configuration snippet]

## Frontend Integration

### React Implementation

[Code examples]

### User Experience

[UI mockups]

## Observability

[Tracing, metrics, logs]

## Scalability Considerations

[How this scales to 10K, 100K concurrent users]

## Cost Analysis

[Infrastructure costs]

## Alternative Approaches Considered

[Other patterns you evaluated]
```

---

## 🚀 Challenge 3: CI/CD Pipeline (10 Points)

### Goal

Set up automated testing and deployment pipeline.

### Tasks

#### 3.1 Review Existing GitHub Actions

- [ ] Read `.github/workflows/ci.yml`
- [ ] Understand current stages
- [ ] Note what's missing

#### 3.2 Enhance CI Pipeline

- [ ] Add dependency caching:

  ```yaml
  - uses: actions/cache@v4
    with:
      path: ~/.npm
      key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
  ```

- [ ] Add linting stage:

  ```yaml
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
  ```

- [ ] Enhance E2E testing:

  ```yaml
  test:
    runs-on: ubuntu-latest
    services:
      minio:
        image: minio/minio:latest
        # ... service configuration
    steps:
      - run: npm run test:e2e
  ```

- [ ] Add Docker build stage:
  ```yaml
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker image
        run: docker build -f docker/Dockerfile.prod -t app:${{ github.sha }} .
      - name: Scan for vulnerabilities
        run: trivy image app:${{ github.sha }}
  ```

#### 3.3 Add Branch Protection

- [ ] Go to repository Settings → Branches
- [ ] Add rule for `main` branch:
  - Require pull request reviews
  - Require status checks (CI must pass)
  - No force pushes
  - No deletions

#### 3.4 Add Pipeline Badge

- [ ] Get badge URL from Actions tab
- [ ] Add to README.md:

  ```markdown
  ## CI Status

  ![CI](https://github.com/username/repo/actions/workflows/ci.yml/badge.svg)
  ```

#### 3.5 Set Up Deployment (Bonus)

- [ ] Choose platform: Railway, Render, Fly.io, or Heroku
- [ ] Add deployment step:

  ```yaml
  deploy:
    needs: [lint, test, build]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to [Platform]
        # ... deployment commands
  ```

- [ ] Configure platform secrets
- [ ] Test deployment

#### 3.6 Add Security Scanning (Bonus)

- [ ] Add Snyk or Trivy for vulnerability scanning
- [ ] Configure CodeQL for code analysis:
  ```yaml
  - name: Initialize CodeQL
    uses: github/codeql-action/init@v2
    with:
      languages: typescript
  ```

#### 3.7 Add Notifications (Bonus)

- [ ] Set up Slack/Discord webhook
- [ ] Add notification step:
  ```yaml
  - name: Notify on failure
    if: failure()
    # ... notification command
  ```

#### 3.8 Documentation

- [ ] Update README with CI/CD section
- [ ] Document how to run tests locally
- [ ] Add troubleshooting guide
- [ ] Create CONTRIBUTING.md with workflow explanation

---

## 🔭 Challenge 4: Observability Dashboard (10 Points - Bonus)

### Goal

Build a React UI with Sentry error tracking and OpenTelemetry tracing.

### Tasks

#### 4.1 Set Up Sentry

- [ ] Sign up at sentry.io
- [ ] Create new project (React)
- [ ] Get DSN (Data Source Name)
- [ ] Add DSN to backend `.env`:
  ```env
  SENTRY_DSN=https://...@sentry.io/...
  ```

#### 4.2 Test Sentry Integration

- [ ] Restart backend
- [ ] Trigger test error:
  ```bash
  curl -X POST "http://localhost:3000/v1/download/check?sentry_test=true" \
    -H "Content-Type: application/json" \
    -d '{"file_id": 70000}'
  ```
- [ ] Check Sentry dashboard for error

#### 4.3 Create React Frontend

- [ ] Create frontend app:

  ```bash
  npm create vite@latest frontend -- --template react-ts
  cd frontend
  npm install
  ```

- [ ] Install dependencies:
  ```bash
  npm install @sentry/react @sentry/tracing
  npm install @opentelemetry/api @opentelemetry/sdk-trace-web
  npm install recharts react-query
  ```

#### 4.4 Set Up Sentry in React

- [ ] Initialize in `main.tsx`:

  ```typescript
  import * as Sentry from "@sentry/react";

  Sentry.init({
    dsn: "YOUR_FRONTEND_DSN",
    integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
    tracesSampleRate: 1.0,
  });
  ```

- [ ] Add Error Boundary:

  ```typescript
  import { ErrorBoundary } from "@sentry/react";

  function App() {
    return (
      <ErrorBoundary fallback={<ErrorFallback />}>
        <Dashboard />
      </ErrorBoundary>
    );
  }
  ```

#### 4.5 Set Up OpenTelemetry in React

- [ ] Create `tracing.ts`:

  ```typescript
  import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
  import { registerInstrumentations } from "@opentelemetry/instrumentation";
  import { FetchInstrumentation } from "@opentelemetry/instrumentation-fetch";

  const provider = new WebTracerProvider({
    // ... configuration
  });

  registerInstrumentations({
    instrumentations: [
      new FetchInstrumentation({
        propagateTraceHeaderCorsUrls: ["http://localhost:3000"],
      }),
    ],
  });
  ```

#### 4.6 Build Dashboard Components

- [ ] **HealthStatus.tsx**
  - Poll `/health` endpoint every 5 seconds
  - Display status indicators
  - Show S3 storage connectivity

- [ ] **DownloadJobList.tsx**
  - Table of download jobs
  - Status column (queued, processing, completed, failed)
  - Progress indicators
  - Download buttons

- [ ] **ErrorLog.tsx**
  - Fetch recent errors from Sentry API
  - Display error messages, timestamps
  - Link to Sentry dashboard

- [ ] **TraceViewer.tsx**
  - Display trace IDs
  - Link to Jaeger UI
  - Correlation with error logs

- [ ] **PerformanceMetrics.tsx**
  - Charts showing API response times
  - Success/failure rates
  - Download duration histogram

#### 4.7 Implement API Integration

- [ ] Create API client:

  ```typescript
  const apiClient = {
    checkHealth: async () => fetch("/health").then((r) => r.json()),
    initiateDownload: async (fileId: number) => {
      /* ... */
    },
    checkStatus: async (jobId: string) => {
      /* ... */
    },
  };
  ```

- [ ] Add trace context propagation:
  ```typescript
  const traceId = getTraceId();
  headers: {
    'traceparent': `00-${traceId}-...`,
  }
  ```

#### 4.8 Update Docker Compose

- [ ] Add frontend service to `docker/compose.dev.yml`:

  ```yaml
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3000
      - VITE_SENTRY_DSN=...
    depends_on:
      - api
  ```

- [ ] Ensure Jaeger UI is accessible:
  ```yaml
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686" # UI
      - "4318:4318" # OTLP HTTP
  ```

#### 4.9 Test Correlation

- [ ] Start full stack: `npm run docker:dev`
- [ ] Trigger a download from frontend
- [ ] Check trace in Jaeger: http://localhost:16686
- [ ] Verify trace ID appears in:
  - Frontend logs
  - Backend logs
  - Sentry error (if error occurs)

#### 4.10 Add User Feedback

- [ ] Implement Sentry User Feedback widget
- [ ] Allow users to report issues directly from UI
- [ ] Include trace ID in feedback

#### 4.11 Documentation

- [ ] Create `frontend/README.md`
- [ ] Document Sentry setup
- [ ] Document OpenTelemetry configuration
- [ ] Add screenshots of dashboard
- [ ] Create troubleshooting guide

---

## 📝 Submission Checklist

### Before Submission

- [ ] All E2E tests pass: `npm run test:e2e`
- [ ] Linting passes: `npm run lint`
- [ ] Format check passes: `npm run format:check`
- [ ] Docker builds successfully: `npm run docker:dev`
- [ ] Health endpoint returns "ok": `curl http://localhost:3000/health`

### Documentation

- [ ] README.md updated with all changes
- [ ] ARCHITECTURE.md complete (Challenge 2)
- [ ] TODO.md checked off
- [ ] Screenshots/diagrams included
- [ ] All environment variables documented

### Code Quality

- [ ] No console.log statements in production code
- [ ] Error handling implemented everywhere
- [ ] TypeScript types are strict
- [ ] No ESLint warnings
- [ ] Code is properly commented

### Repository

- [ ] All files committed
- [ ] `.env` is in `.gitignore`
- [ ] Secrets are not committed
- [ ] Clean git history
- [ ] CI pipeline is green

---

## 🎓 Learning Resources

### S3 & Storage

- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)
- [AWS S3 SDK for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)

### Long-Running Operations

- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Queue Patterns](https://redis.io/docs/manual/patterns/)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

### CI/CD

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Trivy Security Scanner](https://aquasecurity.github.io/trivy/)

### Observability

- [Sentry React SDK](https://docs.sentry.io/platforms/javascript/guides/react/)
- [OpenTelemetry JavaScript](https://opentelemetry.io/docs/instrumentation/js/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)

### Architecture

- [System Design Primer](https://github.com/donnemartin/system-design-primer)
- [AWS Architecture Blog](https://aws.amazon.com/blogs/architecture/)
- [Microservices Patterns](https://microservices.io/patterns/)

---

## 💡 Tips for Success

1. **Start with Challenge 1** - Get S3 working first, it's foundational
2. **Document as you go** - Don't wait until the end
3. **Test frequently** - Run E2E tests after each major change
4. **Use version control** - Commit after completing each task
5. **Ask for help** - Don't get stuck, reach out to mentors
6. **Focus on quality** - Better to complete 2 challenges well than 4 poorly
7. **Time management** - Challenge 2 requires the most thought
8. **Read the logs** - They tell you what's happening
9. **Understand don't copy** - Make sure you know why each line exists
10. **Have fun!** - This is a learning experience

---

## 🚨 Common Pitfalls to Avoid

- **Not reading error messages** - Logs are your friend
- **Copying code without understanding** - You'll get stuck later
- **Ignoring security** - Don't commit secrets
- **Skipping tests** - E2E tests save you time
- **Over-engineering** - Keep it simple, make it work first
- **Poor documentation** - Future you will thank present you
- **Not testing timeouts** - This is the core challenge!
- **Forgetting about observability** - You can't fix what you can't see

---

## ⏰ Time Estimates

| Challenge   | Estimated Time | Priority |
| ----------- | -------------- | -------- |
| Challenge 1 | 2-3 hours      | High     |
| Challenge 2 | 3-4 hours      | High     |
| Challenge 3 | 1-2 hours      | Medium   |
| Challenge 4 | 3-4 hours      | Optional |

**Total: 9-13 hours** (excluding Challenge 4)

---

## 🏆 Good Luck!

Remember: This challenge simulates real-world problems. Companies face these exact issues with long-running operations behind proxies. Your solution could be used in production!

**Questions?** Open an issue or ask a mentor.

**Found a bug?** PRs welcome!

**Need inspiration?** Check how services like:

- GitHub Actions (status polling)
- Stripe (webhooks)
- Slack (WebSockets)
  handle similar problems.
