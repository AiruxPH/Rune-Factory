# Project instructions

Keep this prototype dependency-free unless a dependency has a clear purpose. Gameplay rules belong in progression modules; world rendering and UI must call those operations. Store tunable content in catalog.js with stable IDs. New effects must go through effects.js. Save schema changes need a migration and meaningful regression coverage. Run npm test and npm run check before proposing changes. Do not edit main directly; use a feature branch and pull request. Never commit credentials or player saves.
