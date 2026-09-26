# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Les personnes qui préparent un entretien et les coachs ou accompagnateurs qui les aident. Le produit doit pouvoir servir à une simulation guidée par un coach; un mode solo d'entraînement face à une IA est envisagé.

## Product Purpose

Aider les personnes à se préparer à un entretien en leur permettant de s'entraîner et de retrouver les échanges sous forme de transcription. L'application actuelle fournit des sessions vidéo en temps réel et une transcription téléchargeable. L'entraînement solo face à une IA et l'analyse IA de la transcription sont des objectifs futurs, pas des capacités disponibles actuellement.

## Positioning

Le différenciateur par rapport aux outils de visioconférence, de coaching et de préparation aux entretiens reste à définir. Ne pas inventer de promesse de précision, de résultats ou d'avantage concurrentiel.

## Operating Context

Les sessions se déroulent à distance dans un navigateur et utilisent la caméra et le microphone. Les participants peuvent consulter et télécharger la transcription d'une session. Le fonctionnement avec un coach est visé; le mode solo avec une IA est envisagé pour une évolution future.

## Capabilities and Constraints

- L'application actuelle utilise LiveKit pour les sessions et les flux audio/vidéo, et Deepgram pour la transcription en direct.
- Les transcriptions peuvent être exportées sous forme de fichier texte.
- L'authentification utilise Better Auth; la base de données PostgreSQL est gérée avec Drizzle ORM.
- L'interface visible par l'utilisateur est en français.
- Le mode solo d'entraînement face à l'IA et l'analyse IA de la transcription ne sont pas encore disponibles.
- La conservation et le partage des transcriptions au-delà de leur export ne sont pas définis ici.

## Brand Commitments

Le nom du produit est MirrorTalk. Conserver ce nom. Les autres engagements de marque restent à définir.

## Evidence on Hand

Le code de l'application contient une interface de session vidéo, une transcription en direct et l'export texte. Aucun témoignage client, résultat mesuré, benchmark ni autre preuve marketing n'a été confirmé; ne pas en inventer.

## Product Principles

- Aider à se préparer à un entretien par la pratique, pas seulement par la consultation de conseils.
- Rendre les échanges de la session consultables grâce à une transcription téléchargeable.
- Distinguer clairement les capacités disponibles des fonctions IA envisagées.
- Respecter la confidentialité des échanges et ne pas supposer de politique de conservation non définie.
