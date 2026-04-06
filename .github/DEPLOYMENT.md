# Deployment Configuration Guide

## Overview

This repository uses GitHub Actions for automated deployment of the Best Version application. The deployment pipeline builds a Docker image, pushes it to the GitHub Container Registry, and deploys it to a remote server via SSH.

## Prerequisites

- A remote server with Docker installed
- SSH access to the server
- A GitHub repository with GitHub Actions enabled

## Required GitHub Secrets

Configure the following secrets in your GitHub repository (Settings -> Secrets and variables -> Actions):

### Deployment Connection Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DEPLOY_HOST` | Server hostname or IP address | `192.168.1.100` or `example.com` |
| `DEPLOY_USER` | SSH username for deployment | `deploy` or `root` |
| `DEPLOY_SSH_KEY` | SSH private key (openssh format) | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `DEPLOY_PORT` | SSH port (optional, default: 22) | `2222` |

### Container Registry

The workflow uses GitHub's container registry (GHCR) automatically. No additional secrets are needed as it uses the built-in `GITHUB_TOKEN`.

### Optional: Notification Secrets

| Secret Name | Description | When to use |
|-------------|-------------|-------------|
| `SLACK_WEBHOOK_URL` | Slack webhook URL for deployment notifications | When you want Slack notifications |

## Server Setup

### 1. Install Docker on the Server

```bash
# Update package index
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (replace 'deploy' with your username)
sudo usermod -aG docker deploy
sudo systemctl enable docker
```

### 2. Create SSH Key for Deployment

```bash
# Generate SSH key for deployment (on your local machine)
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""

# Add public key to server's authorized_keys
# Example:
# ssh-copy-id -i ~/.ssh/deploy_key.pub deploy@your-server.com

# Get the private key content
cat ~/.ssh/deploy_key

# Paste into GitHub Secrets as DEPLOY_SSH_KEY
```

### 3. Clone Repository and Create Directories

```bash
# SSH into server
ssh deploy@your-server.com

# Create application directory
mkdir -p /opt/best-version
cd /opt/best-version

# Create data directories
mkdir -p games
mkdir -p submissions

# Set permissions
sudo chown -R $USER:$USER /opt/best-version

# Create a docker-compose file (optional, for manual management)
cat > docker-compose.yml << EOF
version: '3.8'
services:
  best-version:
    image: ghcr.io/YOUR_USERNAME/YOUR_REPO:latest
    container_name: best-version
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - ./games:/app/games
      - ./submissions:/app/submissions
    environment:
      - NODE_ENV=production
EOF
```

## Workflow Behavior

### On Push to Main Branch

1. **Build Job** (always runs):
   - Checks out code
   - Builds Docker image locally
   - Runs health check on image
   - Outputs metadata for deploy job

2. **Deploy Job** (only on push to main):
   - Logs into GHCR
   - Pushes image to registry
   - Connects to server via SSH
   - Pulls latest image
   - Stops old container
   - Starts new container
   - Runs health check with retries
   - Sends notification if configured

### Manual Rollback

The workflow supports manual rollback via GitHub Actions UI:

1. Go to Actions tab
2. Select "Build and Deploy" workflow
3. Click "Run workflow"
4. Select "Manual Rollback"
5. Enter the version tag to rollback to
6. Click "Run workflow"

## Rollback Procedures

### Automatic Rollback Detection

If the deployment health check fails, the deployment job will fail, and you can manually trigger the rollback.

### Manual Rollback Steps

1. **Identify the last known good version:**
   ```bash
   ssh deploy@server "docker images ghcr.io/your-repo --format '{{.Tag}} {{.ID}}'"
   ```

2. **Trigger rollback via GitHub Actions:**
   - Go to Actions -> Build and Deploy -> Run workflow
   - Select "Manual Rollback"
   - Enter the version tag

3. **Verify rollback:**
   ```bash
   ssh deploy@server "docker ps --filter name=best-version"
   ssh deploy@server "docker logs --tail 50 best-version"
   ```

### Emergency Rollback (Direct Server Access)

If GitHub Actions is unavailable:

```bash
# SSH into server
ssh deploy@your-server.com

# Stop current container
docker stop best-version
docker rm retrogamegame-curator

# Pull previous version
docker pull ghcr.io/your-repo:previous_version_tag

# Start with previous version
docker run -d \
  --name best-version \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /opt/best-version/games:/app/games \
  -v /opt/best-version/submissions:/app/submissions \
  ghcr.io/your-repo:previous_version_tag
```

## Troubleshooting

### Common Issues

1. **SSH Connection Fails:**
   - Verify `DEPLOY_HOST`, `DEPLOY_USER`, and `DEPLOY_SSH_KEY` secrets
   - Check SSH key permissions on server
   - Verify SSH port is correct

2. **Docker Pull Fails:**
   - Verify GITHUB_TOKEN has package read permissions
   - Check repository name in workflow matches GHCR path

3. **Health Check Fails:**
   - Check application logs: `docker logs best-version`
   - Verify port 3000 is accessible
   - Check if `/health` endpoint exists

4. **Container Won't Start:**
   - Check volume mounts exist: `ls -la /opt/best-version/`
   - Verify environment variables are set
   - Check container logs: `docker logs best-version`

## Security Considerations

1. **SSH Key Security:**
   - Use SSH keys with minimal privileges
   - Rotate keys periodically
   - Never commit SSH keys to repository

2. **Container Security:**
   - Run containers as non-root user (configured in Dockerfile)
   - Use volume mounts for data persistence
   - Regular security updates via `docker pull ghcr.io/your-repo:latest`

3. **Secret Security:**
   - Limit who can view/edit secrets in repository settings
   - Use repository-level secrets rather than org-level
   - Rotate secrets if compromised

## Testing Locally

Before pushing to main branch, test locally:

```bash
# Build image locally
docker build -t best-version:local .

# Run locally
docker run -d -p 3000:3000 --name test best-version:local

# Test health check
curl http://localhost:3000/health

# Cleanup
docker stop test
docker rm test
```

## Versioning

Images are tagged with:
- SHA short hash (e.g., `abc1234`) - unique identifier for each build
- Branch name (e.g., `main`) - current development branch
- `latest` - only updated on main branch pushes
