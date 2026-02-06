# Frontend Dockerfile for Coolify deployment
# Serves pre-built assets with nginx as non-root user
# Build locally first with: cd frontend && npm run build

# Use lightweight nginx alpine image
FROM nginx:alpine

# Create non-root user and group for security
# UID 1001 is commonly used for non-root applications
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copy pre-built dist files to nginx
# This assumes 'npm run build' has been run locally or in CI
COPY dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy custom root nginx configuration for non-root user
COPY nginx-root.conf /etc/nginx/nginx.conf

# Set ownership of nginx runtime directories to non-root user
# nginx needs write access to these directories for proper operation
RUN chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    mkdir -p /var/lib/nginx/tmp && \
    chown -R appuser:appgroup /var/lib/nginx && \
    chmod -R 755 /var/lib/nginx && \
    chown appuser:appgroup /etc/nginx/nginx.conf && \
    chmod 644 /etc/nginx/nginx.conf

# Switch to non-root user before starting nginx
USER appuser

# Expose port 80 for HTTP traffic
EXPOSE 80

# Start nginx in foreground with explicit config
CMD ["nginx", "-g", "daemon off;"]