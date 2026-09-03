# Production-ready Node.js Dockerfile for EduManage Pro
FROM node:20-alpine

# Set working directory inside container
WORKDIR /usr/src/app

# Copy dependency definitions
COPY package*.json ./

# Install production dependencies cleanly
RUN npm ci --only=production

# Copy application files (excluding patterns from .dockerignore)
COPY . .

# Set default production environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose default HTTP port
EXPOSE 3000

# Run as non-privileged node user for security
USER node

# Container health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Default startup command
CMD ["node", "server.js"]
