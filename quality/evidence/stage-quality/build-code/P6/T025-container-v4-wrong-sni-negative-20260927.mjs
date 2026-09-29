import http from 'node:http';
import tls from 'node:tls';
let finished = false;
function finish(value) {
  if (finished) return;
  finished = true;
  process.stdout.write(`${JSON.stringify(value)}\n`);
  process.exit(0);
}
const req = http.request({ host: 'card04-ac17-gateway-v4', port: 8080, method: 'CONNECT', path: 'chatgpt.com:443' });
req.on('connect', (response, socket) => {
  if (response.statusCode !== 200) return finish({ connected: false, status: response.statusCode });
  const secure = tls.connect({ socket, servername: 'host.docker.internal', rejectUnauthorized: true });
  secure.setTimeout(5000, () => { secure.destroy(); finish({ connected: true, tls: 'timeout' }); });
  secure.on('secureConnect', () => { const authorized = secure.authorized; secure.destroy(); finish({ connected: true, authorized }); });
  secure.on('error', (error) => finish({ connected: true, tlsError: error.code || error.message }));
});
req.on('error', (error) => finish({ requestError: error.code || error.message }));
req.end();
setTimeout(() => finish({ timeout: true }), 7000);
