import { plan } from './plan';

export type V3 = [number, number, number];
export type Box = { p: V3; s: V3 };
export type Op = { level: number; x: number; z: number; kind: 'door' | 'slide' | 'window' | 'arch'; w: number; horiz: boolean };
type Seg = { x1: number; z1: number; x2: number; z2: number };
export const DIM = { door: { h: 2.1, sill: 0 }, slide: { h: 2.1, sill: 0 }, window: { h: 1.2, sill: 0.9 }, arch: { h: 2.4, sill: 0 } };
export const STAIR = { x: 8.3, z: 16.85, w: 1.4, d: 5.0 }; // volée à gauche ; couloir d'entrée à droite
const cache = new Map<number, { boxes: Box[]; ops: Op[]; rails: Box[] }>();

export function build(level: number) {
  const hit = cache.get(level);
  if (hit) return hit;
  const t = plan.wallT, H = plan.levelHeight, base = level * H;
  const segs = new Map<string, Seg>();
  const add = (s: Seg) => segs.set([s.x1, s.z1, s.x2, s.z2].map((v) => Math.round(v * 100)).join(','), s);
  for (const r of plan.rooms) {
    if (r.level !== level || r.open) continue;
    add({ x1: r.x - t, z1: r.z - t / 2, x2: r.x + r.w + t, z2: r.z - t / 2 });
    add({ x1: r.x - t, z1: r.z + r.d + t / 2, x2: r.x + r.w + t, z2: r.z + r.d + t / 2 });
    add({ x1: r.x - t / 2, z1: r.z, x2: r.x - t / 2, z2: r.z + r.d });
    add({ x1: r.x + r.w + t / 2, z1: r.z, x2: r.x + r.w + t / 2, z2: r.z + r.d });
  }
  const boxes: Box[] = [];
  const ops = new Map<string, Op>();
  for (const s of segs.values()) {
    const horiz = s.z1 === s.z2;
    const a = horiz ? s.x1 : s.z1, b = horiz ? s.x2 : s.z2, line = horiz ? s.z1 : s.x1;
    const list = plan.openings
      .filter((o) => o.level === level && Math.abs((horiz ? o.z : o.x) - line) < 0.2)
      .map((o) => { const c = horiz ? o.x : o.z; return { o, a: c - o.w / 2, b: c + o.w / 2, ...DIM[o.kind] }; })
      .filter((o) => o.a >= a - 0.01 && o.b <= b + 0.01)
      .sort((p, q) => p.a - q.a);
    const parts: { a: number; b: number; y0: number; y1: number }[] = [];
    let cur = a;
    for (const o of list) {
      ops.set(`${o.o.x},${o.o.z}`, { ...o.o, horiz });
      if (o.a > cur) parts.push({ a: cur, b: o.a, y0: 0, y1: H });
      if (o.sill > 0) parts.push({ a: o.a, b: o.b, y0: 0, y1: o.sill });
      if (o.sill + o.h < H) parts.push({ a: o.a, b: o.b, y0: o.sill + o.h, y1: H });
      cur = o.b;
    }
    if (b > cur) parts.push({ a: cur, b, y0: 0, y1: H });
    for (const q of parts) {
      const len = q.b - q.a, hh = q.y1 - q.y0, y = base + q.y0 + hh / 2, m = (q.a + q.b) / 2;
      boxes.push({ p: horiz ? [m, y, line] : [line, y, m], s: horiz ? [len, hh, t] : [t, hh, len] });
    }
  }
  const rails: Box[] = [];
  // Escalier en U : sous la volée (RDC) cloison pleine ; à l'étage, garde-corps le long du vide. Passage libre côté nord (RDC) et côté sud (étage).
  if (level === 0) boxes.push({ p: [9.76, 1.5, 19.925], s: [0.12, 3, 3.85] });
  if (level === 1) rails.push({ p: [9.76, base + 0.5, 18.925], s: [0.12, 1, 4.15] });
  if (level === 1) for (const r of plan.rooms) if (r.name === 'Balcon') { // garde-corps vitré de 1 m, côté rue
    rails.push({ p: [r.x + r.w / 2, base + 0.5, r.z + r.d - 0.06], s: [r.w, 1, 0.06] });
    rails.push({ p: [r.x + 0.03, base + 0.5, r.z + r.d / 2], s: [0.06, 1, r.d] });
    rails.push({ p: [r.x + r.w - 0.03, base + 0.5, r.z + r.d / 2], s: [0.06, 1, r.d] });
  }
  const res = { boxes, ops: [...ops.values()], rails };
  cache.set(level, res);
  return res;
}

// Hauteur du sol sous (x,z) ; null = vide (pas de dalle).
export function groundY(x: number, z: number, y: number): number | null {
  const S = STAIR, H = plan.levelHeight;
  if (x >= S.x && x <= S.x + S.w && z >= S.z && z <= S.z + S.d) return Math.min(H, Math.max(0, ((z - S.z) / S.d) * H)); // la volée monte vers le sud
  if (y > 1.5) {
    const t = plan.wallT;
    const ok = plan.rooms.some((r) => r.level === 1 && r.floor !== 'none' && x >= r.x - t && x <= r.x + r.w + t && z >= r.z - t && z <= r.z + r.d + t);
    return ok ? H : null;
  }
  return 0;
}

export function blocked(x: number, z: number, y: number, r = 0.3): boolean {
  if (y < 1.5 && (x < 0.3 || x > plan.terrain.w - 0.3 || z < 0.3 || z > plan.terrain.d - 0.3)) return true;
  if (groundY(x, z, y) === null) return true;
  const lo = y + 0.3, hi = y + 1.6;
  const bd = build(y > 1.5 ? 1 : 0);
  return [...bd.boxes, ...bd.rails].some(
    (b) => Math.abs(x - b.p[0]) < b.s[0] / 2 + r && Math.abs(z - b.p[2]) < b.s[2] / 2 + r && b.p[1] + b.s[1] / 2 > lo && b.p[1] - b.s[1] / 2 < hi,
  );
}

// Toit-terrasse : dalle sur chaque pièce de l'étage (les vides restent ouverts) + acrotère de 60 cm sur le pourtour extérieur.
export function roofParts(): Box[] {
  const t = plan.wallT, y = 2 * plan.levelHeight, N = 6;
  const rs = plan.rooms.filter((r) => r.level === 1 && r.name !== 'Balcon');
  const inside = (x: number, z: number) => rs.some((q) => x > q.x - t && x < q.x + q.w + t && z > q.z - t && z < q.z + q.d + t);
  const out: Box[] = [];
  for (const r of rs) {
    out.push({ p: [r.x + r.w / 2, y + 0.1, r.z + r.d / 2], s: [r.w + 2 * t, 0.2, r.d + 2 * t] });
    for (const [dx, dz] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const horiz = dz !== 0, L = horiz ? r.w : r.d;
      const line = horiz ? (dz < 0 ? r.z - t / 2 : r.z + r.d + t / 2) : (dx < 0 ? r.x - t / 2 : r.x + r.w + t / 2);
      for (let i = 0; i < N; i++) {
        const c = (horiz ? r.x : r.z) + ((i + 0.5) * L) / N;
        const sx = horiz ? c : line + dx * (t / 2 + 0.1), sz = horiz ? line + dz * (t / 2 + 0.1) : c;
        if (inside(sx, sz)) continue;
        out.push({ p: horiz ? [c, y + 0.5, line] : [line, y + 0.5, c], s: horiz ? [L / N + 0.15, 0.6, t] : [t, 0.6, L / N + 0.15] });
      }
    }
  }
  return out;
}
