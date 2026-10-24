import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useState } from 'react';
import { plan } from './plan';

type V3 = [number, number, number];
type Seg = { x1: number; z1: number; x2: number; z2: number };
const THEME = { wall: '#efe6d6', ground: '#d8c9a3', sand: '#e0cfa9', wood: '#b98a5a', tile: '#cfc6b8' };
const DIM = { door: { h: 2.1, sill: 0 }, slide: { h: 2.1, sill: 0 }, window: { h: 1.2, sill: 0.9 } };
const EXT = { pool: ['#4fb6c9', 0.05], tank: ['#999999', 0.3], pit: ['#777777', 0.3], garden: ['#6a9a4a', 0.1], garage: ['#bbbbbb', 2.8] } as const;

function Box({ p, s, c }: { p: V3; s: V3; c: string }) {
  return (
    <mesh position={p}>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} />
    </mesh>
  );
}

function Level({ level }: { level: number }) {
  const t = plan.wallT, H = plan.levelHeight, base = level * H;
  const segs = new Map<string, Seg>();
  const add = (s: Seg) => segs.set([s.x1, s.z1, s.x2, s.z2].map((v) => Math.round(v * 100)).join(','), s);
  const rooms = plan.rooms.filter((r) => r.level === level);
  for (const r of rooms) {
    if (r.open) continue;
    add({ x1: r.x - t, z1: r.z - t / 2, x2: r.x + r.w + t, z2: r.z - t / 2 });
    add({ x1: r.x - t, z1: r.z + r.d + t / 2, x2: r.x + r.w + t, z2: r.z + r.d + t / 2 });
    add({ x1: r.x - t / 2, z1: r.z, x2: r.x - t / 2, z2: r.z + r.d });
    add({ x1: r.x + r.w + t / 2, z1: r.z, x2: r.x + r.w + t / 2, z2: r.z + r.d });
  }
  const els: JSX.Element[] = [];
  let k = 0;
  for (const s of segs.values()) {
    const horiz = s.z1 === s.z2;
    const a = horiz ? s.x1 : s.z1, b = horiz ? s.x2 : s.z2, line = horiz ? s.z1 : s.x1;
    const ops = plan.openings
      .filter((o) => o.level === level && Math.abs((horiz ? o.z : o.x) - line) < 0.2)
      .map((o) => { const c = horiz ? o.x : o.z; return { a: c - o.w / 2, b: c + o.w / 2, ...DIM[o.kind] }; })
      .filter((o) => o.a >= a - 0.01 && o.b <= b + 0.01)
      .sort((p, q) => p.a - q.a);
    const parts: { a: number; b: number; y0: number; y1: number }[] = [];
    let cur = a;
    for (const o of ops) {
      if (o.a > cur) parts.push({ a: cur, b: o.a, y0: 0, y1: H });
      if (o.sill > 0) parts.push({ a: o.a, b: o.b, y0: 0, y1: o.sill });
      if (o.sill + o.h < H) parts.push({ a: o.a, b: o.b, y0: o.sill + o.h, y1: H });
      cur = o.b;
    }
    if (b > cur) parts.push({ a: cur, b, y0: 0, y1: H });
    for (const q of parts) {
      const len = q.b - q.a, hh = q.y1 - q.y0, y = base + q.y0 + hh / 2, m = (q.a + q.b) / 2;
      els.push(<Box key={k++} p={horiz ? [m, y, line] : [line, y, m]} s={horiz ? [len, hh, t] : [t, hh, len]} c={THEME.wall} />);
    }
  }
  return (
    <group>
      {rooms.filter((r) => r.floor !== 'none').map((r) => (
        <Box key={r.id} p={[r.x + r.w / 2, base - 0.06, r.z + r.d / 2]} s={[r.w + 0.1, 0.12, r.d + 0.1]} c={THEME[r.floor as 'sand' | 'wood' | 'tile']} />
      ))}
      {els}
      {level === 0 && rooms.filter((r) => r.name === 'Escalier').map((r) => {
        const n = 16, rise = H / n, run = r.d / n;
        return Array.from({ length: n }, (_, i) => (
          <Box key={`${r.id}-${i}`} p={[r.x + r.w / 2, base + ((i + 1) * rise) / 2, r.z + r.d - (i + 0.5) * run]} s={[r.w - 0.3, (i + 1) * rise, run]} c={THEME.tile} />
        ));
      })}
    </group>
  );
}

export default function App() {
  const [show, setShow] = useState<'all' | 0 | 1>('all');
  const btn = (v: 'all' | 0 | 1, label: string) => (
    <button key={label} onClick={() => setShow(v)} style={{ marginRight: 6, padding: '6px 12px', fontWeight: show === v ? 700 : 400 }}>{label}</button>
  );
  return (
    <>
      <div style={{ position: 'absolute', zIndex: 1, top: 12, left: 12 }}>
        {btn('all', 'Tout')}{btn(0, 'Rez-de-chaussée')}{btn(1, 'Étage')}
      </div>
      <Canvas camera={{ position: [10, 24, 40], fov: 45 }} style={{ background: '#eaf2f8' }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[15, 30, 20]} intensity={1.2} />
        <OrbitControls target={[8.5, 0, 12]} />
        <Box p={[plan.terrain.w / 2, -0.12, plan.terrain.d / 2]} s={[plan.terrain.w, 0.1, plan.terrain.d]} c={THEME.ground} />
        {plan.exterior.map((e) => (
          <Box key={e.id} p={[e.x + e.w / 2, EXT[e.kind][1] / 2 - 0.05, e.z + e.d / 2]} s={[e.w, EXT[e.kind][1], e.d]} c={EXT[e.kind][0]} />
        ))}
        {(show === 'all' || show === 0) && <Level level={0} />}
        {(show === 'all' || show === 1) && <Level level={1} />}
      </Canvas>
    </>
  );
}
