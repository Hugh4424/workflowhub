import{spawn}from"node:child_process";import{EventEmitter}from"node:events";import{existsSync,readFileSync,mkdtempSync,realpathSync,rmSync,writeFileSync}from"node:fs";import{tmpdir}from"node:os";import{join}from"node:path";import{afterEach,describe,expect,it}from"vitest";import{runReviewRecordWithSignalHandling,stageRuntimeCliMain}from"../../tools/cli/stage-runtime.mjs";
const roots=[];afterEach(()=>{while(roots.length)rmSync(roots.pop(),{recursive:true,force:true});});function requireReason(path){ return readFileSync(path,"utf8"); }
function fixture(){const root=realpathSync(mkdtempSync(join(tmpdir(),"current-signal-flush-")));roots.push(root);return{root};}
// Only signal/cancellation/delegate drain survives. No old private preflight, completion or reflection certificate.
describe("public review signal propagation and owned drain",()=>{
  it("keeps a review-record invocation alive through SIGTERM until its owned delegate settles", async () => {
    const signals = new EventEmitter();
    let receivedSignal = null;
    const result = await runReviewRecordWithSignalHandling(async (signal) => {
      receivedSignal = signal;
      signals.emit("SIGTERM");
      signals.emit("SIGINT");
      signals.emit("SIGTERM");
      await new Promise((resolve) => queueMicrotask(resolve));
      expect(signal.aborted).toBe(true);
      return { status: "recorded" };
    }, { signalProcess: signals });

    expect(result).toEqual({ status: "recorded" });
    expect(receivedSignal).toBeInstanceOf(AbortSignal);
    expect(receivedSignal.reason).toMatchObject({ code: "REVIEW_CANCELLED" });
    expect(signals.exitCode).toBe(143);
    expect(signals.listenerCount("SIGTERM")).toBe(0);
    expect(signals.listenerCount("SIGINT")).toBe(0);
  });

  it("passes the CLI SIGINT cancellation signal into the private review-record delegate", async () => {
    const signals = new EventEmitter();
    let receivedSignal = null;
    const result = await stageRuntimeCliMain([
      "review", "--action=record", "--stage=build-code", "--project=workflowhub", "--task=fixture", "--input=request.json",
    ], {
      delegate: async (_argv, { services }) => {
        receivedSignal = services.reviewSignal;
        signals.emit("SIGINT");
        await new Promise((resolve) => queueMicrotask(resolve));
        return { status: "recorded" };
      },
      services: { signalProcess: signals },
    });

    expect(result).toEqual({ status: "recorded" });
    expect(receivedSignal).toBeInstanceOf(AbortSignal);
    expect(receivedSignal.aborted).toBe(true);
    expect(signals.exitCode).toBe(130);
  });

  it("handles a real SIGTERM without exiting before the review-record delegate settles", async () => {
    const state = fixture();
    const marker = join(state.root, "review-record-ready");
    const observed = marker + ".observed", release = marker + ".release";
    const harness = join(state.root, "review-record-signal-harness.mjs");
    writeFileSync(harness, [
      `import { writeFileSync, existsSync } from "node:fs";`,
      `import { stageRuntimeCliMain } from ${JSON.stringify(new URL("../../tools/cli/stage-runtime.mjs", import.meta.url).href)};`,
      `const marker = ${JSON.stringify(marker)};`,
      `await stageRuntimeCliMain(["review", "--action=record", "--stage=build-code", "--project=workflowhub", "--task=fixture", "--input=request.json"], {`,
      `  delegate: async (_argv, { services }) => {`,
      `    writeFileSync(marker, "ready");`,
      `    const hold = setInterval(() => {}, 1000);`,
      `    try { await new Promise((resolve) => services.reviewSignal.aborted ? resolve() : services.reviewSignal.addEventListener("abort", resolve, { once: true })); writeFileSync(${JSON.stringify(observed)}, services.reviewSignal.reason.message); while (!existsSync(${JSON.stringify(release)})) await new Promise(resolve => setTimeout(resolve, 5)); await new Promise((resolve) => setTimeout(resolve, 25)); } finally { clearInterval(hold); }`,
      `    return { status: "recorded" };`,
      `  },`,
      `});`,
    ].join("\n"));
    const child = spawn(process.execPath, [harness], { stdio: "ignore" });
    try {
      const deadline = Date.now() + 2_000;
      while (!existsSync(marker) && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(existsSync(marker)).toBe(true);
      const closed = new Promise((resolve, reject) => {
        child.once("error", reject);
        child.once("close", (code, signal) => resolve({ code, signal }));
      });
      expect(child.kill("SIGTERM")).toBe(true);
      const observedDeadline = Date.now() + 2000;
      while (!existsSync(observed) && Date.now() < observedDeadline) await new Promise(resolve => setTimeout(resolve, 5));
      expect(existsSync(observed)).toBe(true);
      expect(requireReason(observed)).toContain("SIGTERM");
      expect(child.kill("SIGINT")).toBe(true);
      writeFileSync(release, "release owned drain");
      const exit = await closed;
      expect(exit).toEqual({ code: 143, signal: null });
    } finally {
      try { child.kill("SIGKILL"); } catch { /* child has already exited */ }
    }
  });

});
