# URL Shortener API Documentation

## Base URL
```
Production: https://your-domain.com
Development: http://localhost:3000
```

## Authentication
Currently, no authentication is required. Rate limiting is applied per IP address.

## Rate Limits
- **General API**: 100 requests per hour per IP
- **URL Shortening**: 50 requests per hour per IP
- **Redirects**: 1000 requests per hour per IP

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Endpoints

### 1. Shorten URL

Create a short URL from a long URL.

**Endpoint:** `POST /api/shorten`

**Request Body:**
```json
{
  "url": "https://example.com/very-long-url"
}
```

**Response:**
```json
{
  "shortUrl": "https://your-domain.com/abc123",
  "shortCode": "abc123",
  "originalUrl": "https://example.com/very-long-url",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid URL or missing URL parameter
- `429`: Rate limit exceeded
- `500`: Internal server error

**Example:**
```bash
curl -X POST https://your-domain.com/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/long-url"}'
```

### 2. Custom Short URL

Create a short URL with a custom short code.

**Endpoint:** `POST /api/custom-shorten`

**Request Body:**
```json
{
  "url": "https://example.com/very-long-url",
  "customCode": "my-custom-code"
}
```

**Response:**
```json
{
  "shortUrl": "https://your-domain.com/my-custom-code",
  "shortCode": "my-custom-code",
  "originalUrl": "https://example.com/very-long-url",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid URL or custom code
- `409`: Custom code already exists
- `429`: Rate limit exceeded
- `500`: Internal server error

**Custom Code Requirements:**
- 3-20 characters long
- Alphanumeric characters only (a-z, A-Z, 0-9)
- Case sensitive

**Example:**
```bash
curl -X POST https://your-domain.com/api/custom-shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/long-url", "customCode": "my-link"}'
```

### 3. Redirect to Original URL

Redirect to the original URL using the short code.

**Endpoint:** `GET /:shortCode`

**Response:** HTTP 302 redirect to original URL

**Status Codes:**
- `302`: Redirect to original URL
- `404`: Short code not found
- `410`: URL has been deleted
- `500`: Internal server error

**Example:**
```bash
curl -I https://your-domain.com/abc123
# Returns: Location: https://example.com/original-url
```

### 4. Get URL Information

Get information about a short URL without redirecting.

**Endpoint:** `GET /:shortCode/info`

**Response:**
```json
{
  "shortCode": "abc123",
  "originalUrl": "https://example.com/very-long-url",
  "shortUrl": "https://your-domain.com/abc123",
  "createdAt": "2024-01-15T10:30:00Z",
  "totalClicks": 42,
  "isActive": true
}
```

**Status Codes:**
- `200`: Success
- `404`: Short code not found
- `500`: Internal server error

**Example:**
```bash
curl https://your-domain.com/abc123/info
```

### 5. Get URL Analytics

Get detailed analytics for a short URL.

**Endpoint:** `GET /api/analytics/:shortCode`

**Query Parameters:**
- `period` (optional): Time period for analytics (`24h`, `7d`, `30d`, `all`)
- `groupBy` (optional): Group analytics by (`hour`, `day`, `country`, `browser`)

**Response:**
```json
{
  "shortCode": "abc123",
  "totalClicks": 156,
  "uniqueClicks": 98,
  "period": "7d",
  "clicksByDay": [
    {"date": "2024-01-15", "clicks": 23},
    {"date": "2024-01-16", "clicks": 45},
    {"date": "2024-01-17", "clicks": 12}
  ],
  "topCountries": [
    {"country": "US", "clicks": 67},
    {"country": "UK", "clicks": 23},
    {"country": "CA", "clicks": 8}
  ],
  "topBrowsers": [
    {"browser": "Chrome", "clicks": 89},
    {"browser": "Firefox", "clicks": 34},
    {"browser": "Safari", "clicks": 22}
  ],
  "referrers": [
    {"referrer": "google.com", "clicks": 45},
    {"referrer": "twitter.com", "clicks": 23},
    {"referrer": "direct", "clicks": 67}
  ]
}
```

**Status Codes:**
- `200`: Success
- `404`: Short code not found
- `500`: Internal server error

**Example:**
```bash
curl https://your-domain.com/api/analytics/abc123?period=7d&groupBy=day
```

### 6. List URLs

Get a paginated list of all URLs (useful for admin purposes).

**Endpoint:** `GET /api/urls`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sortBy` (optional): Sort field (`createdAt`, `clicks`, `originalUrl`)
- `sortOrder` (optional): Sort order (`asc`, `desc`)

**Response:**
```json
{
  "urls": [
    {
      "shortCode": "abc123",
      "originalUrl": "https://example.com/url1",
      "shortUrl": "https://your-domain.com/abc123",
      "createdAt": "2024-01-15T10:30:00Z",
      "totalClicks": 42,
      "isActive": true
    }
  ],
  "totalCount": 150,
  "currentPage": 1,
  "totalPages": 8,
  "hasNext": true,
  "hasPrev": false
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid query parameters
- `500`: Internal server error

**Example:**
```bash
curl "https://your-domain.com/api/urls?page=1&limit=10&sortBy=clicks&sortOrder=desc"
```

### 7. Update URL

Update properties of an existing short URL.

**Endpoint:** `PATCH /api/urls/:shortCode`

**Request Body:**
```json
{
  "isActive": false,
  "originalUrl": "https://new-example.com/updated-url"
}
```

**Response:**
```json
{
  "shortCode": "abc123",
  "originalUrl": "https://new-example.com/updated-url",
  "shortUrl": "https://your-domain.com/abc123",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-16T14:20:00Z",
  "isActive": false
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid request body
- `404`: Short code not found
- `500`: Internal server error

### 8. Delete URL

Delete a short URL permanently.

**Endpoint:** `DELETE /api/urls/:shortCode`

**Response:**
```json
{
  "message": "URL deleted successfully",
  "shortCode": "abc123"
}
```

**Status Codes:**
- `200`: Success
- `404`: Short code not found
- `500`: Internal server error

**Example:**
```bash
curl -X DELETE https://your-domain.com/api/urls/abc123
```

### 9. Bulk Analytics

Get analytics for multiple URLs at once.

**Endpoint:** `POST /api/analytics/bulk`

**Request Body:**
```json
{
  "shortCodes": ["abc123", "def456", "ghi789"],
  "period": "7d"
}
```

**Response:**
```json
{
  "analytics": [
    {
      "shortCode": "abc123",
      "totalClicks": 156,
      "uniqueClicks": 98
    },
    {
      "shortCode": "def456",
      "totalClicks": 89,
      "uniqueClicks": 67
    }
  ],
  "notFound": ["ghi789"]
}
```

### 10. Health Check

Check the health status of the service.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "database": "connected",
  "redis": "connected",
  "version": "1.0.0"
}
```

**Status Codes:**
- `200`: Service is healthy
- `503`: Service is unhealthy

## Error Response Format

All error responses follow this format:

```json
{
  "error": {
    "message": "Description of the error",
    "code": "ERROR_CODE",
    "details": {}
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/shorten",
  "method": "POST"
}
```

## Common Error Codes

- `INVALID_URL`: The provided URL is not valid
- `MISSING_URL`: URL parameter is required
- `CUSTOM_CODE_EXISTS`: The custom short code is already taken
- `INVALID_CUSTOM_CODE`: The custom code doesn't meet requirements
- `SHORT_CODE_NOT_FOUND`: The short code doesn't exist
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error occurred

## Webhooks (Optional Feature)

You can configure webhooks to receive notifications when URLs are created or accessed.

**Events:**
- `url.created`: When a new short URL is created
- `url.clicked`: When a short URL is accessed
- `url.deleted`: When a short URL is deleted

**Webhook Payload Example:**
```json
{
  "event": "url.clicked",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "shortCode": "abc123",
    "originalUrl": "https://example.com/page",
    "clickData": {
      "ip": "192.168.100",
      "userAgent": "Mozilla/5.0...",
      "referrer": "https://google.com"
    }
  }
}
```
*** SDK Examples ***
JavaScript/Node.js
```
javascriptconst axios = require('axios');

class URLShortener {
  constructor(baseUrl = 'https://your-domain.com') {
    this.baseUrl = baseUrl;
  }

  async shorten(url) {
    const response = await axios.post(`${this.baseUrl}/api/shorten`, { url });
    return response.data;
  }

  async getAnalytics(shortCode, period = '7d') {
    const response = await axios.get(`${this.baseUrl}/api/analytics/${shortCode}?period=${period}`);
    return response.data;
  }
}
```
**Python**
*** pythonimport requests ***
```
class URLShortener:
    def __init__(self, base_url='https://your-domain.com'):
        self.base_url = base_url
    
    def shorten(self, url):
        response = requests.post(f'{self.base_url}/api/shorten', json={'url': url})
        return response.json()
    
    def get_analytics(self, short_code, period='7d'):
        response = requests.get(f'{self.base_url}/api/analytics/{short_code}?period={period}')
        return response.json()
```
**cURL Examples**
```
bash# Shorten URL
curl -X POST https://your-domain.com/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/long-url"}'

# Get analytics
curl https://your-domain.com/api/analytics/abc123?period=30d

# Delete URL
curl -X DELETE https://your-domain.com/api/urls/abc123
```
**Testing**
The API includes comprehensive test coverage. Run tests with:
```
bashnpm test
```
Test categories:

Unit tests for services and utilities
Integration tests for API endpoints
Load tests for performance validation

**Versioning**
This API uses semantic versioning. The current version is included in the health check response.
Breaking changes will be introduced in new major versions with appropriate migration guides.