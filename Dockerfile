# Use Bun for both build and runtime (native bun:sqlite support)
FROM oven/bun:1.3.4-alpine

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy all source code
COPY . .

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN bun run build

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run background worker and Next.js server with Bun runtime
CMD ["sh", "-c", "bun run src/background/index.ts & exec bun run .next/standalone/server.js"]
