FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
COPY public ./public
COPY server ./server
COPY scripts/generate-user-guide.mjs ./scripts/generate-user-guide.mjs
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
COPY --from=build /app/dist ./dist
COPY server ./server
COPY artifacts/nasa-ghana-2025-01-01_03 ./artifacts/nasa-ghana-2025-01-01_03
COPY artifacts/ghana-seasonal-study ./artifacts/ghana-seasonal-study
USER node
EXPOSE 8080
CMD ["node", "server/start.mjs"]
