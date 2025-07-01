FROM node:20-alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies (including devDependencies for development)
RUN npm install

# Copy the rest of the application
COPY . .

EXPOSE 8545 8546

CMD ["npx", "hardhat", "node", "--port", "8545", "--hostname", "0.0.0.0"]