# Playwright Page Screenshot Docker

A service for capturing website screenshots with various options, built with Node.js, Express, and Playwright.

## Features

- Device emulation (desktop, tablet, phone)
- Custom dimensions and full-page screenshots
- Multiple formats (PNG, JPEG, GIF)
- Cache management with TTL
- Element interaction (click, hide)
- Crop functionality
- Custom request headers

## Installation

```bash
npm install
```

## Usage

Start the server:

```bash
npm start
```

Development mode with auto-reload:

```bash
npm run dev
```

## API

### Health Check

```http
GET /health
```

Returns server status and version information.

### Take Screenshot

```http
POST /screenshot
Content-Type: application/json

{
  "url": "https://example.com",
  "device": "desktop",           // optional: desktop, tablet, phone
  "width": 1024,                // optional: custom width
  "height": 768,                // optional: custom height
  "format": "png",              // optional: png, jpg, gif
  "quality": 80,                // optional: 0-100 (for jpg)
  "scale": 2,                   // optional: for high-DPI (1-5)
  "fullPage": true,             // optional: capture full page
  "delay": 1000,                // optional: wait before capture (0-10000ms)
  "fresh": false,               // optional: bypass cache
  "returnUrl": false,           // optional: return cache URL instead of image
  "clickSelectors": ["#menu"],  // optional: click elements before capture
  "hideSelectors": [".ads"],    // optional: hide elements
  "selector": ".content",       // optional: capture specific element
  "crop": {                     // optional: crop screenshot
    "x": 0,
    "y": 0,
    "width": 100,
    "height": 100
  }
}
```

## Testing

Run all tests:

```bash
npm test
```

Watch mode for development:

```bash
npm run test:watch
```

Generate coverage report:

```bash
npm run test:coverage
```

### Test Structure

- `__tests__/api/health.test.js`: Health endpoint tests
- `__tests__/api/screenshot.test.js`: Screenshot endpoint tests covering:
  - Basic functionality
  - Device emulation
  - Format and quality options
  - Dimensions and cropping
  - Element interaction
  - Caching behavior
  - Error handling

## Docker

Build the image:

```bash
docker build -t screenshot-service .
```

Run the container:

```bash
docker run -p 3000:3000 screenshot-service
```

With Docker Compose:

```bash
docker-compose up
```

## License

MIT
