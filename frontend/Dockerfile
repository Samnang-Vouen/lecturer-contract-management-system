# Stage 1: Build the React/Vite app
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Init container — copies built assets into the shared volume then exits.
# Nginx reads from that volume; this container does NOT run nginx.
FROM alpine:latest

COPY --from=builder /app/dist /dist

CMD ["sh", "-c", "cp -rT /dist /var/www/html && echo '[frontend] Assets copied to shared volume.'"]
