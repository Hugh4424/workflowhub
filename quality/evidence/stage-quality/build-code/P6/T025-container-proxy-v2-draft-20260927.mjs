import http from 'node:http';
import net from 'node:net';
import dns from 'node:dns/promises';

const allowed = new Set(['api.openai.com', 'chatgpt.com', 'auth.openai.com']);
function publicIPv4(address) {
  if (net.isIP(address) !== 4) return false;
  const [a, b, c] = address.split('.').map(Number);
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && (b === 0 || (b === 168) || (b === 88 && c === 99))) return false;
  if (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}
function deny(client, label) {
  process.stdout.write(`blocked ${label}\n`);
  client.end('HTTP/1.1 403 Forbidden\r\n\r\n');
}
const server = http.createServer((_req, res) => { res.writeHead(403); res.end('CONNECT only'); });
server.on('connect', async (req, client, head) => {
  const match = /^([a-z0-9.-]+):443$/.exec(req.url);
  if (!match || !allowed.has(match[1])) return deny(client, req.url);
  const host = match[1];
  let records;
  try { records = await dns.lookup(host, { family: 4, all: true }); }
  catch { return deny(client, `${host}:dns-failed`); }
  if (records.length === 0 || records.some((record) => !publicIPv4(record.address))) {
    return deny(client, `${host}:nonpublic-dns`);
  }
  const address = records[0].address;
  process.stdout.write(`allowed ${host}:443 via ${address}\n`);
  const upstream = net.connect({ host: address, port: 443 });
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
