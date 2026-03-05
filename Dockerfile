# ─── Stage 1: Build React frontend ───────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Install root (frontend) dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source files (including .env.production so VITE_API_URL=/api is baked in)
COPY . .

# Build → outputs to backend/public (configured in vite.config.js)
RUN npm run build

# ─── Stage 2: Production backend ─────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install backend production dependencies only
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev

# Copy backend source
COPY backend/ .

# Download AWS RDS global SSL certificate bundle (public cert, not a secret)
RUN mkdir -p certs && \
    wget -qO certs/global-bundle.pem \
    https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# Copy compiled frontend assets from stage 1
COPY --from=frontend-builder /app/backend/public ./public

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "app.js"]
