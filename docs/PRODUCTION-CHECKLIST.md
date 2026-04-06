# Production Deployment Checklist

Pre-deployment verification for Best Version.

## Before First Deploy

### Infrastructure

- [ ] Server provisioned (VPS or Raspberry Pi)
- [ ] Docker 20.10+ installed
- [ ] Docker Compose 2.0+ installed
- [ ] Firewall configured (ports 22, 80, 443 open)
- [ ] Domain name configured (A record pointing to server IP)
- [ ] SSH key-based authentication configured
- [ ] Git installed on server

### GitHub Repository

- [ ] Repository created on GitHub
- [ ] Code pushed to `main` branch
- [ ] GitHub Actions enabled
- [ ] Secrets configured:
  - [ ] `DEPLOY_HOST`
  - [ ] `DEPLOY_USER`
  - [ ] `DEPLOY_SSH_KEY` (with write access for deploying)
  - [ ] `RESEND_API_KEY`
  - [ ] `SITE_URL`
  - [ ] `ADMIN_PASSWORD` (for admin authentication)
  - [ ] `COOKIE_SECRET` (generate a random secure string)

### Application Configuration

- [ ] `.env` file created with production values
- [ ] `RESEND_API_KEY` configured for email functionality
- [ ] `SITE_URL` matches production domain
- [ ] `ADMIN_PASSWORD` set for admin dashboard access
- [ ] `COOKIE_SECRET` is a random, secure string (32+ characters)

### Content

- [ ] Game data files exist in `games/` directory
- [ ] Sample submission data in `submissions/` directory
- [ ] Public assets in `public/` directory

## Post-Deploy Verification

### Health Checks

- [ ] Backend health check: `curl http://localhost:3000/health`
- [ ] Frontend health check: `curl http://localhost:80/health`
- [ ] Container status: `docker-compose ps` shows all services running

### API Endpoints

- [ ] GET `/` - Returns index page
- [ ] GET `/api/games` - Returns games list
- [ ] GET `/api/games/search?q=test` - Returns search results
- [ ] GET `/api/games/:slug` - Returns game details

### Frontend

- [ ] Static files serve correctly on port 80
- [ ] nginx reverse proxy routes `/api/*` to backend
- [ ] No 404 errors on known pages
- [ ] Static assets (CSS, JS) load correctly

### Security

- [ ] HTTPS enforced (if SSL configured)
- [ ] Security headers present
- [ ] Rate limiting working
- [ ] Input sanitization active

### Backups

- [ ] Backup script exists and is executable
- [ ] Backup directory has correct permissions
- [ ] First manual backup created successfully

### Monitoring

- [ ] Logs accessible via `docker-compose logs`
- [ ] Container resource usage visible via `docker stats`
- [ ] Health check logs available

## Ongoing Maintenance

### Daily

- [ ] (Automated) Backup runs at 2 AM via cron
- [ ] Monitor error logs for issues

### Weekly

- [ ] Review backup retention and cleanup
- [ ] Check disk space usage
- [ ] Review subscriber statistics (if newsletter active)

### Monthly

- [ ] Update system packages (`apt-get update && apt-get upgrade`)
- [ ] Pull latest Docker images
- [ ] Review security logs
- [ ] Check SSL certificate expiry (if using Let's Encrypt)

### Quarterly

- [ ] Review and rotate secrets
- [ ] Audit access logs
- [ ] Review and update dependencies
- [ ] Test backup restore procedure

## Emergency Procedures

### Service Unavailable

1. Check container status: `docker-compose ps`
2. Check logs: `docker-compose logs -f`
3. Restart services: `docker-compose restart`
4. If still failing: `docker-compose down && docker-compose up -d`
5. Rollback if recent deploy: `./scripts/rollback.sh local <previous-commit>`

### Data Loss

1. Stop services: `docker-compose down`
2. Restore from backup: `./scripts/backup.sh restore <backup-file>`
3. Verify data integrity
4. Restart services: `docker-compose up -d`

### Security Breach

1. Stop all services: `docker-compose down`
2. Preserve logs for investigation
3. Rotate all secrets and credentials
4. Review access logs for unauthorized access
5. Deploy from known good commit: `./scripts/rollback.sh local <good-commit>`

## Support Resources

- **Documentation:** `docs/DEPLOYMENT.md`
- **Deployment Script:** `scripts/deploy.sh`
- **Backup Script:** `scripts/backup.sh`
- **Rollback Script:** `scripts/rollback.sh`
- **Setup Script:** `scripts/setup-server.sh`
- **GitHub Actions:** `.github/workflows/deploy.yml`
