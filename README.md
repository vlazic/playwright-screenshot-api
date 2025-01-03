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
  "url": "https://example.com",
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
docker build -t playwright-screenshot-api .
```

Run the container:

```bash
docker run -p 3000:3000 playwright-screenshot-api
```

With Docker Compose:

```bash
docker-compose up
```

## License

MIT
