FROM node:20-alpine

# Set working directory
WORKDIR /app/frontend

# Install dependencies
COPY ./frontend/package*.json ./
RUN npm install

# Copy frontend source code
COPY ./frontend ./

# Expose React development server port
EXPOSE 3000

# Start the development server by default
CMD ["npm", "start"]