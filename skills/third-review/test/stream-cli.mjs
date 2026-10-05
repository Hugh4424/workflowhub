#!/usr/bin/env node

let count = 0; let timer;
function emit() {
  count += 1;
  console.log(JSON.stringify({ type: count === 4 ? "session.completed" : "progress", session_id: "stream-session", text: count === 4 ? "stream opinion" : undefined }));
  if (count === 4) { clearInterval(timer); process.exit(0); }
}
emit();
timer = setInterval(emit, 20);
