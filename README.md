# URL Shortener

A production-ready, scalable URL shortener built with Node.js, Express, PostgreSQL, and Redis. Features comprehensive analytics, rate limiting, and robust error handling.

## Features

- **URL Shortening**: Convert long URLs to short, memorable links
- **Custom Short Codes**: Create branded short links with custom codes
- **Analytics**: Track clicks, geographic data, referrers, and more
- **Rate Limiting**: Protect against abuse with configurable rate limits
- **Caching**: Redis-based caching for optimal performance
- **Health Monitoring**: Built-in health checks and monitoring
- **Production Ready**: Comprehensive logging, error handling, and security
- **Scalable Architecture**: Designed for horizontal scaling
- **Docker Support**: Easy deployment with Docker and Docker Compose

## Quick Start

### Prerequisites

- Node.js 16+ (for manual setup)
- Docker and Docker Compose (recommended)
- PostgreSQL 12+
- Redis 6+

### Option 1: Docker Deployment (Recommended)

1. **Clone and configure:**
```bash
git clone <repository-url>
cd url-shortener
cp .env.example .env
# Edit .env with your configuration
```

2. **Start with Docker Compose:**
```bash
docker-compose up -d
```

3. **Initialize database:**
```bash
docker-compose exec app npm run setup-db
```

4. **Access the application:**
- API: http://localhost:3000
- Health check: http://localhost:3000/health

### Option 2: Manual Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your database and Redis settings
```

3. **Setup database:**
```bash
npm run setup-db
```

4. **Start the application:**
```bash
npm start
```

## API Usage

### Shorten a URL
```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/very-long-url"}'
```

Response:
```json
{
  "shortUrl": "http://localhost:3000/abc123",
  "shortCode": "abc123",
  "originalUrl": "https://example.com/very-long-url",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Create Custom Short Code
```bash
curl -X POST http://localhost:3000/api/custom-shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/page", "customCode": "my-link"}'
```

### Get Analytics
```bash
curl http://localhost:3000/api/analytics/abc123?period=7d
```

### Access Short URL
Navigate to `http://localhost:3000/abc123` to be redirected to the original URL.

## Architecture

```
┌─────────────────────────────────────────┐
│              Load Balancer              │
│               (Nginx)                   │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│           API Gateway                   │
│        (Rate Limiting)                  │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
┌───▼────┐ ┌──▼─────┐ ┌─▼─────┐
│ App 1  │ │ App 2  │ │ App N │
│Node.js │ │Node.js │ │Node.js│
└───┬────┘ └────┬───┘ └───┬───┘
    └──────┬─────────┬────┘
           │         │
      ┌────▼───┐ ┌───▼────┐
      │ Redis  │ │Postgres│
      │(Cache) │ │   DB   │
      └────────┘ └────────┘
```

## Project Structure

```
url-shortener/
├── src/                     # Source code
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── models/            # Database models
│   ├── routes/            # Route definitions
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── app.js             # Express app setup
├── migrations/            # Database migrations
├── tests/                # Test suites
├── docs/                 # Documentation
├── docker/               # Docker configurations
├── scripts/              # Utility scripts
└── server.js             # Application entry point
```

## Configuration

Key environment variables:

```bash
# Application
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=url_shortener
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=3600000
```

See `.env.example` for all available options.

## Testing

Run the test suite:

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## Production Deployment

### Docker Production Setup

1. **Use production compose file:**
```bash
docker-compose -f docker/docker-compose.prod.yml up -d
```

2. **Configure SSL with Let's Encrypt:**
```bash
sudo certbot --nginx -d your-domain.com
```

3. **Monitor with health checks:**
```bash
curl https://your-domain.com/health
```

### Manual Production Setup

1. **Install PM2 for process management:**
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

2. **Configure Nginx reverse proxy:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. **Setup database backups:**
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump url_shortener | gzip > backup_$DATE.sql.gz
EOF

# Schedule with cron
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

## Scaling

### Horizontal Scaling

- **Load Balancer**: Distribute traffic across multiple app instances
- **Database**: Use read replicas for analytics queries
- **Redis Cluster**: Scale cache layer horizontally
- **CDN**: Serve static assets and cache redirects globally

### Performance Optimization

- **Database Indexing**: Optimized indexes for fast lookups
- **Connection Pooling**: Efficient database connection management
- **Caching Strategy**: Multi-level caching (Redis + in-memory)
- **Rate Limiting**: Protect against abuse and ensure fair usage

## Monitoring

### Health Checks
```bash
curl http://localhost:3000/health
```

### Metrics
- Request rates and response times
- Database connection pool status
- Redis memory usage
- Error rates by endpoint

### Logging
- Structured JSON logging
- Request/response logging
- Error tracking
- Performance metrics

## Security

- **Input Validation**: Comprehensive URL and parameter validation
- **Rate Limiting**: Per-IP rate limiting with Redis backend
- **CORS Protection**: Configurable CORS policies
- **Security Headers**: Helmet.js security headers
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization

## API Documentation

Comprehensive API documentation is available at `/docs/API.md`.

Key endpoints:
- `POST /api/shorten` - Create short URL
- `POST /api/custom-shorten` - Create custom short URL
- `GET /:shortCode` - Redirect to original URL
- `GET /api/analytics/:shortCode` - Get URL analytics
- `GET /health` - Health check

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and add tests
4. Run tests: `npm test`
5. Commit changes: `git commit -am 'Add feature'`
6. Push to branch: `git push origin feature-name`
7. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- Documentation: `/docs/`
- Issues: GitHub Issues
- Email: support@your-domain.com

## Changelog

### v1.0.0
- Initial release
- URL shortening and redirection
- Analytics tracking
- Rate limiting
- Docker support
- Production deployment guides