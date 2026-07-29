# Use an official lightweight Node.js image.
FROM node:20-alpine

# Keep the application inside /app.
WORKDIR /app

# Run the application in production mode.
ENV NODE_ENV=production

# Copy dependency files first for better Docker layer caching.
COPY package*.json ./

# Install only production dependencies.
RUN npm ci --omit=dev

# Copy the application source code.
COPY . .

# Give ownership of the application files to the non-root node user.
RUN chown -R node:node /app

# Run the application as a non-root user.
USER node

# Document the application's default port.
EXPOSE 3000

# Check whether the application is healthy.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
CMD node -e "const http=require('http'); const port=process.env.PORT||3000; const req=http.get({host:'127.0.0.1',port,path:'/health',timeout:4000},res=>process.exit(res.statusCode===200?0:1)); req.on('error',()=>process.exit(1)); req.on('timeout',()=>req.destroy());"

# Start the application.
CMD ["npm", "start"]