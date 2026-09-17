# --- Etapa 1: build ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Etapa 2: runtime (arquivos estáticos via nginx) ---
# Sem SSR, o build gera só arquivos estáticos (dist/ask-ia/browser);
# o nginx os serve na porta 4000, mantendo o mapeamento do docker-compose.
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ask-ia/browser /usr/share/nginx/html

EXPOSE 4000
