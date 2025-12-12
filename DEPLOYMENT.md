# 🚀 Deployment Guide - Brilliant Cloud VM

## 📋 VM Details

- **Provider:** Brilliant Cloud
- **Subnet:** niter_config_crew
- **Floating IP:** 36.255.71.37
- **SSH Key:** niter_config_crew.ppk (PuTTY format)

---

## 🔧 Step 1: Convert SSH Key (PuTTY to OpenSSH)

Since you're on Linux/Pop!\_OS, you need to convert the .ppk file to OpenSSH format:

```bash
# Install puttygen if not already installed
sudo apt update
sudo apt install putty-tools -y

# Convert .ppk to OpenSSH format
puttygen niter_config_crew.ppk -O private-openssh -o niter_config_crew.pem

# Set correct permissions
chmod 600 niter_config_crew.pem

# Verify the key
ssh-keygen -l -f niter_config_crew.pem
```

---

## 🔌 Step 2: Connect to Your VM

```bash
# Test connection (replace 'ubuntu' with actual username if different)
ssh -i niter_config_crew.pem ubuntu@36.255.71.37

# If you get "Host key verification failed", add to known hosts:
ssh-keyscan -H 36.255.71.37 >> ~/.ssh/known_hosts

# Common usernames to try if 'ubuntu' doesn't work:
# ssh -i niter_config_crew.pem root@36.255.71.37
# ssh -i niter_config_crew.pem admin@36.255.71.37
# ssh -i niter_config_crew.pem ec2-user@36.255.71.37
```

---

## 📦 Step 3: Prepare VM for Docker Deployment

Once connected to the VM, run these commands:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (replace 'ubuntu' with your username)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version

# Log out and back in for group changes to take effect
exit
```

Reconnect:

```bash
ssh -i niter_config_crew.pem ubuntu@36.255.71.37
```

---

## 🚀 Step 4: Deploy the Application

### Option A: Deploy from Git (Recommended)

```bash
# Install git
sudo apt install git -y

# Clone your repository
git clone https://github.com/your-username/CUET-MicrOps-Hackathon-Onsite.git
cd CUET-MicrOps-Hackathon-Onsite

# Create production environment file
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=3000

# Generate strong credentials
S3_ACCESS_KEY_ID=$(openssl rand -base64 32 | tr -d '/+=')
S3_SECRET_ACCESS_KEY=$(openssl rand -base64 48 | tr -d '/+=')
S3_BUCKET_NAME=downloads
S3_ENDPOINT=http://delineate-minio:9000
S3_FORCE_PATH_STYLE=true

# Frontend API URL (use your floating IP)
VITE_API_URL=http://36.255.71.37:3000

# Sentry (optional - add your DSN)
SENTRY_DSN=

# CORS - Allow your IP
CORS_ORIGINS=http://36.255.71.37:5173,http://36.255.71.37:3000

# Rate limiting
REQUEST_TIMEOUT_MS=30000
RATE_LIMIT_MAX_REQUESTS=100

# Download delays
DOWNLOAD_DELAY_ENABLED=true
DOWNLOAD_DELAY_MIN_MS=10000
DOWNLOAD_DELAY_MAX_MS=120000
EOF

# Deploy with Docker Compose
docker-compose -f docker/compose.prod.yml --env-file .env.production up -d

# Check status
docker-compose -f docker/compose.prod.yml ps

# View logs
docker-compose -f docker/compose.prod.yml logs -f
```

### Option B: Deploy from Local Machine (Transfer Files)

From your local machine:

```bash
# Create tarball of the project (exclude node_modules)
cd /home/mhmhmud/Documents/GitHub/CUET-MicrOps-Hackathon-Onsite
tar --exclude='node_modules' --exclude='.git' --exclude='frontend/node_modules' -czf delineate.tar.gz .

# Transfer to VM
scp -i niter_config_crew.pem delineate.tar.gz ubuntu@36.255.71.37:~/

# SSH to VM and extract
ssh -i niter_config_crew.pem ubuntu@36.255.71.37
mkdir -p delineate
cd delineate
tar -xzf ../delineate.tar.gz

# Follow steps from Option A above (create .env.production and deploy)
```

---

## 🌐 Step 5: Configure Firewall

Ensure these ports are open on your VM:

```bash
# Check if UFW is active
sudo ufw status

# If active, allow necessary ports
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 3000/tcp    # API Server
sudo ufw allow 5173/tcp    # Frontend Dashboard
sudo ufw allow 9000/tcp    # MinIO API (optional, for direct access)
sudo ufw allow 9001/tcp    # MinIO Console (optional, for admin)
sudo ufw allow 16686/tcp   # Jaeger UI (optional, for observability)

# Reload firewall
sudo ufw reload
```

**Also check Brilliant Cloud dashboard** to ensure Security Group/Firewall rules allow these ports.

---

## ✅ Step 6: Verify Deployment

### From Your Local Machine:

```bash
# Test API health
curl http://36.255.71.37:3000/health

# Expected response:
# {"status":"healthy","checks":{"storage":"ok"}}

# Test frontend
curl http://36.255.71.37:5173

# Test file check endpoint
curl -X POST http://36.255.71.37:3000/v1/download/check \
  -H "Content-Type: application/json" \
  -d '{"file_id": 70000}'
```

### Open in Browser:

- **Dashboard:** http://36.255.71.37:5173
- **API Docs:** http://36.255.71.37:3000/docs
- **MinIO Console:** http://36.255.71.37:9001 (login with generated credentials from .env.production)
- **Jaeger Tracing:** http://36.255.71.37:16686
- **Health Check:** http://36.255.71.37:3000/health

---

## 🔄 Step 7: Manage Deployment

### View Logs:

```bash
cd ~/CUET-MicrOps-Hackathon-Onsite  # or ~/delineate
docker-compose -f docker/compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker/compose.prod.yml logs -f delineate-app
docker-compose -f docker/compose.prod.yml logs -f delineate-frontend
```

### Restart Services:

```bash
docker-compose -f docker/compose.prod.yml restart

# Restart specific service
docker-compose -f docker/compose.prod.yml restart delineate-app
```

### Stop Services:

```bash
docker-compose -f docker/compose.prod.yml down
```

### Update Deployment:

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker/compose.prod.yml down
docker-compose -f docker/compose.prod.yml up -d --build
```

### Check Resource Usage:

```bash
# Docker stats
docker stats

# System resources
htop  # or top
df -h  # disk usage
free -h  # memory usage
```

---

## 🔒 Step 8: Secure Your Deployment (Recommended)

### 1. Set Up SSL/TLS with Let's Encrypt (Optional but Recommended)

```bash
# Install Nginx
sudo apt install nginx -y

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain if you have one)
# If no domain, skip this step and use HTTP

# Configure Nginx as reverse proxy
sudo nano /etc/nginx/sites-available/delineate

# Add this configuration:
```

```nginx
server {
    listen 80;
    server_name 36.255.71.37;

    # API
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:5173/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support for Vite HMR
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/delineate /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 2. Enable Auto-start on Boot

```bash
# Create systemd service
sudo nano /etc/systemd/system/delineate.service
```

```ini
[Unit]
Description=Delineate Microservice
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/CUET-MicrOps-Hackathon-Onsite
ExecStart=/usr/local/bin/docker-compose -f docker/compose.prod.yml --env-file .env.production up -d
ExecStop=/usr/local/bin/docker-compose -f docker/compose.prod.yml down
User=ubuntu

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable delineate
sudo systemctl start delineate
sudo systemctl status delineate
```

### 3. Set Up Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Set up log rotation
sudo nano /etc/logrotate.d/delineate
```

```
/home/ubuntu/CUET-MicrOps-Hackathon-Onsite/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
}
```

---

## 🐛 Troubleshooting

### Connection Issues:

```bash
# Check if SSH key has correct permissions
ls -l niter_config_crew.pem
# Should show: -rw------- (600)

# If not, fix permissions
chmod 600 niter_config_crew.pem

# Test connection with verbose output
ssh -v -i niter_config_crew.pem ubuntu@36.255.71.37
```

### Docker Issues:

```bash
# Check Docker service status
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker

# Check container logs
docker logs <container-name>

# Remove all containers and start fresh
docker-compose -f docker/compose.prod.yml down -v
docker-compose -f docker/compose.prod.yml up -d --build
```

### Port Already in Use:

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>

# Or stop all Docker containers
docker stop $(docker ps -aq)
```

### Out of Disk Space:

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a --volumes

# Clean up old logs
sudo journalctl --vacuum-time=7d
```

---

## 📊 Monitoring Your Deployment

### Check Application Health:

```bash
# Create health check script
cat > ~/check-health.sh << 'EOF'
#!/bin/bash
echo "=== Checking Delineate Health ==="
echo "API Health:"
curl -s http://36.255.71.37:3000/health | jq
echo ""
echo "Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "Resource Usage:"
docker stats --no-stream
EOF

chmod +x ~/check-health.sh
./check-health.sh
```

### Set Up Alerts (Optional):

Consider using:

- **UptimeRobot** (free): Monitor uptime and get email alerts
- **Netdata** (free): Real-time performance monitoring
- **Grafana + Prometheus**: Advanced metrics (already have Jaeger)

---

## 🎉 Success Checklist

- [ ] SSH key converted to OpenSSH format
- [ ] Successfully connected to VM (36.255.71.37)
- [ ] Docker and Docker Compose installed
- [ ] Application deployed with docker-compose
- [ ] All containers running (`docker ps` shows 5 containers)
- [ ] Health endpoint returns healthy status
- [ ] Dashboard accessible at http://36.255.71.37:5173
- [ ] API accessible at http://36.255.71.37:3000
- [ ] MinIO console accessible at http://36.255.71.37:9001
- [ ] Jaeger UI accessible at http://36.255.71.37:16686
- [ ] Firewall/Security Group configured
- [ ] Can create and check download jobs
- [ ] Logs are accessible and show no errors

---

## 🔗 Quick Links (After Deployment)

- **Dashboard:** http://36.255.71.37:5173
- **API Documentation:** http://36.255.71.37:3000/docs
- **Health Check:** http://36.255.71.37:3000/health
- **MinIO Console:** http://36.255.71.37:9001
- **Jaeger Tracing:** http://36.255.71.37:16686

---

## 📞 Support

If you encounter any issues:

1. Check logs: `docker-compose -f docker/compose.prod.yml logs -f`
2. Check container status: `docker ps -a`
3. Check system resources: `htop` and `df -h`
4. Restart services: `docker-compose -f docker/compose.prod.yml restart`
5. Review this documentation

---

**🚀 Happy Deploying!**
