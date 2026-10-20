// ─── One process per local PGlite folder (development only) ──────────────────
// PGlite runs Postgres inside the process that opens the folder and has no lock of its own.
// A second process opening the same folder runs crash recovery and checkpoints on files the
// first one is still writing, which loses committed rows and in the end breaks the cluster.
// lockPgliteDir() refuses that with a clear error instead. The lock file holds the owner's PID;
// a lock whose process has gone (killed dev server) is taken over. Released on process exit.

import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const LOCK_NAME = 'lms-open.lock';

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === 'EPERM';
  }
}

/** Claims `dir` for this process, or throws if another live process has it open. */
export function lockPgliteDir(dir: string): void {
  const lockFile = path.join(path.resolve(dir), LOCK_NAME);
  mkdirSync(path.dirname(lockFile), { recursive: true });
  const content = `${process.pid}\n${process.argv.slice(1).join(' ')}\n${new Date().toISOString()}\n`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      writeFileSync(lockFile, content, { flag: 'wx' });
      process.once('exit', () => {
        try {
          if (readFileSync(lockFile, 'utf8').startsWith(`${process.pid}\n`)) unlinkSync(lockFile);
        } catch { /* already gone */ }
      });
      return;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err;
    }
    let holder = '';
    try { holder = readFileSync(lockFile, 'utf8'); } catch { continue; } // released meanwhile
    const pid = Number(holder.split('\n')[0]);
    if (pid === process.pid) return;
    if (Number.isInteger(pid) && pid > 0 && isAlive(pid)) {
      throw new Error(
        `${dir} is already open in process ${pid} (${holder.split('\n')[1] || 'unknown command'}). ` +
        'PGlite allows one process per folder: stop that process (dev server, db:local, script) first. ' +
        `If that PID is no longer using it, delete ${lockFile}.`,
      );
    }
    try { unlinkSync(lockFile); } catch { /* another process took it over first */ }
  }
  throw new Error(`Could not lock ${dir}: ${lockFile} keeps changing. Is another process opening it?`);
}
