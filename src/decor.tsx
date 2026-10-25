import { useFrame } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { plan } from './plan';
import { roofParts, type Op, type V3 } from './geometry';
import { Bx } from './shared';

// Palette : blanc cassé, sable, grège, brun bois, touche terracotta.
export const C = { off: '#f4efe6', sable: '#d9c7a3', grege: '#b9ad9c', bois: '#8b6a4a', terra: '#c4704f', dark: '#3a3430', green: '#5b7f4a', glass: '#bcd9e6', deck: '#b99a74' };
type P = [number, number, number, number, number, number, string]; // centre (dx,dy,dz), taille (sx,sy,sz), couleur


// Meubles : face avant vers +z, dos vers -z.
const F: Record<string, P[]> = {
  bed: [[0, .2, 0, 1.6, .4, 2, C.bois], [0, .5, .05, 1.5, .22, 1.9, C.off], [0, .85, -.98, 1.9, 1.1, .08, C.terra], [0, .62, .5, 1.56, .05, .9, C.grege], [-.42, .72, -.72, .55, .14, .32, C.sable], [.42, .72, -.72, .55, .14, .32, C.sable], [0, .74, -.45, 1.0, .1, .3, C.terra], [-1.1, .25, -.85, .45, .5, .4, C.bois], [1.1, .25, -.85, .45, .5, .4, C.bois], [-1.1, .62, -.85, .18, .26, .18, C.off], [1.1, .62, -.85, .18, .26, .18, C.off]],
  wardrobe: [[0, 1, 0, 1.8, 2, .55, C.off], [-.45, 1, .29, .8, 1.9, .03, C.sable], [.45, 1, .29, .8, 1.9, .03, C.sable]],
  vanity: [[0, .38, 0, 1, .76, .45, C.bois], [0, .78, 0, .9, .03, .4, C.off], [0, 1.35, -.2, .7, .9, .03, C.glass]],
  sofa: [[0, .15, 0, 2.2, .3, .9, C.dark], [-.55, .4, .05, 1.05, .2, .8, C.grege], [.55, .4, .05, 1.05, .2, .8, C.grege], [0, .75, -.38, 2.2, .6, .15, C.grege], [-1.07, .45, 0, .14, .6, .9, C.grege], [1.07, .45, 0, .14, .6, .9, C.grege], [-.8, .62, -.2, .42, .36, .12, C.terra], [.8, .62, -.2, .42, .36, .12, C.sable]],
  table: [[0, .2, 0, 1, .4, .6, C.bois]],
  tv: [[0, .25, 0, 1.8, .45, .4, C.off], [0, .05, 0, 1.7, .1, .35, C.dark], [0, 1.2, -.15, 1.5, .85, .05, C.dark], [0, .6, 0, .4, .2, .3, C.sable]],
  dining: [[0, .73, 0, 1.9, .06, .95, C.bois], [-.8, .35, 0, .08, .7, .8, C.dark], [.8, .35, 0, .08, .7, .8, C.dark], [-0.6, .45, 0.75, .42, .05, .42, C.sable], [-0.6, .7, 0.95, .42, .45, .05, C.sable], [-0.6, .45, -0.75, .42, .05, .42, C.sable], [-0.6, .7, -0.95, .42, .45, .05, C.sable], [0, .45, 0.75, .42, .05, .42, C.sable], [0, .7, 0.95, .42, .45, .05, C.sable], [0, .45, -0.75, .42, .05, .42, C.sable], [0, .7, -0.95, .42, .45, .05, C.sable], [0.6, .45, 0.75, .42, .05, .42, C.sable], [0.6, .7, 0.95, .42, .45, .05, C.sable], [0.6, .45, -0.75, .42, .05, .42, C.sable], [0.6, .7, -0.95, .42, .45, .05, C.sable], [0, 2.2, 0, .9, .05, .9, C.terra], [0, 2.7, 0, .03, 1, .03, C.dark]],
  kitchen: [[-.35, .45, 0, 1.7, .9, .6, C.off], [-.35, .92, 0, 1.7, .04, .62, C.bois], [-.6, .95, 0, .5, .02, .4, C.grege], [.1, .95, 0, .5, .02, .4, C.dark], [-.35, 1.9, -.12, 1.7, .7, .35, C.grege], [-.35, 1.35, -.28, 1.7, .5, .03, C.sable], [1.05, .9, 0, .7, 1.8, .65, C.grege]],
  wc: [[0, .2, .1, .4, .4, .55, C.off], [0, .55, -.2, .4, .4, .15, C.off]],
  shower: [[0, .05, 0, .9, .1, .9, C.grege], [-.45, 1, 0, .03, 2, .9, C.glass]],
  art: [[0, 1.7, 0, 1.2, .85, .05, C.dark], [0, 1.7, .03, 1.1, .75, .03, C.terra], [-.2, 1.7, .05, .4, .5, .02, C.sable], [.25, 1.6, .05, .3, .3, .02, C.off]],
  plant: [[0, .2, 0, .3, .4, .3, C.terra], [0, .8, 0, .5, .8, .5, C.green]],
  bistro: [[0, .7, 0, .6, .04, .6, C.dark], [0, .35, 0, .06, .7, .06, C.dark], [-.45, .25, 0, .35, .5, .35, C.sable], [.45, .25, 0, .35, .5, .35, C.sable]],
  lamp: [[0, .02, 0, .3, .04, .3, C.dark], [0, .8, 0, .03, 1.6, .03, C.dark], [0, 1.65, 0, .38, .3, .38, C.off]],
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
      add('table', ex - 1.9, cz, H2, l); add('art', cx, r.z + 0.05, 0, l); add('plant', ex - 0.4, r.z + 0.4, 0, l); add('lamp', ex - 3.3, cz + 1.5, 0, l);
    } else if (r.name === 'Cuisine') add('kitchen', cx - 0.1, r.z + 0.3, 0, l);
    else if (r.name === 'Salle à manger') { add('rug', cx, cz, 0, l); add('dining', cx, cz, 0, l); add('art', ex - 0.05, cz, -H2, l); }
    else if (r.name === 'Balcon') { add('bistro', cx, cz, H2, l); add('plant', r.x + 0.35, r.z + 0.35, 0, l); }
    else if (r.name === 'Espace familial' && r.id === 'r-hall1') add('plant', r.x + 0.4, r.z + 0.4, 0, l);
  }
  return out;
}
const ITEMS = items();

// Pour remplacer un meuble par un vrai modèle 3D : dépose le .glb dans public/models/ puis ajoute-le ici, ex. sofa: { url: './models/sofa.glb', scale: 1 }
const MODELS: Record<string, { url: string; scale?: number }> = {};
function Model({ url, scale = 1 }: { url: string; scale?: number }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene.clone()} scale={scale} />;
}

export function Decor({ level }: { level: number }) {
  const Hh = plan.levelHeight;
  return (
    <group>
      <Suspense fallback={null}>
        {ITEMS.filter((i) => i.level === level).map((i, n) => (
          <group key={n} position={[i.x, level * Hh, i.z]} rotation-y={i.r}>
            {MODELS[i.k] ? <Model {...MODELS[i.k]} /> : F[i.k].map((q, m) => <Bx key={m} p={[q[0], q[1], q[2]]} s={[q[3], q[4], q[5]]} c={q[6]} />)}
          </group>
        ))}
      </Suspense>
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
      <Door o={{ level: 0, x: 2.2, z: D - T / 2, kind: 'slide', w: 3.2, horiz: true, gate: true }} base={0} />
      <Door o={{ level: 0, x: 10.25, z: D - T / 2, kind: 'door', w: 1.0, horiz: true, gate: true }} base={0} />
      {/* Parking, allée, paillasson */}
      <Bx p={[1.9, 0.01, 17.5]} s={[3.4, 0.04, 9]} c="#c9c1b2" />
      <Bx p={[10.25, 0.01, 22.5]} s={[1.0, 0.04, 1.0]} c={C.grege} />
      <Bx p={[10.25, 0.04, 22.3]} s={[0.9, 0.03, 0.5]} c={C.dark} />
      {/* Terrasse en bois, pergola à lames, coin détente, barbecue */}
      <Bx p={[15.15, 0.02, 10.4]} s={[3.4, 0.06, 3.9]} c={C.deck} />
      {[[13.7, 8.6], [16.7, 8.6], [13.7, 12.1], [16.7, 12.1]].map(([x, z]) => <Bx key={`${x}${z}`} p={[x, 1.35, z]} s={[0.15, 2.7, 0.15]} c={C.bois} />)}
      {slats.map((z) => <Bx key={z} p={[15.2, 2.75, z]} s={[3.5, 0.06, 0.18]} c={C.bois} cast />)}
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

const ROOF = roofParts();
export function Roof() {
  return <group>{ROOF.map((b, i) => <Bx key={i} p={b.p} s={b.s} c={C.off} />)}</group>;
}
