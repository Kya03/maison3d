import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { plan } from './plan';
import { build, STAIR, type Op, type V3 } from './geometry';
import { C, Decor, Outdoor, Roof } from './decor';
import { Bx } from './shared';
import { Tour, Walk } from './Rig';

const THEME = { wall: C.off, ground: '#d8c9a3', sand: '#e0cfa9', wood: '#b98a5a', tile: '#cfc6b8', door: '#8a5a3a', glass: '#9fd0e8' };
const EXT = { pool: ['#4fb6c9', 0.05], tank: ['#999999', 0.3], pit: ['#777777', 0.3], garden: ['#6a9a4a', 0.1], garage: ['#bbbbbb', 2.8] } as const;
type Mode = 'orbit' | 'walk' | 'tour';

const Box = Bx;

// Porte battante (pivot sur un côté) ou coulissante. S'ouvre quand on s'approche, ou au clic.
function Door({ o, base }: { o: Op; base: number }) {
  const g = useRef<THREE.Group>(null);
  const [open, setOpen] = useState(false);
  const a = useRef(0);
  const camera = useThree((s) => s.camera);
  const slide = o.kind === 'slide', h = o.horiz;
  useFrame((_, dt) => {
    if (!g.current) return;
    const dx = camera.position.x - o.x, dz = camera.position.z - o.z;
    const near = dx * dx + dz * dz < 2.6 && Math.abs(camera.position.y - (base + 1.65)) < 1.5;
    a.current += ((open || near ? 1 : 0) - a.current) * Math.min(1, dt * 5);
    if (slide) g.current.position.set(h ? o.x + a.current * o.w * 0.95 : o.x + 0.1, base, h ? o.z + 0.1 : o.z + a.current * o.w * 0.95);
    else g.current.rotation.y = (h ? -1 : 1) * a.current * 1.5;
  });
  const pos: V3 = slide ? [o.x, base, o.z] : h ? [o.x - o.w / 2, base, o.z] : [o.x, base, o.z - o.w / 2];
  const leaf: V3 = slide ? [0, 1.05, 0] : h ? [o.w / 2, 1.05, 0] : [0, 1.05, o.w / 2];
  const size: V3 = h ? [o.w, 2.1, slide ? 0.04 : 0.05] : [slide ? 0.04 : 0.05, 2.1, o.w];
  return (
    <group ref={g} position={pos}>
      <mesh position={leaf} castShadow onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={slide ? THEME.glass : THEME.door} transparent={slide} opacity={slide ? 0.5 : 1} />
      </mesh>
    </group>
  );
}

function Level({ level }: { level: number }) {
  const base = level * plan.levelHeight, H = plan.levelHeight;
  const { boxes, ops } = build(level);
  const rooms = plan.rooms.filter((r) => r.level === level);
  return (
    <group>
      {rooms.filter((r) => r.floor !== 'none').map((r) => (
        <Box key={r.id} p={[r.x + r.w / 2, base - 0.06, r.z + r.d / 2]} s={[r.w + 0.1, 0.12, r.d + 0.1]} c={THEME[r.floor as 'sand' | 'wood' | 'tile']} />
      ))}
      {boxes.map((b, i) => <Box key={i} p={b.p} s={b.s} c={THEME.wall} />)}
      {ops.map((o) => o.kind === 'window'
        ? <Box key={`${o.x},${o.z}`} p={[o.x, base + 1.5, o.z]} s={o.horiz ? [o.w, 1.2, 0.03] : [0.03, 1.2, o.w]} c={THEME.glass} o={0.35} />
        : <Door key={`${o.x},${o.z}`} o={o} base={base} />)}
      {level === 0 && rooms.filter((r) => r.name === 'Escalier').map((r) => {
        const n = 16, rise = H / n, run = STAIR.d / n;
        return Array.from({ length: n }, (_, i) => (
          <Box key={`${r.id}-${i}`} p={[STAIR.x + STAIR.w / 2, ((i + 1) * rise) / 2, STAIR.z + STAIR.d - (i + 0.5) * run]} s={[STAIR.w - 0.1, (i + 1) * rise, run]} c={THEME.tile} />
        ));
      })}
    </group>
  );
}

// Lumière du jour : heure 0-24, soleil se lève à l'est (6 h) et se couche à l'ouest (18 h).
function Sky({ hour, shadow }: { hour: number; shadow: boolean }) {
  const ang = ((hour - 6) / 12) * Math.PI, s = Math.sin(ang), day = Math.max(0, s);
  const bg = new THREE.Color('#0b1026').lerp(new THREE.Color('#eaf2f8'), Math.min(1, day * 2)).getStyle();
  return (
    <>
      <color attach="background" args={[bg]} />
      <ambientLight intensity={0.3 + 0.5 * day} />
      <directionalLight castShadow={shadow} position={[8.5 + Math.cos(ang) * 35, Math.max(0.15, s) * 35, 14]} intensity={0.2 + 1.3 * day}
        shadow-mapSize={[1024, 1024]} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-near={1} shadow-camera-far={150} />
    </>
  );
}

function Orbit() {
  const camera = useThree((s) => s.camera);
  useEffect(() => { camera.position.set(10, 24, 40); }, [camera]);
  return <OrbitControls target={[8.5, 0, 12]} />;
}

export default function App() {
  const [mode, setMode] = useState<Mode>('orbit');
  const [show, setShow] = useState<'all' | 0 | 1>('all');
  const [hour, setHour] = useState(11);
  const [auto, setAuto] = useState(false);
  const [cover, setCover] = useState(false);
  const [light, setLight] = useState(location.search.includes('leger'));
  const [roof, setRoof] = useState(true);
  const [ck, setCk] = useState(0);
  const lost = useRef(0);
  useEffect(() => {
    if (!auto) return;
    const i = setInterval(() => setHour((h) => (h + 0.04) % 24), 50);
    return () => clearInterval(i);
  }, [auto]);
  const go = (m: Mode) => { setMode(m); setShow('all'); };
  const b = (on: boolean, label: string, fn: () => void) => (
    <button key={label} onClick={fn} style={{ marginRight: 6, padding: '6px 12px', fontWeight: on ? 700 : 400 }}>{label}</button>
  );
  return (
    <>
      <div style={{ position: 'absolute', zIndex: 1, top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>{b(mode === 'orbit', 'Vue libre', () => go('orbit'))}{b(mode === 'walk', 'Visite à pied', () => go('walk'))}{b(mode === 'tour', 'Visite auto', () => go('tour'))}</div>
        {mode === 'orbit' && <div>{b(show === 'all', 'Tout', () => setShow('all'))}{b(show === 0, 'Rez-de-chaussée', () => setShow(0))}{b(show === 1, 'Étage', () => setShow(1))}</div>}
        <label style={{ background: '#fffc', padding: '4px 8px', borderRadius: 6 }}>
          Heure {Math.floor(hour)} h <input type="range" min={0} max={24} step={0.1} value={hour} onChange={(e) => setHour(+e.target.value)} />
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> défilement
        </label>
        <div>{b(cover, 'Piscine couverte', () => setCover((v) => !v))}{b(roof, 'Toit', () => setRoof((v) => !v))}{b(light, 'Mode léger', () => setLight((v) => !v))}</div>
        {mode === 'walk' && <div style={{ background: '#fffc', padding: '4px 8px', borderRadius: 6 }}>Clique dans la scène · ZQSD/flèches · Maj = courir · Échap = libérer la souris</div>}
        {mode === 'orbit' && <div style={{ background: '#fffc', padding: '4px 8px', borderRadius: 6 }}>Clique sur une porte pour l'ouvrir</div>}
      </div>
      <Canvas key={ck} shadows={!light} dpr={[1, 1.5]} gl={{ powerPreference: 'high-performance' }} camera={{ position: [10, 24, 40], fov: 45 }}
        onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost.current += 1; if (lost.current > 1) setLight(true); setTimeout(() => setCk((k) => k + 1), 400); })}>
        <Sky hour={hour} shadow={!light} />
        {mode === 'orbit' && <Orbit />}
        {b(cover, 'Piscine couverte', () => setCover((v) => !v))}
        {mode === 'walk' && <Walk />}
        {mode === 'tour' && <Tour onLevel={(l) => setShow(l)} />}
        <Box p={[plan.terrain.w / 2, -0.12, plan.terrain.d / 2]} s={[plan.terrain.w, 0.1, plan.terrain.d]} c={THEME.ground} />
        {plan.exterior.map((e) => (
          <Box key={e.id} p={[e.x + e.w / 2, EXT[e.kind][1] / 2 - 0.05, e.z + e.d / 2]} s={[e.w, EXT[e.kind][1], e.d]} c={EXT[e.kind][0]} />
        ))}
        <Outdoor Door={Door} cover={cover} />
        {(show === 'all' || show === 0) && <><Level level={0} />{!light && <Decor level={0} />}</>}
        {(show === 'all' || show === 1) && <><Level level={1} />{!light && <Decor level={1} />}{roof && <Roof />}</>}
      </Canvas>
    </>
  );
}
