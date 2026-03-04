# MMIT Lab - Coolify Deployment Guide

## Changes Made for Production Deployment

### 1. Fixed Deprecated Meta Tag
- **File**: [`frontend/index.html`](frontend/index.html:16-17)
- **Issue**: The deprecated `<meta name="apple-mobile-web-app-capable" content="yes">` tag
- **Fix**: Added the recommended `<meta name="mobile-web-app-capable" content="yes">` tag alongside the existing one

### 2. Environment Configuration
- **File**: [`frontend/.env.production`](frontend/.env.production:1-5)
- **Added**: Production environment variables file with proper configuration

### 3. Router Navigation Fix
- **File**: [`frontend/src/main.js`](frontend/src/main.js:18-47)
- **Issue**: Forceful router navigation could cause issues in production
- **Fix**: Simplified navigation logic with proper error handling

### 4. Vite Configuration Update
- **File**: [`frontend/vite.config.js`](frontend/vite.config.js:6)
- **Change**: Made base URL configurable via `VITE_BASE_URL` environment variable

## Docker Deployment Setup

### Files Added:
1. [`frontend/Dockerfile`](frontend/Dockerfile:1-26) - Multi-stage Docker build
2. [`frontend/nginx.conf`](frontend/nginx.conf:1-22) - Nginx configuration for SPA
3. [`frontend/.dockerignore`](frontend/.dockerignore:1-20) - Docker ignore rules

### Building and Running with Docker:

```bash
# Build the Docker image
cd frontend
docker build -t mmit-frontend .

# Run the container
docker run -p 3000:80 mmit-frontend
```

## Coolify Deployment Configuration

For Coolify deployment, you can use the following configuration:

### Option 1: Use the Dockerfile
- Set the build method to "Dockerfile"
- Path: `frontend/Dockerfile`
- Port: 80

### Option 2: Build with Node.js
- Set the build method to "Node.js"
- Build command: `npm run build`
- Publish directory: `dist`
- Port: 5173 (or configure Vite preview)

### Environment Variables for Coolify:
```env
NODE_ENV=production
VITE_APP_TITLE=MMIT Lab
VITE_APP_DESCRIPTION=Hardware testing application
VITE_API_BASE_URL=/api
```

## Troubleshooting Common Issues

### Black Screen in Production:
1. **Check browser console** for JavaScript errors
2. **Verify base URL** configuration matches deployment path
3. **Ensure static assets** are properly served
4. **Check Content Security Policy** - might need adjustment for production

### Router Issues:
- The app now uses proper SPA routing with fallback to index.html
- Nginx configuration handles client-side routing correctly

### Build Issues:
- The Dockerfile uses a multi-stage build for optimal performance
- Production dependencies only are included in the final image

## Testing the Deployment

1. **Local Docker test**:
   ```bash
   cd frontend
   docker build -t test-app .
   docker run -p 8080:80 test-app
   # Visit http://localhost:8080
   ```

2. **Production build test**:
   ```bash
   cd frontend
   npm run build
   npx serve dist
   # Verify the app works correctly
   ```

## Additional Notes

- The app now properly handles the deprecated meta tag warning
- Router navigation is more robust in production environments
- Docker deployment provides a consistent production environment
- Nginx configuration ensures optimal performance and caching