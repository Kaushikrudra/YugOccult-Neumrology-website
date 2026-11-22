# VPS Production Deployment Guide
**Project:** YugOccult Learning Academy (Yug Skill Institute)  
**Target Architecture:** Single Ubuntu 22.04 / 24.04 LTS VPS with Nginx, Node.js 20 LTS, PostgreSQL 16, and PM2.

---

## 1. Prerequisites & Server Sizing

| Component | Minimum Recommended Specification |
| :--- | :--- |
| **Operating System** | Ubuntu 22.04 LTS or Ubuntu 24.04 LTS (x86_64) |
| **vCPU** | 1 Core (2 Cores recommended for high traffic) |
| **RAM** | 2 GB (with 2 GB Swap space enabled) |
| **Disk Storage** | 25 GB NVMe / SSD |
| **Public Ports** | 80 (HTTP), 443 (HTTPS), 22 (SSH) |
| **Domain** | Active domain pointed via DNS A records to your VPS IP (`yugoccult.in`, `www.yugoccult.in`) |

---

## 2. Initial Server Hardening & Packages

SSH into your fresh VPS as `root`:

```bash
ssh root@YOUR_SERVER_IP
```

### 2.1 Update System & Create Application User
```bash
apt update && apt upgrade -y
apt install -y curl git ufw build-essential software-properties-common fail2ban

# Create dedicated non-root application user
adduser --gecos "" deployer
usermod -aG sudo deployer

# Setup SSH key access for deployer
mkdir -p /home/deployer/.ssh
cp /root/.ssh/authorized_keys /home/deployer/.ssh/ 2>/dev/null || true
chown -R deployer:deployer /home/deployer/.ssh
chmod 700 /home/deployer/.ssh
chmod 600 /home/deployer/.ssh/authorized_keys 2>/dev/null || true
```

### 2.2 Configure UFW Firewall
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status verbose
```

### 2.3 Configure 2GB Swap File (Ensures smooth npm builds)
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 3. Install Runtime Stack

Switch to the `deployer` user:
```bash
su - deployer
```

### 3.1 Install Node.js 20 LTS & PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# Verify installation
node -v   # Should output v20.x.x
npm -v    # Should output 10.x.x
pm2 -v
```

### 3.2 Install PostgreSQL 16
```bash
sudo apt install -y postgresql postgresql-contrib

# Verify PostgreSQL is active
sudo systemctl status postgresql --no-pager
```

### 3.3 Install Nginx & Certbot
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

---

## 4. PostgreSQL Database Setup

Create the database and a dedicated user:

```bash
sudo -u postgres psql
```

Inside the PostgreSQL prompt (`postgres=#`), run:

```sql
CREATE DATABASE yug_occult_db;
CREATE USER yug_user WITH ENCRYPTED PASSWORD 'YOUR_STRONG_DATABASE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE yug_occult_db TO yug_user;

-- Grant schema permissions for public schema in PostgreSQL 15+
\c yug_occult_db
GRANT ALL ON SCHEMA public TO yug_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO yug_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO yug_user;

\q
```

---

## 5. Clone and Configure Application

### 5.1 Clone Repository
```bash
sudo mkdir -p /var/www/yugoccult
sudo chown -R deployer:deployer /var/www/yugoccult

# Clone your private repository or sync files
git clone YOUR_REPOSITORY_URL /var/www/yugoccult
cd /var/www/yugoccult
```

### 5.2 Server Environment Configuration
```bash
cd /var/www/yugoccult/server
cp .env.example .env
nano .env
```

**Required values to edit in `/var/www/yugoccult/server/.env`:**
```ini
HOST=127.0.0.1
PORT=5000
NODE_ENV=production
CLIENT_URL=https://yugoccult.in
SERVER_PUBLIC_URL=https://yugoccult.in
TRUST_PROXY_HOPS=1

DATABASE_URL=postgresql://yug_user:YOUR_STRONG_DATABASE_PASSWORD@127.0.0.1:5432/yug_occult_db
DB_SSL=false

# Generate with: openssl rand -base64 32
JWT_SECRET=YOUR_SECURE_JWT_SECRET_KEY_MIN_32_CHARS

ADMIN_NOTIFY_EMAIL=yanushka655@gmail.com
ADMIN_EMAIL=admin@yugoccult.in
ADMIN_PASSWORD=YOUR_INITIAL_ADMIN_PASSWORD

# SMTP Configuration (Hostinger, Google Workspace, or Amazon SES)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=support@yugoccult.in
SMTP_PASS=YOUR_EMAIL_PASSWORD
SMTP_FROM="YugOccult Learning Academy" <support@yugoccult.in>
```

### 5.3 Run Database Migrations & Seed Admin
```bash
cd /var/www/yugoccult/server
npm ci
npm run migrate
npm run seed:admin
```

### 5.4 Test Email Delivery
```bash
# Verify SMTP credentials and email dispatch
npm run mail:test
```

### 5.5 Build Backend
```bash
npm run build
```

---

## 6. Build Client Frontend

```bash
cd /var/www/yugoccult/client
npm ci

# If you are ready for search engines to index your site, set VITE_ALLOW_INDEXING=true:
export VITE_ALLOW_INDEXING=true
export VITE_SITE_URL=https://yugoccult.in

npm run build
```

Verify that `client/dist/index.html` and `client/dist/robots.txt` were generated.

---

## 7. Setup PM2 Process Manager

Create logs folder and start backend with PM2:

```bash
cd /var/www/yugoccult
mkdir -p /var/www/yugoccult/server/logs

# Start application via ecosystem file
pm2 start deploy/pm2/ecosystem.config.cjs --env production

# Check status
pm2 status
pm2 logs yugoccult-api --lines 20

# Configure PM2 to start automatically on system boot
pm2 startup systemd -u deployer --hp /home/deployer
# (Run the sudo env PATH=... command that PM2 outputs)
pm2 save
```

---

## 8. Configure Nginx & SSL Certificate

### 8.1 Setup Nginx Virtual Host
```bash
sudo cp /var/www/yugoccult/deploy/nginx/yugoccult.conf.template /etc/nginx/sites-available/yugoccult.conf

# Replace placeholders with your actual domain and paths
sudo sed -i 's|YOUR_DOMAIN|yugoccult.in|g' /etc/nginx/sites-available/yugoccult.conf
sudo sed -i 's|APP_DIR|/var/www/yugoccult|g' /etc/nginx/sites-available/yugoccult.conf
sudo sed -i 's|APP_PORT|5000|g' /etc/nginx/sites-available/yugoccult.conf

# Enable site
sudo ln -sf /etc/nginx/sites-available/yugoccult.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

### 8.2 Obtain Let's Encrypt SSL Certificate
```bash
sudo certbot --nginx -d yugoccult.in -d www.yugoccult.in
```

### 8.3 Test & Reload Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 9. Automated Daily Backups

Setup a daily cron job to back up the database and uploaded media:

```bash
# Ensure backup script is executable
chmod +x /var/www/yugoccult/deploy/scripts/backup.sh

# Edit crontab
crontab -e
```

Add this line to run the backup daily at 2:30 AM:
```cron
30 2 * * * /var/www/yugoccult/deploy/scripts/backup.sh >> /var/log/yugoccult-backup.log 2>&1
```

---

## 10. Subsequent Deployments

For future updates, simply execute:
```bash
cd /var/www/yugoccult
./deploy/scripts/deploy.sh main
```

---

## 11. Production Verification Checklist

Run these smoke tests directly from your terminal or browser:

1. **API Health Check:**
   ```bash
   curl -s https://yugoccult.in/api/health | jq .
   # Expected response: {"status":"ok","service":"astrology-numerology-api", ...}
   ```
2. **Legal Pages Public API:**
   ```bash
   curl -s https://yugoccult.in/api/pages/terms | jq .title
   # Expected response: "Terms & Conditions"
   ```
3. **Robots.txt & Sitemap:**
   ```bash
   curl -I https://yugoccult.in/robots.txt
   curl -s https://yugoccult.in/sitemap.xml | grep "<loc>"
   ```
4. **Honeypot Contact Submission:**
   ```bash
   curl -X POST https://yugoccult.in/api/enquiries \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Bot","email":"bot@test.com","phone":"9999999999","subject":"Test","message":"Spam bot","website":"https://spam.com"}'
   # Expected response: 200 generic message without saving or notifying admin
   ```
5. **Forgot Password Enumeration Prevention:**
   ```bash
   curl -X POST https://yugoccult.in/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"nonexistent_user@example.com"}'
   # Expected response: 200 generic message
   ```
