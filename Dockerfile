# Use an official Node.js image for production.
FROM node:22-slim

# Keep the app inside /app in the container.
WORKDIR /app

# Run the app in production mode by default.
ENV NODE_ENV=production

# Install only production dependencies first for better Docker cache.
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the application code.
COPY . .

# Use the safe non-root user that comes with the Node image.
USER node

# The app listens on this port by default.
EXPOSE 3000

# Docker can use this to check if the app is alive.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "const http = require('http'); const port = process.env.PORT || 3000; const req = http.get({ host: '127.0.0.1', port, path: '/health', timeout: 4000 }, (res) => process.exit(res.statusCode === 200 ? 0 : 1)); req.on('error', () => process.exit(1)); req.on('timeout', () => req.destroy());"

# Start the Express server.
CMD ["npm", "start"]
