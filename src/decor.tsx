import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { plan } from './plan';
import type { Op, V3 } from './geometry';

// Palette : blanc cassé, sable, grège, brun bois, touche terracotta.
export const C = { off: '#f4efe6', sable: '#d9c7a3', grege: '#b9ad9c', bois: '#8b6a4a', terra: '#c4704f', dark: '#3a3430', green: '#5b7f4a', glass: '#bcd9e6', deck: '#b99a74' };
type P = [number, number, number, number, number, number, string]; // centre (dx,dy,dz), taille (sx,sy,sz), couleur

function Bx({ p, s, c }: { p: V3; s: V3; c: string }) {
  return (
    <mesh position={p} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} transparent={c === C.glass} opacity={c === C.glass ? 0.4 : 1} />
    </mesh>
  );
}

// Meubles : face avant vers +z, dos vers -z.
const F: Record<string, P[]> = {
  bed: [[0, .25, 0, 1.6, .5, 2, C.bois], [0, .6, .05, 1.5, .2, 1.9, C.off], [0, .85, -.97, 1.8, 1, .08, C.terra], [-.4, .78, -.7, .5, .12, .3, C.sable], [.4, .78, -.7, .5, .12, .3, C.sable], [0, .72, .6, 1.5, .04, .6, C.grege], [-1.05, .22, -.8, .4, .44, .4, C.bois], [1.05, .22, -.8, .4, .44, .4, C.bois]],
  wardrobe: [[0, 1, 0, 1.8, 2, .55, C.off], [-.45, 1, .29, .8, 1.9, .03, C.sable], [.45, 1, .29, .8, 1.9, .03, C.sable]],
  vanity: [[0, .38, 0, 1, .76, .45, C.bois], [0, .78, 0, .9, .03, .4, C.off], [0, 1.35, -.2, .7, .9, .03, C.glass]],
  sofa: [[0, .22, 0, 2.2, .44, .9, C.grege], [0, .65, -.38, 2.2, .5, .15, C.grege], [-1.05, .4, 0, .12, .5, .9, C.grege], [1.05, .4, 0, .12, .5, .9, C.grege], [-.6, .6, -.2, .4, .35, .12, C.terra], [.6, .6, -.2, .4, .35, .12, C.sable]],
  table: [[0, .2, 0, 1, .4, .6, C.bois]],
  tv: [[0, .25, 0, 1.8, .5, .4, C.off], [0, 1.2, -.15, 1.4, .8, .05, C.dark]],
  dining: [[0, .38, 0, 1.8, .76, .9, C.bois], [-.6, .25, .7, .4, .5, .4, C.sable], [0, .25, .7, .4, .5, .4, C.sable], [.6, .25, .7, .4, .5, .4, C.sable], [-.6, .25, -.7, .4, .5, .4, C.sable], [0, .25, -.7, .4, .5, .4, C.sable], [.6, .25, -.7, .4, .5, .4, C.sable], [0, 2.2, 0, .9, .05, .9, C.terra]],
  kitchen: [[-.35, .45, 0, 1.7, .9, .6, C.off], [-.35, .92, 0, 1.7, .04, .62, C.bois], [-.35, 1.9, -.12, 1.7, .7, .35, C.grege], [1.05, .9, 0, .7, 1.8, .65, C.grege]],
  wc: [[0, .2, .1, .4, .4, .55, C.off], [0, .55, -.2, .4, .4, .15, C.off]],
  shower: [[0, .05, 0, .9, .1, .9, C.grege], [-.45, 1, 0, .03, 2, .9, C.glass]],
  art: [[0, 1.7, 0, 1.1, .75, .04, C.terra], [-.2, 1.7, .03, .4, .5, .02, C.sable]],
  plant: [[0, .2, 0, .3, .4, .3, C.terra], [0, .8, 0, .5, .8, .5, C.green]],
  rug: [[0, .012, 0, 2.4, .02, 1.6, C.sable]],
  bbq: [[0, .4, 0, 1, .8, .5, '#5a5149'], [0, .85, 0, .9, .04, .4, C.dark], [.3, 1.6, -.15, .3, 1.6, .3, '#5a5149']],
  osofa: [[0, .22, 0, 2.4, .44, .9, C.sable], [0, .65, -.38, 2.4, .5, .15, C.sable], [-.6, .55, -.1, .4, .1, .4, C.terra]],
};
type Item = { k: string; x: number; z: number; r: number; level: number };
const H2 = Math.PI / 2;

function items(): Item[] {
  const out: Item[] = [];
  const add = (k: string, x: number, z: number, r: number, level: number) => out.push({ k, x, z, r, level });
  for (const r of plan.rooms) {
    const l = r.level, cx = r.x + r.w / 2, cz = r.z + r.d / 2, ex = r.x + r.w, sz = r.z + r.d;
    if (r.name === 'Chambre') {
      add('rug', cx, r.z + 1.8, 0, l); add('bed', cx, r.z + 1.15, 0, l); add('art', cx, r.z + 0.05, 0, l);
      add('wardrobe', r.x + 0.3, sz - 1.3, H2, l); add('vanity', ex - 0.25, sz - 1.3, -H2, l); add('plant', r.x + 0.35, r.z + 0.35, 0, l);
    } else if (r.name === 'SDB') {
      add('vanity', r.x + 0.6, r.z + 0.25, 0, l); add('wc', ex - 0.35, r.z + 0.35, 0, l); add('shower', ex - 0.5, sz - 0.5, 0, l);
    } else if (r.name === 'Toilettes') add('wc', cx, r.z + 0.35, 0, l);
    else if (r.name === 'Salon') {
      add('rug', ex - 2.0, cz, 0, l); add('tv', ex - 0.25, cz, -H2, l); add('sofa', ex - 3.3, cz, H2, l);
      add('table', ex - 1.9, cz, H2, l); add('art', cx, r.z + 0.05, 0, l); add('plant', ex - 0.4, r.z + 0.4, 0, l);
    } else if (r.name === 'Cuisine') add('kitchen', cx - 0.1, r.z + 0.3, 0, l);
    else if (r.name === 'Salle à manger') { add('dining', cx, cz, 0, l); add('art', ex - 0.05, cz, -H2, l); }
    else if (r.name === 'Espace familial' && r.id === 'r-hall1') add('plant', r.x + 0.4, r.z + 0.4, 0, l);
  }
  return out;
}
const ITEMS = items();

export function Decor({ level }: { level: number }) {
  return (
    <group>
      {ITEMS.filter((i) => i.level === level).map((i, n) => (
        <group key={n} position={[i.x, level * plan.levelHeight, i.z]} rotation-y={i.r}>
          {F[i.k].map((q, m) => <Bx key={m} p={[q[0], q[1], q[2]]} s={[q[3], q[4], q[5]]} c={q[6]} />)}
        </group>
      ))}
    </group>
  );
}

// Couverture rigide de la piscine : glisse depuis le bord nord, praticable.
function Cover({ closed }: { closed: boolean }) {
  const p = plan.exterior.find((e) => e.id === 'pool')!;
  const g = useRef<THREE.Group>(null), a = useRef(0);
  useFrame((_, dt) => {
    a.current += ((closed ? 1 : 0) - a.current) * Math.min(1, dt * 2);
    if (g.current) g.current.scale.z = Math.max(0.001, a.current);
  });
  return (
    <group ref={g} position={[p.x + p.w / 2, 0.1, p.z - 0.05]}>
      <mesh position={[0, 0, (p.d + 0.1) / 2]} castShadow receiveShadow>
        <boxGeometry args={[p.w + 0.1, 0.08, p.d + 0.1]} />
        <meshStandardMaterial color={C.bois} />
      </mesh>
    </group>
  );
}

const Tree = ({ x, z }: { x: number; z: number }) => (
  <group position={[x, 0, z]}>
    <Bx p={[0, 0.8, 0]} s={[0.25, 1.6, 0.25]} c={C.bois} />
    <mesh position={[0, 2.3, 0]} castShadow><sphereGeometry args={[1.0, 16, 12]} /><meshStandardMaterial color={C.green} /></mesh>
  </group>
);

export function Outdoor({ Door, cover }: { Door: (p: { o: Op; base: number }) => JSX.Element; cover: boolean }) {
  const W = plan.terrain.w, D = plan.terrain.d, T = 0.2, Hf = 2.2;
  const south: [number, number][] = [[0, 0.6], [3.8, 9.75], [10.75, W]];
  const slats = Array.from({ length: 11 }, (_, i) => 8.7 + i * 0.35);
  return (
    <group>
      {/* Clôture + portail voiture (x 0,6–3,8) + portillon (x 9,75–10,75) */}
      <Bx p={[W / 2, Hf / 2, T / 2]} s={[W, Hf, T]} c={C.off} />
      <Bx p={[T / 2, Hf / 2, D / 2]} s={[T, Hf, D]} c={C.off} />
      <Bx p={[W - T / 2, Hf / 2, D / 2]} s={[T, Hf, D]} c={C.off} />
      {south.map(([a, b]) => <Bx key={a} p={[(a + b) / 2, Hf / 2, D - T / 2]} s={[b - a, Hf, T]} c={C.off} />)}
      <Door o={{ level: 0, x: 2.2, z: D - T / 2, kind: 'slide', w: 3.2, horiz: true }} base={0} />
      <Door o={{ level: 0, x: 10.25, z: D - T / 2, kind: 'door', w: 1.0, horiz: true }} base={0} />
      {/* Parking, allée, paillasson */}
      <Bx p={[1.9, 0.01, 17.5]} s={[3.4, 0.04, 9]} c="#c9c1b2" />
      <Bx p={[10.25, 0.01, 22.5]} s={[1.0, 0.04, 1.0]} c={C.grege} />
      <Bx p={[10.25, 0.04, 22.3]} s={[0.9, 0.03, 0.5]} c={C.dark} />
      {/* Terrasse en bois, pergola à lames, coin détente, barbecue */}
      <Bx p={[15.15, 0.02, 10.4]} s={[3.4, 0.06, 3.9]} c={C.deck} />
      {[[13.7, 8.6], [16.7, 8.6], [13.7, 12.1], [16.7, 12.1]].map(([x, z]) => <Bx key={`${x}${z}`} p={[x, 1.35, z]} s={[0.15, 2.7, 0.15]} c={C.bois} />)}
      {slats.map((z) => <Bx key={z} p={[15.2, 2.75, z]} s={[3.5, 0.06, 0.18]} c={C.bois} />)}
      <group position={[15.1, 0.05, 9.9]} rotation-y={Math.PI}><Bx p={[0, 0.22, 0]} s={[2.4, 0.44, 0.9]} c={C.sable} /><Bx p={[0, 0.65, -0.38]} s={[2.4, 0.5, 0.15]} c={C.sable} /><Bx p={[-0.6, 0.55, -0.1]} s={[0.4, 0.1, 0.4]} c={C.terra} /></group>
      <Bx p={[15.1, 0.25, 9.0]} s={[1.2, 0.4, 0.6]} c={C.bois} />
      <group position={[16.4, 0.05, 11.4]} rotation-y={-H2}>{F.bbq.map((q, m) => <Bx key={m} p={[q[0], q[1], q[2]]} s={[q[3], q[4], q[5]]} c={q[6]} />)}</group>
      {/* Piscine : margelle + couverture rigide */}
      <Bx p={[15.2, 0.0, 6.3]} s={[3.4, 0.04, 4.2]} c={C.sable} />
      <Cover closed={cover} />
      {/* Jardin : arbres, coin animaux, plantes */}
      {[[11, 2], [13.5, 2], [16, 2]].map(([x, z]) => <Tree key={x} x={x} z={z} />)}
      <Bx p={[9.2, 0.02, 2.2]} s={[2.4, 0.04, 2.2]} c="#9bb07a" />
      <Bx p={[9.2, 0.35, 1.5]} s={[0.8, 0.7, 0.8]} c={C.terra} />
      {[[3.5, 4.4], [12.3, 21.2], [16.5, 13.0]].map(([x, z]) => <group key={x} position={[x, 0, z]}>{F.plant.map((q, m) => <Bx key={m} p={[q[0], q[1], q[2]]} s={[q[3], q[4], q[5]]} c={q[6]} />)}</group>)}
    </group>
  );
}
