import fs from "node:fs";
import http from "node:http";
import path from "node:path";

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (!argv[index].startsWith("--")) continue;
    values[argv[index].slice(2)] = argv[index + 1];
    index += 1;
  }
  return values;
}

const args = parseArgs(process.argv.slice(2));
// Confine serving to the demo/ subtree. Previously this defaulted to the whole
// repo, so /.git/config, reports/*.db, and any local scratch file were fetchable
// while the demo ran. --root still overrides for advanced use.
const repoRoot = path.resolve(args.root || ".");
const demoRoot = path.resolve(repoRoot, "demo");
const port = Number(args.port || 8790);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".webm": "video/webm", ".mp4": "video/mp4" };

function isLocalHost(hostHeader) {
  const host = String(hostHeader || "").split(":")[0].toLowerCase();
  return host === "127.0.0.1" || host === "localhost" || host === "[::1]" || host === "::1" || host === "";
}

const server = http.createServer((request, response) => {
  if (!isLocalHost(request.headers.host)) {
    response.writeHead(403).end("Forbidden: non-local Host header");
    return;
  }
  const url = new URL(request.url, `http://127.0.0.1:${port}`);
  if (url.pathname === "/health") {
    response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    response.end('{"status":"ok"}');
    return;
  }
  // Both "/" and "/demo/..." map into the demo/ subtree (the docs advertise the
  // /demo/ URL, so strip that prefix rather than nesting demo/demo).
  let requested = decodeURIComponent(url.pathname);
  if (requested === "/" || requested === "/demo" || requested === "/demo/") requested = "/index.html";
  else if (requested.startsWith("/demo/")) requested = requested.slice("/demo".length);
  const filePath = path.resolve(demoRoot, `.${requested}`);
  if (filePath !== demoRoot && !filePath.startsWith(`${demoRoot}${path.sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  let target = filePath;
  try { if (fs.statSync(target).isDirectory()) target = path.join(target, "index.html"); } catch {}
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not found");
    return;
  }
  response.writeHead(200, { "content-type": types[path.extname(target).toLowerCase()] || "application/octet-stream", "cache-control": "no-store", "x-content-type-options": "nosniff" });
  fs.createReadStream(target).pipe(response);
});

server.listen(port, "127.0.0.1", () => console.log(`PickBits Dependency Audit demo: http://127.0.0.1:${port}/demo/`));
