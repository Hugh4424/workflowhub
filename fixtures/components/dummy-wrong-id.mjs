#!/usr/bin/env node
// Dummy component: exits 0, writes valid JSON but component_id does not match registry entry.
// Registry declares "expect-X"; this outputs "actual-Y".
process.stdout.write(JSON.stringify({ component_id: "actual-Y", status: "ok" }) + "\n");
process.exit(0);
