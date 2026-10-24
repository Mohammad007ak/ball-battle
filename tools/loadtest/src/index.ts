import { cpus } from 'node:os';
import { parseArgs } from 'node:util';
import { defaultBalance as B } from '@chakachak/content';
import * as EC from '@chakachak/economy';
import { createMatch } from '@chakachak/engine';
import { Room, type Seat } from '../../../apps/server/src/online/room';

/**
 * Load test: N concurrent online matches (bot vs bot, full engine + snapshots, real 60 Hz clock)
 * in one process, as the server runs them. Reports CPU, memory and outgoing bandwidth.
 */
const { values: o } = parseArgs({
  options: {
    rooms: { type: 'string', default: '200' },
    seconds: { type: 'string', default: '60' },
  },
});
const N = Number(o.rooms),
  secs = Number(o.seconds);
let bytes = 0,
  finished = 0,
  seed = 1;
const rand = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
const send = (m: object) => {
  bytes += JSON.stringify(m).length;
};
const rooms = new Set<Room>();
function spawn(i: number) {
  const S = EC.freshProfile(B);
  S.trophies = (i * 97) % 2200;
  const st = EC.matchSetup(B, S, '1v1', rand);
  const m = createMatch('1v1', i + 1, st.teams, B);
  const seat = (): Seat => ({ playerId: null, name: 'bot', skins: ['', ''], send, goneAt: null });
  const room = new Room(
    'r' + i,
    m,
    [seat(), seat()],
    B,
    () => performance.now(),
    0.5,
    (r) => {
      rooms.delete(r);
      finished++;
      spawn(i + N); // keep N matches running
    },
  );
  rooms.add(room);
}
for (let i = 0; i < N; i++) spawn(i);

const t0 = performance.now(),
  c0 = process.cpuUsage();
let last = t0,
  acc = 0,
  ticks = 0,
  late = 0;
const loop = setInterval(() => {
  const now = performance.now();
  acc += now - last;
  last = now;
  if (acc > 100) late++;
  acc = Math.min(acc, 1000 / 6);
  while (acc >= 1000 / 60) {
    acc -= 1000 / 60;
    ticks++;
    for (const r of [...rooms]) r.tick();
  }
  if (now - t0 >= secs * 1000) {
    clearInterval(loop);
    const cpu = process.cpuUsage(c0),
      wall = (now - t0) / 1000;
    const pct = ((cpu.user + cpu.system) / 1e6 / wall) * 100;
    console.log(
      JSON.stringify(
        {
          rooms: N,
          seconds: Math.round(wall),
          simTicks: ticks,
          finishedMatches: finished,
          cpuPercentOfOneCore: Math.round(pct),
          cores: cpus().length,
          rssMB: Math.round(process.memoryUsage().rss / 1e6),
          heapMB: Math.round(process.memoryUsage().heapUsed / 1e6),
          outKBpsTotal: Math.round(bytes / 1024 / wall),
          outKBpsPerPlayer: +(bytes / 1024 / wall / (2 * N)).toFixed(1),
          laggedFrames: late,
        },
        null,
        2,
      ),
    );
  }
}, 8);
