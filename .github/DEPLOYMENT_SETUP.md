# GitHub Actions Deployment Setup

This guide will help you configure automatic deployment to your Brilliant Cloud VM using GitHub Actions.

## 🔐 Required GitHub Secrets

You need to add these secrets to your GitHub repository:

### How to Add Secrets:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each of the following secrets:

### Secrets to Add:

#### 1. SSH_PRIVATE_KEY

- **Name**: `SSH_PRIVATE_KEY`
- **Value**: Copy the entire contents of your `niter_config_crew.pem` file
  ```bash
  # Get the SSH key content:
  cat niter_config_crew.pem
  ```
- **Important**: Copy everything including the `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----` lines

#### 2. VM_IP

- **Name**: `VM_IP`
- **Value**: `36.255.71.37`

#### 3. SSH_USER

- **Name**: `SSH_USER`
- **Value**: `ubuntu`

## 🚀 How It Works

Once secrets are configured, the deployment workflow will:

1. **Automatic Deployment**: Triggers on every push to `main` or `master` branch
2. **Manual Deployment**: Can be triggered manually from the Actions tab
3. **Deployment Steps**:
   - Connects to VM via SSH
   - Pulls latest code from GitHub
   - Rebuilds Docker containers
   - Restarts all services
   - Verifies health endpoints
   - Cleans up old Docker images

## 📋 Deployment Process

### Automatic (on git push):

```bash
git add .
git commit -m "Your changes"
git push origin main
```

The deployment will automatically start and you can monitor it in the **Actions** tab.

### Manual (from GitHub):

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Select **Deploy to Production** workflow
4. Click **Run workflow**
5. Select branch (main)
6. Click **Run workflow**

## ✅ Verifying Deployment

After deployment completes (usually 2-3 minutes), check:

- ✅ GitHub Actions shows green checkmark
- ✅ Dashboard: http://36.255.71.37:5173
- ✅ API: http://36.255.71.37:3000/health
- ✅ MinIO: http://36.255.71.37:9001

## 🔍 Monitoring Deployments

### View Deployment Logs:

1. Go to **Actions** tab in GitHub
2. Click on the latest workflow run
3. Click on **Deploy to Brilliant Cloud** job
4. Expand steps to see detailed logs

### Check Container Status on VM:

```bash
ssh -i niter_config_crew.pem ubuntu@36.255.71.37 "docker ps"
```

### View Container Logs:

```bash
ssh -i niter_config_crew.pem ubuntu@36.255.71.37 "cd CUET-MicrOps-Hackathon-Onsite && docker-compose -f docker/compose.prod.yml logs -f"
```

## 🔄 Rollback Process

If deployment fails or introduces issues:

```bash
# SSH into VM
ssh -i niter_config_crew.pem ubuntu@36.255.71.37

# Navigate to project
cd CUET-MicrOps-Hackathon-Onsite

# Checkout previous commit
git log --oneline -n 5  # View recent commits
git checkout <previous-commit-hash>

# Rebuild and restart
docker-compose -f docker/compose.prod.yml up -d --build --force-recreate
```

## 🛡️ Security Best Practices

✅ **DO:**

- Store SSH keys only in GitHub Secrets (never commit)
- Use read-only deployment keys when possible
- Regularly rotate SSH keys
- Monitor deployment logs

❌ **DON'T:**

- Commit `.pem` or `.ppk` files to the repository
- Share SSH keys in plain text
- Use root user for deployments
- Expose secrets in workflow logs

## 🐛 Troubleshooting

### Deployment Fails with "Permission Denied"

- Verify `SSH_PRIVATE_KEY` secret contains the full key including header/footer
- Ensure key file format is OpenSSH (not PuTTY)
- Check SSH key permissions on VM

### Deployment Fails with "Connection Refused"

- Verify `VM_IP` is correct (36.255.71.37)
- Check VM is running in Brilliant Cloud dashboard
- Verify port 22 is open in firewall

### Containers Don't Start After Deployment

- Check Docker logs: `docker-compose logs`
- Verify `.env` file exists on VM
- Check disk space: `df -h`
- Restart Docker: `sudo systemctl restart docker`

### Health Check Fails

- Wait 30 seconds for services to fully start
- Check if containers are running: `docker ps`
- Verify firewall allows ports 3000, 5173, 9000-9001
- Test health endpoint manually: `curl http://localhost:3000/health`

## 📞 Support

If you encounter issues:

1. Check the **Actions** tab for detailed error logs
2. Verify all GitHub Secrets are correctly configured
3. Test SSH connection manually: `ssh -i niter_config_crew.pem ubuntu@36.255.71.37`
4. Check VM resources: CPU, memory, disk space

## 🎯 Next Steps

After setting up GitHub Actions deployment:

1. **Add Status Badge** to README.md:

   ```markdown
   ![Deploy Status](https://github.com/YOUR_USERNAME/CUET-MicrOps-Hackathon-Onsite/workflows/Deploy%20to%20Production/badge.svg)
   ```

2. **Configure Branch Protection**:
   - Require CI to pass before merging
   - Require pull request reviews

3. **Set Up Monitoring**:
   - Add health check monitoring (UptimeRobot)
   - Configure error alerts (Sentry)
   - Set up log aggregation

4. **Implement Blue-Green Deployment**:
   - Zero-downtime deployments
   - Quick rollback capability
