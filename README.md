# Playwright Screenshot API

A service for capturing website screenshots with various options, built with Node.js, Express, and Playwright.

## Features

- Device emulation (desktop, tablet, phone)
- Custom dimensions and full-page screenshots
- Multiple formats (PNG, JPEG, GIF)
- Cache management with TTL
- Element interaction (click, hide)
- Crop functionality
- Custom request headers

## Quick Start with Docker

Pre-built Docker images are available on GitHub Container Registry:

```bash
# Pull the latest version
docker pull ghcr.io/vlazic/playwright-screenshot-docker:latest

# Run the container
docker run -p 3000:3000 ghcr.io/vlazic/playwright-screenshot-docker:latest
```

### Platform Support

Images are available for both x86_64/amd64 and ARM64/aarch64 architectures. Docker will automatically pull the correct image for your platform.

## API

### Health Check

```http
GET /health
```

Returns server status and version information.

### Take Screenshot

Available options:
- `device`: desktop, tablet, phone
- `width`: custom width
- `height`: custom height
- `format`: png, jpg, gif
- `quality`: 0-100 (for jpg)
- `scale`: for high-DPI (1-5)
- `fullPage`: capture full page
- `delay`: wait before capture (0-10000ms)
- `fresh`: bypass cache
- `returnUrl`: return cache URL instead of image
- `clickSelectors`: click elements before capture
- `hideSelectors`: hide elements
- `selector`: capture specific element
- `crop`: crop screenshot

```http
POST /screenshot
Content-Type: application/json

{
  "url": "https://vlazic.com",
  "device": "desktop",
  "width": 1024,
  "height": 768,
  "format": "png",
  "quality": 80,
  "scale": 2,
  "fullPage": true,
  "delay": 1000,
  "fresh": false,
  "returnUrl": false,
  "clickSelectors": ["#menu"],
  "hideSelectors": [".ads"],
  "selector": ".content",
  "crop": {
    "x": 0,
    "y": 0,
    "width": 100,
    "height": 100
  }
}
```

## Development

### Installation

```bash
npm install
```

### Local Development

Start the server:

```bash
npm start
```

Development mode with auto-reload:

```bash
npm run dev
```

### Docker Development

Build and run locally with Docker Compose:

```bash
# Development mode with hot-reload
npm run docker:dev

# Production mode
npm run docker:prod
```

Build manually:

```bash
docker build -t playwright-screenshot-api .
docker run -p 3000:3000 playwright-screenshot-api
```

### Testing

#### API Tests

```bash
# Run API tests
npm run test:api

# Watch mode for development
npm run test:api:watch

# Generate coverage report
npm run test:api:coverage
```

#### Manual Tests

```bash
# Visual regression tests
npm run test:manual:visual

# Cache functionality tests
npm run test:manual:cache
```

#### Test Structure

- `tests/api/health.test.js`: Health endpoint tests
- `tests/api/screenshot.test.js`: Screenshot endpoint tests covering:
  - Basic functionality
  - Device emulation
  - Format and quality options
  - Dimensions and cropping
  - Element interaction
  - Caching behavior
  - Error handling

### Docker Build Automation

Images are automatically built and published to GitHub Container Registry on:
- Push to master branch
- New version tags
- Pull requests (build only, not published)

The build process creates multi-architecture images supporting:
- Linux x86_64/amd64
- Linux ARM64/aarch64

## License

MIT
