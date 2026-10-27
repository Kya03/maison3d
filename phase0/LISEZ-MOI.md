# Phase 0 : premier rendu réaliste (chambre 1 du rez-de-chaussée)

Blender est gratuit. On le lance **sans fenêtre** (« -b ») : il lit le script, construit la pièce, calcule la lumière et écrit une image.
Le rendu se fait au processeur (CPU) : aucun risque pour la carte graphique de ton PC.

## Où l'exécuter : GitHub Codespaces (recommandé)
1. Ouvre ton Codespace, puis un terminal.
2. Installe Blender (une seule fois, quelques minutes) :
   `sudo apt-get update && sudo apt-get install -y blender`
3. Mets le dossier `phase0` dans ton projet, puis :
   `cd phase0`
   `QUALITE=rapide blender -b -P render_room.py`   → test en 1 à 5 minutes (image 960x540)
   `QUALITE=moyenne blender -b -P render_room.py`  → image 1280x720, plus belle, plus longue
4. Récupère `chambre1.png` : clic droit sur le fichier dans l'explorateur de VS Code → Download.

## Réglages utiles
- Image trop sombre ou trop claire : `EXPOSITION=1.5` (plus clair) ou `EXPOSITION=0.3` (plus sombre).
- Nom du fichier : `SORTIE=essai2.png`.
- Un fichier `chambre1.blend` est aussi créé : on pourra l'ouvrir plus tard dans Blender.

## Sur ton PC Windows (alternative)
Télécharge Blender (version « portable », zip) sur blender.org, puis dans une invite de commandes :
`set QUALITE=rapide` puis `blender.exe -b -P render_room.py`
(le CPU travaille à fond pendant le rendu, ferme les autres programmes).

## À savoir
- Je n'ai pas pu lancer ce script moi-même (mon environnement n'a pas assez de puissance pour Blender). Il peut demander des ajustements : envoie-moi le message d'erreur ou l'image obtenue.
