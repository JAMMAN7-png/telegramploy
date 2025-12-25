# Use Node.js 20 Alpine
FROM node:20-alpine

WORKDIR /app

# Install dependencies for compatibility
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json ./

# Install dependencies with npm
ENV NODE_ENV=production
RUN npm install --legacy-peer-deps

# Copy all source code
COPY . .

# Build the Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Create data directory for SQLite
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install tsx globally for TypeScript execution
RUN npm install -g tsx

# Run both background worker and Next.js server
CMD ["sh", "-c", "tsx src/background/index.ts & exec node .next/standalone/server.js"]
