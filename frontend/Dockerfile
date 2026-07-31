# Image de développement (hot-reload via volume monté).
# Le durcissement non-root est réservé à l'image de production multi-stage (S2-07).
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
