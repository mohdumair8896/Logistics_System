// One process per local PGlite folder: a live holder is refused, a dead one is taken over.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { lockPgliteDir } from '@/lib/pglite-lock';

let dir: string;
let lockFile: string;
const children: ChildProcess[] = [];

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'lms-pglite-lock-'));
  lockFile = path.join(dir, 'lms-open.lock');
});

afterEach(() => {
  for (const child of children.splice(0)) child.kill();
  rmSync(dir, { recursive: true, force: true });
});

function holderPid() {
  return Number(readFileSync(lockFile, 'utf8').split('\n')[0]);
}

describe('lockPgliteDir', () => {
  it('claims a free folder for this process, and again without error', () => {
    lockPgliteDir(dir);
    expect(holderPid()).toBe(process.pid);
    expect(() => lockPgliteDir(dir)).not.toThrow();
  });

  it('refuses a folder another live process has open', async () => {
    const other = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)']);
    children.push(other);
    await once(other, 'spawn');
    writeFileSync(lockFile, `${other.pid}\nnext dev\n2026-10-20T00:00:00.000Z\n`);

    expect(() => lockPgliteDir(dir)).toThrow(`is already open in process ${other.pid} (next dev)`);
    expect(holderPid()).toBe(other.pid);
  });

  it('takes over a lock left by a process that has gone', async () => {
    const gone = spawn(process.execPath, ['-e', '']);
    await once(gone, 'exit');
    writeFileSync(lockFile, `${gone.pid}\nnext dev\n2026-10-20T00:00:00.000Z\n`);

    lockPgliteDir(dir);
    expect(holderPid()).toBe(process.pid);
  });
});
