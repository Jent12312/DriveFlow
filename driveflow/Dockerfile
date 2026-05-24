# Используем легковесный образ Node.js
FROM node:18-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm install

# Генерируем Prisma Client
RUN npx prisma generate

# Копируем весь код
COPY . .

# Компилируем TypeScript в JavaScript
RUN npm run build

# --- Финальный этап ---
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/fonts ./fonts 

COPY --from=builder /app/prisma ./prisma

# Прокидываем порт
EXPOSE 3000

# Запускаем миграции БД при старте сервера и сам сервер
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]