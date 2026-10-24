import { availableParallelism } from 'node:os';
import { Worker } from 'node:worker_threads';
import type { Balance } from '@chakachak/content';
import type { Job, Outcome } from './run';

/** Run jobs across worker threads (TypeScript is loaded through tsx in each worker). */
export async function runParallel(
  jobs: Job[],
  balance: Balance,
  threads = availableParallelism(),
): Promise<Outcome[]> {
  const n = Math.max(1, Math.min(threads, jobs.length));
  const chunks = Array.from({ length: n }, (_, i) => jobs.filter((_, k) => k % n === i));
  const url = new URL('./worker-boot.mjs', import.meta.url);
  const parts = await Promise.all(
    chunks.map(
      (chunk) =>
        new Promise<Outcome[]>((resolve, reject) => {
          const w = new Worker(url, { workerData: { jobs: chunk, balance } });
          w.once('message', resolve);
          w.once('error', reject);
        }),
    ),
  );
  return parts.flat();
}
