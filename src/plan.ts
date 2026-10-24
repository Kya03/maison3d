import { Plan } from './schema';

// Source : PLAN_22.pdf (cotes en cm converties en m). Terrain 17 x 23 m, maison 13 x 18 m, retraits : 4 m gauche, 4 m fond, 1 m rue.
// ATTENTION : plan dessiné à la main, positions déduites des cotes (± 10 cm). Hauteur sous plafond supposée (3,00 m) : non lisible sur la coupe AA.
// Murs de 15 cm.
const r = (id: string, name: string, level: number, x: number, z: number, w: number, d: number, extra = {}) =>
  ({ id, name, level, x, z, w, d, ...extra });

export const plan = Plan.parse({
  terrain: { w: 17, d: 23 },
  levelHeight: 3.0,
  wallT: 0.15,
  rooms: [
    // ---- Rez-de-chaussée ----
    r('r-sdb1', 'SDB', 0, 4.15, 4.15, 2.5, 2.0, { floor: 'tile' }),
    r('r-sdb2', 'SDB', 0, 4.15, 6.3, 2.5, 1.85, { floor: 'tile' }),
    r('r-ch1', 'Chambre', 0, 6.8, 4.15, 4.0, 4.0, { floor: 'wood' }),
    r('r-toil', 'Toilettes', 0, 11.1, 4.15, 2.0, 2.5, { floor: 'tile' }),
    r('r-ch2', 'Chambre', 0, 4.15, 8.3, 4.0, 3.8, { floor: 'wood' }),
    r('r-sdb3', 'SDB', 0, 4.15, 14.9, 2.8, 1.8, { floor: 'tile' }),
    r('r-ch3', 'Chambre', 0, 4.15, 16.85, 4.0, 5.0, { floor: 'wood' }),
    r('r-esc', 'Escalier', 0, 8.3, 16.85, 2.4, 5.0, { floor: 'tile' }),
    r('r-hall1', 'Espace familial', 0, 8.3, 8.3, 2.55, 8.4, { open: true }),
    r('r-hall2', 'Espace familial', 0, 10.85, 13.55, 2.75, 3.15, { open: true }),
    r('r-hall3', 'Espace familial', 0, 10.85, 8.3, 2.5, 2.15, { open: true }),
    r('r-cuis', 'Cuisine', 0, 10.85, 10.6, 2.5, 2.8, { floor: 'tile' }),
    r('r-sam', 'Salle à manger', 0, 13.6, 12.55, 3.25, 4.15, { floor: 'tile' }),
    r('r-salon', 'Salon', 0, 10.85, 16.85, 6.0, 5.0, { floor: 'wood' }),
    // ---- Étage (vides : pas de dalle au-dessus de l'espace familial) ----
    r('e-sdb1', 'SDB', 1, 4.15, 4.15, 2.5, 2.0, { floor: 'tile' }),
    r('e-sdb2', 'SDB', 1, 4.15, 6.3, 2.5, 1.85, { floor: 'tile' }),
    r('e-ch1', 'Chambre', 1, 6.8, 4.15, 4.0, 4.0, { floor: 'wood' }),
    r('e-toil', 'Toilettes', 1, 11.1, 4.15, 2.0, 2.5, { floor: 'tile' }),
    r('e-ch2', 'Chambre', 1, 4.15, 8.3, 4.0, 3.8, { floor: 'wood' }),
    r('e-cuisL', 'Cuisine', 1, 4.15, 14.9, 2.8, 2.5, { floor: 'tile' }),
    r('e-salL', 'Salon', 1, 4.15, 17.55, 4.0, 4.3, { floor: 'wood' }),
    r('e-esc', 'Escalier', 1, 8.3, 16.85, 2.4, 5.0, { floor: 'none', open: true }),
    r('e-hall', 'Hall', 1, 8.3, 8.3, 2.55, 8.55, { open: true }),
    r('e-cuisR', 'Cuisine', 1, 10.95, 9.9, 2.6, 2.7, { floor: 'tile' }),
    r('e-chR', 'Chambre', 1, 13.7, 12.7, 3.15, 3.0, { floor: 'wood' }),
    r('e-salR', 'Salon', 1, 10.85, 15.85, 6.0, 6.0, { floor: 'wood' }),
  ],
  openings: [
    // RDC
    { level: 0, x: 9.5, z: 21.925, kind: 'door', w: 1.2 }, // entrée (cage d'escalier, côté rue)
    { level: 0, x: 6.15, z: 21.925, kind: 'window', w: 1.5 },
    { level: 0, x: 13.85, z: 21.925, kind: 'window', w: 2.5 },
    { level: 0, x: 8.8, z: 4.075, kind: 'window', w: 2.0 },
    { level: 0, x: 5.4, z: 4.075, kind: 'window', w: 0.8 },
    { level: 0, x: 4.075, z: 10.2, kind: 'window', w: 1.2 },
    { level: 0, x: 9.8, z: 8.225, kind: 'door', w: 0.9 },
    { level: 0, x: 8.225, z: 10.0, kind: 'door', w: 0.9 },
    { level: 0, x: 7.6, z: 16.775, kind: 'door', w: 0.9 },
    { level: 0, x: 12.0, z: 10.525, kind: 'door', w: 0.9 },
    { level: 0, x: 12.0, z: 16.775, kind: 'slide', w: 1.6 },
    { level: 0, x: 15.2, z: 12.475, kind: 'slide', w: 2.0 },
    { level: 0, x: 12.1, z: 6.725, kind: 'door', w: 0.8 },
    // Étage
    { level: 1, x: 6.15, z: 21.925, kind: 'window', w: 2.0 },
    { level: 1, x: 13.85, z: 21.925, kind: 'window', w: 2.5 },
    { level: 1, x: 8.8, z: 4.075, kind: 'window', w: 2.0 },
    { level: 1, x: 9.8, z: 8.225, kind: 'door', w: 0.9 },
    { level: 1, x: 8.225, z: 10.0, kind: 'door', w: 0.9 },
    { level: 1, x: 10.875, z: 11.2, kind: 'door', w: 0.9 },
    { level: 1, x: 10.775, z: 16.3, kind: 'door', w: 0.9 },
    { level: 1, x: 15.0, z: 15.775, kind: 'door', w: 0.9 },
    { level: 1, x: 6.725, z: 5.2, kind: 'door', w: 0.8 },
    { level: 1, x: 6.725, z: 7.2, kind: 'door', w: 0.8 },
    { level: 1, x: 5.5, z: 17.475, kind: 'door', w: 0.9 },
  ],
  exterior: [
    // Issus du plan de masse : FS (fosse septique), PP (puisard)
    { id: 'fs', kind: 'tank', x: 1.2, z: 0.5, w: 2.9, d: 2.6 },
    { id: 'pp', kind: 'pit', x: 6.2, z: 0.6, w: 2.0, d: 2.0 },
    // Emplacements provisoires (à définir avec toi) : piscine, potager. Garage : non dessiné, position inconnue.
    { id: 'pool', kind: 'pool', x: 13.9, z: 5.0, w: 2.8, d: 6.0 },
    { id: 'potager', kind: 'garden', x: 0.4, z: 6.0, w: 3.2, d: 8.0 },
  ],
});
