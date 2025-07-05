FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY ./frontend/smart-crid/package*.json ./
RUN npm install

# Copy frontend source code
COPY ./frontend/smart-crid ./

# Expose Vue development server port
EXPOSE 5173

# Start the development server by default
CMD ["npm", "run", "dev"]