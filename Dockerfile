# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

WORKDIR /app

# Install dependencies for better compatibility
RUN apk add --no-cache libc6-compat

# Install Bun for running the background worker
RUN npm install -g bun

# Copy package files and install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy all source code
COPY . .

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN bun run build

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run both background worker and Next.js server
CMD ["sh", "-c", "bun run src/background/index.ts & exec node .next/standalone/server.js"]
