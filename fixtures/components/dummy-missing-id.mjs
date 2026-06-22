#!/usr/bin/env node
// Dummy component: exits 0, writes valid JSON but no component_id field.
process.stdout.write(JSON.stringify({ status: "ok" }) + "\n");
process.exit(0);
