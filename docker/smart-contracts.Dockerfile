FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --no-audit --no-fund --prefer-offline

COPY . .

CMD ["sh", "-c", "\
  echo '🧪 Running tests...' && \
  npm run test && \
  echo '📊 Generating coverage report...' && \
  npm run coverage && \
  echo '🔍 Running security analysis...' && \
  npm run security-check && \
  echo '✅ Smart contracts ready!' \
"]