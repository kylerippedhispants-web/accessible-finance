import { copyFile, cp, mkdir, readdir, rm } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'dist');
const publishedDirectories = ['assets', 'guides', 'us'];
const publishedExtensions = new Set(['.css', '.html', '.js', '.jpg', '.jpeg', '.png', '.svg', '.txt', '.xml']);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const entry of await readdir(root, { withFileTypes: true })) {
  if (entry.isDirectory() && publishedDirectories.includes(entry.name)) {
    await cp(join(root, entry.name), join(output, entry.name), { recursive: true });
    continue;
  }

  if (entry.isFile() && publishedExtensions.has(extname(entry.name).toLowerCase())) {
    await copyFile(join(root, entry.name), join(output, entry.name));
  }
}

process.stdout.write('Copied the legacy static site into dist without changing its URLs.\n');
