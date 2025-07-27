# Use the official Node.js 18 LTS image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Create data directory for persistence
RUN mkdir -p /data && chown node:node /data

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application files
COPY index.html .
COPY script-with-persistence.js .
COPY data-persistence.js .
COPY styles.css .
COPY server.js .

# Copy any additional static assets
COPY imported-books.json ./imported-books.json

# Change ownership of the app directory to the node user
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Expose port 3000
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV DATA_FILE=/data/books.json
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
