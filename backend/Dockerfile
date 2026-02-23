FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# Install all deps including devDependencies (nodemon for hot-reload)
RUN npm ci

COPY . .

EXPOSE 5001

# Default: production. docker-compose overrides this with nodemon for dev.
CMD ["node", "server.js"]
