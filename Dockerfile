# ==========================================
# Stage 1: Build the React frontend (client)
# ==========================================
FROM node:20-alpine AS client-builder

WORKDIR /app/client

# Copy package configuration files
COPY client/package*.json ./

# Install all dependencies (dev included) for building
RUN npm ci

# Copy the rest of the client code
COPY client/ ./

# Build the frontend to generate the 'dist' folder
RUN npm run build

# ==========================================
# Stage 2: Serve the Express backend (server)
# ==========================================
FROM node:20-alpine AS server-production

WORKDIR /app/server

# Set to production mode
ENV NODE_ENV=production

# Copy server package configuration files
COPY server/package*.json ./

# Install only production dependencies (omit devDependencies)
RUN npm ci --omit=dev

# Copy server code
COPY server/ ./

# Copy built frontend client assets into the server's public folder
COPY --from=client-builder /app/client/dist ./public

# Render assigns a dynamic PORT env var
EXPOSE 5000

# Start server
CMD ["node", "server.js"]
