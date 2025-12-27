# Use Node.js 20 Alpine as base image
FROM node:20-alpine AS base

# Install pnpm and build dependencies for native modules
RUN apk add --no-cache python3 make g++ && npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the Next.js app
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

# Install pnpm and build dependencies for native modules
RUN apk add --no-cache dumb-init python3 make g++ && npm install -g pnpm

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Copy built app from build stage
COPY --from=base /app/.next/standalone ./

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Expose port
EXPOSE 3456

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3456

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]