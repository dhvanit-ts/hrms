FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8000

# Environment variables are passed from docker-compose.yml
# Defaults are set there via ${VAR:-default}
ENV NODE_ENV=development

CMD ["node", "src/index.js"]

