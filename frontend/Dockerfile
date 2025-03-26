FROM node:20-alpine

WORKDIR /app

# Instalar o pnpm globalmente
RUN npm install -g pnpm

COPY package*.json ./
RUN pnpm install

COPY . .
RUN pnpm run build

EXPOSE 3000
# Usar o --host para expor a aplicação para fora do container
CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0"] 