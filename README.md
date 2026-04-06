# Best Version - Game Metadata Application

A comprehensive game metadata application for tracking and managing RPG game information with submission workflows, newsletter distribution, and an admin dashboard.

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git
- For SSL: Internet connectivity for Let's Encrypt validation

### Deployment

```bash
# Clone repository
git clone <repo-url> /opt/best-version
cd /opt/best-version

# Configure environment
cp .env.example .env
nano .env  # Update RESEND_API_KEY, SITE_URL, COOKIE_SECRET, ADMIN_PASSWORD

# Deploy
./scripts/deploy.sh
```

### Access

- HTTP: http://localhost
- HTTPS: https://localhost (after SSL setup)
- API: http://localhost:3000
- Admin: http://localhost/admin

## Architecture

- **Frontend**: Astro static site served by nginx
- **Backend**: Node.js Express API
- **Data Persistence**: Docker named volumes (games, submissions, newsletters, ssl)
- **Security**: SSL/TLS via Let's Encrypt, security headers, rate limiting, CSRF protection

## Project Structure

```
.
├── src/                 # Node.js backend
│   ├── index.js         # Application entry point
│   ├── config/          # Configuration
│   ├── services/        # Business logic services
│   ├── routes/          # API routes
│   └── middleware/      # Express middleware
├── frontend/            # Astro frontend
│   ├── src/            # Source files
│   └── dist/           # Built output
├── public/             # Static public assets
├── games/              # Game metadata JSON files (persistent volume)
├── submissions/        # User submissions (persistent volume)
├── newsletters/        # Newsletter data (persistent volume)
├── nginx/              # nginx configuration
├── scripts/            # Deployment and management scripts
├── docker-compose.yml  # Docker orchestration
├── Dockerfile          # Container build configuration
└── .env                # Environment configuration (not in git)
```

## Key Features

- **Game Metadata Management**: Load, validate, and query game metadata
- **Search & Filtering**: Search by title, genre, theme, platform, difficulty, reception
- **Recommendations**: Get similar games based on genres and themes
- **User Submissions**: Submit new games or edits with validation
- **DMCA Processing**: Handle DMCA takedown requests
- **Deletion Requests**: Process user data deletion requests
- **Newsletter Distribution**: Build and send newsletters to subscribers
- **Admin Dashboard**: Manage submissions, games, and system settings
- **Performance Optimization**: Memory caching, image optimization, CDN headers

## Data Volumes

| Volume | Contents |
|--------|----------|
| `best-version_games` | Game metadata JSON files |
| `best-version_submissions` | User game submissions |
| `best-version_newsletters` | Subscriber and newsletter data |
| `best-version_ssl` | SSL certificates |

## Deployment Scripts

| Script | Description |
|--------|-------------|
| `./scripts/deploy.sh` | Deploy application to Docker |
| `./scripts/backup.sh create` | Create full backup |
| `./scripts/backup.sh list` | List available backups |
| `./scripts/restore.sh` | Restore from latest backup |
| `./scripts/restore.sh <backup-name>` | Restore from specific backup |
| `./scripts/rollback.sh state` | View current state |
| `./scripts/ssl-setup.sh create` | Obtain SSL certificate |
| `./scripts/ssl-setup.sh renew` | Renew SSL certificate |
| `./scripts/setup-server.sh` | Setup fresh server |

## Environment Configuration

Edit `.env` file:

```bash
# Application
NODE_ENV=production
PORT=3000

# Site URL (UPDATE FOR PRODUCTION)
SITE_URL=http://localhost

# Email (Resend)
RESEND_API_KEY=your-resend-api-key

# Security (GENERATE SECURE VALUES)
COOKIE_SECRET=$(openssl rand -base64 32)
ADMIN_PASSWORD=$(openssl rand -base64 32)

# Settings
ADMIN_EMAIL=admin@best-version.com
NEWSLETTER_EMAIL=newsletter@best-version.com
```

## Container Management

```bash
# Status
docker-compose ps

# Logs
docker-compose logs -f
docker-compose logs app

# Stop/Start
docker-compose stop
docker-compose start

# Restart
docker-compose restart

# View container
docker exec -it best-version sh
```

## Volume Management

```bash
# List volumes
docker volume ls | grep best-version

# Inspect volume
docker volume inspect best-version_games

# View volume contents
docker run --rm -v best-version_games:/data alpine ls /data

# Count files
docker run --rm -v best-version_games:/data alpine find /data -name "*.json" | wc -l
```

## Health Checks

```bash
# Backend health
curl http://localhost:3000/health

# Frontend health
curl http://localhost/health

# API endpoint
curl http://localhost:3000/api/games | head -c 200
```

## Performance Endpoints

```bash
# Performance metrics
curl http://localhost:3000/api/performance/metrics

# Cache statistics
curl http://localhost:3000/api/performance/cache-stats
```

## Security

- HTTPS with Let's Encrypt certificates
- Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- Rate limiting on API endpoints
- Input sanitization
- CSRF protection
- Non-root container user
- Environment variables for secrets

## SSL Certificate Management

```bash
# Create certificate
sudo ./scripts/ssl-setup.sh create

# Renew certificate
sudo ./scripts/ssl-setup.sh renew

# Check status
./scripts/ssl-setup.sh status

# Self-signed (dev only)
./scripts/ssl-setup.sh self-signed
```

## Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

## Local Development

```bash
# Install dependencies
npm install

# Start backend
npm start

# Start frontend
npm run dev:frontend
```

## Disaster Recovery

### Full Restore from Backup

```bash
# On new server
curl -fsSL https://get.docker.com | sh
git clone <repo-url> /opt/best-version
cd /opt/best-version

# Copy backup
scp -r user@backup-server:/path/to/backups/best-version-backup_* /opt/best-version/backups/

# Restore
./scripts/restore.sh best-version-backup_TIMESTAMP
```

## Documentation

See `docs/` directory:

- `DEPLOYMENT.md` - Complete deployment guide
- `PRODUCTION-CHECKLIST.md` - Pre-deployment checklist
- `NEW-SERVER-DEPLOYMENT.md` - New server setup
- `SETUP-GUIDE.md` - Detailed setup instructions
- `QUICK-START.md` - Quick reference

## Support

For issues or questions:

1. Check logs: `docker-compose logs -f`
2. Review `docs/` documentation
3. Check `scripts/README.md` for script usage
