import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const repository = resolve(process.argv[2] ?? "");
const readmePath = resolve(process.argv[3] ?? join(repository, "README.md"));
if (!repository || !readmePath) throw new TypeError("repository and README path are required");

const readme = readFileSync(readmePath, "utf8");
const standard = readFileSync(join(repository, "docs/standard-workflow.md"), "utf8");
const { CURRENT_MATERIAL_FILES, materialFilesForCohort } = await import(
  pathToFileURL(join(repository, "runtime/task/material-workspace.mjs")).href
);
const lines = readme.split(/\r?\n/);
const pre = lines.filter((line) => line.startsWith("- `pre`："));
const post = lines.filter((line) => line.startsWith("- `post`："));
const expectedPre = "- `pre`：`make-decision → build-spec → build-plan → build-code → verify-code`。既有任务、历史记录和缺少冻结 cohort 的任务都保留这条五阶段路线。";
const expectedPost = "- `post`：`make-decision → build-plan → build-code → verify-code`。`build-plan` 负责当前 `spec.md`、独立的 `phases/P<n>.md` 和纯指针 `phases/index.md`；`build-spec` 只读保留 pre/history。";
const checks = [
  ["pre README line remains unchanged", pre.length === 1 && pre[0] === expectedPre],
  ["post README line names current materials", post.length === 1 && post[0] === expectedPost],
  ["runtime post base materials agree", JSON.stringify(materialFilesForCohort("post")) === JSON.stringify(["decision-log.md", "spec.md", "phases/index.md"])],
  ["runtime pre materials remain historical", JSON.stringify(CURRENT_MATERIAL_FILES) === JSON.stringify(["decision-log.md", "spec.md", "plan.md", "tasks.md"])],
  ["workflow says post has independent phases", standard.includes("post 是\n   `decision-log.md`、含全局实现设计的 `spec.md`、独立 `phases/P<n>.md`、纯指针\n   `phases/index.md`")],
  ["workflow rejects post plan/tasks double-write", standard.includes("不生成 `plan.md/tasks.md` 双写")],
];
for (const [name, passed] of checks) console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
if (checks.some(([, passed]) => !passed)) process.exitCode = 1;
