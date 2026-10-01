import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const script = resolve(import.meta.dirname, '../scripts/serve-dist.mjs');
const fixtureRoot = resolve(import.meta.dirname, '../.local-tools');

describe('built-site preview HTTP handling', () => {
  let directory: string;
  let server: ChildProcess;
  let address: string;

  beforeAll(async () => {
    await mkdir(fixtureRoot, { recursive: true });
    directory = await mkdtemp(join(fixtureRoot, 'preview-test-'));
    await mkdir(join(directory, 'dist', 'planner'), { recursive: true });
    await writeFile(join(directory, 'dist', 'index.html'), '<h1>Website</h1>');
    await writeFile(join(directory, 'dist', '404.html'), '<h1>Missing page</h1>');
    await writeFile(join(directory, 'dist', 'planner', 'index.html'), '<h1>Planner</h1>');
    await writeFile(join(directory, 'dist', 'site.css'), 'body { color: green; }');
    server = spawn(process.execPath, [script, '0'], {
      cwd: directory,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    address = await new Promise<string>((resolveAddress, reject) => {
      let output = '';
      let errors = '';
      server.stdout!.on('data', (data: Buffer) => {
        output += data.toString();
        const match = output.match(/Built site: (http:\/\/127\.0\.0\.1:\d+)/);
        if (match) resolveAddress(match[1]);
      });
      server.stderr!.on('data', (data: Buffer) => { errors += data.toString(); });
      server.once('error', reject);
      server.once('exit', (code) => reject(new Error(`Preview exited with ${code}: ${errors}`)));
    });
  });

  afterAll(async () => {
    if (server && server.exitCode === null && server.signalCode === null) {
      const exited = once(server, 'exit');
      server.kill();
      await exited;
    }
    if (directory) {
      const target = resolve(directory);
      if (!target.startsWith(`${fixtureRoot}${sep}preview-test-`)) throw new Error('Unexpected preview fixture path');
      await rm(target, { recursive: true, force: true });
    }
  });

  it('rejects malformed percent encoding and null bytes without stopping the server', async () => {
    for (const path of ['/%E0%A4%A', '/%00']) {
      const invalid = await fetch(`${address}${path}`);
      expect(invalid.status).toBe(400);
      expect(await invalid.text()).toBe('Bad Request');
    }
    const home = await fetch(address);
    expect(home.status).toBe(200);
    expect(await home.text()).toBe('<h1>Website</h1>');
  });

  it('preserves static assets, planner deep links, and custom 404 responses', async () => {
    const stylesheet = await fetch(`${address}/site.css`);
    expect(stylesheet.headers.get('content-type')).toBe('text/css; charset=utf-8');
    expect(await stylesheet.text()).toContain('color: green');
    for (const path of ['/planner', '/planner/dashboard']) {
      const planner = await fetch(`${address}${path}`);
      expect(planner.status).toBe(200);
      expect(await planner.text()).toBe('<h1>Planner</h1>');
    }
    const missing = await fetch(`${address}/missing-page`);
    expect(missing.status).toBe(404);
    expect(await missing.text()).toBe('<h1>Missing page</h1>');
  });

  it('returns a plain 404 when its fallback file disappears and keeps serving requests', async () => {
    await rm(join(directory, 'dist', '404.html'));
    const missing = await fetch(`${address}/missing-page`);
    expect(missing.status).toBe(404);
    expect(missing.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await missing.text()).toBe('Not Found');
    const home = await fetch(address);
    expect(home.status).toBe(200);
    expect(await home.text()).toBe('<h1>Website</h1>');
  });
});
