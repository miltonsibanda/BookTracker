# Use the official Nginx image to serve static files
FROM nginx:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Set the working directory in the container
WORKDIR /usr/share/nginx/html

# Remove the default nginx static assets
RUN rm -rf ./*

# Copy the BookTracker application files to the container
COPY index.html .
COPY script.js .
COPY styles.css .
COPY debug.html .
COPY test-modals.html .
COPY test-simple.html .
COPY test-final-fixes.html .
COPY debug-methods.html .

# Copy the nginx configuration file
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Start nginx server
CMD ["nginx", "-g", "daemon off;"]
