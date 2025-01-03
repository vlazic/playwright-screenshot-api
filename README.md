# Playwright Page Screenshot Docker

A simple API service that takes screenshots of web pages using Playwright, packaged in a Docker container. Features caching with configurable TTL and option to return URLs instead of binary data.

## Requirements

- Docker

## Running with Docker Compose

```bash
docker compose up -d
```

This will build the image and start the service with all necessary configurations.

To stop the service:
```bash
docker compose down
```

## Running with Docker (Alternative)

```bash
docker build -t screenshot-api .
docker run -d \
  -p 3000:3000 \
  -v screenshot-cache:/app/cache \
  --name screenshot-service \
  screenshot-api
```

Note: The container uses a named volume `screenshot-cache` for persistent cache storage.

## Usage

### Basic Screenshot

Send a POST request to `http://localhost:3000/screenshot` with a JSON body containing the URL you want to screenshot:

```bash
curl -X POST \
  http://localhost:3000/screenshot \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com"}' \
  --output screenshot.png
```

### Using Cache with URL Return

```bash
curl -X POST \
  http://localhost:3000/screenshot \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://example.com",
    "returnUrl": true,
    "ttl": 3600
  }'
```

### API Endpoints

#### POST /screenshot

Request body:
```json
{
  "url": "https://example.com",    // Required: URL to screenshot
  "returnUrl": false,              // Optional: Return URL instead of binary (default: false)
  "ttl": 3600                      // Optional: Cache TTL in seconds (default: 3600)
}
```

Responses:

1. Binary Response (returnUrl: false):
   - Content-Type: image/png
   - Body: Binary image data

2. URL Response (returnUrl: true):
   ```json
   {
     "url": "/cache/[filename].png"
   }
   ```

Error responses:
- 400: URL is required
- 500: Screenshot failed

### Caching

- Screenshots are cached by default for 1 hour (3600 seconds)
- Custom TTL can be set per request using the `ttl` parameter
- Cache is cleared on server startup
- Expired cache files are automatically cleaned up hourly
- Cache persists across container restarts using Docker volume

### Testing

The repository includes a test script that can verify both basic functionality and caching:

```bash
# Test basic screenshot
./test.sh

# Test caching with 5-second TTL
./test.sh cache
```

### Docker Commands

View cached files:
```bash
docker exec screenshot-service ls -la /app/cache
```

Stop and remove container:
```bash
docker stop screenshot-service
docker rm screenshot-service
```

Clean start (rebuilds image, removes old container, starts fresh):
```bash
docker build -t screenshot-api .
docker stop screenshot-service
docker rm screenshot-service
docker run -d \
  -p 3000:3000 \
  -v screenshot-cache:/app/cache \
  --name screenshot-service \
  screenshot-api
```

## TODO

Screenshot Configuration Options:

1. Basic Settings:
- [ ] URL input for specifying the web page to capture
- [ ] Device selection (desktop, phone, tablet) for device-specific screenshots
- [ ] Dimension control with width x height format (default 1024x768) and a full-length screenshot option
- [ ] Format selection between jpg, png, and gif

2. Cache Management:
- [ ] Cache limit setting in days (default 14 days)
- [ ] Option to force "Always fresh screenshot"
- [ ] Delay timer ranging from 0 to 10000ms for handling animations and lazy loading

3. Visual Quality and Display:
- [ ] Zoom level control for high-resolution captures, with support for retina-like screenshots (200+ recommended)
- [ ] Dimension control for specifying screenshot size
- [ ] Crop functionality using x,y,width,height coordinates

4. Element and Content Control:
- [ ] Click functionality to interact with elements before capture (using CSS selectors)
- [ ] Hide option to remove specific elements from the screenshot
- [ ] Selector parameter to capture specific DOM elements
- [ ] Crop parameter for capturing selected regions

5. Request Header Customization:
- [ ] Cookie management for setting Cookie request headers
- [ ] Accept-Language header configuration
- [ ] User-Agent header customization
