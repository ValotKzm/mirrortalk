# MirrorTalk: instructions pour l'agent

## Projet

- MirrorTalk est une application Next.js 16 avec App Router, React 19 et TypeScript.
- L'interface principale gère des entretiens vidéo en temps réel, les participants et la transcription locale/distante.
- LiveKit fournit les salles et les flux audio/vidéo; Deepgram fournit la transcription.
- Better Auth gère l'authentification, avec Drizzle ORM et PostgreSQL pour la persistance.
- L'interface et les messages visibles par l'utilisateur sont en français; conserve cette langue sauf demande contraire.

## Organisation utile

- `app/`: routes App Router, page principale, styles globaux et composants UI.
- `app/api/`: routes serveur, notamment la génération des jetons LiveKit et Deepgram.
- `app/actions/connection/`: actions serveur liées à la connexion et à l'inscription.
- `app/components/`: composants de transcription et formulaires de connexion.
- `lib/db/`: connexion Drizzle et schéma de base de données.
- `drizzle/`: migrations générées. Ne modifie pas une migration déjà appliquée sans demande explicite; préfère une nouvelle migration.
- `public/audio-processor.js`: processeur audio servi comme ressource publique.

## Conventions de travail

- Respecte les frontières client/serveur de Next.js. Les API du navigateur (caméra, microphone, `MediaStream`, DOM) doivent rester dans des composants client.
- Garde les secrets côté serveur et lis-les depuis les variables d'environnement. Ne copie jamais de valeurs de `.env` dans le code, les logs, les réponses API ou la documentation.
- Valide les entrées des routes API et des Server Actions; ne fais pas confiance aux valeurs fournies par le navigateur.
- Lors des changements de flux LiveKit ou Deepgram, traite explicitement les états de connexion, erreurs et nettoyage des tracks/ressources.
- Préserve les comportements existants d'authentification et de transcription lors des changements UI.
- Réutilise les dépendances et conventions déjà présentes; évite d'ajouter une dépendance pour une petite utilité.
- Ne lance pas `db:push` ou une migration sur une base réelle sans accord explicite.

## Vérifications

- `pnpm lint` vérifie ESLint.
- `pnpm build` vérifie la compilation de production.
- Après une modification de schéma, utilise `pnpm db:generate` pour générer une migration, puis examine-la avant toute application.
- Il n'y a pas de script de test dédié dans `package.json`; ne prétends pas qu'une suite de tests a été exécutée.

## Sécurité et changements

- Ne lis ni ne révèle les secrets de `.env`; demande à l'utilisateur de vérifier les valeurs localement si nécessaire.
- Fais des modifications ciblées et ne supprime pas de changements préexistants.
- Avant de modifier des migrations, l'authentification ou les permissions, vérifie les usages proches et explique les effets de bord importants.