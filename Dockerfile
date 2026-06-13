# Multi-stage build: Vite app → static nginx host.
#
# Self-contained: no monorepo coupling. @possibl/rcrt-sdk,
# @possibl/rcrt-app-kit and @possibl/rcrt-ui are installed from vendored
# tarballs in vendor/ (file: deps) until they're published to npm — so the
# vendor dir MUST be copied before `npm install` resolves them. (Skipping
# this caused a Cloud Build failure in the dogfood console; see its commit
# 67ecc42.) Once the packages are published, switch package.json to registry
# versions and this Dockerfile keeps working (the vendor copy is then a no-op).

FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY vendor ./vendor

RUN npm install --ignore-scripts

COPY . .

ARG VITE_API_URL
ARG VITE_TENANT_ID
ARG VITE_RCRT_API_KEY
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID

ENV VITE_API_URL=$VITE_API_URL \
    VITE_TENANT_ID=$VITE_TENANT_ID \
    VITE_RCRT_API_KEY=$VITE_RCRT_API_KEY \
    VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID

RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
