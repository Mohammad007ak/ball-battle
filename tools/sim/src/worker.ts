import { parentPort, workerData } from 'node:worker_threads';
import type { Balance } from '@chakachak/content';
import { runJob, type Job } from './run';

const { jobs, balance } = workerData as { jobs: Job[]; balance: Balance };
parentPort!.postMessage(jobs.map((j) => runJob(j, balance)));
