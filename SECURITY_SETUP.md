# Security Setup Guide

This guide covers essential security configurations for production deployment.

## 1. Rotate All Secrets (CRITICAL)

### Generate a New Cookie Secret

```bash
# Generate a cryptographically secure 32-byte hex secret
openssl rand -hex 32
# Example output: a1b2c3d4e5f6... (64 hex characters)

# OR use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set in your `.env`:
```env
COOKIE_SECRET=<your-generated-secret>
```

### Set a Strong Admin Password

Requirements:
- Minimum 16 characters
- Mix of uppercase, lowercase, numbers, and symbols
- Not a dictionary word or common phrase

```bash
# Generate a strong password
node -e "const chars='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'; const p=Array(20).fill(0).map(()=>chars[Math.random()*chars.length]).join(''); console.log(p)"
```

Set in your `.env`:
```env
ADMIN_PASSWORD=<your-strong-password>
```

### Verify .env is NOT Committed

```bash
# Check if .env is in .gitignore
cat .gitignore | grep .env

# If not, add it:
echo ".env" >> .gitignore

# Check if .env was accidentally committed
git log -p --all -- .env

# If committed, you MUST purge it from history:
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Then force push (WARNING: rewrites history!)
git push --force --all
```

## 2. Configure Redis for Session Storage (PRODUCTION)

For production deployments, Redis-backed sessions are required for:
- Session persistence across restarts
- Horizontal scaling support
- Distributed session management

### Install Redis

```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# Or use Docker
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

### Configure Redis Authentication

```bash
# Edit redis.conf or set via command
docker exec redis redis-cli CONFIG SET requirepass <strong-redis-password>
```

### Update .env for Redis

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<your-redis-password>
REDIS_ENABLED=true

# Session Configuration
SESSION_STORE=redis
SESSION_TTL=86400  # 24 hours in seconds
```

### Verify Redis Connection

```bash
node -e "
const redis = require('redis');
const client = redis.createClient({
  host: 'localhost',
  port: 6379,
  password: process.env.REDIS_PASSWORD
});
client.on('error', err => console.error('Redis Error:', err));
client.on('connect', () => console.log('Redis connected!'));
client.connect();
"
```

## 3. Environment Validation Script

Add this to your startup to ensure required secrets are present:

```javascript
// Add to src/index.js before server startup
const requiredEnvVars = [
  'COOKIE_SECRET',
  'ADMIN_PASSWORD',
  'SITE_URL'
];

const missingEnvVars = requiredEnvVars.filter(envVar => {
  const value = process.env[envVar];
  if (!value || value.length === 0) {
    console.error(`Missing required environment variable: ${envVar}`);
    return true;
  }
  return false;
});

if (missingEnvVars.length > 0) {
  console.error('Application cannot start without required environment variables');
  process.exit(1);
}

// Warn about weak credentials
if (process.env.COOKIE_SECRET.length < 32) {
  console.warn('WARNING: COOKIE_SECRET should be at least 32 characters');
}

if (process.env.ADMIN_PASSWORD.length < 16) {
  console.warn('WARNING: ADMIN_PASSWORD should be at least 16 characters');
}
```

## 4. HTTPS Configuration (PRODUCTION)

### Generate SSL Certificates

```bash
# Generate self-signed certificate for testing
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365

# For production, use Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

### Update nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## 5. Security Monitoring

### Enable CSP Violation Reporting

The application is configured to report CSP violations to `/api/csp-report`. Monitor these for potential attacks:

```javascript
// Log CSP violations for analysis
app.post('/api/csp-report', (req, res) => {
  const violation = req.body;
  console.log('CSP Violation:', {
    blockedURI: violation.csp?.blockedURI,
    documentURI: violation.csp?.documentURI,
    disposition: violation.csp?.effectiveDirective,
    referrer: violation.csp?.referrer
  });
  res.status(200).send('OK');
});
```

### Audit Log Review

Review the audit log regularly:
```bash
tail -f .audit.log
```

## 6. Rate Limiting Configuration

Default settings:
- API: 1000 requests per 15 minutes per IP
- Auth endpoints: 5 attempts per 15 minutes per IP
- Submissions: 10 per 24 hours per IP

Adjust in `.env`:
```env
API_RATE_LIMIT=1000           # requests per 15 minutes
AUTH_RATE_LIMIT=5             # attempts per 15 minutes
SUBMISSION_RATE_LIMIT=10      # per 24 hours
```

## 7. Security Checklist

Before production deployment, verify:

- [ ] COOKIE_SECRET is 32+ characters, cryptographically random
- [ ] ADMIN_PASSWORD is 16+ characters, not a dictionary word
- [ ] .env file is in .gitignore and not committed
- [ ] Git history is purged of any previous .env files
- [ ] Redis is configured with authentication (if using Redis sessions)
- [ ] SSL/TLS certificates are valid and properly configured
- [ ] HSTS header is enabled
- [ ] CSP violations are being monitored
- [ ] Audit logs are being reviewed
- [ ] Rate limits are appropriate for your use case
- [ ] NODE_ENV is set to 'production'
- [ ] Port 3000 is not exposed externally (only nginx/proxy should be public)

## 8. Incident Response

If credentials are compromised:

1. **Immediately rotate all secrets:**
   - Generate new COOKIE_SECRET
   - Reset ADMIN_PASSWORD
   - Rotate Redis password

2. **Invalidate all sessions:**
   - Clear Redis session data: `redis-cli FLUSHDB`
   - Force all users to re-authenticate

3. **Review audit logs** for unauthorized access

4. **Update deployment** with new credentials

5. **Monitor** for continued suspicious activity

## 9. Additional Hardening (Recommended)

- Enable fail2ban for SSH and application logs
- Configure firewall rules (only necessary ports)
- Implement regular security scanning
- Set up intrusion detection
- Regular security audits and penetration testing
- Keep all dependencies updated

---

**Last Updated:** 2026-04-08  
**Security Contact:** admin@best-version.com
