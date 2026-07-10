# Multi-stage build: Vite app → static nginx host.
#
# Self-contained: no monorepo coupling. @possibl/rcrt-sdk,
# @possibl/rcrt-app-kit and @possibl/rcrt-ui install from the npm registry
# (package.json pins registry versions since 0.5.x — the old vendored-tarball
# COPY was removed because the vendor/ dir no longer exists and a COPY of a
# missing dir fails the whole Docker build).

FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

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
