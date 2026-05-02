# ── Stage 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: Runtime ─────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

# Copy installed node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application source files
COPY server.js ./
COPY app.js ./
COPY index.html ./
COPY index.css ./
COPY assistant.html ./
COPY data/ ./data/

# Cloud Run sets PORT env var; server.js already reads process.env.PORT
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "server.js"]
