import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve('dist');
const port = process.argv[2] === undefined ? 4173 : Number(process.argv[2]);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function fileStat(path) {
  try {
    return statSync(path);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return undefined;
    throw error;
  }
}

const server = createServer((request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    if (pathname.includes('\0')) throw new URIError('Invalid path');
  } catch {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Bad Request');
    return;
  }
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  let target = resolve(root, normalize(relativePath));

  if (target !== root && !target.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  try {
    if (fileStat(target)?.isDirectory()) target = join(target, 'index.html');
    if (!fileStat(target)?.isFile() && pathname.startsWith('/planner/')) {
      target = join(root, 'planner', 'index.html');
    }
    if (!fileStat(target)?.isFile()) {
      target = join(root, '404.html');
      response.statusCode = 404;
    }
  } catch {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Unable to read preview file');
    return;
  }

  response.setHeader('Content-Type', mimeTypes[extname(target).toLowerCase()] ?? 'application/octet-stream');
  const stream = createReadStream(target);
  stream.on('error', (error) => {
    if (response.headersSent) {
      response.destroy();
      return;
    }
    const missing = error.code === 'ENOENT' || error.code === 'ENOTDIR';
    response.writeHead(missing ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' })
      .end(missing ? 'Not Found' : 'Unable to read preview file');
  });
  response.on('close', () => stream.destroy());
  stream.pipe(response);
}).listen(port, '127.0.0.1', () => {
  process.stdout.write(`Built site: http://127.0.0.1:${server.address().port}\n`);
});
