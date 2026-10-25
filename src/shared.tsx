import { Instance } from '@react-three/drei';
import * as THREE from 'three';
import type { V3 } from './geometry';

// Toutes les boîtes opaques sont dessinées en UN SEUL appel GPU (instancing) ; seules les vitres (transparentes) sont à part.
const unit = new THREE.BoxGeometry(1, 1, 1);
const mats = new Map<string, THREE.MeshStandardMaterial>();
const glass = (c: string, o: number) => {
  const k = c + o;
  let m = mats.get(k);
  if (!m) { m = new THREE.MeshStandardMaterial({ color: c, transparent: true, opacity: o }); mats.set(k, m); }
  return m;
};
export function Bx({ p, s, c, o = 1 }: { p: V3; s: V3; c: string; o?: number; cast?: boolean }) {
  if (c === '#bcd9e6' || o < 1) return <mesh position={p} scale={s} geometry={unit} material={glass(c, c === '#bcd9e6' ? 0.4 : o)} />;
  return <Instance position={p} scale={s} color={c} />;
}

// Réglages d'affichage partagés (lus à chaque image par les portes).
export const ui = { doorsOpen: true };
