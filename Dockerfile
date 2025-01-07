# Stage 1: Development dependencies
FROM node:18 AS deps
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json ./
COPY pnpm-lock.yaml* ./
RUN pnpm install

# Stage 2: Production build
FROM node:18 AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy deps and source
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN pnpm build

# Stage 3: Production runtime
FROM node:18-slim AS runner
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Create a non-root user
RUN groupadd -g 1001 nodejs
RUN useradd -u 1001 -g nodejs -s /bin/bash nodeuser

# Copy only production necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml* ./
COPY --from=builder /app/servers ./servers

# Install only production dependencies
RUN pnpm install --prod

# Set proper permissions
RUN chown -R nodeuser:nodejs /app

# Switch to non-root user
USER nodeuser

# Expose the port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start the application
CMD ["node", "dist/server.js"]
