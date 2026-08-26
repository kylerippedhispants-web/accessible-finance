import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve('dist');
const port = Number(process.argv[2]) || 4173;
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

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  let relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  let target = resolve(root, normalize(relativePath));

  if (target !== root && !target.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
  if ((!existsSync(target) || !statSync(target).isFile()) && pathname.startsWith('/planner/')) {
    target = join(root, 'planner', 'index.html');
  }
  if (!existsSync(target) || !statSync(target).isFile()) {
    target = join(root, '404.html');
    response.statusCode = 404;
  }

  response.setHeader('Content-Type', mimeTypes[extname(target).toLowerCase()] ?? 'application/octet-stream');
  response.setHeader('Cache-Control', 'no-store');
  createReadStream(target).pipe(response);
}).listen(port, '127.0.0.1', () => {
  process.stdout.write(`Built site: http://127.0.0.1:${port}\n`);
});
