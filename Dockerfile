# 555 İnşaat — tək konteyner: Express API + repo kökündəki statik frontend
# Fly.io-da PORT mühit dəyişəni avtomatik təyin olunur (fly.toml internal_port ilə uyğun).

FROM node:20-bookworm-slim

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY . .

WORKDIR /app/backend

ENV NODE_ENV=production
ENV HOST=0.0.0.0

CMD ["node", "server.js"]
