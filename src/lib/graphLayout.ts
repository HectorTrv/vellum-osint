/**
 * Tiny force-directed graph layout — runs synchronously, ~250 iterations.
 * No external dep. Stable output for the same input via deterministic seeding.
 */

export type LayoutNode = { id: string };
export type LayoutEdge = { from: string; to: string };
export type LayoutPos = { x: number; y: number };

type Sim = LayoutPos & { vx: number; vy: number; fx: number; fy: number };

// Mulberry32 — fast, deterministic
function seedRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function layout(
  nodes: LayoutNode[],
  edges: LayoutEdge[],
  width = 1100,
  height = 600,
  seed = "vellum"
): Map<string, LayoutPos> {
  const rng = seedRandom(hash(seed));
  const positions = new Map<string, Sim>();

  // Initial positions: jittered ring around centre
  const cx = width / 2;
  const cy = height / 2;
  nodes.forEach((n, i) => {
    const angle = (i / Math.max(1, nodes.length)) * Math.PI * 2 + rng() * 0.4;
    const r = 120 + rng() * 60;
    positions.set(n.id, {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      vx: 0, vy: 0, fx: 0, fy: 0,
    });
  });

  const REPULSION = 12000;
  const SPRING = 0.045;
  const SPRING_LENGTH = 130;
  const GRAVITY = 0.012;
  const DAMPING = 0.82;
  const ITERATIONS = 280;
  const MAX_VEL = 30;

  const arr = Array.from(positions.values());
  const idsArr = Array.from(positions.keys());

  // Pre-compute degree for adaptive spring length
  const deg = new Map<string, number>();
  for (const e of edges) {
    deg.set(e.from, (deg.get(e.from) ?? 0) + 1);
    deg.set(e.to, (deg.get(e.to) ?? 0) + 1);
  }

  for (let iter = 0; iter < ITERATIONS; iter++) {
    // Reset forces
    for (const p of arr) { p.fx = 0; p.fy = 0; }

    // Repulsion (n^2)
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i], b = arr[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 0.5) {
          dx = (rng() - 0.5) * 4;
          dy = (rng() - 0.5) * 4;
          d2 = dx * dx + dy * dy + 0.5;
        }
        const force = REPULSION / d2;
        const d = Math.sqrt(d2);
        const fx = (dx / d) * force;
        const fy = (dy / d) * force;
        a.fx -= fx; a.fy -= fy;
        b.fx += fx; b.fy += fy;
      }
    }

    // Springs on edges
    for (const e of edges) {
      const a = positions.get(e.from);
      const b = positions.get(e.to);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const targetLen = SPRING_LENGTH;
      const f = SPRING * (d - targetLen);
      const fx = (dx / d) * f;
      const fy = (dy / d) * f;
      a.fx += fx; a.fy += fy;
      b.fx -= fx; b.fy -= fy;
    }

    // Gravity towards centre + integrate
    for (const p of arr) {
      p.fx += (cx - p.x) * GRAVITY;
      p.fy += (cy - p.y) * GRAVITY;
      p.vx = (p.vx + p.fx) * DAMPING;
      p.vy = (p.vy + p.fy) * DAMPING;
      // Clamp velocity
      const v = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (v > MAX_VEL) {
        p.vx = (p.vx / v) * MAX_VEL;
        p.vy = (p.vy / v) * MAX_VEL;
      }
      p.x += p.vx;
      p.y += p.vy;
    }
  }

  const out = new Map<string, LayoutPos>();
  idsArr.forEach((id) => {
    const p = positions.get(id)!;
    out.set(id, { x: p.x, y: p.y });
  });
  // Suppress unused warning in some toolchains
  void deg;
  return out;
}

export function layoutBounds(positions: Map<string, LayoutPos>): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  positions.forEach(({ x, y }) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  });
  return { minX, minY, maxX, maxY };
}
