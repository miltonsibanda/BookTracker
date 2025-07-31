FROM node:18-alpine

WORKDIR /app

# Install curl and build dependencies for SQLite
RUN apk add --no-cache curl python3 make g++ sqlite

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Create necessary directories with proper permissions
RUN mkdir -p /app/data /app/backups && \
    chmod 755 /app/data /app/backups && \
    chown -R node:node /app

# Switch to non-root user AFTER setting permissions
USER node

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Initialize database and start the application
CMD ["node", "server.js"]
