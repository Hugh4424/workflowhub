#!/usr/bin/env node
const event = JSON.stringify({ type: "heartbeat", sequence: 1, status: "running" });
const other = JSON.stringify({ type: "heartbeat", sequence: 2, status: "running" });
console.log(event);
setTimeout(() => console.log(other), 10);
setTimeout(() => { console.log(event); process.exit(0); }, 20);
