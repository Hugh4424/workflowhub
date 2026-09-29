import http from 'node:http';
const req = http.request({ host: 'card04-ac17-gateway-v4', port: 8080, method: 'CONNECT', path: 'host.docker.internal:48173' });
req.on('connect', (response) => { console.log(JSON.stringify({ status: response.statusCode })); process.exit(0); });
req.on('response', (response) => console.log(JSON.stringify({ status: response.statusCode })));
req.on('error', (error) => console.log(JSON.stringify({ error: error.code })));
req.end();
