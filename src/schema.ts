import { z } from 'zod';

// Repère : mètres. x = vers l'est (droite du plan), z = vers le bas du plan (la rue est en z = terrain.d), y = hauteur.
export const Room = z.object({
  id: z.string(), name: z.string(), level: z.number().int(),
  x: z.number(), z: z.number(), w: z.number().positive(), d: z.number().positive(), // intérieur de la pièce
  floor: z.enum(['sand', 'wood', 'tile', 'none']).default('sand'),
  open: z.boolean().default(false), // pièce ouverte : sol seulement, pas de murs
});
export const Opening = z.object({
  level: z.number().int(), x: z.number(), z: z.number(), // centre, sur l'axe du mur
  kind: z.enum(['door', 'slide', 'window', 'arch']), w: z.number().positive(),
});
export const Exterior = z.object({
  id: z.string(), kind: z.enum(['pool', 'tank', 'pit', 'garden', 'garage']),
  x: z.number(), z: z.number(), w: z.number().positive(), d: z.number().positive(),
});
export const Plan = z.object({
  terrain: z.object({ w: z.number(), d: z.number() }),
  levelHeight: z.number(), wallT: z.number(),
  rooms: z.array(Room), openings: z.array(Opening), exterior: z.array(Exterior),
});
export type PlanT = z.infer<typeof Plan>;
