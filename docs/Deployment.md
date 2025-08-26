Deployment Guide
Prerequisites

Docker and Docker Compose
PostgreSQL 12+
Redis 6+
Node.js 16+ (for manual deployment)
Nginx (for reverse proxy)
SSL Certificate (for production)

Production Deployment
1. Docker Deployment (Recommended)
Step 1: Prepare Environment
bash# Clone repository
git clone <repository-url>
cd url-shortener

# Copy and configure environment
cp .env.example .env
Step 2: Configure Environment Variables
bash# Edit .env file
nano .env

# Required production settings:
NODE_ENV=production
BASE_URL=https://your-domain.com
DB_PASSWORD=your_secure_db_password
REDIS_PASSWORD=your_secure_redis_password
Step 3: Deploy with Docker Compose
bash# Build and start services
docker-compose -f docker/docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker/docker-compose.prod.yml logs -f

# Run database migrations
docker-compose -f docker/docker-compose.prod.yml exec app npm run setup-db
Step 4: Configure SSL (Let's Encrypt)
bash# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Update nginx configuration
sudo cp docker/nginx.prod.conf /etc/nginx/sites-available/url-shortener
sudo ln -s /etc/nginx/sites-available/url-shortener /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
2. Manual Deployment
Step 1: Server Setup (Ubuntu 20.04+)
bash# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Redis
sudo apt install redis-server

# Install Nginx
sudo apt install nginx

# Install PM2 for process management
sudo npm install -g pm2
Step 2: Database Setup
bash# Create database and user
sudo -u postgres psql

CREATE DATABASE url_shortener_prod;
CREATE USER url_shortener WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE url_shortener_prod TO url_shortener;
\q
Step 3: Application Setup
bash# Create application directory
sudo mkdir -p /var/www/url-shortener
sudo chown $USER:$USER /var/www/url-shortener
cd /var/www/url-shortener

# Clone and setup application
git clone <repository-url> .
npm ci --production

# Configure environment
cp .env.example .env
nano .env  # Edit with production values

# Run database migrations
npm run setup-db

# Create logs directory
mkdir -p logs
Step 4: PM2 Process Management
bash# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'url-shortener',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    log_file: './logs/pm2.log',
    out_file: './logs/pm2-out.log',
    error_file: './logs/pm2-error.log',
    max_memory_restart: '500M'
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
Step 5: Nginx Configuration
bash# Create nginx config
sudo tee /etc/nginx/sites-available/url-shortener << EOF
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/url-shortener /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
Horizontal Scaling
Load Balancer Setup
nginxupstream app_servers {
    least_conn;
    server 10.0.1.10:3000 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:3000 max_fails=3 fail_timeout=30s;
    server 10.0.1.12:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://app_servers;
        # ... other proxy settings
    }
}
Database Scaling
yaml# docker-compose.scale.yml
version: '3.8'
services:
  postgres-master:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: url_shortener
      POSTGRES_REPLICATION_MODE: master
      POSTGRES_REPLICATION_USER: replicator
      POSTGRES_REPLICATION_PASSWORD: replicator_password

  postgres-slave:
    image: postgres:15-alpine
    environment:
      POSTGRES_MASTER_SERVICE: postgres-master
      POSTGRES_REPLICATION_MODE: slave
      POSTGRES_REPLICATION_USER: replicator
      POSTGRES_REPLICATION_PASSWORD: replicator_password
Redis Clustering
bash# Redis Cluster setup
redis-cli --cluster create \
  127.0.0.1:7000 127.0.0.1:7001 127.0.0.1:7002 \
  127.0.0.1:7003 127.0.0.1:7004 127.0.0.1:7005 \
  --cluster-replicas 1
Monitoring and Maintenance
Health Monitoring
bash# Create health check script
cat > /usr/local/bin/health-check.sh << 'EOF'
#!/bin/bash
HEALTH_URL="http://localhost:3000/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "$(date): Health check passed"
    exit 0
else
    echo "$(date): Health check failed (HTTP $RESPONSE)"
    # Restart application
    pm2 restart url-shortener
    exit 1
fi
EOF

chmod +x /usr/local/bin/health-check.sh

# Add to crontab
echo "*/5 * * * * /usr/local/bin/health-check.sh >> /var/log/health-check.log 2>&1" | crontab -
Log Rotation
bash# Create logrotate configuration
sudo tee /etc/logrotate.d/url-shortener << EOF
/var/www/url-shortener/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
Backup Strategy
bash#!/bin/bash
# backup.sh - Database and Redis backup script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/url-shortener"
mkdir -p $BACKUP_DIR

# PostgreSQL backup
pg_dump -h localhost -U url_shortener -d url_shortener_prod | gzip > $BACKUP_DIR/postgres_$DATE.sql.gz

# Redis backup
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/postgres_$DATE.sql.gz s3://your-backup-bucket/
aws s3 cp $BACKUP_DIR/redis_$DATE.rdb s3://your-backup-bucket/

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +30 -delete
Performance Tuning
PostgreSQL Optimization
sql-- postgresql.conf optimizations for production
shared_buffers = '256MB'
effective_cache_size = '1GB' 
work_mem = '4MB'
maintenance_work_mem = '64MB'
checkpoint_completion_target = 0.9
wal_buffers = '16MB'
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
max_connections = 100
Redis Optimization
conf# redis.conf optimizations
maxmemory 512mb
maxmemory-policy allkeys-lru
timeout 300
tcp-keepalive 60
save 900 1
save 300 10
save 60 10000
Security Checklist

 SSL/TLS certificates installed and configured
 Database passwords are strong and unique
 Redis password protection enabled
 Firewall configured (only necessary ports open)
 Regular security updates applied
 Log monitoring and alerting configured
 Rate limiting properly configured
 Input validation in place
 CORS properly configured
 Security headers configured in Nginx

Troubleshooting
Common Issues
Application won't start:
bash# Check logs
pm2 logs url-shortener

# Check database connection
npm run setup-db

# Check Redis connection
redis-cli ping
High memory usage:
bash# Check Node.js memory usage
pm2 monit

# Check for memory leaks
node --inspect server.js
Database connection issues:
bash# Check PostgreSQL status
sudo systemctl status postgresql

# Check connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Check configuration
sudo -u postgres psql -c "SHOW all;"
Redis connection issues:
bash# Check Redis status
sudo systemctl status redis

# Check Redis memory
redis-cli info memory

# Check Redis connections
redis-cli info clients