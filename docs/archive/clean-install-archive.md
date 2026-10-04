# M17 clean-install 留档

## 运行边界

- 任务：`workflowhub-m17-repo-skills-multicli-20260903`
- 运行日期：2026-09-05
- 运行 worktree：`/Users/Hugh/Hugh/Project/workflowhub-workflowhub-m17-repo-skills-multicli-20260903`
- 当前基线：`main` 与任务分支已对齐到 `248a7de36ab82fe0fb103f34a7e5a355da14006c`
- Node.js：`v24.14.0`
- npm：`11.9.0`
- Git：`2.39.5`
- 外部前置：仅需仓库依赖；不安装 `superpowers`/`gstack`，不调用 provider。

运行前在仓库根目录执行 `npm ci --ignore-scripts`，然后执行以下确切命令：

```sh
node tools/architecture/clean-install.mjs
```

无参数调用默认执行 runner、skill bundle、Multica layout 和当前树完整检查。脚本在临时目录创建 runner、skill bundle、目标 Git 仓库、隔离 `HOME` 与 task storage，结束时清理临时目录。临时目录先解析为真实路径，确保 macOS `/var` symlink 不会让已安装 CLI 被跳过或让 storage root 被错误拒绝。

## 结果

- 退出码：`0`
- `status`：`passed`
- runner 文件：`118`
- skill bundle 文件：`116`
- 五阶段 skill 解析：`passed`，五段均有依赖命中；解析模式为 `no_provider_package_resolution`
- runner 安装：`status=0`
- 隔离布局：bootstrap `0`，doctor `0`
- 安装后五阶段 task：`passed`；实际调用安装副本 Runner 的五个 public `run --action=execute`，顺序为 `make-decision`、`build-spec`、`build-plan`、`build-code`、`verify-code`，五次退出码均为 `0`
- 五阶段 task 质量事实：至少写入五条 SHA 命名 fact；该样例不调用 provider，因此各阶段缺少宿主 Stage Agent 结果时仍保留 `incomplete`/`unavailable`，不伪造质量通过
- source tree：前后 hash 均为 `38f65c43a5fe3bfb38cedd8213fde030253e2739f4fc462768386baa049c57aa`
- untracked audit：前后 content hash 均为 `8c2a7282d69069ca8e1f05d688d2518632d91791a5abf133357c2425adc0979f`
- source tree / untracked files：均未改变
- 随后加入 stage-reflection 测试 fixture 与 Claude 探针事实后再次执行同一命令：仍 exit `0`、`status=passed`；本次 source tree hash 为 `5c669e4a53a80ca4f9b4e3c9fbdc943387c6c16ab583def6a785b1a2eaa1799c`，untracked audit hash 为 `ed0c23fb20786f3e476051d0c0a1fedf1e789cb716694317312a7a8730395442`，两者前后均一致。

已有 `quality/tests/t21-clean-install-rerun.json` 与 `quality/tests/output/t21-clean-install-rerun.output` 是合并前快照的不可变历史 receipt；本次主线合并后重新执行了同一窄命令，但没有覆盖旧 receipt。

第三人复现：在新的仓库工作树安装依赖后，保持不安装 `superpowers`/`gstack`，执行上面的命令；应看到 `status=passed`、runner/skill bundle 构建与五阶段解析命中、隔离 bootstrap/doctor 均为 `0`、安装副本 Runner 的五阶段 public 调用均为 `0`，且 source/untracked 前后 hash 一致。hash 会随工作树内容变化，不要求与本次值相同。该样例是无 provider 的确定性 task fixture，证明安装副本与公共五阶段入口可执行，但不能替代受支持宿主实际完成业务任务的证据。

## 十条验收与 AC-C-001 当前核对

| 验收 | 当前结论 | 最小留证 |
| --- | --- | --- |
| AC-A-001 | incomplete | clean-install 已覆盖安装副本的确定性五阶段 task；仍无受支持宿主实际完成业务任务的样例，且该 task 无 provider 结果 |
| AC-A-002 | passed | T17 GREEN rerun |
| AC-A-003 | passed | T18 focused rerun |
| AC-A-004 | passed | T20 parity/e2e rerun |
| AC-A-005 | passed | T15 real catalog scan receipt |
| AC-B-001 | incomplete | 无真实 Claude CLI 会话 |
| AC-B-002 | passed | current T9/T11/T20 rerun receipts |
| AC-B-003 | passed | T19 mapping receipt |
| AC-B-004 | passed | T20 adapter scan/e2e |
| AC-B-005 | passed | T19 Codex 核实记录 |
| AC-C-001 | incomplete | 全量 `npm test` exit `1` |

AC-B-002 使用的是 `quality/tests/t9-identity-outcome-rerun2.json`、`quality/tests/t11-claude-outcome-packet-rerun2.json` 与 `quality/tests/t20-cli-parity-rerun2.json`；早期依赖缺失或修正前快照的 receipt 仅保留为历史事实。

AC-A-005 的当前真实 catalog 扫描 receipt 为 `quality/tests/t15-metrics-scan-rerun2.json`；它通过现有 `runtime/evidence/check-skill-closure.mjs` 入口扫描仓内 `skills/catalog.yaml`，并确认核心技能没有 disabled 或 missing 的 `metrics_enabled` 声明。早期 T15 fixture-only receipt 仍保留为历史事实。

以上是 build-code 阶段留证，不替代 verify-code 独立验证；任何未完成项保持 `incomplete`，不宣称 M17 已发布。
