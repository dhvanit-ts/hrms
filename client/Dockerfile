# 1. Install workspace deps
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json ./client/
COPY server/package.json ./server/

RUN npm ci

# 2. Build client only
FROM node:20-alpine AS builder
WORKDIR /app

COPY . .
COPY --from=deps /app/node_modules ./node_modules

RUN npm --workspace client run build

# 3. Serve
FROM nginx:alpine AS runner
COPY --from=builder /app/client/dist /usr/share/nginx/html

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
