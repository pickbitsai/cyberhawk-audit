import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const reportPath = path.resolve(process.argv[2] || "reports/dependency-audit-report.html");
const port = Number(process.argv[3] || 8765);

if (!fs.existsSync(reportPath) || !fs.statSync(reportPath).isFile()) {
  console.error(`Report not found: ${reportPath}`);
  process.exit(2);
}

function isLocalHost(hostHeader) {
  const host = String(hostHeader || "").split(":")[0].toLowerCase();
  return host === "127.0.0.1" || host === "localhost" || host === "[::1]" || host === "::1" || host === "";
}

const server = http.createServer((request, response) => {
  if (!isLocalHost(request.headers.host)) {
    response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    response.end("Forbidden: non-local Host header");
    return;
  }
  if (request.method !== "GET" || !["/", "/report"].includes(new URL(request.url, `http://127.0.0.1:${port}`).pathname)) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; img-src 'self' data:; form-action 'none'; base-uri 'none'",
  });
  fs.createReadStream(reportPath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`PickBits Dependency Audit report: http://127.0.0.1:${port}/`);
});
