#!/bin/bash
# Quick Deploy Script for Brilliant Cloud VM
# Usage: ./quick-deploy.sh

set -e

echo "🚀 Delineate - Quick Deploy to Brilliant Cloud"
echo "=============================================="
echo ""

# VM Configuration
VM_IP="36.255.71.37"
SSH_KEY="niter_config_crew.pem"
SSH_USER="ubuntu"  # Change if different
PROJECT_DIR="CUET-MicrOps-Hackathon-Onsite"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}❌ Error: $SSH_KEY not found!${NC}"
    echo "Please convert your .ppk file first:"
    echo "  puttygen niter_config_crew.ppk -O private-openssh -o niter_config_crew.pem"
    echo "  chmod 600 niter_config_crew.pem"
    exit 1
fi

# Check SSH key permissions
if [ "$(stat -c %a $SSH_KEY)" != "600" ]; then
    echo -e "${YELLOW}⚠️  Fixing SSH key permissions...${NC}"
    chmod 600 $SSH_KEY
fi

echo -e "${GREEN}✓ SSH key found and permissions correct${NC}"
echo ""

# Test SSH connection
echo "🔌 Testing SSH connection to $VM_IP..."
if ssh -i $SSH_KEY -o ConnectTimeout=10 -o StrictHostKeyChecking=no $SSH_USER@$VM_IP "echo 'Connection successful'" &> /dev/null; then
    echo -e "${GREEN}✓ SSH connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to VM${NC}"
    echo "Please check:"
    echo "  1. VM is running"
    echo "  2. IP address is correct: $VM_IP"
    echo "  3. Username is correct: $SSH_USER"
    echo "  4. Firewall allows SSH (port 22)"
    echo ""
    echo "Try manual connection:"
    echo "  ssh -i $SSH_KEY $SSH_USER@$VM_IP"
    exit 1
fi
echo ""

# Ask for deployment method
echo "📦 Choose deployment method:"
echo "  1) Deploy from Git (recommended)"
echo "  2) Transfer files from local machine"
read -p "Enter choice (1 or 2): " DEPLOY_METHOD

if [ "$DEPLOY_METHOD" = "1" ]; then
    # Deploy from Git
    read -p "Enter your Git repository URL: " GIT_URL
    
    echo ""
    echo "🚀 Deploying from Git repository..."
    
    ssh -i $SSH_KEY $SSH_USER@$VM_IP << EOF
        set -e
        
        # Update system
        echo "📦 Updating system packages..."
        sudo apt update
        
        # Install Docker if not present
        if ! command -v docker &> /dev/null; then
            echo "🐳 Installing Docker..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker \$USER
            rm get-docker.sh
        fi
        
        # Install Docker Compose if not present
        if ! command -v docker-compose &> /dev/null; then
            echo "🐳 Installing Docker Compose..."
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        fi
        
        # Install git if not present
        if ! command -v git &> /dev/null; then
            echo "📦 Installing Git..."
            sudo apt install git -y
        fi
        
        # Clone repository
        echo "📥 Cloning repository..."
        rm -rf $PROJECT_DIR
        git clone $GIT_URL $PROJECT_DIR
        cd $PROJECT_DIR
        
        # Create production environment file
        echo "⚙️  Creating production environment file..."
        cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000

# Strong credentials
S3_ACCESS_KEY_ID=\$(openssl rand -base64 32 | tr -d '/+=')
S3_SECRET_ACCESS_KEY=\$(openssl rand -base64 48 | tr -d '/+=')
S3_BUCKET_NAME=downloads
S3_ENDPOINT=http://delineate-minio:9000
S3_FORCE_PATH_STYLE=true

# Frontend
VITE_API_URL=http://$VM_IP:3000

# CORS
CORS_ORIGINS=http://$VM_IP:5173,http://$VM_IP:3000

# Rate limiting
REQUEST_TIMEOUT_MS=30000
RATE_LIMIT_MAX_REQUESTS=100

# Download delays
DOWNLOAD_DELAY_ENABLED=true
DOWNLOAD_DELAY_MIN_MS=10000
DOWNLOAD_DELAY_MAX_MS=120000
ENVEOF
        
        # Deploy with Docker Compose
        echo "🚀 Starting Docker containers..."
        docker-compose -f docker/compose.prod.yml  up -d
        
        # Wait for services to start
        echo "⏳ Waiting for services to start..."
        sleep 15
        
        # Check health
        echo "✅ Checking application health..."
        docker-compose -f docker/compose.prod.yml ps
        
        echo ""
        echo "✅ Deployment complete!"
EOF

elif [ "$DEPLOY_METHOD" = "2" ]; then
    # Transfer files
    echo ""
    echo "📦 Creating tarball..."
    
    # Create tarball excluding unnecessary files
    tar --exclude='node_modules' \
        --exclude='frontend/node_modules' \
        --exclude='.git' \
        --exclude='*.log' \
        --exclude='.env' \
        --exclude='.env.local' \
        --exclude='niter_config_crew.ppk' \
        --exclude='niter_config_crew.pem' \
        -czf /tmp/delineate-deploy.tar.gz .
    
    echo -e "${GREEN}✓ Tarball created${NC}"
    echo ""
    
    echo "📤 Transferring files to VM..."
    scp -i $SSH_KEY /tmp/delineate-deploy.tar.gz $SSH_USER@$VM_IP:~/
    
    echo -e "${GREEN}✓ Files transferred${NC}"
    echo ""
    
    echo "🚀 Setting up on VM..."
    ssh -i $SSH_KEY $SSH_USER@$VM_IP << EOF
        set -e
        
        # Update system
        echo "📦 Updating system packages..."
        sudo apt update
        
        # Install Docker if not present
        if ! command -v docker &> /dev/null; then
            echo "🐳 Installing Docker..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker \$USER
            rm get-docker.sh
        fi
        
        # Install Docker Compose if not present
        if ! command -v docker-compose &> /dev/null; then
            echo "🐳 Installing Docker Compose..."
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        fi
        
        # Extract files
        echo "📂 Extracting application files..."
        rm -rf $PROJECT_DIR
        mkdir -p $PROJECT_DIR
        cd $PROJECT_DIR
        tar -xzf ~/delineate-deploy.tar.gz
        rm ~/delineate-deploy.tar.gz
        
        # Create production environment file
        echo "⚙️  Creating production environment file..."
        cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000

# Strong credentials
S3_ACCESS_KEY_ID=\$(openssl rand -base64 32 | tr -d '/+=')
S3_SECRET_ACCESS_KEY=\$(openssl rand -base64 48 | tr -d '/+=')
S3_BUCKET_NAME=downloads
S3_ENDPOINT=http://delineate-minio:9000
S3_FORCE_PATH_STYLE=true

# Frontend
VITE_API_URL=http://$VM_IP:3000

# CORS
CORS_ORIGINS=http://$VM_IP:5173,http://$VM_IP:3000

# Rate limiting
REQUEST_TIMEOUT_MS=30000
RATE_LIMIT_MAX_REQUESTS=100

# Download delays
DOWNLOAD_DELAY_ENABLED=true
DOWNLOAD_DELAY_MIN_MS=10000
DOWNLOAD_DELAY_MAX_MS=120000
ENVEOF
        
        # Deploy with Docker Compose
        echo "🚀 Starting Docker containers..."
        docker-compose -f docker/compose.prod.yml  up -d
        
        # Wait for services to start
        echo "⏳ Waiting for services to start..."
        sleep 15
        
        # Check health
        echo "✅ Checking application health..."
        docker-compose -f docker/compose.prod.yml ps
        
        echo ""
        echo "✅ Deployment complete!"
EOF
    
    # Clean up local tarball
    rm /tmp/delineate-deploy.tar.gz
else
    echo -e "${RED}❌ Invalid choice${NC}"
    exit 1
fi

echo ""
echo "=============================================="
echo -e "${GREEN}🎉 Deployment Successful!${NC}"
echo "=============================================="
echo ""
echo "🌐 Access your application:"
echo "   Dashboard:    http://$VM_IP:5173"
echo "   API:          http://$VM_IP:3000"
echo "   API Docs:     http://$VM_IP:3000/docs"
echo "   Health Check: http://$VM_IP:3000/health"
echo "   MinIO:        http://$VM_IP:9001"
echo "   Jaeger:       http://$VM_IP:16686"
echo ""
echo "📋 Useful commands:"
echo "   View logs:     ssh -i $SSH_KEY $SSH_USER@$VM_IP 'cd $PROJECT_DIR && docker-compose -f docker/compose.prod.yml logs -f'"
echo "   Check status:  ssh -i $SSH_KEY $SSH_USER@$VM_IP 'cd $PROJECT_DIR && docker-compose -f docker/compose.prod.yml ps'"
echo "   Restart:       ssh -i $SSH_KEY $SSH_USER@$VM_IP 'cd $PROJECT_DIR && docker-compose -f docker/compose.prod.yml restart'"
echo "   Stop:          ssh -i $SSH_KEY $SSH_USER@$VM_IP 'cd $PROJECT_DIR && docker-compose -f docker/compose.prod.yml down'"
echo ""
echo "📖 Full documentation: DEPLOYMENT.md"
echo ""
