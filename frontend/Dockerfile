FROM node:20-alpine AS base

ARG VITE_API_URL=http://localhost:8000
ENV NODE_ENV=production \
    VITE_API_URL=${VITE_API_URL}

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
