# Image de développement (hot-reload via volume monté).
# Le durcissement non-root et le multi-stage sont réservés à l'image de production (S2-05/S2-07).
FROM node:22-alpine

# requis par le moteur Prisma sur Alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
