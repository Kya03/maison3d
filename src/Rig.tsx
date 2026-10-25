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

// Visite automatique : [position caméra, point regardé]. Extérieur (toit fermé) → rez-de-chaussée pièce par pièce → étage pièce par pièce.
const EXT: [V3, V3][] = [
  [[-3, 9, 30], [9, 2, 12]], [[9.5, 6, 34], [9, 2, 12]], [[21, 9, 28], [9, 2, 12]], [[22, 9, 6], [9, 2, 12]], [[9, 10, -6], [9, 2, 12]],
];
const room = (x: number, z: number, y0: number, back: number, h: number): [V3, V3] => [[x, y0 + h, z + back], [x, y0, z]];
const GF: [V3, V3][] = [
  room(6.2, 19.3, 0, 5.5, 7.5), room(5.6, 15.8, 0, 5, 7), room(6.2, 10.2, 0, 5.8, 7.5), room(5.4, 6.3, 0, 5.2, 7), room(8.8, 6.2, 0, 5.8, 7.5),
  room(12.2, 6.9, 0, 5.6, 7), room(12.1, 12, 0, 5.2, 7), room(15.2, 14.6, 0, 4.9, 7), room(13.8, 19.3, 0, 5.7, 7.5), room(9.5, 12, 0, 6, 8),
];
const UF: [V3, V3][] = [
  room(6.2, 19, 3, 6, 7.5), room(5.6, 15.5, 3, 5, 7), room(6.2, 10.2, 3, 5.8, 7.5), room(5.4, 6.3, 3, 5.2, 7), room(8.8, 6.2, 3, 5.8, 7.5),
  room(12.2, 6.9, 3, 5.6, 7), room(12.5, 11.3, 3, 5.2, 7), room(14.9, 14.2, 3, 5.3, 7), room(13.8, 18.5, 3, 7.5, 7.5), room(9.5, 12, 3, 6, 7.5),
];
const KF = [...EXT, ...GF, ...UF];
export function Tour({ onPhase }: { onPhase: (p: 'ext' | 'gf' | 'uf') => void }) {
  const camera = useThree((s) => s.camera);
  const c = useMemo(() => ({
    p: new THREE.CatmullRomCurve3(KF.map((k) => new THREE.Vector3(...k[0])), true, 'catmullrom', 0.3),
    t: new THREE.CatmullRomCurve3(KF.map((k) => new THREE.Vector3(...k[1])), true, 'catmullrom', 0.3),
  }), []);
  const u = useRef(0), phase = useRef('');
  const a = useMemo(() => new THREE.Vector3(), []), b = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    u.current = (u.current + dt / (KF.length * 5)) % 1;
    c.p.getPoint(u.current, a); c.t.getPoint(u.current, b);
    camera.position.copy(a); camera.lookAt(b);
    const i = Math.floor(u.current * KF.length);
    const ph = i < EXT.length ? 'ext' : i < EXT.length + GF.length ? 'gf' : 'uf';
    if (phase.current !== ph) { phase.current = ph; onPhase(ph); }
  });
  return null;
}
