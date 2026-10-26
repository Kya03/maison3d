import { useFrame } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { plan } from './plan';
import { build, roofParts, STAIR, type Op, type V3 } from './geometry';
import { Bx } from './shared';

export const C = { off: '#f4efe6', sable: '#d9c7a3', grege: '#b9ad9c', bois: '#8b6a4a', terra: '#c4704f', dark: '#2f2b29', green: '#5b7f4a', glass: '#bcd9e6', deck: '#b99a74', gold: '#c9a45c', led: '#ffd89a', anth: '#4a4a4d', brick: '#b4724a', fence: '#e3d8c6' };
type P = [number, number, number, number, number, number, string]; // centre (dx,dy,dz), taille (sx,sy,sz), couleur ('$x' = couleur du thème)
type Theme = Record<string, string>;
const H = plan.levelHeight, H2 = Math.PI / 2;

// Ambiances de couleur : le mobilier est le même partout, seules les couleurs changent.
const BASE: Theme = { wall: '#f4efe6', wood: '#8b6a4a', head: '#d9c7a3', bed: '#f4efe6', throw: '#b9ad9c', accent: '#c4704f', rug: '#d9c7a3', curtain: '#e8dfd0', sofa: '#b9ad9c', cab: '#f4efe6', basin: '#f4efe6', fix: '#c9a45c' };
const T: Record<string, Theme> = {
  ivoire: { wall: '#e9dfd0', head: '#f1ebe0', bed: '#f4efe6', throw: '#cbb79b', accent: '#d9c7a3', rug: '#eee6d8', wood: '#b99a74', curtain: '#d8cbb6' },
  bordeaux: { wall: '#7a2c38', head: '#6b2231', bed: '#efe6d6', throw: '#8e3a46', accent: '#c9a45c', rug: '#d8c7ae', wood: '#6a4632', curtain: '#8b3a48' },
  marron: { wall: '#7a5a44', head: '#5f4332', bed: '#efe3d0', throw: '#a17a58', accent: '#d9b98a', rug: '#cdb89b', wood: '#4d3626', curtain: '#9b7a5c' },
  chaud: { wall: '#c98a5e', head: '#b5623f', bed: '#f2e6d3', throw: '#d19a52', accent: '#e0b04a', rug: '#e4cfa8', wood: '#8b5a36', curtain: '#d9a066' },
  lumineux: { wall: '#f6f3ec', head: '#f1ede4', bed: '#ffffff', throw: '#cfd9c4', accent: '#a9bfa0', rug: '#f0ebe0', wood: '#cdb894', curtain: '#ffffff' },
  boheme: { wall: '#5f7a6e', head: '#3f6a6b', bed: '#f1e8d8', throw: '#c98c7a', accent: '#d6a45a', rug: '#cdb78f', wood: '#a77f52', curtain: '#e6c9b0' },
  salonRDC: { wall: '#b5523b', sofa: '#efe6d6', accent: '#b5523b', cab: '#7c8062', wood: '#7c8062', rug: '#efe6d6', curtain: '#e8dcc4' },
  salonClair: { wall: '#e8dfd0', sofa: '#efe6d6', accent: '#8a4a3a', cab: '#d8ccb6', wood: '#7a5a44', rug: '#b8aa94', curtain: '#ffffff' },
  salonSombre: { wall: '#5a463a', sofa: '#8a7766', accent: '#c9a45c', cab: '#3c322b', wood: '#3c2b22', rug: '#6b5a4c', curtain: '#cbb79b' },
  familial: { wall: '#c9825f', sofa: '#e6dcc8', accent: '#a85a3c', cab: '#c9825f', wood: '#b9a07c', rug: '#c8ae86', curtain: '#b5523b' },
  familial2: { wall: '#9fae92', sofa: '#e2dccb', accent: '#7f8f6d', cab: '#9fae92', wood: '#b9a07c', rug: '#cdbf9f', curtain: '#9fae92' },
  marbre: { basin: '#f4efe6', wood: '#b99a74' },
  sauge: { basin: '#7f8f6d', wood: '#a77f52' },
  balcClair: { sofa: '#d6c9b3', wood: '#b99a74' },
  balcNoir: { sofa: '#d9d4cc', wood: '#2f2b29' },
};
const th = (n?: string): Theme => ({ ...BASE, ...(n ? T[n] : {}) });
const col = (c: string, t: Theme) => (c[0] === '$' ? t[c.slice(1)] ?? '#cccccc' : c);

const F: Record<string, P[]> = {
  bed: [[0, .22, 0, 1.7, .44, 2.1, '$head'], [0, .55, .05, 1.55, .22, 1.95, '$bed'], [0, .95, -1.03, 1.9, 1.2, .08, '$head'], [-.5, .95, -.98, .55, .75, .06, '$head'], [0, .95, -.98, .55, .75, .06, '$head'], [.5, .95, -.98, .55, .75, .06, '$head'],
    [-.4, .72, -.72, .55, .14, .32, '$accent'], [.4, .72, -.72, .55, .14, .32, '$accent'], [0, .76, -.5, .9, .1, .3, '$throw'], [0, .68, .55, 1.56, .04, .85, '$throw'],
    [-1.15, .28, -.85, .5, .56, .42, '$wood'], [1.15, .28, -.85, .5, .56, .42, '$wood'], [-1.15, .68, -.85, .14, .22, .14, C.off], [1.15, .68, -.85, .14, .22, .14, C.off], [-1.15, 1.6, -1.0, .1, .4, .08, C.gold], [1.15, 1.6, -1.0, .1, .4, .08, C.gold]],
  vanity: [[0, .38, 0, 1.4, .76, .5, C.off], [0, .78, 0, 1.46, .04, .52, C.off], [0, 1.55, -.23, 1.0, 1.0, .02, C.led], [0, 1.55, -.22, .9, .9, .03, '#dfeaee'], [0, .28, .65, .55, .56, .5, '$head'], [0, .62, .9, .55, .5, .1, '$head'], [-.5, .9, 0, .12, .25, .12, '#e8d9c0']],
  miroir: [[0, .9, 0, .7, 1.8, .08, '#f1ebe0'], [0, .9, .045, .55, 1.6, .02, '#dfeaee'], [0, .9, -.03, .78, 1.88, .02, C.led]],
  vasque: [[0, .55, 0, .9, .3, .45, '$wood'], [0, .78, 0, .95, .05, .47, C.off], [0, .87, 0, .4, .12, .32, '$basin'], [0, 1.45, -.2, .55, .85, .03, '#dfeaee'], [0, 1.45, -.215, .6, .9, .01, C.led], [.2, 1.0, -.1, .03, .25, .03, C.gold]],
  wc: [[0, .42, .05, .38, .36, .55, '$basin'], [0, 1.0, -.2, .4, .15, .08, C.gold], [0, .75, -.2, .4, .5, .15, C.off]],
  shower: [[0, .05, 0, .9, .1, .9, C.grege], [-.45, 1, 0, .03, 2, .9, C.glass], [-.45, 1, .45, .05, 2, .04, C.dark], [-.45, 1, -.45, .05, 2, .04, C.dark], [.1, 2.05, -.3, .3, .03, .3, C.gold], [.43, 1.3, 0, .03, .5, .5, C.led]],
  sofa: [[0, .15, 0, 2.2, .3, .9, C.dark], [-.55, .4, .05, 1.05, .2, .8, '$sofa'], [.55, .4, .05, 1.05, .2, .8, '$sofa'], [0, .75, -.38, 2.2, .6, .15, '$sofa'], [-1.07, .45, 0, .14, .6, .9, '$sofa'], [1.07, .45, 0, .14, .6, .9, '$sofa'], [-.8, .62, -.2, .42, .36, .12, '$accent'], [.8, .62, -.2, .42, .36, .12, C.sable]],
  fauteuil: [[0, .2, 0, .85, .4, .85, '$accent'], [0, .6, -.35, .85, .6, .18, '$accent']],
  sofaL: [[0, .15, 0, 2.2, .3, .9, C.dark], [-.55, .4, .05, 1.05, .2, .8, '$sofa'], [.55, .4, .05, 1.05, .2, .8, '$sofa'], [0, .75, -.38, 2.2, .6, .15, '$sofa'], [1.4, .22, .45, .9, .44, 1.8, '$sofa'], [-.8, .62, -.2, .42, .36, .12, '$accent'], [1.4, .55, .8, .4, .3, .12, '$accent']],
  table: [[0, .2, 0, 1, .4, .6, '$wood']],
  rond: [[0, .2, 0, .9, .4, .9, '$wood'], [0, .45, 0, .25, .12, .25, '$accent']],
  tv: [[0, .25, 0, 2.2, .4, .4, '$cab'], [0, .06, .02, 2.2, .03, .4, C.led], [0, 1.35, -.15, 1.6, .9, .05, C.dark]],
  cheminee: [[0, 1.3, 0, 1.4, 2.6, .35, '$cab'], [0, .55, .18, .9, .5, .05, C.dark], [0, .5, .21, .7, .14, .03, '#ff9d3a'], [0, 1.5, .18, .9, .9, .05, C.off], [0, 1.5, .21, .8, .04, .02, C.led]],
  priere: [[0, .2, 0, .42, .4, .3, C.off], [0, .75, -.05, .42, 1.1, .2, C.off], [0, 1.42, 0, .46, .06, .32, C.off], [0, 1.47, 0, .22, .05, .16, '#1d3a5f'], [0, 1.65, -.08, .28, .3, .04, C.off], [-.12, 1.0, .06, .04, .3, .03, C.gold], [.12, 1.0, .06, .04, .3, .03, C.gold]],
  kitchen: [[-.35, .45, 0, 1.7, .9, .6, C.anth], [-.35, .92, 0, 1.7, .04, .62, '#26262a'], [-.6, .95, 0, .5, .02, .4, '#cfd3d6'], [.1, .95, 0, .5, .02, .4, C.dark], [-.35, 1.9, -.12, 1.7, .7, .35, C.anth], [-.35, 1.35, -.28, 1.7, .5, .03, '#ddd3c2'], [-.35, 1.52, -.1, 1.7, .02, .3, C.led], [1.05, .9, 0, .7, 1.8, .65, '#9a9fa3'], [-.35, 2.4, .2, .25, .35, .25, C.gold], [.3, 2.4, .2, .25, .35, .25, C.gold]],
  dining: [[0, .73, 0, 2.2, .06, 1.1, '#e9e4dc'], [0, .37, 0, .8, .7, .5, C.gold],
    ...[-.7, 0, .7].flatMap((x): P[] => [[x, .45, .85, .5, .05, .5, '#cdbfa8'], [x, .75, 1.08, .5, .5, .06, '#cdbfa8'], [x, .45, -.85, .5, .05, .5, '#cdbfa8'], [x, .75, -1.08, .5, .5, .06, '#cdbfa8']]),
    [-.5, 2.3, 0, 1.0, .06, .7, '#fff3dc'], [.5, 2.3, 0, 1.0, .06, .7, '#fff3dc'], [0, 2.75, 0, .02, .9, .02, C.dark]],
  buffet: [[0, .4, 0, 1.6, .8, .4, C.grege], [0, 1.6, -.15, 1.0, 1.0, .03, '#dfeaee'], [0, 1.6, -.17, 1.12, 1.12, .01, C.led]],
  plant: [[0, .2, 0, .3, .4, .3, C.terra], [0, .8, 0, .5, .8, .5, C.green]],
  lamp: [[0, .02, 0, .3, .04, .3, C.dark], [0, .8, 0, .03, 1.6, .03, C.dark], [0, 1.65, 0, .38, .3, .38, C.off]],
  console: [[0, .85, 0, 1.4, .1, .3, '$wood'], [0, .68, 0, 1.3, .26, .28, '$wood'], [0, 1.7, -.12, .85, .85, .03, C.gold], [0, 1.7, -.1, .75, .75, .02, '#dfeaee'], [-.4, 1.1, 0, .2, .3, .2, '#e6dccb']],
  bistro: [[0, .7, 0, .6, .04, .6, C.dark], [0, .35, 0, .06, .7, .06, C.dark], [-.45, .25, 0, .35, .5, .35, C.sable], [.45, .25, 0, .35, .5, .35, C.sable]],
  osofa: [[0, .22, 0, 2.4, .44, .9, '$wood'], [0, .5, .02, 2.3, .14, .8, '$sofa'], [0, .72, -.38, 2.4, .5, .15, '$sofa'], [-.6, .6, -.1, .4, .1, .4, C.terra]],
  rug: [[0, .012, 0, 2.4, .02, 1.6, '$rug']],
  bbq: [[0, .45, 0, 1.2, .9, .6, C.brick], [0, .95, 0, 1.3, .06, .65, C.dark], [0, 1.7, -.2, .9, 1.5, .35, C.brick], [0, 2.7, -.2, .4, 1.0, .3, C.brick], [0, .4, .31, .6, .5, .02, C.dark]],
  bar: [[0, .5, 0, 1.8, 1.0, .5, '#a07a50'], [0, 1.02, 0, 1.9, .05, .6, C.dark], [-.6, .35, .8, .35, .7, .35, '#4a3b30'], [0, .35, .8, .35, .7, .35, '#4a3b30'], [.6, .35, .8, .35, .7, .35, '#4a3b30']],
  tabler: [[0, .72, 0, 1.1, .05, 1.1, '#a8825a'], [0, .36, 0, .1, .72, .1, C.dark], [.95, .25, 0, .5, .5, .5, '#4a3b30'], [-.95, .25, 0, .5, .5, .5, '#4a3b30']],
};

function majlis(w: number, d: number): P[] {
  const x0 = -w / 2, L = Math.min(2.8, w * 0.5), ax = x0 + 0.9 + L / 2, tx = x0 + 0.9 + L * 0.55;
  const p: P[] = [
    [x0 + .45, .22, 0, .9, .44, d - .4, '$sofa'], [x0 + .12, .65, 0, .24, .9, d - .4, '$sofa'],
    [ax, .22, -d / 2 + .55, L, .44, .9, '$sofa'], [ax, .65, -d / 2 + .2, L, .9, .24, '$sofa'],
    [ax, .22, d / 2 - .55, L, .44, .9, '$sofa'], [ax, .65, d / 2 - .2, L, .9, .24, '$sofa'],
    [tx, .28, 0, .9, .56, .9, '$wood'], [tx, .58, 0, 1.1, .04, 1.1, '$wood'], [tx, .012, 0, L + .6, .02, 2.4, '$rug'],
    [tx, 2.6, 0, .9, .35, .9, C.gold], [tx, 2.9, 0, .03, .3, .03, C.dark],
  ];
  for (const z of [-.8, 0, .8]) p.push([x0 + .5, .55, z, .14, .4, .4, '$accent']);
  return p;
}

type Item = { k: string; x: number; z: number; r: number; level: number; t?: string; parts?: P[] };
type Panel = { level: number; p: V3; s: V3; c: string };
const ROOMTHEME: Record<string, string> = { 'r-ch3': 'ivoire', 'r-ch2': 'bordeaux', 'r-ch1': 'marron', 'e-chR': 'chaud', 'e-ch2': 'lumineux', 'e-ch1': 'boheme', 'r-salon': 'salonRDC', 'e-salL': 'salonClair', 'e-salR': 'salonSombre', 'r-sam': 'familial' };
// Chambres (numérotation de Hop) : mur de tête de lit, coiffeuse et miroir [x, z, rotation]
const BEDROOMS: Record<string, { head: 'N' | 'S' | 'E' | 'W'; van: [number, number, number]; mir: [number, number, number] }> = {
  'r-ch3': { head: 'W', van: [7.85, 18.3, -H2], mir: [7.85, 20.8, -H2] }, // chambre 1 RDC
  'r-ch2': { head: 'S', van: [7.2, 8.6, 0], mir: [4.4, 9.0, H2] }, // chambre 2 RDC
  'r-ch1': { head: 'E', van: [7.1, 7.1, H2], mir: [8.0, 7.95, Math.PI] }, // chambre 3 RDC
  'e-chR': { head: 'E', van: [14.6, 11.7, 0], mir: [13.1, 13.2, H2] }, // chambre 1 étage
  'e-ch2': { head: 'S', van: [7.2, 8.6, 0], mir: [4.4, 9.0, H2] }, // chambre 2 étage
  'e-ch1': { head: 'E', van: [7.1, 7.1, H2], mir: [8.0, 7.95, Math.PI] }, // chambre 3 étage
};

const PANELS: Panel[] = [];
const CURT: Panel[] = [];
function items(): Item[] {
  const out: Item[] = [];
  const add = (k: string, x: number, z: number, r: number, level: number, t?: string) => out.push({ k, x, z, r, level, t });
  for (const r of plan.rooms) {
    const l = r.level, cx = r.x + r.w / 2, cz = r.z + r.d / 2, ex = r.x + r.w, sz = r.z + r.d, base = l * H;
    const B = BEDROOMS[r.id], tn = ROOMTHEME[r.id];
    if (B) {
      const hp = { N: [cx, r.z + 1.15, 0], S: [cx, sz - 1.15, Math.PI], W: [r.x + 1.15, cz, H2], E: [ex - 1.15, cz, -H2] }[B.head];
      add('rug', cx, cz, 0, l, tn); add('bed', hp[0], hp[1], hp[2], l, tn);
      add('vanity', B.van[0], B.van[1], B.van[2], l, tn); add('miroir', B.mir[0], B.mir[1], B.mir[2], l, tn); add('plant', ex - 0.35, sz - 0.35, 0, l);
      const L = Math.min(3.4, (B.head === 'N' || B.head === 'S' ? r.w : r.d) - 0.1), c = th(tn).wall;
      if (B.head === 'N') PANELS.push({ level: l, p: [hp[0], base + 1.4, r.z + 0.02], s: [L, 2.8, 0.04], c });
      if (B.head === 'S') PANELS.push({ level: l, p: [hp[0], base + 1.4, sz - 0.02], s: [L, 2.8, 0.04], c });
      if (B.head === 'W') PANELS.push({ level: l, p: [r.x + 0.02, base + 1.4, hp[1]], s: [0.04, 2.8, L], c });
      if (B.head === 'E') PANELS.push({ level: l, p: [ex - 0.02, base + 1.4, hp[1]], s: [0.04, 2.8, L], c });
    } else if (r.name === 'SDB') {
      const t = l === 0 ? 'marbre' : 'sauge';
      add('vasque', r.x + 0.7, r.z + 0.25, 0, l, t); add('wc', ex - 0.4, r.z + 0.35, 0, l, t); add('shower', ex - 0.5, sz - 0.5, 0, l, t);
    } else if (r.name === 'Toilettes') {
      if (r.id === 'r-toil') { add('vasque', r.x + 0.25, cz - 0.4, H2, l, 'marbre'); add('wc', cx + 0.1, sz - 0.3, Math.PI, l, 'marbre'); }
      else add('wc', cx, r.z + 0.35, 0, l, 'sauge');
    } else if (r.name === 'Salon') {
      const e = l === 1;
      add('tv', ex - 0.25, cz, -H2, l, tn);
      const L = Math.min(r.d - 0.4, 4.4); PANELS.push({ level: l, p: [ex - 0.02, base + 1.35, cz], s: [0.04, 2.7, L], c: th(tn).wall });
      if (!e) { add('rug', ex - 2.0, cz, 0, l, tn); add('sofa', ex - 3.4, cz, H2, l, tn); add('table', ex - 2.0, cz, H2, l, tn); add('fauteuil', ex - 1.8, cz + 1.9, -H2, l, tn); add('plant', ex - 0.4, r.z + 0.4, 0, l); add('lamp', ex - 3.4, cz + 1.7, 0, l); }
      else { out.push({ k: 'majlis', x: cx, z: cz, r: 0, level: l, t: tn, parts: majlis(r.w, r.d) }); add('priere', r.x + 0.4, r.z + 0.3, 0, l); add('plant', ex - 0.4, r.z + 0.4, 0, l); }
    } else if (r.name === 'Cuisine') add('kitchen', cx - 0.1, r.z + 0.3, 0, l);
    else if (r.name === 'Salle à manger') { add('rug', cx, cz, 0, l, tn); add('dining', cx, cz, H2, l); add('buffet', ex - 0.25, cz, -H2, l); }
    else if (r.name === 'Espace familial' && r.id === 'r-hall1') { add('cheminee', 8.6, 13.0, H2, l, 'familial'); add('rug', 9.6, 14.8, 0, l, 'familial'); add('sofaL', 9.2, 15.9, Math.PI, l, 'familial'); add('rond', 9.6, 14.2, 0, l, 'familial'); add('plant', 10.5, 9.0, 0, l); }
    else if (r.id === 'e-hall') { add('cheminee', 8.6, 13.0, H2, l, 'familial2'); add('rug', 9.6, 14.8, 0, l, 'familial2'); add('sofaL', 9.2, 15.9, Math.PI, l, 'familial2'); add('rond', 9.6, 14.2, 0, l, 'familial2'); add('plant', 10.5, 9.0, 0, l); }
    else if (r.id === 'e-balcS1') { add('osofa', cx, r.z + 0.5, 0, l, 'balcClair'); add('rond', cx, r.z + 1.15, 0, l, 'balcClair'); add('plant', r.x + 0.4, sz - 0.4, 0, l); }
    else if (r.id === 'e-balcS2') { add('osofa', cx, r.z + 0.5, 0, l, 'balcNoir'); add('bistro', cx, r.z + 1.4, 0, l); add('plant', r.x + 0.35, sz - 0.35, 0, l); add('plant', ex - 0.35, sz - 0.35, 0, l); }
  }
  // Entrée : couloir à droite de l'escalier
  add('rug', 10.25, 19.4, 0, 0, 'familial'); add('console', 10.55, 19.4, -H2, 0, 'familial'); add('plant', 10.45, 21.4, 0, 0);
  // Rideaux aux fenêtres des pièces décorées
  for (const level of [0, 1]) for (const o of build(level).ops) {
    if (o.kind === 'door' || o.kind === 'arch') continue;
    const r = plan.rooms.find((q) => q.level === level && !q.open && ROOMTHEME[q.id] && o.x >= q.x - 0.3 && o.x <= q.x + q.w + 0.3 && o.z >= q.z - 0.3 && o.z <= q.z + q.d + 0.3);
    if (!r) continue;
    const c = th(ROOMTHEME[r.id]).curtain, y = level * H + 1.4, sg = o.horiz ? (r.z + r.d / 2 > o.z ? 1 : -1) : (r.x + r.w / 2 > o.x ? 1 : -1);
    CURT.push(o.horiz ? { level, p: [o.x, y, o.z + sg * 0.14], s: [o.w + 0.5, 2.6, 0.05], c } : { level, p: [o.x + sg * 0.14, y, o.z], s: [0.05, 2.6, o.w + 0.5], c });
  }
  return out;
}
const ITEMS = items();

// Escalier : contremarches claires, marches en noyer, LED sous les marches, lames de bois au mur, rampe bois et métal noir
function StairExtras() {
  const n = 16, rise = H / n, run = STAIR.d / n;
  return (
    <group>
      <Bx p={[8.31, 1.5, 19.35]} s={[0.04, 3, 5]} c="#6b4a32" />
      <Bx p={[8.36, 1.9, 18.4]} s={[0.04, 1.2, 0.04]} c={C.led} />
      {Array.from({ length: n }, (_, i) => {
        const z = STAIR.z + (i + 0.5) * run, y = (i + 1) * rise;
        return (
          <group key={i}>
            <Bx p={[9.0, y - 0.02, z - run / 2 + 0.01]} s={[1.2, 0.02, 0.03]} c={C.led} />
            <Bx p={[9.68, y + 0.93, z]} s={[0.06, 0.05, run + 0.02]} c="#5a3d2a" />
            {i % 2 === 0 && <Bx p={[9.68, y + 0.45, z]} s={[0.025, 0.9, 0.025]} c={C.dark} />}
          </group>
        );
      })}
    </group>
  );
}

const MODELS: Record<string, { url: string; scale?: number }> = {};
function Model({ url, scale = 1 }: { url: string; scale?: number }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene.clone()} scale={scale} />;
}

export function Decor({ level }: { level: number }) {
  return (
    <group>
      <Suspense fallback={null}>
        {ITEMS.filter((i) => i.level === level).map((i, n) => {
          const t = th(i.t);
          return (
            <group key={n} position={[i.x, level * H, i.z]} rotation-y={i.r}>
              {MODELS[i.k] ? <Model {...MODELS[i.k]} /> : (i.parts ?? F[i.k]).map((q, m) => <Bx key={m} p={[q[0], q[1], q[2]]} s={[q[3], q[4], q[5]]} c={col(q[6], t)} />)}
            </group>
          );
        })}
      </Suspense>
      {PANELS.filter((p) => p.level === level).map((p, i) => <Bx key={`p${i}`} p={p.p} s={p.s} c={p.c} />)}
      {CURT.filter((p) => p.level === level).map((p, i) => <Bx key={`c${i}`} p={p.p} s={p.s} c={p.c} />)}
      {level === 0 && <StairExtras />}
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

const Tree = ({ x, z, r = 1.0, h = 1.6 }: { x: number; z: number; r?: number; h?: number }) => (
  <group position={[x, 0, z]}>
    <Bx p={[0, h / 2, 0]} s={[0.22, h, 0.22]} c={C.bois} />
    <mesh position={[0, h + r * 0.7, 0]} castShadow><sphereGeometry args={[r, 16, 12]} /><meshStandardMaterial color={C.green} /></mesh>
  </group>
);
const Parts = ({ k, x, z, r = 0, y = 0.05, t }: { k: string; x: number; z: number; r?: number; y?: number; t?: string }) => (
  <group position={[x, y, z]} rotation-y={r}>{F[k].map((q, m) => <Bx key={m} p={[q[0], q[1], q[2]]} s={[q[3], q[4], q[5]]} c={col(q[6], th(t))} />)}</group>
);

export function Outdoor({ Door, cover }: { Door: (p: { o: Op; base: number }) => JSX.Element; cover: boolean }) {
  const W = plan.terrain.w, D = plan.terrain.d, T2 = 0.2, Hf = 2.2;
  const south: [number, number][] = [[0, 0.6], [3.8, 9.75], [10.75, W]];
  const slats = Array.from({ length: 11 }, (_, i) => 8.7 + i * 0.35);
  return (
    <group>
      {/* Clôture + portail voiture (x 0,6–3,8) + portillon (x 9,75–10,75) */}
      <Bx p={[W / 2, Hf / 2, T2 / 2]} s={[W, Hf, T2]} c={C.fence} />
      <Bx p={[T2 / 2, Hf / 2, D / 2]} s={[T2, Hf, D]} c={C.fence} />
      <Bx p={[W - T2 / 2, Hf / 2, D / 2]} s={[T2, Hf, D]} c={C.fence} />
      {south.map(([a, b]) => <Bx key={a} p={[(a + b) / 2, Hf / 2, D - T2 / 2]} s={[b - a, Hf, T2]} c={C.fence} />)}
      <Door o={{ level: 0, x: 2.2, z: D - T2 / 2, kind: 'slide', w: 3.2, horiz: true, gate: true }} base={0} />
      <Door o={{ level: 0, x: 10.25, z: D - T2 / 2, kind: 'door', w: 1.0, horiz: true, gate: true }} base={0} />
      {/* Parking avec voiture, allée, paillasson, auvent d'entrée, cyprès */}
      <Bx p={[1.9, 0.01, 17.5]} s={[3.4, 0.04, 9]} c="#c9c1b2" />
      <group position={[1.9, 0, 18.4]}>
        <Bx p={[0, 0.55, 0]} s={[1.8, 0.6, 4.3]} c="#d4d2cd" /><Bx p={[0, 1.05, -0.1]} s={[1.6, 0.5, 2.4]} c="#2c3a44" />
        {[[-0.9, -1.4], [0.9, -1.4], [-0.9, 1.4], [0.9, 1.4]].map(([x, z]) => <Bx key={`${x}${z}`} p={[x, 0.3, z]} s={[0.2, 0.6, 0.6]} c={C.dark} />)}
      </group>
      <Bx p={[10.25, 0.01, 22.5]} s={[1.0, 0.04, 1.0]} c={C.grege} />
      <Bx p={[10.25, 0.04, 22.3]} s={[0.9, 0.03, 0.5]} c={C.dark} />
      <Bx p={[10.25, 2.6, 22.5]} s={[1.6, 0.1, 1.2]} c={C.anth} /><Bx p={[10.25, 2.53, 22.5]} s={[1.5, 0.02, 1.1]} c={C.led} />
      {[11.5, 11.85, 12.2].map((x) => <Bx key={x} p={[x, 0.9, 22.6]} s={[0.35, 1.8, 0.35]} c={C.green} />)}
      {/* Terrasse en bois, pergola à lames, détente, bar, barbecue en briques, table */}
      <Bx p={[15.15, 0.02, 10.4]} s={[3.4, 0.06, 3.9]} c={C.deck} />
      {[[13.7, 8.6], [16.7, 8.6], [13.7, 12.1], [16.7, 12.1]].map(([x, z]) => <Bx key={`${x}${z}`} p={[x, 1.35, z]} s={[0.15, 2.7, 0.15]} c={C.bois} />)}
      {slats.map((z) => <Bx key={z} p={[15.2, 2.75, z]} s={[3.5, 0.06, 0.18]} c={C.bois} cast />)}
      <Parts k="osofa" x={15.1} z={9.9} r={Math.PI} t="balcClair" /><Parts k="rond" x={15.1} z={9.0} t="balcClair" />
      <Parts k="bbq" x={16.45} z={11.6} r={-H2} /><Parts k="bar" x={16.35} z={9.9} r={-H2} /><Parts k="tabler" x={14.4} z={11.0} />
      {/* Piscine : margelle, eau bleue visible, couverture rigide */}
      <Bx p={[15.2, 0.0, 4.3]} s={[3.4, 0.04, 0.2]} c={C.sable} /><Bx p={[15.2, 0.0, 8.3]} s={[3.4, 0.04, 0.2]} c={C.sable} />
      <Bx p={[13.6, 0.0, 6.3]} s={[0.2, 0.04, 4.2]} c={C.sable} /><Bx p={[16.8, 0.0, 6.3]} s={[0.2, 0.04, 4.2]} c={C.sable} />
      <Cover closed={cover} />
      {/* Patio : gazon, dalle bois, fauteuil suspendu, parasol, oliviers */}
      <Bx p={[6.2, 0.02, 13.5]} s={[3.8, 0.04, 2.4]} c="#4f8a3e" /><Bx p={[6.4, 0.05, 13.5]} s={[1.8, 0.03, 1.1]} c={C.deck} />
      <Bx p={[4.8, 1.4, 12.5]} s={[0.05, 2.8, 0.05]} c={C.dark} /><Bx p={[5.2, 2.8, 12.5]} s={[0.9, 0.05, 0.05]} c={C.dark} />
      <mesh position={[5.2, 1.15, 12.7]} castShadow><sphereGeometry args={[0.42, 12, 10]} /><meshStandardMaterial color={C.dark} /></mesh>
      <Bx p={[5.2, 1.0, 12.7]} s={[0.5, 0.15, 0.5]} c={C.off} />
      <Bx p={[6.9, 1.1, 13.0]} s={[0.05, 2.2, 0.05]} c={C.dark} />
      <mesh position={[6.9, 2.3, 13.0]} castShadow><coneGeometry args={[1.3, 0.45, 16]} /><meshStandardMaterial color={C.off} /></mesh>
      <Tree x={7.7} z={12.7} r={0.5} h={0.9} /><Tree x={7.7} z={14.3} r={0.5} h={0.9} />
      {[0, 1, 2, 3, 4, 5].map((i) => <Bx key={i} p={[4.4 + i * 0.7, 2.6, 12.35]} s={[0.08, 0.08, 0.08]} c={C.led} />)}
      {/* Jardin */}
      {[[11, 2], [13.5, 2], [16, 2]].map(([x, z]) => <Tree key={x} x={x} z={z} />)}
      <Bx p={[9.2, 0.02, 2.2]} s={[2.4, 0.04, 2.2]} c="#9bb07a" /><Bx p={[9.2, 0.35, 1.5]} s={[0.8, 0.7, 0.8]} c={C.terra} />
      {[[3.5, 4.4], [12.3, 21.2], [16.5, 13.0]].map(([x, z]) => <Parts key={x} k="plant" x={x} z={z} />)}
    </group>
  );
}

// Toit-terrasse avec acrotère + aménagement : gazon, pergola, balancelle, bar et grill, coin détente.
const ROOF = roofParts();
export function Roof() {
  const y = 2 * H + 0.2;
  return (
    <group>
      {ROOF.map((b, i) => <Bx key={i} p={b.p} s={b.s} c="#d6c6ab" />)}
      {plan.rooms.filter((r) => r.name === 'Balcon').map((r) => <Bx key={r.id} p={[r.x + r.w / 2, 2 * H + 0.1, r.z + r.d / 2]} s={[r.w + 0.1, 0.2, r.d + 0.1]} c="#d6c6ab" />)}
      <Bx p={[13.4, y + 0.02, 17.6]} s={[5.2, 0.04, 3.6]} c="#4f8a3e" /><Bx p={[15.2, y + 0.05, 17.0]} s={[2.8, 0.06, 2.4]} c={C.deck} />
      {[[13.9, 15.9], [16.6, 15.9], [13.9, 18.1], [16.6, 18.1]].map(([x, z]) => <Bx key={`${x}${z}`} p={[x, y + 1.25, z]} s={[0.12, 2.5, 0.12]} c="#6b4a32" />)}
      {Array.from({ length: 8 }, (_, i) => <Bx key={i} p={[15.25, y + 2.55, 15.9 + i * 0.3]} s={[2.9, 0.06, 0.14]} c="#6b4a32" cast />)}
      <Bx p={[14.5, y + 1.6, 17.0]} s={[0.02, 1.9, 0.02]} c={C.sable} /><Bx p={[15.9, y + 1.6, 17.0]} s={[0.02, 1.9, 0.02]} c={C.sable} />
      <Bx p={[15.2, y + 0.65, 17.0]} s={[1.7, 0.2, 0.9]} c={C.bois} /><Bx p={[15.2, y + 0.85, 17.0]} s={[1.6, 0.2, 0.8]} c={C.off} /><Bx p={[15.2, y + 0.2, 18.0]} s={[1.0, 0.4, 0.6]} c={C.bois} />
      {[0, 1, 2, 3, 4].map((i) => <Bx key={i} p={[12.4 + (i % 2) * 0.5, y + 0.04, 16.8 + i * 0.5]} s={[0.35, 0.03, 0.3]} c="#cfc6b8" />)}
      <Bx p={[11.3, y + 0.5, 16.8]} s={[0.6, 1.0, 2.0]} c="#d9d2c4" /><Bx p={[11.3, y + 1.02, 16.8]} s={[0.7, 0.05, 2.1]} c={C.dark} /><Bx p={[11.3, y + 0.5, 18.5]} s={[0.6, 1.0, 0.8]} c="#9a9fa3" />
      <Bx p={[12.0, y + 0.35, 16.3]} s={[0.35, 0.7, 0.35]} c={C.bois} /><Bx p={[12.0, y + 0.35, 17.3]} s={[0.35, 0.7, 0.35]} c={C.bois} />
      <Bx p={[16.2, y + 0.3, 19.3]} s={[0.9, 0.4, 0.9]} c="#8a9b86" /><Bx p={[14.7, y + 0.15, 19.4]} s={[0.8, 0.3, 0.7]} c="#5a5a5c" />
      {[[11.1, 15.7], [16.7, 19.6], [11.1, 19.6]].map(([x, z]) => <Parts key={`${x}${z}`} k="plant" x={x} z={z} y={y} />)}
      {[[11.0, 15.7], [16.8, 15.7], [16.8, 19.7]].map(([x, z]) => <Bx key={`${x}${z}`} p={[x, y + 0.15, z]} s={[0.2, 0.3, 0.2]} c={C.led} />)}
    </group>
  );
}
