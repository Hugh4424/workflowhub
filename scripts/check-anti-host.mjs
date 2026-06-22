/**
 * check-anti-host.mjs  (FR-GUARD-001 / FR-GUARD-002)
 *
 * Anti-host-dependency lint for workflowhub core files.
 * Scans core/*.mjs (via scanCoreFiles) for four classes of host coupling.
 *
 * Exit codes:
 *   0 — clean (no violations found, or --self-test passed)
 *   1 — violations found
 *   2 — internal error
 *
 * CLI:
 *   node scripts/check-anti-host.mjs              # scan core/ (default)
 *   node scripts/check-anti-host.mjs --self-test  # prove all four regex classes fire
 *   node scripts/check-anti-host.mjs --files f1 f2 ...  # scan specific files (for tests)
 *   node scripts/check-anti-host.mjs --list-files # print files that would be scanned
 *
 * Pattern: mirrors multica provider-name-scan.mjs convention (exit 0/1/2 + --self-test
 * + --list-files) but does NOT import it.
 */

import { readFileSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";

// --------------------------------------------------------------------------
// Four anti-host regex classes
// --------------------------------------------------------------------------

const CLASSES = [
  {
    id: 1,
    name: "hardcoded-path",
    description: "Hardcoded absolute path (/Users/…, /home/…, multica-agenthub, Knowledge/Projects)",
    // Matches absolute paths that are clearly machine-local or repo-specific.
    // Intentionally avoids matching relative paths or generic /tmp.
    regex: /(?:\/Users\/|\/home\/)[^\s"'`]+|multica-agenthub|Knowledge\/Projects/g,
  },
  {
    id: 2,
    name: "repo-root-climb",
    description: "Climbing parent dirs to find repo root (dirname+fileURLToPath+../../.. or walking up for .git/REPO_ROOT)",
    // Catches:
    //   A) Three or more consecutive ../ in a path string — "../../.." style deep climb
    //   B) Walking up to find .git or REPO_ROOT marker (variable assignment, not in throw/string)
    // Does NOT flag dirname+fileURLToPath alone: a single-level relative resolve is fine in core.
    // The rule is: climbing THREE or more levels = repo root hunting.
    regex: /(?:\.\.\/){3,}|['"`](?:\.\.\/){2,}\.\.['"`]|=\s*(?:find|locate|walk)[^;]*\.git|REPO_ROOT\s*=/g,
  },
  {
    id: 3,
    name: "source-derived",
    description: "Host-specific derived paths (.machine/source, .agenthub/)",
    regex: /\.machine\/source|\.agenthub[\/'"]/g,
  },
  {
    id: 4,
    name: "claude-hook",
    description: "Claude-specific hook event names or any .claude/ host path (PreToolUse, PostToolUse, SessionStart, Stop, .claude/settings.json, .claude/commands/, etc.)",
    // Match the specific Claude hook event name strings and any .claude/ host path.
    regex: /['"`](?:PreToolUse|PostToolUse|SessionStart|Stop)['"`]|\.claude\//g,
  },
];

// --------------------------------------------------------------------------
// Scan a single file — returns array of findings
// --------------------------------------------------------------------------

function scanFile(filePath) {
  let content;
  try {
    content = readFileSync(filePath, "utf8");
  } catch (err) {
    return [{ file: filePath, line: 0, class: "error", match: err.message }];
  }

  const lines = content.split("\n");
  const findings = [];

  for (const cls of CLASSES) {
    // Reset lastIndex before each use (regex has /g flag)
    cls.regex.lastIndex = 0;
    let m;
    while ((m = cls.regex.exec(content)) !== null) {
      // Determine line number (1-based)
      const lineIndex = content.slice(0, m.index).split("\n").length;
      findings.push({
        file: filePath,
        line: lineIndex,
        class: cls.name,
        classId: cls.id,
        match: m[0].slice(0, 120), // truncate for readability
      });
    }
  }

  return findings;
}

// --------------------------------------------------------------------------
// --self-test: inline bad samples, prove each class fires
// --------------------------------------------------------------------------

function runSelfTest() {
  const BAD_SAMPLES = [
    {
      id: 1,
      name: "hardcoded-path",
      content: `export const DIR = "/Users/alice/Projects/multica-agenthub/config";`,
    },
    {
      id: 2,
      name: "repo-root-climb",
      content: [
        `import { fileURLToPath } from "url";`,
        `import { dirname, resolve } from "path";`,
        `const __dirname = dirname(fileURLToPath(import.meta.url));`,
        `const repoRoot = resolve(__dirname, "../../..");`,
      ].join("\n"),
    },
    {
      id: 3,
      name: "source-derived",
      content: `export const JOURNAL = ".machine/source";`,
    },
    {
      id: 4,
      name: "claude-hook",
      content: `export const EVENTS = ["PreToolUse", "PostToolUse"];`,
    },
  ];

  let allPassed = true;

  for (const sample of BAD_SAMPLES) {
    const cls = CLASSES.find((c) => c.id === sample.id);
    if (!cls) {
      console.error(`  MISSING class ${sample.id}`);
      allPassed = false;
      continue;
    }

    cls.regex.lastIndex = 0;
    const matched = cls.regex.test(sample.content);
    if (matched) {
      console.log(`  class ${sample.id} (${cls.name}): CAUGHT — regex fires on bad sample`);
    } else {
      console.error(`  class ${sample.id} (${cls.name}): FAILED — regex did NOT fire on bad sample`);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log("self-test PASSED — all four classes detected their bad sample");
    process.exit(0);
  } else {
    console.error("self-test FAILED — one or more classes did not fire");
    process.exit(2);
  }
}

// --------------------------------------------------------------------------
// --list-files
// --------------------------------------------------------------------------

async function listFiles(files) {
  for (const f of files) {
    console.log(f);
  }
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--self-test")) {
    runSelfTest();
    return;
  }

  // Resolve file list: --files f1 f2 ... overrides default scanCoreFiles()
  let filesToScan;
  const filesIdx = args.indexOf("--files");
  if (filesIdx !== -1) {
    filesToScan = args.slice(filesIdx + 1).filter((a) => !a.startsWith("--"));
    if (filesToScan.length === 0) {
      console.error("error: --files requires at least one path");
      process.exit(2);
    }
  } else {
    // Default: use the shared boundary anchor
    const { scanCoreFiles } = await import(
      new URL("./scan-core-files.mjs", import.meta.url).href
    );
    filesToScan = scanCoreFiles();
  }

  if (args.includes("--list-files")) {
    await listFiles(filesToScan);
    process.exit(0);
  }

  // Scan
  const allFindings = [];
  for (const f of filesToScan) {
    allFindings.push(...scanFile(f));
  }

  if (allFindings.length === 0) {
    console.log(`check-anti-host: OK — scanned ${filesToScan.length} file(s), no violations`);
    process.exit(0);
  }

  // Report violations
  console.log(`check-anti-host: VIOLATIONS FOUND in ${filesToScan.length} file(s):`);
  for (const f of allFindings) {
    const label = f.classId
      ? `class ${f.classId} (${f.class})`
      : f.class;
    console.log(`  [${label}] ${f.file}:${f.line}  →  ${f.match}`);
  }
  process.exit(1);
}

main().catch((err) => {
  console.error("check-anti-host internal error:", err.message);
  process.exit(2);
});
