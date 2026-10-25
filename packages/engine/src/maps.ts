import type { EngineData } from '@chakachak/content';
import { hurt } from './combat';
import type { Ctx } from './ctx';
import { burst, emit, ring, shake, type Bounds } from './ctx';
import type { Circle, Fighter, MapId, MapState, Projectile } from './types';
import { cos, hypot, sin } from './dmath';

export const MAP_IDS: MapId[] = ['classic', 'pillars', 'spikes', 'pinball', 'portal', 'spinner'];
const PORTAL_COL = ['#d06bff', '#6ee7f9'];

export function buildMap(id: MapId, W: number, H: number, D: EngineData['maps']): MapState {
  const o: MapState = {
    id,
    pillars: [],
    bumpers: [],
    portals: [],
    bar: null,
    spikes: false,
    obsA: 1,
  };
  if (id === 'pillars')
    o.pillars = (D.pillars.at as number[][]).map(([x, y]) => ({
      x: x! * W,
      y: y! * H,
      R: D.pillars.R,
      hit: 0,
    }));
  if (id === 'pinball')
    o.bumpers = (D.pinball.at as number[][]).map(([x, y]) => ({
      x: x! * W,
      y: y! * H,
      R: D.pinball.R,
      hit: 0,
    }));
  if (id === 'spikes') o.spikes = true;
  if (id === 'portal')
    o.portals = (D.portal.at as number[][]).map(([x, y]) => ({
      bx: x! * W,
      by: y! * H,
      x: x! * W,
      y: y! * H,
    }));
  if (id === 'spinner')
    o.bar = { base: D.spinner.len, len: D.spinner.len, w: D.spinner.w, ang: 0, spd: D.spinner.spd };
  return o;
}

export function mapTick(c: Ctx, dt: number) {
  const { s } = c,
    M = s.map,
    k = (s.W / 2 - s.ins) / (s.W / 2);
  M.obsA = s.ins > 0 ? Math.max(0, 1 - s.ins / c.B.engine.maps.obsFade) : 1;
  for (const b of M.bumpers) b.hit = Math.max(0, b.hit - dt);
  if (M.bar) {
    M.bar.ang += M.bar.spd * dt;
    M.bar.len = M.bar.base * k;
  }
  for (const p of M.portals) {
    p.x = s.W / 2 + (p.bx - s.W / 2) * k;
    p.y = s.H / 2 + (p.by - s.H / 2) * k;
  }
}

function circleBounce(f: Fighter, o: Circle): boolean {
  const dx = f.x - o.x,
    dy = f.y - o.y,
    d = hypot(dx, dy),
    mn = f.r + o.R;
  if (d >= mn || d === 0) return false;
  const nx = dx / d,
    ny = dy / d;
  f.x = o.x + nx * mn;
  f.y = o.y + ny * mn;
  const vn = f.vx * nx + f.vy * ny;
  if (vn < 0) {
    f.vx -= 2 * vn * nx;
    f.vy -= 2 * vn * ny;
  }
  return true;
}

function onSpike(f: Fighter, wall: string, B: Bounds, span: number): boolean {
  const w = B.x1 - B.x0,
    h = B.y1 - B.y0;
  if (wall === 'l' || wall === 'r') return f.y > B.y0 + h * span && f.y < B.y1 - h * span;
  return f.x > B.x0 + w * span && f.x < B.x1 - w * span;
}

/** Closest point on the spinner bar to (x, y) and its signed position along the bar. */
function barPoint(c: Ctx, x: number, y: number) {
  const bar = c.s.map.bar!,
    cx = c.s.W / 2,
    cy = c.s.H / 2,
    ux = cos(bar.ang),
    uy = sin(bar.ang);
  const proj = Math.max(-bar.len, Math.min(bar.len, (x - cx) * ux + (y - cy) * uy));
  return { px: cx + ux * proj, py: cy + uy * proj, ux, uy, proj };
}

export function mapPhysics(c: Ctx, f: Fighter, B: Bounds, wall: string | null, dt: number) {
  const M = c.s.map,
    D = c.B.engine.maps;
  f.spikeCd -= dt;
  f.obsCd -= dt;
  f.barCd -= dt;
  f.portCd -= dt;
  if (wall && M.spikes && f.spikeCd <= 0 && onSpike(f, wall, B, D.spikes.span)) {
    f.spikeCd = D.spikes.cd;
    hurt(c, f, D.spikes.dmg, null, '#ff6b6b');
    burst(c, f.x, f.y, '#ff6b6b', 12);
    shake(c, 5);
  }
  if (M.obsA > 0.5) {
    for (const p of M.pillars)
      if (circleBounce(f, p) && f.obsCd <= 0) {
        f.obsCd = D.pillars.cd;
        burst(c, (f.x + p.x) / 2, (f.y + p.y) / 2, '#c9d6e8', 6, 0.6);
      }
    for (const b of M.bumpers)
      if (circleBounce(f, b)) {
        if (b.hit <= 0.1) {
          b.hit = D.pinball.hitT;
          ring(c, b.x, b.y, b.R, '#ffc53d', 0.35, 4);
          burst(c, b.x, b.y, '#ffc53d', 8);
          shake(c, 4);
        }
        f.boostT = Math.max(f.boostT, D.pinball.boost);
      }
  }
  if (M.bar) {
    const { px, py, ux, uy, proj } = barPoint(c, f.x, f.y),
      dx = f.x - px,
      dy = f.y - py,
      d = hypot(dx, dy),
      mn = f.r + M.bar.w / 2;
    if (d < mn && d > 0) {
      const nx = dx / d,
        ny = dy / d;
      f.x = px + nx * mn;
      f.y = py + ny * mn;
      const vpx = -uy * M.bar.spd * proj,
        vpy = ux * M.bar.spd * proj,
        rel = (f.vx - vpx) * nx + (f.vy - vpy) * ny;
      if (rel < 0) {
        f.vx -= 2 * rel * nx;
        f.vy -= 2 * rel * ny;
      }
      if (f.barCd <= 0) {
        f.barCd = D.spinner.cd;
        f.boostT = Math.max(f.boostT, D.spinner.boost);
        hurt(c, f, D.spinner.dmg, null, '#6ee7f9');
        burst(c, px, py, '#6ee7f9', 10);
        shake(c, 4);
      }
    }
  }
  if (M.portals.length && f.portCd <= 0) {
    for (let i = 0; i < 2; i++) {
      const P = M.portals[i]!;
      if (hypot(f.x - P.x, f.y - P.y) < D.portal.R) {
        const Q = M.portals[1 - i]!;
        ring(c, P.x, P.y, 10, PORTAL_COL[i]!, 0.4, 4);
        f.x = Q.x;
        f.y = Q.y;
        f.portCd = D.portal.cd;
        emit(c, { e: 'teleport', fid: f.id });
        ring(c, Q.x, Q.y, 10, PORTAL_COL[1 - i]!, 0.45, 5);
        burst(c, Q.x, Q.y, PORTAL_COL[1 - i]!, 16);
        break;
      }
    }
  }
}

/** Obstacles block projectiles; portals carry them once. */
export function arrowMap(c: Ctx, ar: Projectile) {
  const M = c.s.map,
    D = c.B.engine.maps;
  if (M.obsA > 0.5)
    for (const o of M.pillars.concat(M.bumpers))
      if (hypot(ar.x - o.x, ar.y - o.y) < o.R + 2) {
        burst(c, ar.x, ar.y, '#c9d6e8', 5, 0.5);
        ar.life = 0;
        return;
      }
  if (M.bar) {
    const { px, py } = barPoint(c, ar.x, ar.y);
    if (hypot(ar.x - px, ar.y - py) < M.bar.w / 2 + 2) {
      burst(c, ar.x, ar.y, '#6ee7f9', 5, 0.5);
      ar.life = 0;
      return;
    }
  }
  if (!ar.ported)
    for (let i = 0; i < M.portals.length; i++) {
      const P = M.portals[i]!;
      if (hypot(ar.x - P.x, ar.y - P.y) < D.portal.arrowR) {
        const Q = M.portals[1 - i]!;
        ar.x = Q.x + ar.vx * D.portal.arrowLead;
        ar.y = Q.y + ar.vy * D.portal.arrowLead;
        ar.ported = true;
        ring(c, Q.x, Q.y, 6, PORTAL_COL[1 - i]!, 0.3, 3);
        break;
      }
    }
}

/** Whether a pickup may spawn at (x, y) without overlapping map features. */
export function clearOfMap(c: Ctx, x: number, y: number): boolean {
  const M = c.s.map,
    D = c.B.engine.maps.clear;
  for (const o of M.pillars.concat(M.bumpers))
    if (hypot(x - o.x, y - o.y) < o.R + D.obstacle) return false;
  for (const p of M.portals) if (hypot(x - p.x, y - p.y) < D.portal) return false;
  if (M.bar && hypot(x - c.s.W / 2, y - c.s.H / 2) < M.bar.len + D.bar) return false;
  return true;
}
