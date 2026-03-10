# Backend Dockerfile for MMIT Testing Suite
# Uses Node.js alpine with non-root user

# Build stage
FROM node:25-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Runtime stage
FROM node:25-alpine
WORKDIR /app

# Create non-root user (node user already exists in base image with UID 1001)
# But we'll ensure we use a non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Ensure logs directory exists and is writable
RUN mkdir -p logs && chown -R appuser:appgroup logs

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "src/server.js"]
