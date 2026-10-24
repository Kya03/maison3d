import * as THREE from 'three';
import type { V3 } from './geometry';

// Une seule géométrie et un matériau par couleur : beaucoup moins de mémoire GPU que 1 géométrie par boîte.
const unit = new THREE.BoxGeometry(1, 1, 1);
const mats = new Map<string, THREE.MeshStandardMaterial>();
const mat = (c: string, o: number) => {
  const k = c + o;
  let m = mats.get(k);
  if (!m) { m = new THREE.MeshStandardMaterial({ color: c, transparent: o < 1, opacity: o }); mats.set(k, m); }
  return m;
};
export function Bx({ p, s, c, o = 1, cast }: { p: V3; s: V3; c: string; o?: number; cast?: boolean }) {
  const op = c === '#bcd9e6' ? 0.4 : o;
  return <mesh position={p} scale={s} geometry={unit} material={mat(c, op)} castShadow={cast ?? s[0] * s[1] * s[2] > 0.3} receiveShadow />;
}
