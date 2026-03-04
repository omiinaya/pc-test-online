# Coolify Deployment Instructions for MMIT Lab

## Issue Resolution

The previous issue where the app would load a blank screen after deployment to Coolify has been resolved. The problem was caused by incorrect asset path resolution in the production build.

## Root Cause

The Vite configuration was using relative paths for assets in production builds, which caused issues when the app was served from certain URL paths on Coolify. Assets failed to load, resulting in an empty app container.

## Solution Implemented

1. Updated `frontend/vite.config.js` to use absolute paths (`/`) for production builds
2. Modified `DEPLOYMENT_GUIDE.md` with correct environment variable configuration

## Deployment Steps

### Prerequisites
Make sure you have:
- A Coolify account
- This repository connected to Coolify

### Deployment Configuration

1. In Coolify, create a new application
2. Select your repository
3. Configure the build settings:
   - Build pack: NodeJS
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
   - Port: 80

4. Set the following environment variables:
   ```
   NODE_ENV=production
   VITE_APP_TITLE=MMIT Lab
   VITE_APP_DESCRIPTION=Hardware testing application
   VITE_API_BASE_URL=/api
   ```

5. Deploy the application

## Verification

After deployment:
1. Check the browser console for any JavaScript errors
2. Verify that all assets load correctly (no 404 errors)
3. Confirm that the app initializes and displays the test interface

## Troubleshooting

If you still encounter issues:
1. Check the browser Network tab to ensure all assets are loading with 200 status
2. Verify that the Coolify application logs don't show any build errors
3. Ensure the publish directory is set correctly to `frontend/dist`

## Additional Notes

The fix implemented ensures that:
- Assets are referenced with absolute paths in production builds
- The application works correctly regardless of the URL path where it's served
- No additional configuration is needed for standard Coolify deployments