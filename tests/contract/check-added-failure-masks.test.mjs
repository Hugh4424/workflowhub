import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import {
  EXIT,
  classifyRegion,
  evaluateSelfTest,
  findCatchRegions,
  maskSource,
  parseAddedLines,
  readPhaseBase,
  runScan,
  scanText,
  shouldScan,
} from "../../tools/cli/check-added-failure-masks.mjs";

const CLI = fileURLToPath(new URL("../../tools/cli/check-added-failure-masks.mjs", import.meta.url));
const TEMP_DIRS = [];

function tempDir(prefix) {
  const dir = realpathSync(mkdtempSync(join(realpathSync(tmpdir()), prefix)));
  TEMP_DIRS.push(dir);
  return dir;
}

afterAll(() => {
  for (const dir of TEMP_DIRS) rmSync(dir, { recursive: true, force: true });
});

function git(cwd, ...args) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout.trim();
}

function initRepo() {
  const root = tempDir("p2-mask-repo-");
  git(root, "init", "-q");
  git(root, "-c", "user.email=test@example.com", "-c", "user.name=test", "commit", "--allow-empty", "-q", "-m", "base");
  return root;
}

function writeFile(root, path, content) {
  const full = join(root, path);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, content);
}

function taskRoot(baseHead, phase = "P2") {
  const root = tempDir("p2-mask-task-");
  writeFileSync(join(root, "task.json"), JSON.stringify({ task_id: "T008", project_name: "fixture" }));
  const cursor = {
    phase_id: phase,
    task_id: phase === "P2" ? "T008" : "T014",
    phases_head: "a".repeat(40),
    base_head: baseHead,
    recorded_at: "2026-11-25T00:00:00.000Z",
  };
  writeFileSync(join(root, "facts.jsonl"), `${JSON.stringify({
    record_kind: "stage",
    task_id: "T008",
    project_name: "fixture",
    stage: "build-code",
    source: "p2 contract fixture",
    created_at: "2026-11-25T00:00:00.000Z",
    phase_progress: cursor,
  })}\n`);
  return root;
}

function allLines(text) {
  const map = new Map();
  const lines = text.split("\n");
  if (lines.at(-1) === "") lines.pop();
  lines.forEach((value, index) => map.set(index + 1, value));
  return map;
}

function classify(text, path = "a.mjs") {
  return scanText({ path, text, addedLines: allLines(text) });
}

function runCli(args, cwd) {
  return spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: "utf8" });
}

// 19 个输入样本分 13 组：与 --self-test 的组口径同源，逐样本断言。
const SAMPLES = [
  { group: 1, text: "try { read(p); } catch {}", expected: { count: 1, kind: "EMPTY_CATCH" } },
  { group: 2, text: "try {\n  read(p);\n} catch {\n}", expected: { count: 1, kind: "EMPTY_CATCH" } },
  { group: 3, text: "try {\n  read(p);\n} catch (e) {\n  return null;\n}", expected: { count: 1, kind: "RETURN_MASK", line: 4, catchLine: 3 } },
  { group: 4, text: "try {\n  read(p);\n} catch (e) {\n  return false;\n}", expected: { count: 1, kind: "RETURN_MASK", line: 4, catchLine: 3 } },
  { group: 5, text: "try {\n  read(p);\n} catch (e) {\n  return undefined;\n}", expected: { count: 1, kind: "RETURN_MASK", line: 4, catchLine: 3 } },
  { group: 6, text: "try { read(p); } catch (e) { return []; }", expected: { count: 1, kind: "RETURN_MASK" } },
  { group: 6, text: "try { read(p); } catch (e) { return {}; }", expected: { count: 1, kind: "RETURN_MASK" } },
  { group: 6, text: "try { read(p); } catch (e) { return 0; }", expected: { count: 1, kind: "RETURN_MASK" } },
  { group: 6, text: "try { read(p); } catch (e) { return \"\"; }", expected: { count: 1, kind: "RETURN_MASK" } },
  { group: 6, text: "try { read(p); } catch (e) { return; }", expected: { count: 1, kind: "RETURN_MASK" } },
  { group: 7, text: "try {\n  read(p);\n} catch {\n  return null;\n}", expected: { count: 1, kind: "RETURN_MASK", line: 4, catchLine: 3 } },
  { group: 8, text: "try { read(p); } catch { return null; } // 探测：目录不存在即视为无", expected: { count: 0, exempt: 1 } },
  { group: 9, text: "try {\n  read(p);\n} catch {\n  // 探测：读不到即无\n  return null;\n}", expected: { count: 0, exempt: 1 } },
  { group: 10, text: "try {\n  read(p);\n} catch (e) {\n  log(e); return null;\n}", expected: { count: 0 } },
  { group: 11, text: "try {\n  read(p);\n} catch (e) {\n  throw e;\n}", expected: { count: 0 } },
  { group: 11, text: "try {\n  read(p);\n} catch {\n  return fallback(e);\n}", expected: { count: 0 } },
  { group: 12, path: "tests/x.test.mjs", text: "try { read(p); } catch (e) { return null; }", expected: { count: 0, skippedFiles: 1, skippedHits: 1 } },
  { group: 13, path: "docs/x.mjs", text: "console.log(1);", expected: { count: 0, skippedFiles: 1 } },
  { group: 13, path: "fixtures/x.mjs", text: "console.log(1);", expected: { count: 0, skippedFiles: 1 } },
];

describe("maskSource", () => {
  it("blanks strings and comments without changing line count", () => {
    const text = 'const a = "catch {"; // catch { return null; }\nconst b = `x ${y}`; /* catch {} */\n';
    const { masked, comments } = maskSource(text);
    expect(masked.split("\n")).toHaveLength(text.split("\n").length);
    expect(masked).not.toContain("catch");
    expect(masked).not.toContain("return null");
    expect(comments.map((comment) => comment.text.trim())).toEqual(["catch { return null; }", "catch {}"]);
  });

  it("keeps code visible", () => {
    const { masked } = maskSource("try { read(p); } catch {}\n");
    expect(masked).toContain("try { read(p); } catch {}");
  });
});

describe("findCatchRegions", () => {
  it("finds catch with and without a binding", () => {
    const { masked } = maskSource("try { a(); } catch {}\ntry { b(); } catch (error) {\n}\n");
    const regions = findCatchRegions(masked);
    expect(regions).toHaveLength(2);
    expect(regions[0].catchLine).toBe(1);
    expect(regions[1].catchLine).toBe(2);
  });

  it("handles braces inside the catch body", () => {
    const { masked } = maskSource("try { a(); } catch { if (x) { y(); } }\n");
    const regions = findCatchRegions(masked);
    expect(regions).toHaveLength(1);
    expect(classifyRegion(regions[0], masked, []).kind).toBeNull();
  });

  it("reports an unbalanced catch instead of dropping it silently", () => {
    const unbalanced = [];
    const { masked } = maskSource("try { a(); } catch { if (x) {\n");
    const regions = findCatchRegions(masked, (line) => unbalanced.push(line));
    expect(regions).toHaveLength(0);
    expect(unbalanced).toEqual([1]);
  });
});

describe("19 samples in 13 groups", () => {
  for (const [index, sample] of SAMPLES.entries()) {
    it(`sample ${index + 1} (group ${sample.group})`, () => {
      const path = sample.path ?? "a.mjs";
      const scanned = shouldScan(path);
      const result = classify(sample.text, path);
      if (!scanned) {
        expect(sample.expected.skippedFiles).toBe(1);
        if (sample.expected.skippedHits !== undefined) {
          const hits = scanText({ path, text: sample.text, addedLines: allLines(sample.text) }).candidates.length;
          expect(hits).toBe(sample.expected.skippedHits);
        }
        return;
      }
      expect(result.candidates).toHaveLength(sample.expected.count);
      if (sample.expected.count === 0) {
        if (sample.expected.exempt !== undefined) expect(result.exempt).toBe(sample.expected.exempt);
        return;
      }
      expect(result.candidates[0].kind).toBe(sample.expected.kind);
      if (sample.expected.line !== undefined) expect(result.candidates[0].line).toBe(sample.expected.line);
      if (sample.expected.catchLine !== undefined) expect(result.candidates[0].catchLine).toBe(sample.expected.catchLine);
    });
  }
});

describe("exemption scope", () => {
  it("counts exempt only when the region intersects added lines", () => {
    const text = "try { a(); } catch { return null; } // 历史理由\n";
    const notAdded = scanText({ path: "a.mjs", text, addedLines: new Map([[2, ""]]) });
    expect(notAdded.candidates).toHaveLength(0);
    expect(notAdded.exempt).toBe(0);
    const added = scanText({ path: "a.mjs", text, addedLines: new Map([[1, ""]]) });
    expect(added.exempt).toBe(1);
  });
});

describe("shouldScan", () => {
  it("accepts code extensions and rejects skipped segments", () => {
    expect(shouldScan("tools/cli/a.mjs")).toBe(true);
    expect(shouldScan("src/a.ts")).toBe(true);
    expect(shouldScan("tests/a.test.mjs")).toBe(false);
    expect(shouldScan("test/a.mjs")).toBe(false);
    expect(shouldScan("__tests__/a.mjs")).toBe(false);
    expect(shouldScan("fixtures/a.mjs")).toBe(false);
    expect(shouldScan("docs/a.mjs")).toBe(false);
    expect(shouldScan("specs/a.mjs")).toBe(false);
    expect(shouldScan("quality/a.mjs")).toBe(false);
    expect(shouldScan("node_modules/a.mjs")).toBe(false);
    expect(shouldScan("a.md")).toBe(false);
  });
});

describe("parseAddedLines", () => {
  it("reads tracked hunks and untracked files in two steps", () => {
    const root = initRepo();
    writeFile(root, "src/app.mjs", "const a = 1;\n");
    git(root, "add", "-A");
    git(root, "-c", "user.email=test@example.com", "-c", "user.name=test", "commit", "-q", "-m", "tracked");
    const base = git(root, "rev-parse", "HEAD");
    writeFile(root, "src/app.mjs", "const a = 1;\ntry { x(); } catch {}\n");
    writeFile(root, "extra.mjs", "try {\n  y();\n} catch {\n  return null;\n}\n");
    const added = parseAddedLines({ root, base });
    expect([...added.get("src/app.mjs").keys()]).toEqual([2]);
    expect([...added.get("extra.mjs").keys()]).toEqual([1, 2, 3, 4, 5]);
    expect(added.get("extra.mjs").get(4)).toBe("  return null;");
  });

  it("keeps added lines that start with ++ (not a file header)", () => {
    const root = initRepo();
    writeFile(root, "src/counter.mjs", "let counter = 0;\n");
    git(root, "add", "-A");
    git(root, "-c", "user.email=test@example.com", "-c", "user.name=test", "commit", "-q", "-m", "counter");
    const base = git(root, "rev-parse", "HEAD");
    writeFile(root, "src/counter.mjs", "let counter = 0;\n++ counter;\ntry { x(); } catch {}\n");
    const added = parseAddedLines({ root, base });
    expect([...added.get("src/counter.mjs").keys()]).toEqual([2, 3]);
    expect(added.get("src/counter.mjs").get(2)).toBe("++ counter;");
    expect([...added.keys()]).toEqual(["src/counter.mjs"]);
    const result = runScan({ root, base });
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]).toMatchObject({ path: "src/counter.mjs", line: 3, kind: "EMPTY_CATCH" });
  });
});

describe("readPhaseBase", () => {
  it("returns the build-code cursor when the phase matches", () => {
    const root = initRepo();
    const base = git(root, "rev-parse", "HEAD");
    const task = taskRoot(base);
    expect(readPhaseBase(task, "P2").base_head).toBe(base);
  });

  it("rejects a cursor from another phase", () => {
    const root = initRepo();
    const base = git(root, "rev-parse", "HEAD");
    const task = taskRoot(base, "P3");
    expect(() => readPhaseBase(task, "P2")).toThrow(/cursor 只含 P3\/T014/);
  });

  it("rejects a missing cursor", () => {
    const root = initRepo();
    const base = git(root, "rev-parse", "HEAD");
    const task = taskRoot(base);
    writeFileSync(join(task, "facts.jsonl"), `${JSON.stringify({
      record_kind: "stage", task_id: "T008", project_name: "fixture", stage: "build-code",
      source: "p2 contract fixture", created_at: "2026-11-25T00:00:00.000Z",
    })}\n`);
    expect(() => readPhaseBase(task, "P2")).toThrow(/phase_progress\.base_head/);
  });
});

describe("CLI self-test", () => {
  it("prints 13 PASS lines and exits 0", () => {
    const result = runCli(["--self-test"], process.cwd());
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("self-test: 13/13");
    expect(result.stdout.match(/self-test: PASS \d+ /g)).toHaveLength(13);
  });

  it("reports 19 samples in 13 groups without reading the repo", () => {
    const report = evaluateSelfTest();
    expect(report.total).toBe(13);
    expect(report.passed).toBe(13);
    expect(SAMPLES).toHaveLength(19);
  });
});

describe("CLI scan", () => {
  it("reports a deliberate return null as a candidate and exits 1 with --strict", () => {
    const root = initRepo();
    const base = git(root, "rev-parse", "HEAD");
    const task = taskRoot(base);
    writeFile(root, ".probe-failure-mask.mjs", "try {\n  return readFileSync(p);\n} catch {\n  return null;\n}\n");
    const result = runCli(["--base", base, "--task-path", task, "--phase", "P2", "--strict"], root);
    expect(result.status).toBe(EXIT.CANDIDATE);
    expect(result.stdout).toContain(".probe-failure-mask.mjs:4 [RETURN_MASK] (catch@3)");
  });

  it("returns zero candidates after the probe is removed", () => {
    const root = initRepo();
    const base = git(root, "rev-parse", "HEAD");
    const task = taskRoot(base);
    const result = runCli(["--base", base, "--task-path", task, "--phase", "P2", "--strict"], root);
    expect(result.status).toBe(EXIT.PASS);
    expect(result.stdout).toContain("summary: candidates=0");
  });

  it("exits 0 with a note when --strict is omitted (non-gate comparison)", () => {
    const root = initRepo();
    const base = git(root, "rev-parse", "HEAD");
    const task = taskRoot(base);
    writeFile(root, ".probe-failure-mask.mjs", "try {\n  x();\n} catch {\n  return null;\n}\n");
    const lenient = runCli(["--base", base, "--task-path", task, "--phase", "P2"], root);
    expect(lenient.status).toBe(EXIT.PASS);
    expect(lenient.stdout).toContain("candidate: .probe-failure-mask.mjs:4 [RETURN_MASK]");
    expect(lenient.stdout).toContain("note: exit 0 is not a pass; rerun with --strict for the gate");
    const strict = runCli(["--base", base, "--task-path", task, "--phase", "P2", "--strict"], root);
    expect(strict.status).toBe(EXIT.CANDIDATE);
  });

  it("fails loudly when an untracked file cannot be read", () => {
    const root = initRepo();
    const base = git(root, "rev-parse", "HEAD");
    const task = taskRoot(base);
    symlinkSync("missing-target", join(root, "broken.mjs"));
    const result = runCli(["--base", base, "--task-path", task, "--phase", "P2", "--strict"], root);
    expect(result.status).toBe(EXIT.INPUT);
    expect(result.stdout).toContain("cannot read untracked file broken.mjs");
  });

  it("warns and counts an unbalanced catch region instead of dropping it", () => {
    const root = initRepo();
    const base = git(root, "rev-parse", "HEAD");
    const task = taskRoot(base);
    writeFile(root, "src/broken-catch.mjs", "try { a(); } catch {\n");
    const result = runCli(["--base", base, "--task-path", task, "--phase", "P2", "--strict"], root);
    expect(result.status).toBe(EXIT.PASS);
    expect(result.stdout).toContain("warning: unbalanced catch region at src/broken-catch.mjs:1");
    expect(result.stdout).toContain("unbalanced_regions=1");
  });

  it("counts tests/ copies as skipped instead of candidates", () => {
    const root = initRepo();
    const base = git(root, "rev-parse", "HEAD");
    const task = taskRoot(base);
    writeFile(root, "tests/.probe.test.mjs", "try{x();}catch{}\n");
    const result = runCli(["--base", base, "--task-path", task, "--phase", "P2", "--strict"], root);
    expect(result.status).toBe(EXIT.PASS);
    expect(result.stdout).not.toMatch(/^candidate: tests\//m);
    expect(result.stdout).toMatch(/skipped_files=1 skipped_hits=1/);
  });
});

describe("CLI input errors", () => {
  it("requires --base or --self-test", () => {
    const result = runCli([], process.cwd());
    expect(result.status).toBe(EXIT.INPUT);
    expect(result.stdout).toContain("--base <commit> is required");
  });

  it("requires --task-path", () => {
    const result = runCli(["--base", "HEAD"], process.cwd());
    expect(result.status).toBe(EXIT.INPUT);
    expect(result.stdout).toContain("--task-path");
  });

  it("rejects --self-test combined with scan arguments", () => {
    const result = runCli(["--self-test", "--base", "HEAD"], process.cwd());
    expect(result.status).toBe(EXIT.INPUT);
    expect(result.stdout).toContain("--self-test cannot be combined");
  });

  it("rejects a base that differs from the cursor", () => {
    const root = initRepo();
    const base = git(root, "rev-parse", "HEAD");
    git(root, "-c", "user.email=test@example.com", "-c", "user.name=test", "commit", "--allow-empty", "-q", "-m", "next");
    const next = git(root, "rev-parse", "HEAD");
    const task = taskRoot(base);
    const result = runCli(["--base", next, "--task-path", task, "--phase", "P2"], root);
    expect(result.status).toBe(EXIT.INPUT);
    expect(result.stdout).toContain(`differs from phase_progress.base_head ${base}`);
  });

  it("rejects an unknown commit", () => {
    const root = initRepo();
    const task = taskRoot(git(root, "rev-parse", "HEAD"));
    const result = runCli(["--base", "deadbeef", "--task-path", task], root);
    expect(result.status).toBe(EXIT.INPUT);
    expect(result.stdout).toContain("is not a commit");
  });
});

describe("runScan", () => {
  it("keeps historical lines outside the added range", () => {
    const root = initRepo();
    writeFile(root, "src/legacy.mjs", "try { a(); } catch {\n  return null;\n}\n");
    git(root, "add", "-A");
    git(root, "-c", "user.email=test@example.com", "-c", "user.name=test", "commit", "-q", "-m", "legacy");
    const base = git(root, "rev-parse", "HEAD");
    writeFile(root, "src/legacy.mjs", "try { a(); } catch {\n  return null;\n}\nconst b = 2;\n");
    const result = runScan({ root, base });
    expect(result.candidates).toHaveLength(0);
  });
});
