# Stage 1: Build the React/Vite app
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm config set fetch-retries 10 \
    && npm config set fetch-retry-mintimeout 30000 \
    && npm config set fetch-retry-maxtimeout 300000 \
    && npm config set fetch-timeout 600000 \
    && npm ci

COPY . .

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Init container — copies built assets into the shared volume then exits.

#So basically: FROM alpine:latest = "give me the smallest usable Linux to run shell commands."
FROM alpine:latest
# after that now docker contianer contain /dist: /index.html and /assets
COPY --from=builder /app/dist /dist

CMD ["sh", "-c", "cp -rT /dist /var/www/html && echo '[frontend] Assets copied to shared volume.'"]
