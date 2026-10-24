# Maison 3D

Maquette 3D générée par code à partir de `src/plan.ts` (données issues de PLAN_22.pdf, validées par Zod).

## Lancer (GitHub Codespaces)
1. Pousse ce dossier sur un dépôt GitHub, puis **Code → Codespaces → Create**.
2. `npm run dev` : ouvre le port 5173.
3. Déploiement : Settings → Pages → Source « GitHub Actions ».

## Modifier la maison
Tout est dans `src/plan.ts` : pièces (`rooms`), portes/fenêtres (`openings`), extérieurs (`exterior`). Unités : mètres. Hauteur d'étage supposée : 3,00 m.

## Prochaines phases
Éditeur (déplacer murs et meubles), styles de décoration, escaliers et toit, extérieurs, visite à la première personne, import automatique du PDF.
