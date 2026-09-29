import http from 'node:http';
import net from 'node:net';
const allowed = new Set(['api.openai.com', 'chatgpt.com', 'auth.openai.com']);
const server = http.createServer((_req, res) => { res.writeHead(403); res.end('CONNECT only'); });
server.on('connect', (req, client, head) => {
  const parts = req.url.split(':');
  const host = parts[0];
  const port = Number(parts[1]);
  if (parts.length !== 2 || !allowed.has(host) || port !== 443) {
    process.stdout.write(`blocked ${host}:${port}\n`);
    client.end('HTTP/1.1 403 Forbidden\r\n\r\n');
    return;
  }
  process.stdout.write(`allowed ${host}:${port}\n`);
  const upstream = net.connect(port, host);
  upstream.once('connect', () => {
    client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    if (head.length) upstream.write(head);
    client.pipe(upstream);
    upstream.pipe(client);
  });
  upstream.on('error', () => client.destroy());
  client.on('error', () => upstream.destroy());
});
server.listen(8080, '0.0.0.0');
