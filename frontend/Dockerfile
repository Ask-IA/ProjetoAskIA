# --- Etapa 1: build (instala deps e gera o dist/) ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Etapa 2: runtime (só o necessário pra rodar o servidor SSR) ---
FROM node:22-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 4000
ENV PORT=4000

CMD ["node", "dist/ask-ia/server/server.mjs"]