import { PointerLockControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { blocked, groundY, type V3 } from './geometry';

// Visite à la première personne : ZQSD / WASD / flèches, Maj = courir, clic pour capturer la souris, Échap pour la libérer.
export function Walk() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const keys = useRef<Record<string, boolean>>({});
  const st = useRef({ x: 9.5, z: 22.5, y: 0 });
  useEffect(() => {
    st.current = { x: 9.5, z: 22.5, y: 0 };
    camera.fov = 70; camera.updateProjectionMatrix();
    camera.position.set(9.5, 1.65, 22.5); camera.rotation.set(0, 0, 0);
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

// Visite automatique : [position caméra, point regardé]. Les 5 premiers = extérieur (tous niveaux), le reste = rez-de-chaussée vu d'en haut.
const KF: [V3, V3][] = [
  [[-3, 9, 30], [9, 2, 12]], [[9.5, 6, 34], [9, 2, 12]], [[21, 9, 28], [9, 2, 12]], [[22, 9, 6], [9, 2, 12]], [[9, 10, -6], [9, 2, 12]],
  [[6.2, 7, 25], [6.2, 0, 19.3]], [[13.8, 7, 25], [13.8, 0, 19.3]], [[15.2, 6.5, 18], [15, 0, 14.6]],
  [[11.5, 6.5, 16], [12.1, 0, 12]], [[9.5, 7, 18], [9.5, 0, 11]], [[8.8, 7, 11], [8.8, 0, 6.2]], [[6, 7, 13], [6, 0, 9]],
];
export function Tour({ onLevel }: { onLevel: (l: 'all' | 0) => void }) {
  const camera = useThree((s) => s.camera);
  const c = useMemo(() => ({
    p: new THREE.CatmullRomCurve3(KF.map((k) => new THREE.Vector3(...k[0])), true, 'catmullrom', 0.3),
    t: new THREE.CatmullRomCurve3(KF.map((k) => new THREE.Vector3(...k[1])), true, 'catmullrom', 0.3),
  }), []);
  const u = useRef(0), phase = useRef<'all' | 0 | null>(null);
  const a = useMemo(() => new THREE.Vector3(), []), b = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    u.current = (u.current + dt / 75) % 1;
    c.p.getPoint(u.current, a); c.t.getPoint(u.current, b);
    camera.position.copy(a); camera.lookAt(b);
    const ph = u.current < 5 / KF.length ? 'all' : 0;
    if (phase.current !== ph) { phase.current = ph; onLevel(ph); }
  });
  return null;
}
