import { Plan } from './schema';

// Source : PLAN_22.pdf (cotes en cm converties en m). Terrain 17 x 23 m, maison 13 x 18 m, retraits : 4 m gauche, 4 m fond, 1 m rue.
// Plan dessiné à la main : positions déduites des cotes et du dessin (± 10-20 cm). Hauteur d'étage supposée : 3,00 m. Murs : 15 cm.
const r = (id: string, name: string, level: number, x: number, z: number, w: number, d: number, extra = {}) =>
  ({ id, name, level, x, z, w, d, ...extra });
const o = (level: number, x: number, z: number, kind: 'door' | 'slide' | 'window' | 'arch', w: number) => ({ level, x, z, kind, w });

export const plan = Plan.parse({
  terrain: { w: 17, d: 23 },
  levelHeight: 3.0,
  wallT: 0.15,
  rooms: [
    // ---- Rez-de-chaussée ----
    r('r-sdb1', 'SDB', 0, 4.15, 4.15, 2.5, 2.0, { floor: 'tile' }),
    r('r-sdb2', 'SDB', 0, 4.15, 6.3, 2.5, 1.85, { floor: 'tile' }),
    r('r-ch1', 'Chambre', 0, 6.8, 4.15, 4.0, 4.0, { floor: 'wood' }),
    r('r-toil', 'Toilettes', 0, 11.1, 5.65, 1.8, 2.5, { floor: 'tile' }), // toilette publique, porte côté piscine
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
    // ---- Étage (zones hachurées du plan = hall / dégagement, praticables ; zones « VIDE » = ciel ouvert) ----
    r('e-sdb1', 'SDB', 1, 4.15, 4.15, 2.5, 2.0, { floor: 'tile' }),
    r('e-sdb2', 'SDB', 1, 4.15, 6.3, 2.5, 1.85, { floor: 'tile' }),
    r('e-ch1', 'Chambre', 1, 6.8, 4.15, 4.0, 4.0, { floor: 'wood' }),
    r('e-toil', 'Toilettes', 1, 11.1, 5.65, 1.8, 2.5, { floor: 'tile' }),
    r('e-toil2', 'Toilettes', 1, 8.6, 8.6, 1.2, 1.4, { floor: 'tile' }),
    r('e-ch2', 'Chambre', 1, 4.15, 8.3, 4.0, 3.8, { floor: 'wood' }),
    r('e-cuisL', 'Cuisine', 1, 4.15, 14.3, 2.8, 2.4, { floor: 'tile' }),
    r('e-salL', 'Salon', 1, 4.15, 16.85, 4.0, 4.0, { floor: 'wood' }),
    r('e-balcS1', 'Balcon', 1, 4.15, 21.0, 4.0, 1.5, { open: true, floor: 'wood' }), // grand balcon, façade, à gauche
    r('e-esc', 'Escalier', 1, 8.3, 16.85, 2.4, 5.0, { floor: 'none' }),
    r('e-cours', 'Coursive', 1, 9.75, 16.85, 0.95, 5.0, { open: true }),
    r('e-hall', 'Hall', 1, 8.3, 8.3, 2.55, 8.55, { open: true }),
    r('e-hall3', 'Hall', 1, 10.85, 8.3, 3.0, 1.4, { open: true }),
    r('e-hallD', 'Hall', 1, 10.85, 12.9, 2.0, 2.5, { open: true }),
    r('e-pal', 'Palier', 1, 6.95, 14.3, 1.35, 2.4, { open: true }),
    r('e-cuisR', 'Cuisine', 1, 11.1, 9.85, 2.8, 2.9, { floor: 'tile' }),
    r('e-chR', 'Chambre', 1, 12.9, 12.8, 3.95, 2.55, { floor: 'wood' }), // chambre en L : partie principale + alcôve nord
    r('e-chR2', 'Chambre ext', 1, 14.05, 11.45, 2.8, 1.2, { floor: 'wood' }),
    r('e-salR', 'Salon', 1, 10.85, 15.5, 6.0, 4.35, { floor: 'wood' }),
    r('e-salR2', 'Salon ext', 1, 14.0, 20.0, 2.85, 1.85, { floor: 'wood' }),
    r('e-balcS2', 'Balcon', 1, 10.85, 20.0, 3.0, 2.0, { open: true, floor: 'wood' }), // petit balcon, près de l'escalier
  ],
  openings: [
    // RDC : entrée par le couloir à droite de l'escalier, puis porte vers l'espace familial
    o(0, 10.25, 21.925, 'door', 1.0), o(0, 10.25, 16.775, 'door', 1.0),
    o(0, 6.15, 21.925, 'window', 1.5), o(0, 13.85, 21.925, 'window', 2.5), o(0, 8.8, 4.075, 'window', 2.0),
    o(0, 5.4, 4.075, 'window', 0.8), o(0, 4.075, 10.2, 'window', 1.2), o(0, 12.0, 5.575, 'window', 0.6),
    o(0, 6.725, 5.3, 'door', 0.8), o(0, 5.4, 8.225, 'door', 0.8), o(0, 10.0, 8.225, 'door', 0.9), o(0, 8.225, 8.8, 'door', 0.9),
    o(0, 5.2, 16.775, 'door', 0.8), o(0, 7.6, 16.775, 'door', 0.9), o(0, 10.775, 11.2, 'door', 0.8),
    o(0, 13.425, 12.8, 'door', 0.8), o(0, 13.175, 7.3, 'door', 0.8), // toilette publique : porte vers l'extérieur
    o(0, 12.0, 16.775, 'slide', 1.6), o(0, 15.2, 12.475, 'slide', 2.0),
    // Étage
    o(1, 8.8, 4.075, 'window', 2.0), o(1, 4.075, 10.2, 'window', 1.2), o(1, 15.4, 11.375, 'window', 1.6), o(1, 15.4, 12.725, 'arch', 2.4), o(1, 9.5, 21.925, 'window', 1.4),
    o(1, 6.725, 5.3, 'door', 0.8), o(1, 5.4, 8.225, 'door', 0.8), o(1, 10.0, 8.225, 'door', 0.9), o(1, 12.0, 8.225, 'door', 0.8),
    o(1, 9.2, 10.075, 'door', 0.7), o(1, 8.225, 11.2, 'door', 0.9), o(1, 7.025, 15.5, 'door', 0.9), o(1, 7.5, 16.775, 'door', 1.2),
    o(1, 11.025, 11.0, 'door', 0.8), o(1, 12.825, 14.0, 'door', 0.9), o(1, 10.775, 16.3, 'door', 0.9), o(1, 9.55, 16.775, 'arch', 1.8),
    o(1, 6.1, 20.925, 'slide', 2.0), o(1, 12.35, 19.925, 'slide', 1.2), o(1, 15.4, 19.925, 'arch', 2.0), o(1, 15.4, 21.925, 'window', 1.8),
  ],
  exterior: [
    { id: 'fs', kind: 'tank', x: 1.2, z: 0.5, w: 2.9, d: 2.6 },
    { id: 'pp', kind: 'pit', x: 6.2, z: 0.6, w: 2.0, d: 2.0 },
    { id: 'pool', kind: 'pool', x: 13.7, z: 4.4, w: 3.0, d: 3.8 },
    { id: 'potager', kind: 'garden', x: 0.4, z: 6.0, w: 3.2, d: 6.5 },
  ],
});
