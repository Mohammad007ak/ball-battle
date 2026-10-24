import { mkdirSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { defaultBalance, type Balance } from '@chakachak/content';
import { runParallel } from './pool';
import { plan, summarize, type Rates } from './run';
import { tuneStep, type Change } from './tune';

const { values: o } = parseArgs({
  options: {
    full: { type: 'boolean', default: false },
    samples: { type: 'string', default: '1' },
    seed: { type: 'string', default: '1' },
    check: { type: 'boolean', default: false },
    tune: { type: 'string', default: '0' },
    out: { type: 'string', default: 'tools/sim/out' },
    min: { type: 'string', default: '0.45' },
    max: { type: 'string', default: '0.55' },
  },
});
const band: [number, number] = [Number(o.min), Number(o.max)];
const pct = (x: number) => (x * 100).toFixed(1).padStart(5) + '%';

async function measure(B: Balance): Promise<Rates> {
  const jobs = plan({ full: o.full!, samples: Number(o.samples), seed: Number(o.seed) });
  const t0 = performance.now();
  const rates = summarize(await runParallel(jobs, B));
  console.log(
    `${rates.rounds} rounds in ${((performance.now() - t0) / 1000).toFixed(1)}s, avg ${rates.avgSeconds.toFixed(1)}s per round`,
  );
  return rates;
}

function report(r: Rates): string[] {
  const bad: string[] = [];
  const table = (title: string, t: Rates['classes']) => {
    console.log(`\n${title}`);
    for (const [k, e] of Object.entries(t).sort((a, b) => b[1].rate - a[1].rate)) {
      const out = e.rate < band[0] || e.rate > band[1];
      if (out) bad.push(`${k} ${pct(e.rate)}`);
      console.log(`  ${out ? '✗' : ' '} ${k.padEnd(14)} ${pct(e.rate)}  (${e.games})`);
    }
  };
  table('Characters', r.classes);
  table('Abilities', r.abilities);
  return bad;
}

if (!o.full)
  console.log(
    'Fast sample: ~80 games per ability (±11% noise). Use --full for real ability numbers.',
  );
let B = defaultBalance;
let rates = await measure(B);
let bad = report(rates);
const all: Change[] = [];
for (let i = 0; i < Number(o.tune) && bad.length; i++) {
  const t = tuneStep(B, rates, band);
  B = t.balance;
  all.push(...t.changes);
  console.log(`\n— tune pass ${i + 1}: ${t.changes.length} changes`);
  rates = await measure(B);
  bad = report(rates);
}

mkdirSync(o.out!, { recursive: true });
writeFileSync(`${o.out}/rates.json`, JSON.stringify(rates, null, 2));
if (all.length) {
  // Merge successive edits of the same number into one from→to line.
  const merged = new Map<string, Change>();
  for (const c of all)
    merged.set(c.path, { path: c.path, from: merged.get(c.path)?.from ?? c.from, to: c.to });
  writeFileSync(`${o.out}/changes.json`, JSON.stringify([...merged.values()], null, 2));
  writeFileSync(`${o.out}/gamedata.tuned.json`, JSON.stringify(B.game, null, 2) + '\n');
  console.log(`\nProposed changes written to ${o.out}/changes.json and gamedata.tuned.json`);
}
console.log(
  bad.length
    ? `\nOutside ${pct(band[0])}–${pct(band[1])}: ${bad.join(', ')}`
    : '\nAll characters and abilities within band.',
);
if (o.check && bad.length) process.exit(1);
