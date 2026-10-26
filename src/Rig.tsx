import { PointerLockControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { blocked, groundY, type V3 } from './geometry';

// Visite à la première personne : ZQSD / WASD / flèches, Maj = courir, clic pour capturer la souris, Échap pour la libérer.
export function Walk() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const keys = useRef<Record<string, boolean>>({});
  const st = useRef({ x: 10.25, z: 22.5, y: 0 });
  useEffect(() => {
    st.current = { x: 10.25, z: 22.5, y: 0 };
    camera.fov = 70; camera.updateProjectionMatrix();
    camera.position.set(10.25, 1.65, 22.5); camera.rotation.set(0, 0, 0);
    const d = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const u = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', d); window.addEventListener('keyup', u);
    return () => { window.removeEventListener('keydown', d); window.removeEventListener('keyup', u); camera.fov = 45; camera.updateProjectionMatrix(); };
  }, [camera]);
  useFrame((_, dt) => {
    const s = st.current, k = keys.current;
    const f = (k['z'] || k['w'] || k['arrowup'] ? 1 : 0) - (k['s'] || k['arrowdown'] ? 1 : 0);
    const r = (k['d'] || k['arrowright'] ? 1 : 0) - (k['q'] || k['a'] || k['arrowleft'] ? 1 : 0);
    if (f || r) {
      const dir = new THREE.Vector3(); camera.getWorldDirection(dir); dir.y = 0; dir.normalize();
      const sp = (k['shift'] ? 4 : 2.2) * Math.min(dt, 0.05);
      const mx = (dir.x * f - dir.z * r) * sp, mz = (dir.z * f + dir.x * r) * sp;
      if (!blocked(s.x + mx, s.z, s.y)) s.x += mx;
      if (!blocked(s.x, s.z + mz, s.y)) s.z += mz;
    }
    const g = groundY(s.x, s.z, s.y);
    if (g !== null) s.y += (g - s.y) * Math.min(1, dt * 10);
    camera.position.set(s.x, s.y + 1.65, s.z);
  });
  return <PointerLockControls />;
}

// ───────────────────────── Visite automatique « home tour » ─────────────────────────
// Chaque ligne : [x, y, z de la caméra, x, y, z du point regardé, durée optionnelle en s]. Hauteur d'yeux : 1,55 m (RDC), 4,55 m (étage).
type Row = number[];
const mv = (rows: Row[], dy: number): Row[] => rows.map((r) => [r[0], r[1] + dy, r[2], r[3], r[4] + dy, r[5], ...(r[6] ? [r[6]] : [])]);

const EXT: Row[] = [ // portail, façade, portillon, puis tour des alentours
  [9.5, 2.2, 34, 9.5, 2.6, 22], [6.5, 1.9, 29.5, 8, 2.8, 22], [2.6, 1.7, 28, 2.2, 1.3, 23], [3.6, 1.7, 26.5, 2.2, 1.2, 23, 3],
  [7, 2, 29, 6.15, 4, 22], [8.8, 1.9, 28.5, 9.6, 4.3, 22], [13, 1.9, 28.5, 12.35, 3.9, 22], [11.5, 1.7, 26.5, 10.25, 1.6, 23], [10.25, 1.6, 25.6, 10.25, 1.7, 22.5, 3],
  [18.5, 3.4, 29, 12, 3, 19], [21.5, 3.8, 19, 12, 3.5, 14], [21.5, 4, 8, 12, 3.5, 9], [19, 4.2, -2.5, 12, 3, 7], [13, 4.2, -5, 10, 3, 8], [5, 4.2, -4.5, 8, 3, 9],
  [-3, 3.9, 1.5, 7, 3, 10], [-4, 3.6, 11, 7, 3, 14], [-3.5, 3.4, 21, 6, 3, 18], [0.5, 2.5, 29.5, 6, 3, 21], [6, 1.9, 29.5, 9, 2, 22], [10.25, 1.6, 27, 10.25, 1.6, 22],
];
const ENTREE: Row[] = [ // portillon, porte, couloir d'entrée, espace familial
  [10.25, 1.6, 23.6, 10.25, 1.5, 21.5], [10.25, 1.55, 21.2, 10.25, 1.6, 17.5], [10.25, 1.55, 20.5, 10.6, 1.3, 19.4, 3], [10.25, 1.55, 18.3, 10.25, 1.5, 16.5],
  [10.25, 1.55, 16, 9.6, 1.4, 13.5], [10.2, 1.55, 15, 9.2, 1, 14.5, 3], [10, 1.55, 13.6, 8.6, 1.5, 13, 3], [9.8, 1.55, 12.4, 9.2, 1, 15.2, 3], [9.6, 1.55, 11.2, 9.6, 1.4, 14],
];
const SALON: Row[] = [
  [10.2, 1.55, 13.8, 11.5, 1.5, 15.6], [11.6, 1.55, 15.6, 12, 1.5, 17.5], [12, 1.55, 16.5, 14.5, 1.4, 19.3], [12.4, 1.55, 18, 16.6, 1.5, 19.3, 3],
  [13, 1.55, 19.2, 13.9, 1.5, 21.8, 3], [14.2, 1.55, 20.5, 15, 0.9, 18.3, 3], [12.2, 1.55, 17.3, 12, 1.5, 15],
];
const CH1: Row[] = [ // chambre 1 + sa salle de bain
  [9.2, 1.55, 15.7, 7.6, 1.5, 16.8], [7.6, 1.55, 16.1, 7.6, 1.4, 17.6], [7.5, 1.55, 17.5, 5.3, 1, 19.3, 3], [7.2, 1.55, 19.2, 5.2, 1.3, 19.3, 3], [6.8, 1.55, 20.4, 7.85, 1.2, 18.3, 3], [6.1, 1.55, 19.5, 6.15, 1.6, 21.8, 3],
  [5.2, 1.55, 17.6, 5.2, 1.5, 15.5], [5.3, 1.55, 16.2, 5, 1.3, 15.1, 3], [5.3, 1.55, 15.6, 6.5, 1.2, 15.3, 3], [5.4, 1.55, 15.5, 6.45, 1.2, 16.2, 3], [5.2, 1.55, 16.9, 5.2, 1.5, 18], [7.5, 1.55, 17.6, 7.6, 1.5, 16.2], [8.6, 1.55, 15.6, 9.2, 1.5, 12],
];
const chambre2 = (dz: number): Row[] => [ // chambre 2 + sa salle de bain (porte est : z 8,8 au RDC, 11,2 à l'étage)
  [9.2, 1.55, 10.5 + dz, 9.2, 1.5, 8.8 + dz], [9, 1.55, 8.8 + dz, 7.5, 1.4, 9.5], [7.5, 1.55, 9.3, 6.15, 1, 10.95, 3], [7, 1.55, 9.6, 6.1, 1.3, 12, 3], [6.5, 1.55, 9.4, 4.4, 1.3, 9.2, 3], [6, 1.55, 9.5, 7.2, 1.2, 8.5, 3],
  [5.4, 1.55, 9, 5.4, 1.5, 7.2], [5.5, 1.55, 7.7, 4.9, 1.3, 6.5, 3], [5.4, 1.55, 7.5, 6.25, 1.2, 6.65, 3], [5.2, 1.55, 6.9, 6.15, 1.2, 7.65, 3], [5.4, 1.55, 8.6, 6.5, 1.5, 10], [7.6, 1.55, 9 + dz * 0.5, 9, 1.5, 8.8 + dz],
];
const CH3: Row[] = [ // chambre 3 + sa salle de bain (porte sud z 8,225)
  [10, 1.55, 9.4, 10, 1.5, 7.5], [9.9, 1.55, 7.7, 8, 1.3, 5.5, 3], [8, 1.55, 7.2, 10.8, 1.3, 6.15, 3], [8.8, 1.55, 7, 8.8, 1.5, 4.2, 3], [8.5, 1.55, 6.5, 7.1, 1.1, 7.1, 3],
  [7.5, 1.55, 5.3, 6, 1.5, 5.3], [6.3, 1.55, 5.1, 4.9, 1.3, 4.4, 3], [5.4, 1.55, 5.6, 6.25, 1.2, 4.5, 3], [5, 1.55, 4.7, 6.15, 1.2, 5.65, 3], [7.3, 1.55, 5.3, 8.5, 1.5, 6.5], [9.5, 1.55, 7.7, 10, 1.5, 9],
];
const CUISINE_SAM: Row[] = [ // cuisine (porte ouest), salle à manger (porte est de la cuisine)
  [10, 1.55, 10.5, 10, 1.5, 11.2], [10.3, 1.55, 11.2, 12, 1.4, 10.9, 3], [11.6, 1.55, 11.8, 12, 1.6, 10.8, 3], [12.4, 1.55, 12.6, 11.9, 1.3, 10.9, 3], [12.8, 1.55, 12, 13.4, 1.5, 12.8],
  [13, 1.55, 12.8, 14.5, 1.4, 13.2], [14.1, 1.55, 13, 15.2, 1, 14.6, 3], [14.2, 1.55, 15.8, 15.2, 1, 13.9, 3], [15, 1.55, 13.2, 16.6, 1.5, 14.6, 3], [15.2, 1.55, 13.3, 15.2, 1.5, 11],
];
const TOILETTE: Row[] = [ // sortie sur la terrasse, toilette publique (porte vers la piscine)
  [15.2, 1.55, 11.8, 14, 1.3, 9], [14.2, 1.6, 10, 13.3, 1.4, 7.4], [13.8, 1.6, 8.7, 13.175, 1.4, 7.3, 3], [13.7, 1.6, 7.4, 12.4, 1.4, 7.3], [12.8, 1.55, 7.2, 11.4, 1.3, 6.5, 3], [12.6, 1.55, 6.5, 12.1, 1.1, 7.85, 3], [13.5, 1.6, 7.4, 13.8, 1.5, 8.5],
  [14.5, 1.6, 10.5, 15.2, 1.5, 12.5], [15.2, 1.55, 12.9, 14, 1.5, 13.2], [13.9, 1.55, 13, 12.5, 1.5, 12.8], [12.6, 1.55, 12.8, 10.5, 1.5, 11.2], [11, 1.55, 11.2, 9.5, 1.5, 11.6], [9.8, 1.55, 12.2, 8, 1.5, 13.4],
];
const PATIO_JARDIN: Row[] = [ // patio, voiture, potager, arbres, coin barbecue et piscine
  [8, 1.6, 13.3, 5.2, 1.2, 12.7, 3], [7, 1.6, 13.8, 6.9, 1.3, 12.8, 3], [6.6, 1.6, 12.6, 7.7, 1.2, 13.9, 3], [6, 1.6, 14.2, 5, 1, 13.4], [4.6, 1.6, 13.6, 2.5, 1.3, 16],
  [3.2, 1.6, 14.8, 1.9, 0.8, 18.4, 3], [3.4, 1.6, 17, 1.9, 0.8, 18.4, 3], [3.4, 1.6, 20.5, 1.9, 0.8, 18.4, 3], [1, 1.6, 21.5, 1.9, 0.8, 18.4], [3.2, 1.6, 13, 2, 0.4, 8.5, 3], [3.4, 1.6, 9.5, 2, 0.4, 7.5, 3],
  [4, 1.6, 5, 8, 1.8, 2.8], [6, 1.7, 2.9, 9.2, 0.8, 2.2, 3], [9.5, 1.7, 3, 12.5, 2, 2, 3], [12, 1.7, 3.2, 15, 2, 2, 3],
  [12.5, 1.7, 3.6, 14.5, 1, 6], [13.3, 1.7, 4.2, 15.2, 0.2, 6.3, 3], [13.3, 1.7, 6.5, 15.2, 0.2, 6.3, 3], [13.4, 1.7, 8.8, 16, 1.2, 10.5, 3], [14.2, 1.7, 11.8, 16.3, 1.2, 10.5, 3], [14.5, 1.6, 9, 15.1, 0.8, 9.9, 3], [14, 1.7, 11.5, 14.4, 0.8, 11, 3],
  [15.2, 1.55, 12, 15.2, 1.5, 13.5], [14.5, 1.55, 13.2, 13.4, 1.5, 12.8], [12.4, 1.55, 12.8, 10.5, 1.5, 11.2], [10.2, 1.55, 11.2, 10, 1.5, 14], [10.1, 1.55, 15.3, 10.25, 1.5, 17.5], [10.25, 1.55, 17.5, 9, 1, 17.6],
];
const ESCALIER: Row[] = [ // on monte la volée, on tourne vers la coursive, puis hall de l'étage
  [9.1, 1.9, 17.3, 9, 1.9, 19], [9, 2.55, 18.5, 9, 3.2, 21.5], [9, 3.15, 19.5, 9, 4, 21.8], [9, 3.75, 20.5, 9.4, 4.4, 21.9], [9.1, 4.2, 21.3, 10.2, 4.5, 21.6],
  [10.25, 4.55, 21.3, 10.25, 4.5, 17], [10, 4.55, 18.5, 8.5, 4.2, 19.4, 3], [10, 4.55, 17, 9.6, 4.5, 15],
];
const HALL_E: Row[] = [[9.8, 4.55, 15.7, 9.2, 4, 14.6, 3], [10, 4.55, 13.8, 8.6, 4.5, 13, 3], [9.6, 4.55, 12.5, 9.2, 4, 15.2, 3]];
const SALON_L: Row[] = [ // salon de gauche : majlis, prière, TV, grand balcon ; cuisine de gauche
  [8.9, 4.55, 15.9, 7.6, 4.5, 16.2], [7.6, 4.55, 16.2, 7.5, 4.5, 17.6], [7.5, 4.55, 17.5, 6, 3.9, 18.8, 3], [7.2, 4.55, 18.6, 4.55, 4.2, 17.15, 3], [6.6, 4.55, 19.2, 7.9, 4.6, 18.85, 3],
  [6.1, 4.55, 20, 6.1, 4.5, 21.4], [6.1, 4.55, 21.7, 6.1, 4.4, 24, 4], [7.4, 4.55, 21.8, 5, 4, 21.6, 3], [6.1, 4.55, 20, 7, 4.5, 17],
  [7.5, 4.55, 16.5, 7.4, 4.5, 15.5], [7.6, 4.55, 15.5, 6, 4.5, 15.5], [6.3, 4.55, 15.5, 5.45, 4.5, 14.6, 3], [6.5, 4.55, 16, 5.4, 4.3, 14.7, 3], [7.5, 4.55, 15.5, 9, 4.5, 14],
];
const WC_E: Row[] = [ // toilettes de l'étage, cuisine de droite
  [10.5, 4.55, 9.2, 12, 4.5, 8.6], [12, 4.55, 8.9, 12, 4.4, 7], [12, 4.55, 7.6, 11.4, 4.3, 6.5, 3], [11.6, 4.55, 9, 9.2, 4.5, 10.07],
  [9.2, 4.55, 9.6, 9.2, 4.5, 8.8, 3], [10.5, 4.55, 11, 11.6, 4.5, 11], [11.8, 4.55, 11.2, 12.6, 4.2, 10.4, 3], [12.6, 4.55, 12.2, 12.4, 4.3, 10.2, 3], [11.5, 4.55, 11, 9.8, 4.5, 11.5],
];
const CH_R: Row[] = [ // chambre 1 de l'étage (chaude) avec alcôve, puis salon de droite (sombre) et petit balcon
  [10.5, 4.55, 13.5, 12, 4.5, 14], [12, 4.55, 14, 13.6, 4.5, 14], [13.6, 4.55, 14, 15.7, 4, 14.07, 3], [13.8, 4.55, 13.3, 16.8, 4.2, 14.07, 3], [14.8, 4.55, 13.5, 14.6, 4.2, 11.7, 3], [14.5, 4.55, 12.2, 15.4, 4.5, 11.3, 3], [13.5, 4.55, 14, 10.8, 4.5, 14],
  [10.9, 4.55, 15, 10.7, 4.5, 16.3], [11.5, 4.55, 16.3, 13, 4, 17.8], [12.5, 4.55, 17.5, 15, 3.9, 17.7, 3], [14, 4.55, 17.2, 16.6, 4.4, 17.7, 3], [13.5, 4.55, 18.7, 16, 4, 16.8, 3],
  [12.4, 4.55, 18.7, 12.35, 4.5, 20.3], [12.35, 4.55, 21, 12.35, 4.4, 24, 4], [11.8, 4.55, 21.2, 13.8, 4, 21.2, 3],
];
const TERRASSE: Row[] = [ // envol vers le toit-terrasse et visite détaillée
  [12.35, 5.3, 22.9, 12.35, 6, 19], [13.5, 8.3, 22, 14.5, 7, 17.5], [12, 7.9, 19.6, 15, 7, 17, 3], [13, 7.8, 16, 15.2, 7.1, 17, 3], [16.3, 7.8, 16, 11.3, 7, 17.5, 3],
  [14.5, 7.8, 19.4, 16.2, 6.6, 19.3, 3], [12.6, 7.8, 18.8, 11.3, 7.1, 17, 3], [13.5, 8.5, 21.5, 14, 7, 17], [20, 11, 29, 11, 3, 14, 6],
];
const sequence: Row[] = [
  ...EXT, ...ENTREE, ...SALON, ...CH1, ...chambre2(0), ...CH3, ...CUISINE_SAM, ...TOILETTE, ...PATIO_JARDIN, ...ESCALIER, ...HALL_E, ...SALON_L,
  ...mv(chambre2(2.4), 3), ...mv(CH3, 3), ...WC_E, ...CH_R, ...TERRASSE,
];
const FOV = (r: Row, i: number) => (i < EXT.length || r[1] > 7 || r[1] < 1.2 || r[2] > 22.5 || r[2] < 4 && r[1] > 1.2 ? 55 : 68);

export function Tour({ record, runKey, speed, onProgress, onDone }: { record: boolean; runKey: number; speed: number; onProgress: (p: number) => void; onDone: () => void }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const data = useMemo(() => {
    const P = sequence.map((r) => new THREE.Vector3(r[0], r[1], r[2])), Q = sequence.map((r) => new THREE.Vector3(r[3], r[4], r[5]));
    const dur = sequence.map((r, i) => (i === 0 ? 0 : r[6] ?? Math.min(18, Math.max(2.2, P[i].distanceTo(P[i - 1]) / 1.15, Q[i].distanceTo(Q[i - 1]) / 2.2))));
    const cum: number[] = []; dur.reduce((a, d, i) => (cum[i] = a + d), 0);
    return { cp: new THREE.CatmullRomCurve3(P, false, 'centripetal'), cq: new THREE.CatmullRomCurve3(Q, false, 'centripetal'), dur, cum, total: cum[cum.length - 1], fov: sequence.map(FOV) };
  }, []);
  const t = useRef(0), done = useRef(false), last = useRef(0);
  const a = useMemo(() => new THREE.Vector3(), []), b = useMemo(() => new THREE.Vector3(), []);
  const mr = useRef<MediaRecorder | null>(null);
  useEffect(() => {
    t.current = 0; done.current = false;
    if (!record) return;
    const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m));
    const rec = new MediaRecorder((gl.domElement as HTMLCanvasElement).captureStream(30), { mimeType: mime, videoBitsPerSecond: 3_000_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' })); link.download = 'visite-maison.webm'; link.click();
      onDone();
    };
    rec.start(1000); mr.current = rec;
    return () => { if (rec.state !== 'inactive') { rec.onstop = null; rec.stop(); } };
  }, [record, runKey]);
  useEffect(() => () => { camera.fov = 45; camera.updateProjectionMatrix(); }, [camera]);
  useFrame((_, dt) => {
    if (done.current) return;
    t.current += Math.min(dt, 0.1) * speed;
    if (t.current >= data.total) {
      if (record) { done.current = true; mr.current?.stop(); return; }
      t.current = 0;
    }
    let i = 1; while (i < data.cum.length - 1 && data.cum[i] < t.current) i++;
    const f = i - 1 + (t.current - data.cum[i - 1]) / data.dur[i], u = f / (data.cum.length - 1);
    data.cp.getPoint(u, a); data.cq.getPoint(u, b);
    camera.position.copy(a); camera.lookAt(b);
    const fv = data.fov[i - 1] + (data.fov[i] - data.fov[i - 1]) * (f - (i - 1));
    if (Math.abs(camera.fov - fv) > 0.05) { camera.fov = fv; camera.updateProjectionMatrix(); }
    if (t.current - last.current > 1) { last.current = t.current; onProgress(Math.round((100 * t.current) / data.total)); }
  });
  return null;
}
