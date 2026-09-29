// Host-only, fixed-content network sentinel for the T026 isolated sample.
// Run only during one reviewed container attempt; never mount into Docker.
import http from "node:http";
const body = Buffer.from("AC17_T026_FIXED_HOST_SENTINEL_20260927\n");
http.createServer((request, response) => {
  if (request.method !== "GET" || request.url !== "/") {
    response.writeHead(404, { "content-length": "0" });
    response.end();
    return;
  }
  response.writeHead(200, { "content-type": "text/plain", "content-length": String(body.length),
    "cache-control": "no-store" });
  response.end(body);
}).listen(48173, "0.0.0.0", () => process.stdout.write("t026-sentinel-listening\n"));
