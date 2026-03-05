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

# Download AWS RDS global SSL certificate bundle and tell Node.js to trust it
RUN mkdir -p certs && \
    wget -qO certs/global-bundle.pem \
    https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# NODE_EXTRA_CA_CERTS makes Node.js trust this CA bundle in addition to its
# built-in store — the correct way to add custom CAs to Node.js
ENV NODE_EXTRA_CA_CERTS=/app/certs/global-bundle.pem

# Copy compiled frontend assets from stage 1
COPY --from=frontend-builder /app/backend/public ./public

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "app.js"]
