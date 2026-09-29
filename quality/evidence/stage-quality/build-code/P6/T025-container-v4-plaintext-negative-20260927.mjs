import http from 'node:http';
let result = { connected: false, oracleReadable: false, bytes: 0, end: 'none' };
let finished = false;
function finish(end) {
  if (finished) return;
  finished = true;
  result.end = end;
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exit(0);
}
const req = http.request({ host: 'card04-ac17-gateway-v4', port: 8080, method: 'CONNECT', path: 'chatgpt.com:443' });
req.on('connect', (response, socket) => {
  result.connected = response.statusCode === 200;
  if (!result.connected) return finish(`status:${response.statusCode}`);
  socket.setTimeout(3000, () => { socket.destroy(); finish('timeout'); });
  socket.on('data', (chunk) => { result.bytes += chunk.length; result.oracleReadable ||= chunk.includes('AC17_ORACLE_SENTINEL'); });
  socket.on('error', () => finish('error'));
  socket.on('close', () => finish('closed'));
  socket.write('GET /sentinel.txt HTTP/1.1\r\nHost: host.docker.internal:48173\r\nConnection: close\r\n\r\n');
});
req.on('error', () => finish('request-error'));
req.end();
setTimeout(() => finish('global-timeout'), 5000);
