# Contribuer à TaskForge

## Linter et formatter

| Dossier | Linter | Formatter |
|---|---|---|
| `backend/` | ESLint (`npm run lint`) | Prettier, intégré à ESLint (`eslint-plugin-prettier`) |
| `frontend/` | oxlint (`npm run lint`) | Prettier (`npm run format`) |

Chaque dossier a sa propre config (`backend/eslint.config.mjs`, `frontend/.oxlintrc.json`,
`.prettierrc` dans chaque dossier).

## Pre-commit hook

Un hook Husky + lint-staged, configuré à la racine (`package.json`, clé `lint-staged`),
tourne à chaque `git commit` :

- fichiers `backend/**/*.ts` modifiés → `npm run lint` dans `backend/`
- fichiers `frontend/**/*.{ts,tsx}` modifiés → `npm run format` puis `npm run lint` dans `frontend/`

Le commit est bloqué si le linter remonte une erreur non corrigeable automatiquement.

## Installation

```bash
npm install              # à la racine — installe husky et active le hook
cd backend && npm install # génère aussi le client Prisma (postinstall)
cd frontend && npm install
```

Le client Prisma (`backend/src/generated/prisma`) n'est pas versionné : il est régénéré
à l'install (`postinstall: prisma generate`) et à chaque build Docker. Sans lui, ESLint
ne peut pas résoudre les types du client et remonte de faux positifs — pense à relancer
`npx prisma generate` dans `backend/` si le linter se met soudainement à hurler partout.

## Lancer les vérifications manuellement

```bash
npm --prefix backend run lint
npm --prefix frontend run lint
npm --prefix frontend run format
```
