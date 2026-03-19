# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Build frontend and backend (if needed)
RUN npm run build || true

# Expose the port the app runs on (adjust as needed)
EXPOSE 3000

# Start the application (adjust as needed)
CMD ["npm", "start"]
