# Image de développement (hot-reload via volume monté).
# Le durcissement non-root et le multi-stage sont réservés à l'image de production (S2-05/S2-07).
FROM node:22-alpine

# requis par le moteur Prisma sur Alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

# Le postinstall du package.json lance « prisma generate » : le schéma doit donc
# être présent avant l'installation, sinon npm install échoue et l'image ne se
# construit pas. L'URL est factice et cantonnée à ce RUN — la génération du
# client lit le schéma, elle n'ouvre aucune connexion.
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" \
    npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
