# WorkflowHub review record

status: available
terminal_status: semantic
task_id: workflowhub-thin-core-card-04-20260919
stage: build-code
subject_kind: phase
phase_id: P4
review_scope: phase
attempt_id: 1258c827-37b6-5f95-a408-d4028e3f1eb1
snapshot_tree: 4381e90d43a7072ba12d1a4359ba757c3ddd5786
material_id: d668cdab96cf365623ae500eb3995ed9b8b8a058ea3075ebe1b751e11fb96d1c
dispatch_state: dispatched
request_key: b9b059fa73f4ecbf919d57ea8cb37f0eba05634b1327ed21dd56eb3f0ba21a31
error: null

```json
{"findings":[{"provider":"codex/luna","id":"F-22f0e3f6fa8d","severity":"major","path":"runtime/stage/stage-handlers.mjs","line":1771,"issue":"browser case 永远不能覆盖对应 AC：即使浏览器执行和 UI QA projection 都通过，passed 条件仍排除 browser，AC 覆盖会留在 unknown，导致真实浏览器验收无法形成逐 AC 通过事实。","root_cause":"acceptanceCoverageForExecution 对所有 browser tier 无条件判定 passed=false，且没有消费后续构建的 ui_qa_projection。","recommendation":"将已认证且按唯一 AC、ref/hash 绑定的 UI QA projection 接入逐 AC 覆盖判定；缺失或不匹配时继续保持 unknown。","providers":["codex/luna"],"adapter_count":1,"finding_count":1,"disposition":"invalid_evidence","evidence_status":"invalid_anchor","source_strength":"single_source","provider_findings":[{"provider":"codex/luna","adapter":"codex","severity":"major","evidence_kind":"direct","evidence_anchor_valid":false}]},{"provider":"kimi/coding","id":"F-28802ff9def2","severity":"minor","path":"runtime/stage/stage-runner.mjs","line":4550,"issue":"p5HumanExceptionFromDecisionLog() declares no parameters and unconditionally returns null (lines 438-442), so publishP5SameRunSource always exits at `if (!exception) return` (line 509) and the entire P5 report write block below it (lines 510-600) is unreachable dead code. The call site passes (ctx, acceptanceChain) at line 508, which are silently ignored, implying a declaration-parse capability that does not exist, and the function does not attempt the `## 人工例外声明` JSON-fence shape that authenticateP5StageEndReport (S-0010) authenticates.","root_cause":"p5HumanExceptionFromDecisionLog() declares no parameters and unconditionally returns null (lines 438-442), so publishP5SameRunSource always exits at `if (!exception) return` (line 509) and the entire P5 report write block below it (lines 510-600) is unreachable dead code. The call site passes (ctx, acceptanceChain) at line 508, which are silently ignored, implying a declaration-parse capability that does not exist, and the function does not attempt the `## 人工例外声明` JSON-fence shape that authenticateP5StageEndReport (S-0010) authenticates.","recommendation":"Delete the unreachable P5 publish block and the misleading call arguments, or implement the decision-log declaration parse against the authenticated JSON-fence shape; keep the fail-closed 'no confirmed human exception source' behavior explicit rather than buried in dead code.","providers":["kimi/coding"],"adapter_count":1,"finding_count":1,"disposition":"nonblocking_minor","evidence_status":"minor","source_strength":"single_source","provider_findings":[{"provider":"kimi/coding","adapter":"kimi","severity":"minor","evidence_kind":"unspecified","evidence_anchor_valid":true}]},{"provider":"kimi/coding","id":"F-2c53ff18326f","severity":"major","path":"evidence/test-summary.json","line":4,"issue":"The only test-execution evidence in the packet for P4/T006 is a single GREEN run (exit_code 0, ~2.1s). AC-18 requires a RED→GREEN record of the same test failing before the change and passing after, with failure scenario '只有 GREEN 无 RED 且无 G-2 豁免披露，即失败' (requirements/acceptance_criteria.md:1); the packet contains no RED artifact, no negative-control run for the T006 Action-⑤ requirement that forcing source_ids back to [] must fail and be persisted ('证据落盘', acceptance_criteria.md:30), and no G-2 exemption disclosure. AC-21 is also only partially met: raw_output_included is false and the referenced receipt/output bytes are absent from the packet, so the output location cannot be read back as AC-21's 度量 requires.","root_cause":"T006 evidence capture recorded only the final passing vitest invocation; the pre-change failing run and the source_ids negative-control run were not persisted into the packet, and raw test output was excluded (raw_output_included=false), leaving AC-18/AC-21 acceptance criteria without their required artifacts.","recommendation":"Land the RED run record, the negative-control (source_ids=[]) failing run, and the restored GREEN run artifacts plus readable raw output into the packet evidence before claiming T006 Done, or record an explicit G-2 exemption disclosure; the claimed '先目标 RED 后 GREEN' and '证据落盘' in acceptance_criteria.md:53 are otherwise unverifiable.","providers":["kimi/coding"],"adapter_count":1,"finding_count":1,"disposition":"invalid_evidence","evidence_status":"invalid_anchor","source_strength":"single_source","provider_findings":[{"provider":"kimi/coding","adapter":"kimi","severity":"major","evidence_kind":"direct","evidence_anchor_valid":false}]},{"provider":"codex/luna","id":"F-3c5d09b97170","severity":"major","path":"workflows/build-code/targeted-runner.mjs","line":54,"issue":"固定 capture 路径启用 WORKFLOWHUB_TARGETED_INHERIT_GROUP=1 后，detached 为 false；超时、取消或输出超限时只杀直接测试进程。测试派生的子进程可能继续运行并修改工作树，而本次 capture 已返回失败。","root_cause":"固定运行模式禁用 detached 进程组，而 kill handler 在该模式下只调用 child.kill。","recommendation":"为每个目标进程建立可单独终止的进程组，并让内部超时、取消、输出超限及外层超时都终止整个目标进程树。","providers":["codex/luna"],"adapter_count":1,"finding_count":1,"disposition":"needs_corroboration","evidence_status":"single_inference","source_strength":"single_source","provider_findings":[{"provider":"codex/luna","adapter":"codex","severity":"major","evidence_kind":"inferred","evidence_anchor_valid":false}]},{"provider":"codex/luna","id":"F-608af91c7e3a","severity":"major","path":"workflows/build-code/case-selection.mjs","line":112,"issue":"非 retired 的任意状态都会被当作可运行 case。status 缺失或为 unknown 的目录项，只要 change_triggers 命中，就会进入选择并执行。","root_cause":"选择器把“不是 retired”当作“active”，没有校验业务 case 的状态白名单。","recommendation":"只选择 status === \"active\" 的 case；对缺失或不在 active/retired 白名单内的状态 fail closed。","providers":["codex/luna"],"adapter_count":1,"finding_count":1,"disposition":"invalid_evidence","evidence_status":"invalid_anchor","source_strength":"single_source","provider_findings":[{"provider":"codex/luna","adapter":"codex","severity":"major","evidence_kind":"direct","evidence_anchor_valid":false}]},{"provider":"kimi/coding","id":"F-c595f6fd3a9c","severity":"minor","path":"runtime/stage/stage-runner.mjs","line":4714,"issue":"runOfficialStage's options still declare `allowLegacyStageOutcome = false`, but its only consumer was removed in this diff: executePrivateAcceptance drops the legacyStageOutcome parameter and its branch (old lines 100-104) and the call site no longer passes authenticatedStageOutcome (new line 129). The option has no remaining reader anywhere in the diff and is dead, misleading API surface.","root_cause":"runOfficialStage's options still declare `allowLegacyStageOutcome = false`, but its only consumer was removed in this diff: executePrivateAcceptance drops the legacyStageOutcome parameter and its branch (old lines 100-104) and the call site no longer passes authenticatedStageOutcome (new line 129). The option has no remaining reader anywhere in the diff and is dead, misleading API surface.","recommendation":"Remove allowLegacyStageOutcome from the runOfficialStage options (and update any callers), or explicitly document it as reserved-for-removal so no caller relies on legacy outcome injection that no longer exists.","providers":["kimi/coding"],"adapter_count":1,"finding_count":1,"disposition":"nonblocking_minor","evidence_status":"minor","source_strength":"single_source","provider_findings":[{"provider":"kimi/coding","adapter":"kimi","severity":"minor","evidence_kind":"unspecified","evidence_anchor_valid":true}]}],"provider_results":[{"provider":"codex/luna","output":{"findings":[{"severity":"major","path":"workflows/build-code/case-selection.mjs","line":112,"issue":"非 retired 的任意状态都会被当作可运行 case。status 缺失或为 unknown 的目录项，只要 change_triggers 命中，就会进入选择并执行。","recommendation":"只选择 status === \"active\" 的 case；对缺失或不在 active/retired 白名单内的状态 fail closed。","evidence_kind":"direct","evidence":"`const matched = catalog.cases.filter((entry) => entry.status !== \"retired\"\n      && entry.change_triggers.includes(changed));`","root_cause":"选择器把“不是 retired”当作“active”，没有校验业务 case 的状态白名单。"},{"severity":"major","path":"runtime/stage/stage-handlers.mjs","line":1771,"issue":"browser case 永远不能覆盖对应 AC：即使浏览器执行和 UI QA projection 都通过，passed 条件仍排除 browser，AC 覆盖会留在 unknown，导致真实浏览器验收无法形成逐 AC 通过事实。","recommendation":"将已认证且按唯一 AC、ref/hash 绑定的 UI QA projection 接入逐 AC 覆盖判定；缺失或不匹配时继续保持 unknown。","evidence_kind":"direct","evidence":"`const passed = item.tier !== \"browser\" && item.status !== \"unavailable\"\n          && own.length === 1 && own[0].value.status === \"passed\";`","root_cause":"acceptanceCoverageForExecution 对所有 browser tier 无条件判定 passed=false，且没有消费后续构建的 ui_qa_projection。"},{"severity":"major","path":"workflows/build-code/targeted-runner.mjs","line":54,"issue":"固定 capture 路径启用 WORKFLOWHUB_TARGETED_INHERIT_GROUP=1 后，detached 为 false；超时、取消或输出超限时只杀直接测试进程。测试派生的子进程可能继续运行并修改工作树，而本次 capture 已返回失败。","recommendation":"为每个目标进程建立可单独终止的进程组，并让内部超时、取消、输出超限及外层超时都终止整个目标进程树。","evidence_kind":"inferred","evidence":"`try { child.kill(\"SIGKILL\"); } catch { /* already exited */ }`","root_cause":"固定运行模式禁用 detached 进程组，而 kill handler 在该模式下只调用 child.kill。"}]}},{"provider":"kimi/coding","output":{"findings":[{"severity":"major","path":"evidence/test-summary.json","line":4,"issue":"The only test-execution evidence in the packet for P4/T006 is a single GREEN run (exit_code 0, ~2.1s). AC-18 requires a RED→GREEN record of the same test failing before the change and passing after, with failure scenario '只有 GREEN 无 RED 且无 G-2 豁免披露，即失败' (requirements/acceptance_criteria.md:1); the packet contains no RED artifact, no negative-control run for the T006 Action-⑤ requirement that forcing source_ids back to [] must fail and be persisted ('证据落盘', acceptance_criteria.md:30), and no G-2 exemption disclosure. AC-21 is also only partially met: raw_output_included is false and the referenced receipt/output bytes are absent from the packet, so the output location cannot be read back as AC-21's 度量 requires.","recommendation":"Land the RED run record, the negative-control (source_ids=[]) failing run, and the restored GREEN run artifacts plus readable raw output into the packet evidence before claiming T006 Done, or record an explicit G-2 exemption disclosure; the claimed '先目标 RED 后 GREEN' and '证据落盘' in acceptance_criteria.md:53 are otherwise unverifiable.","evidence_kind":"direct","evidence":"\"exit_code\": 0,\n  \"suite_scope\": \"unspecified\",\n  \"coverage_classes\": [],","root_cause":"T006 evidence capture recorded only the final passing vitest invocation; the pre-change failing run and the source_ids negative-control run were not persisted into the packet, and raw test output was excluded (raw_output_included=false), leaving AC-18/AC-21 acceptance criteria without their required artifacts."},{"severity":"minor","path":"runtime/stage/stage-runner.mjs","line":4550,"issue":"p5HumanExceptionFromDecisionLog() declares no parameters and unconditionally returns null (lines 438-442), so publishP5SameRunSource always exits at `if (!exception) return` (line 509) and the entire P5 report write block below it (lines 510-600) is unreachable dead code. The call site passes (ctx, acceptanceChain) at line 508, which are silently ignored, implying a declaration-parse capability that does not exist, and the function does not attempt the `## 人工例外声明` JSON-fence shape that authenticateP5StageEndReport (S-0010) authenticates.","recommendation":"Delete the unreachable P5 publish block and the misleading call arguments, or implement the decision-log declaration parse against the authenticated JSON-fence shape; keep the fail-closed 'no confirmed human exception source' behavior explicit rather than buried in dead code."},{"severity":"minor","path":"runtime/stage/stage-runner.mjs","line":4714,"issue":"runOfficialStage's options still declare `allowLegacyStageOutcome = false`, but its only consumer was removed in this diff: executePrivateAcceptance drops the legacyStageOutcome parameter and its branch (old lines 100-104) and the call site no longer passes authenticatedStageOutcome (new line 129). The option has no remaining reader anywhere in the diff and is dead, misleading API surface.","recommendation":"Remove allowLegacyStageOutcome from the runOfficialStage options (and update any callers), or explicitly document it as reserved-for-removal so no caller relies on legacy outcome injection that no longer exists."}]}}]}
```

## Public result and coverage

```json
{
  "semantic_status": "available",
  "coverage": "satisfied",
  "public_result": {
    "status": "available",
    "stage": "build-code",
    "material_id": "d668cdab96cf365623ae500eb3995ed9b8b8a058ea3075ebe1b751e11fb96d1c",
    "runtime_id": "ocr-host-ca982188-705c-4535-96dd-3a3f2c07a8ea",
    "outcome": "completed",
    "minimum_heterologous": 1,
    "provider_selection": {
      "providers": [
        "kimi/coding",
        "codex/luna"
      ],
      "provider_identities": {
        "kimi/coding": {
          "source_id": "kimi/coding",
          "config_id": "715d4c1363f6ba7ddc3a03734e40697fee487bc5f9ad1b9ab52f91934609c1e7"
        },
        "codex/luna": {
          "source_id": "codex/luna",
          "config_id": "4dc86dd0fed302488355af8011650e660a4b142e64ad66bff98b1dddeeb558f4"
        }
      },
      "eligible_profiles": [
        "kimi/coding",
        "codex/luna"
      ],
      "provider_models": {
        "kimi/coding": "kimi-for-coding/kimi-for-coding",
        "codex/luna": "gpt-6-luna"
      }
    },
    "provider_results": [
      {
        "provider": "kimi/coding",
        "status": "completed",
        "identity": {
          "provider": "kimi/coding",
          "adapter": "kimi",
          "source_id": "kimi/coding",
          "config_id": "715d4c1363f6ba7ddc3a03734e40697fee487bc5f9ad1b9ab52f91934609c1e7",
          "model": "kimi-for-coding/kimi-for-coding"
        },
        "error": null,
        "timing": {
          "started_at_ms": 1790528722201,
          "completed_at_ms": 1790529509811,
          "duration_ms": 787610
        },
        "usage": null,
        "findings": [
          {
            "provider": "kimi/coding",
            "severity": "major",
            "path": "evidence/test-summary.json",
            "line": 4,
            "issue": "The only test-execution evidence in the packet for P4/T006 is a single GREEN run (exit_code 0, ~2.1s). AC-18 requires a RED→GREEN record of the same test failing before the change and passing after, with failure scenario '只有 GREEN 无 RED 且无 G-2 豁免披露，即失败' (requirements/acceptance_criteria.md:1); the packet contains no RED artifact, no negative-control run for the T006 Action-⑤ requirement that forcing source_ids back to [] must fail and be persisted ('证据落盘', acceptance_criteria.md:30), and no G-2 exemption disclosure. AC-21 is also only partially met: raw_output_included is false and the referenced receipt/output bytes are absent from the packet, so the output location cannot be read back as AC-21's 度量 requires.",
            "recommendation": "Land the RED run record, the negative-control (source_ids=[]) failing run, and the restored GREEN run artifacts plus readable raw output into the packet evidence before claiming T006 Done, or record an explicit G-2 exemption disclosure; the claimed '先目标 RED 后 GREEN' and '证据落盘' in acceptance_criteria.md:53 are otherwise unverifiable.",
            "evidence_kind": "direct",
            "evidence": "\"exit_code\": 0,\n  \"suite_scope\": \"unspecified\",\n  \"coverage_classes\": [],",
            "root_cause": "T006 evidence capture recorded only the final passing vitest invocation; the pre-change failing run and the source_ids negative-control run were not persisted into the packet, and raw test output was excluded (raw_output_included=false), leaving AC-18/AC-21 acceptance criteria without their required artifacts."
          },
          {
            "provider": "kimi/coding",
            "severity": "minor",
            "path": "runtime/stage/stage-runner.mjs",
            "line": 4550,
            "issue": "p5HumanExceptionFromDecisionLog() declares no parameters and unconditionally returns null (lines 438-442), so publishP5SameRunSource always exits at `if (!exception) return` (line 509) and the entire P5 report write block below it (lines 510-600) is unreachable dead code. The call site passes (ctx, acceptanceChain) at line 508, which are silently ignored, implying a declaration-parse capability that does not exist, and the function does not attempt the `## 人工例外声明` JSON-fence shape that authenticateP5StageEndReport (S-0010) authenticates.",
            "recommendation": "Delete the unreachable P5 publish block and the misleading call arguments, or implement the decision-log declaration parse against the authenticated JSON-fence shape; keep the fail-closed 'no confirmed human exception source' behavior explicit rather than buried in dead code."
          },
          {
            "provider": "kimi/coding",
            "severity": "minor",
            "path": "runtime/stage/stage-runner.mjs",
            "line": 4714,
            "issue": "runOfficialStage's options still declare `allowLegacyStageOutcome = false`, but its only consumer was removed in this diff: executePrivateAcceptance drops the legacyStageOutcome parameter and its branch (old lines 100-104) and the call site no longer passes authenticatedStageOutcome (new line 129). The option has no remaining reader anywhere in the diff and is dead, misleading API surface.",
            "recommendation": "Remove allowLegacyStageOutcome from the runOfficialStage options (and update any callers), or explicitly document it as reserved-for-removal so no caller relies on legacy outcome injection that no longer exists."
          }
        ],
        "evidence_anchor_valid": [
          false,
          true,
          true
        ],
        "coverage": {
          "selected_files": [
            "change-map.json",
            "diff-index.json",
            "diff-shards/S-0009.md",
            "diff-shards/S-0010.md",
            "diff-shards/S-0011.md",
            "diff-shards/S-0012.md",
            "diff-shards/S-0013.md",
            "diff-shards/S-0014.md",
            "diff-shards/S-0015.md",
            "diff-shards/S-0016.md",
            "diff-shards/S-0017.md",
            "diff-shards/S-0018.md",
            "diff-shards/S-0019.md",
            "diff-shards/S-0038.md",
            "diff-shards/S-0039.md",
            "diff-shards/S-0040.md",
            "diff-shards/S-0041.md",
            "diff-shards/S-0042.md",
            "diff-shards/S-0043.md",
            "diff-shards/S-0044.md",
            "diff-shards/S-0045.md",
            "diff-shards/S-0046.md",
            "diff-shards/S-0047.md",
            "diff-shards/S-0048.md",
            "diff-shards/S-0049.md",
            "diff-shards/S-0050.md",
            "diff-shards/S-0051.md",
            "diff-shards/S-0052.md",
            "diff-shards/S-0053.md",
            "diff-shards/S-0054.md",
            "diff-shards/S-0055.md",
            "diff-shards/S-0056.md",
            "diff-shards/S-0057.md",
            "diff-shards/S-0058.md",
            "diff-shards/S-0059.md",
            "diff-shards/S-0060.md",
            "diff-shards/S-0061.md",
            "diff-shards/S-0062.md",
            "diff-shards/S-0063.md",
            "diff-shards/S-0064.md",
            "diff-shards/S-0065.md",
            "diff-shards/S-0066.md",
            "diff-shards/S-0067.md",
            "diff-shards/S-0068.md",
            "diff-shards/S-0069.md",
            "diff-shards/S-0070.md",
            "diff-shards/S-0071.md",
            "diff-shards/S-0072.md",
            "diff-shards/S-0073.md",
            "diff-shards/S-0074.md",
            "diff-shards/S-0075.md",
            "diff-shards/S-0076.md",
            "diff-shards/S-0077.md",
            "diff-shards/S-0078.md",
            "diff-shards/S-0079.md",
            "diff-shards/S-0080.md",
            "diff-shards/S-0081.md",
            "evidence/test-summary.json",
            "requirements/acceptance_criteria.md",
            "requirements/approved_spec.json",
            "requirements/test_evidence.json",
            "review-instructions.md",
            "source.json"
          ],
          "read_confirmed": false
        },
        "execution": {
          "adapter": "kimi",
          "model": "kimi-for-coding/kimi-for-coding",
          "timing": {
            "started_at_ms": 1790528722201,
            "completed_at_ms": 1790529509811,
            "duration_ms": 787610
          },
          "usage": null,
          "retry": {
            "count": 0,
            "progress_events": 96
          },
          "health": {
            "provider": "kimi/coding",
            "status": "completed",
            "liveness": false,
            "last_liveness_at_ms": 1790529509487,
            "last_output_at_ms": 1790529509487,
            "progress_events": 96,
            "stdout_bytes": 1060527,
            "stderr_bytes": 0
          },
          "runtime_id": "ocr-host-ca982188-705c-4535-96dd-3a3f2c07a8ea"
        }
      },
      {
        "provider": "codex/luna",
        "status": "completed",
        "identity": {
          "provider": "codex/luna",
          "adapter": "codex",
          "source_id": "codex/luna",
          "config_id": "4dc86dd0fed302488355af8011650e660a4b142e64ad66bff98b1dddeeb558f4",
          "model": "gpt-6-luna"
        },
        "error": null,
        "timing": {
          "started_at_ms": 1790528722203,
          "completed_at_ms": 1790529701784,
          "duration_ms": 979581
        },
        "usage": {
          "input_tokens": 7895992,
          "cached_input_tokens": 7528960,
          "cache_write_input_tokens": 0,
          "output_tokens": 49134,
          "reasoning_output_tokens": 44147
        },
        "findings": [
          {
            "provider": "codex/luna",
            "severity": "major",
            "path": "workflows/build-code/case-selection.mjs",
            "line": 112,
            "issue": "非 retired 的任意状态都会被当作可运行 case。status 缺失或为 unknown 的目录项，只要 change_triggers 命中，就会进入选择并执行。",
            "recommendation": "只选择 status === \"active\" 的 case；对缺失或不在 active/retired 白名单内的状态 fail closed。",
            "evidence_kind": "direct",
            "evidence": "`const matched = catalog.cases.filter((entry) => entry.status !== \"retired\"\n      && entry.change_triggers.includes(changed));`",
            "root_cause": "选择器把“不是 retired”当作“active”，没有校验业务 case 的状态白名单。"
          },
          {
            "provider": "codex/luna",
            "severity": "major",
            "path": "runtime/stage/stage-handlers.mjs",
            "line": 1771,
            "issue": "browser case 永远不能覆盖对应 AC：即使浏览器执行和 UI QA projection 都通过，passed 条件仍排除 browser，AC 覆盖会留在 unknown，导致真实浏览器验收无法形成逐 AC 通过事实。",
            "recommendation": "将已认证且按唯一 AC、ref/hash 绑定的 UI QA projection 接入逐 AC 覆盖判定；缺失或不匹配时继续保持 unknown。",
            "evidence_kind": "direct",
            "evidence": "`const passed = item.tier !== \"browser\" && item.status !== \"unavailable\"\n          && own.length === 1 && own[0].value.status === \"passed\";`",
            "root_cause": "acceptanceCoverageForExecution 对所有 browser tier 无条件判定 passed=false，且没有消费后续构建的 ui_qa_projection。"
          },
          {
            "provider": "codex/luna",
            "severity": "major",
            "path": "workflows/build-code/targeted-runner.mjs",
            "line": 54,
            "issue": "固定 capture 路径启用 WORKFLOWHUB_TARGETED_INHERIT_GROUP=1 后，detached 为 false；超时、取消或输出超限时只杀直接测试进程。测试派生的子进程可能继续运行并修改工作树，而本次 capture 已返回失败。",
            "recommendation": "为每个目标进程建立可单独终止的进程组，并让内部超时、取消、输出超限及外层超时都终止整个目标进程树。",
            "evidence_kind": "inferred",
            "evidence": "`try { child.kill(\"SIGKILL\"); } catch { /* already exited */ }`",
            "root_cause": "固定运行模式禁用 detached 进程组，而 kill handler 在该模式下只调用 child.kill。"
          }
        ],
        "evidence_anchor_valid": [
          false,
          false,
          false
        ],
        "coverage": {
          "selected_files": [
            "change-map.json",
            "diff-index.json",
            "diff-shards/S-0009.md",
            "diff-shards/S-0010.md",
            "diff-shards/S-0011.md",
            "diff-shards/S-0012.md",
            "diff-shards/S-0013.md",
            "diff-shards/S-0014.md",
            "diff-shards/S-0015.md",
            "diff-shards/S-0016.md",
            "diff-shards/S-0017.md",
            "diff-shards/S-0018.md",
            "diff-shards/S-0019.md",
            "diff-shards/S-0038.md",
            "diff-shards/S-0039.md",
            "diff-shards/S-0040.md",
            "diff-shards/S-0041.md",
            "diff-shards/S-0042.md",
            "diff-shards/S-0043.md",
            "diff-shards/S-0044.md",
            "diff-shards/S-0045.md",
            "diff-shards/S-0046.md",
            "diff-shards/S-0047.md",
            "diff-shards/S-0048.md",
            "diff-shards/S-0049.md",
            "diff-shards/S-0050.md",
            "diff-shards/S-0051.md",
            "diff-shards/S-0052.md",
            "diff-shards/S-0053.md",
            "diff-shards/S-0054.md",
            "diff-shards/S-0055.md",
            "diff-shards/S-0056.md",
            "diff-shards/S-0057.md",
            "diff-shards/S-0058.md",
            "diff-shards/S-0059.md",
            "diff-shards/S-0060.md",
            "diff-shards/S-0061.md",
            "diff-shards/S-0062.md",
            "diff-shards/S-0063.md",
            "diff-shards/S-0064.md",
            "diff-shards/S-0065.md",
            "diff-shards/S-0066.md",
            "diff-shards/S-0067.md",
            "diff-shards/S-0068.md",
            "diff-shards/S-0069.md",
            "diff-shards/S-0070.md",
            "diff-shards/S-0071.md",
            "diff-shards/S-0072.md",
            "diff-shards/S-0073.md",
            "diff-shards/S-0074.md",
            "diff-shards/S-0075.md",
            "diff-shards/S-0076.md",
            "diff-shards/S-0077.md",
            "diff-shards/S-0078.md",
            "diff-shards/S-0079.md",
            "diff-shards/S-0080.md",
            "diff-shards/S-0081.md",
            "evidence/test-summary.json",
            "requirements/acceptance_criteria.md",
            "requirements/approved_spec.json",
            "requirements/test_evidence.json",
            "review-instructions.md",
            "source.json"
          ],
          "read_confirmed": false
        },
        "execution": {
          "adapter": "codex",
          "model": "gpt-6-luna",
          "timing": {
            "started_at_ms": 1790528722203,
            "completed_at_ms": 1790529701784,
            "duration_ms": 979581
          },
          "usage": {
            "input_tokens": 7895992,
            "cached_input_tokens": 7528960,
            "cache_write_input_tokens": 0,
            "output_tokens": 49134,
            "reasoning_output_tokens": 44147
          },
          "retry": {
            "count": 0,
            "progress_events": 254
          },
          "health": {
            "provider": "codex/luna",
            "status": "completed",
            "liveness": false,
            "last_liveness_at_ms": 1790529697390,
            "last_output_at_ms": 1790529682082,
            "progress_events": 254,
            "stdout_bytes": 1651040,
            "stderr_bytes": 3577
          },
          "runtime_id": "ocr-host-ca982188-705c-4535-96dd-3a3f2c07a8ea"
        }
      }
    ],
    "findings": [
      {
        "provider": "kimi/coding",
        "severity": "major",
        "path": "evidence/test-summary.json",
        "line": 4,
        "issue": "The only test-execution evidence in the packet for P4/T006 is a single GREEN run (exit_code 0, ~2.1s). AC-18 requires a RED→GREEN record of the same test failing before the change and passing after, with failure scenario '只有 GREEN 无 RED 且无 G-2 豁免披露，即失败' (requirements/acceptance_criteria.md:1); the packet contains no RED artifact, no negative-control run for the T006 Action-⑤ requirement that forcing source_ids back to [] must fail and be persisted ('证据落盘', acceptance_criteria.md:30), and no G-2 exemption disclosure. AC-21 is also only partially met: raw_output_included is false and the referenced receipt/output bytes are absent from the packet, so the output location cannot be read back as AC-21's 度量 requires.",
        "recommendation": "Land the RED run record, the negative-control (source_ids=[]) failing run, and the restored GREEN run artifacts plus readable raw output into the packet evidence before claiming T006 Done, or record an explicit G-2 exemption disclosure; the claimed '先目标 RED 后 GREEN' and '证据落盘' in acceptance_criteria.md:53 are otherwise unverifiable.",
        "evidence_kind": "direct",
        "evidence": "\"exit_code\": 0,\n  \"suite_scope\": \"unspecified\",\n  \"coverage_classes\": [],",
        "root_cause": "T006 evidence capture recorded only the final passing vitest invocation; the pre-change failing run and the source_ids negative-control run were not persisted into the packet, and raw test output was excluded (raw_output_included=false), leaving AC-18/AC-21 acceptance criteria without their required artifacts."
      },
      {
        "provider": "kimi/coding",
        "severity": "minor",
        "path": "runtime/stage/stage-runner.mjs",
        "line": 4550,
        "issue": "p5HumanExceptionFromDecisionLog() declares no parameters and unconditionally returns null (lines 438-442), so publishP5SameRunSource always exits at `if (!exception) return` (line 509) and the entire P5 report write block below it (lines 510-600) is unreachable dead code. The call site passes (ctx, acceptanceChain) at line 508, which are silently ignored, implying a declaration-parse capability that does not exist, and the function does not attempt the `## 人工例外声明` JSON-fence shape that authenticateP5StageEndReport (S-0010) authenticates.",
        "recommendation": "Delete the unreachable P5 publish block and the misleading call arguments, or implement the decision-log declaration parse against the authenticated JSON-fence shape; keep the fail-closed 'no confirmed human exception source' behavior explicit rather than buried in dead code."
      },
      {
        "provider": "kimi/coding",
        "severity": "minor",
        "path": "runtime/stage/stage-runner.mjs",
        "line": 4714,
        "issue": "runOfficialStage's options still declare `allowLegacyStageOutcome = false`, but its only consumer was removed in this diff: executePrivateAcceptance drops the legacyStageOutcome parameter and its branch (old lines 100-104) and the call site no longer passes authenticatedStageOutcome (new line 129). The option has no remaining reader anywhere in the diff and is dead, misleading API surface.",
        "recommendation": "Remove allowLegacyStageOutcome from the runOfficialStage options (and update any callers), or explicitly document it as reserved-for-removal so no caller relies on legacy outcome injection that no longer exists."
      },
      {
        "provider": "codex/luna",
        "severity": "major",
        "path": "workflows/build-code/case-selection.mjs",
        "line": 112,
        "issue": "非 retired 的任意状态都会被当作可运行 case。status 缺失或为 unknown 的目录项，只要 change_triggers 命中，就会进入选择并执行。",
        "recommendation": "只选择 status === \"active\" 的 case；对缺失或不在 active/retired 白名单内的状态 fail closed。",
        "evidence_kind": "direct",
        "evidence": "`const matched = catalog.cases.filter((entry) => entry.status !== \"retired\"\n      && entry.change_triggers.includes(changed));`",
        "root_cause": "选择器把“不是 retired”当作“active”，没有校验业务 case 的状态白名单。"
      },
      {
        "provider": "codex/luna",
        "severity": "major",
        "path": "runtime/stage/stage-handlers.mjs",
        "line": 1771,
        "issue": "browser case 永远不能覆盖对应 AC：即使浏览器执行和 UI QA projection 都通过，passed 条件仍排除 browser，AC 覆盖会留在 unknown，导致真实浏览器验收无法形成逐 AC 通过事实。",
        "recommendation": "将已认证且按唯一 AC、ref/hash 绑定的 UI QA projection 接入逐 AC 覆盖判定；缺失或不匹配时继续保持 unknown。",
        "evidence_kind": "direct",
        "evidence": "`const passed = item.tier !== \"browser\" && item.status !== \"unavailable\"\n          && own.length === 1 && own[0].value.status === \"passed\";`",
        "root_cause": "acceptanceCoverageForExecution 对所有 browser tier 无条件判定 passed=false，且没有消费后续构建的 ui_qa_projection。"
      },
      {
        "provider": "codex/luna",
        "severity": "major",
        "path": "workflows/build-code/targeted-runner.mjs",
        "line": 54,
        "issue": "固定 capture 路径启用 WORKFLOWHUB_TARGETED_INHERIT_GROUP=1 后，detached 为 false；超时、取消或输出超限时只杀直接测试进程。测试派生的子进程可能继续运行并修改工作树，而本次 capture 已返回失败。",
        "recommendation": "为每个目标进程建立可单独终止的进程组，并让内部超时、取消、输出超限及外层超时都终止整个目标进程树。",
        "evidence_kind": "inferred",
        "evidence": "`try { child.kill(\"SIGKILL\"); } catch { /* already exited */ }`",
        "root_cause": "固定运行模式禁用 detached 进程组，而 kill handler 在该模式下只调用 child.kill。"
      }
    ],
    "dispatch_state": "dispatched",
    "ocr": {
      "version": "open-code-review v1.12.9 (bccbc15) darwin/arm64\nbuilt at: 2026-09-22T11:06:38Z\nhttp<host-path-redacted>",
      "preview": {
        "schema_version": "1",
        "mode": "commit",
        "repository": "<host-path-redacted>",
        "commit": "HEAD",
        "background": "WorkflowHub OCR candidate packet",
        "total_files": 63,
        "reviewable_count": 63,
        "excluded_count": 0,
        "total_insertions": 13159,
        "total_deletions": 0,
        "reviewable_files": [
          {
            "path": "change-map.json",
            "status": "added",
            "insertions": 1,
            "deletions": 0
          },
          {
            "path": "diff-index.json",
            "status": "added",
            "insertions": 1,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0009.md",
            "status": "added",
            "insertions": 26,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0010.md",
            "status": "added",
            "insertions": 368,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0011.md",
            "status": "added",
            "insertions": 27,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0012.md",
            "status": "added",
            "insertions": 151,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0013.md",
            "status": "added",
            "insertions": 251,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0014.md",
            "status": "added",
            "insertions": 22,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0015.md",
            "status": "added",
            "insertions": 335,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0016.md",
            "status": "added",
            "insertions": 439,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0017.md",
            "status": "added",
            "insertions": 347,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0018.md",
            "status": "added",
            "insertions": 640,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0019.md",
            "status": "added",
            "insertions": 181,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0038.md",
            "status": "added",
            "insertions": 491,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0039.md",
            "status": "added",
            "insertions": 302,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0040.md",
            "status": "added",
            "insertions": 628,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0041.md",
            "status": "added",
            "insertions": 243,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0042.md",
            "status": "added",
            "insertions": 161,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0043.md",
            "status": "added",
            "insertions": 178,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0044.md",
            "status": "added",
            "insertions": 613,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0045.md",
            "status": "added",
            "insertions": 115,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0046.md",
            "status": "added",
            "insertions": 140,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0047.md",
            "status": "added",
            "insertions": 159,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0048.md",
            "status": "added",
            "insertions": 196,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0049.md",
            "status": "added",
            "insertions": 188,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0050.md",
            "status": "added",
            "insertions": 687,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0051.md",
            "status": "added",
            "insertions": 229,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0052.md",
            "status": "added",
            "insertions": 125,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0053.md",
            "status": "added",
            "insertions": 109,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0054.md",
            "status": "added",
            "insertions": 78,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0055.md",
            "status": "added",
            "insertions": 182,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0056.md",
            "status": "added",
            "insertions": 517,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0057.md",
            "status": "added",
            "insertions": 137,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0058.md",
            "status": "added",
            "insertions": 84,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0059.md",
            "status": "added",
            "insertions": 18,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0060.md",
            "status": "added",
            "insertions": 117,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0061.md",
            "status": "added",
            "insertions": 18,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0062.md",
            "status": "added",
            "insertions": 42,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0063.md",
            "status": "added",
            "insertions": 629,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0064.md",
            "status": "added",
            "insertions": 284,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0065.md",
            "status": "added",
            "insertions": 110,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0066.md",
            "status": "added",
            "insertions": 271,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0067.md",
            "status": "added",
            "insertions": 46,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0068.md",
            "status": "added",
            "insertions": 633,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0069.md",
            "status": "added",
            "insertions": 41,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0070.md",
            "status": "added",
            "insertions": 23,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0071.md",
            "status": "added",
            "insertions": 19,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0072.md",
            "status": "added",
            "insertions": 49,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0073.md",
            "status": "added",
            "insertions": 392,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0074.md",
            "status": "added",
            "insertions": 580,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0075.md",
            "status": "added",
            "insertions": 167,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0076.md",
            "status": "added",
            "insertions": 200,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0077.md",
            "status": "added",
            "insertions": 267,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0078.md",
            "status": "added",
            "insertions": 255,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0079.md",
            "status": "added",
            "insertions": 287,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0080.md",
            "status": "added",
            "insertions": 27,
            "deletions": 0
          },
          {
            "path": "diff-shards/S-0081.md",
            "status": "added",
            "insertions": 59,
            "deletions": 0
          },
          {
            "path": "evidence/test-summary.json",
            "status": "added",
            "insertions": 14,
            "deletions": 0
          },
          {
            "path": "requirements/acceptance_criteria.md",
            "status": "added",
            "insertions": 250,
            "deletions": 0
          },
          {
            "path": "requirements/approved_spec.json",
            "status": "added",
            "insertions": 1,
            "deletions": 0
          },
          {
            "path": "requirements/test_evidence.json",
            "status": "added",
            "insertions": 1,
            "deletions": 0
          },
          {
            "path": "review-instructions.md",
            "status": "added",
            "insertions": 7,
            "deletions": 0
          },
          {
            "path": "source.json",
            "status": "added",
            "insertions": 1,
            "deletions": 0
          }
        ],
        "excluded_files": []
      },
      "rules": {
        "schema_version": "1",
        "groups": [
          {
            "group_id": 1,
            "source": "custom",
            "pattern": "**/*.json",
            "files": [
              "change-map.json",
              "diff-index.json",
              "evidence/test-summary.json",
              "requirements/approved_spec.json",
              "requirements/test_evidence.json",
              "source.json"
            ],
            "rule": "Review schema, identity, provenance and failure semantics; report only evidence-backed issues."
          },
          {
            "group_id": 2,
            "source": "custom",
            "pattern": "**/*.md",
            "files": [
              "diff-shards/S-0009.md",
              "diff-shards/S-0010.md",
              "diff-shards/S-0011.md",
              "diff-shards/S-0012.md",
              "diff-shards/S-0013.md",
              "diff-shards/S-0014.md",
              "diff-shards/S-0015.md",
              "diff-shards/S-0016.md",
              "diff-shards/S-0017.md",
              "diff-shards/S-0018.md",
              "diff-shards/S-0019.md",
              "diff-shards/S-0038.md",
              "diff-shards/S-0039.md",
              "diff-shards/S-0040.md",
              "diff-shards/S-0041.md",
              "diff-shards/S-0042.md",
              "diff-shards/S-0043.md",
              "diff-shards/S-0044.md",
              "diff-shards/S-0045.md",
              "diff-shards/S-0046.md",
              "diff-shards/S-0047.md",
              "diff-shards/S-0048.md",
              "diff-shards/S-0049.md",
              "diff-shards/S-0050.md",
              "diff-shards/S-0051.md",
              "diff-shards/S-0052.md",
              "diff-shards/S-0053.md",
              "diff-shards/S-0054.md",
              "diff-shards/S-0055.md",
              "diff-shards/S-0056.md",
              "diff-shards/S-0057.md",
              "diff-shards/S-0058.md",
              "diff-shards/S-0059.md",
              "diff-shards/S-0060.md",
              "diff-shards/S-0061.md",
              "diff-shards/S-0062.md",
              "diff-shards/S-0063.md",
              "diff-shards/S-0064.md",
              "diff-shards/S-0065.md",
              "diff-shards/S-0066.md",
              "diff-shards/S-0067.md",
              "diff-shards/S-0068.md",
              "diff-shards/S-0069.md",
              "diff-shards/S-0070.md",
              "diff-shards/S-0071.md",
              "diff-shards/S-0072.md",
              "diff-shards/S-0073.md",
              "diff-shards/S-0074.md",
              "diff-shards/S-0075.md",
              "diff-shards/S-0076.md",
              "diff-shards/S-0077.md",
              "diff-shards/S-0078.md",
              "diff-shards/S-0079.md",
              "diff-shards/S-0080.md",
              "diff-shards/S-0081.md",
              "requirements/acceptance_criteria.md",
              "review-instructions.md"
            ],
            "rule": "Review requirements, contracts, diffs, lifecycle and failure boundaries; report only evidence-backed issues."
          }
        ]
      },
      "manifest": [
        {
          "path": ".git/COMMIT_EDITMSG",
          "bytes": 33,
          "sha256": "32992faeeb7bbc66ab1f17b9fafa4ccb47a72e559e5333ff8eac62149907b700"
        },
        {
          "path": ".git/config",
          "bytes": 137,
          "sha256": "cae33efdb02cf774435c1ff9cb16bcc1014606908530c6e1dc727615fe3e8cda"
        },
        {
          "path": ".git/description",
          "bytes": 73,
          "sha256": "85ab6c163d43a17ea9cf7788308bca1466f1b0a8d1cc92e26e9bf63da4062aee"
        },
        {
          "path": ".git/HEAD",
          "bytes": 21,
          "sha256": "28d25bf82af4c0e2b72f50959b2beb859e3e60b9630a5e8c603dad4ddb2b6e80"
        },
        {
          "path": ".git/hooks/applypatch-msg.sample",
          "bytes": 478,
          "sha256": "0223497a0b8b033aa58a3a521b8629869386cf7ab0e2f101963d328aa62193f7"
        },
        {
          "path": ".git/hooks/commit-msg.sample",
          "bytes": 896,
          "sha256": "1f74d5e9292979b573ebd59741d46cb93ff391acdd083d340b94370753d92437"
        },
        {
          "path": ".git/hooks/fsmonitor-watchman.sample",
          "bytes": 4726,
          "sha256": "e0549964e93897b519bd8e333c037e51fff0f88ba13e086a331592bf801fa1d0"
        },
        {
          "path": ".git/hooks/post-update.sample",
          "bytes": 189,
          "sha256": "81765af2daef323061dcbc5e61fc16481cb74b3bac9ad8a174b186523586f6c5"
        },
        {
          "path": ".git/hooks/pre-applypatch.sample",
          "bytes": 424,
          "sha256": "e15c5b469ea3e0a695bea6f2c82bcf8e62821074939ddd85b77e0007ff165475"
        },
        {
          "path": ".git/hooks/pre-commit.sample",
          "bytes": 1643,
          "sha256": "f9af7d95eb1231ecf2eba9770fedfa8d4797a12b02d7240e98d568201251244a"
        },
        {
          "path": ".git/hooks/pre-merge-commit.sample",
          "bytes": 416,
          "sha256": "d3825a70337940ebbd0a5c072984e13245920cdf8898bd225c8d27a6dfc9cb53"
        },
        {
          "path": ".git/hooks/pre-push.sample",
          "bytes": 1374,
          "sha256": "ecce9c7e04d3f5dd9d8ada81753dd1d549a9634b26770042b58dda00217d086a"
        },
        {
          "path": ".git/hooks/pre-rebase.sample",
          "bytes": 4898,
          "sha256": "4febce867790052338076f4e66cc47efb14879d18097d1d61c8261859eaaa7b3"
        },
        {
          "path": ".git/hooks/pre-receive.sample",
          "bytes": 544,
          "sha256": "a4c3d2b9c7bb3fd8d1441c31bd4ee71a595d66b44fcf49ddb310252320169989"
        },
        {
          "path": ".git/hooks/prepare-commit-msg.sample",
          "bytes": 1492,
          "sha256": "e9ddcaa4189fddd25ed97fc8c789eca7b6ca16390b2392ae3276f0c8e1aa4619"
        },
        {
          "path": ".git/hooks/push-to-checkout.sample",
          "bytes": 2783,
          "sha256": "a53d0741798b287c6dd7afa64aee473f305e65d3f49463bb9d7408ec3b12bf5f"
        },
        {
          "path": ".git/hooks/update.sample",
          "bytes": 3650,
          "sha256": "8d5f2fa83e103cf08b57eaa67521df9194f45cbdbcb37da52ad586097a14d106"
        },
        {
          "path": ".git/index",
          "bytes": 5733,
          "sha256": "a1f98db784b0868536b451c3367cf39c67248537d686f9ef75cb70a55062ffb7"
        },
        {
          "path": ".git/info/exclude",
          "bytes": 240,
          "sha256": "6671fe83b7a07c8932ee89164d1f2793b2318058eb8b98dc5c06ee0a5a3b0ec1"
        },
        {
          "path": ".git/logs/HEAD",
          "bytes": 182,
          "sha256": "3e093c5991ba8c0868fd7926bb2dcb77f8ad406f49263b0ad7558db3ebcc1b68"
        },
        {
          "path": ".git/logs/refs/heads/main",
          "bytes": 182,
          "sha256": "3e093c5991ba8c0868fd7926bb2dcb77f8ad406f49263b0ad7558db3ebcc1b68"
        },
        {
          "path": ".git/objects/07/7cbc11914930761fbd05ba58e83fed90fe3f7f",
          "bytes": 10086,
          "sha256": "4f3c9c55f54a946dbdfb48e811a199ebe547ba7e0ae2acda90d70088a9bbf954"
        },
        {
          "path": ".git/objects/17/5b841fd5f48c5dce406aca8eca9bb4c5a6f52d",
          "bytes": 1575,
          "sha256": "6be89b291b7a8fbb7ab486301ebcbe8edd0949e51e73097e5dede13d79d89e7d"
        },
        {
          "path": ".git/objects/18/8a3fd254776e1019decb07da0e7dd4bab8cfd7",
          "bytes": 7442,
          "sha256": "12099680e98f7d584181e6769c4832f9250dd654ac1c70058849eeae64c726f3"
        },
        {
          "path": ".git/objects/1b/904e0d2b38d0d26d2b63f6eda220d2f282af00",
          "bytes": 11443,
          "sha256": "2a72815b9bde9bb1de7ec1884596036eab13ee4dc093eb3aa2f904d2e2c7e095"
        },
        {
          "path": ".git/objects/22/21bacac415c7554f10c693c0aaa760add20d58",
          "bytes": 798,
          "sha256": "1dfccc4ca94d809b0fb4a18c817faf28700a831caa892dca037c8220baa9fe71"
        },
        {
          "path": ".git/objects/28/00eb97e79b3b5e207b220fcdeb0ec7e94aa364",
          "bytes": 10570,
          "sha256": "ef0b3fc29a19ff7925a651c6a0a1634b8856c837e0a363e4af8e083bee2cbc9d"
        },
        {
          "path": ".git/objects/30/42632593cd9aaacb86ca1cda24a449ef322586",
          "bytes": 2783,
          "sha256": "0ebf39919831025640863d6ca38962465ee3eff3bf6e4ed048d79d442649b3c6"
        },
        {
          "path": ".git/objects/30/acf0927081ee730c3b0cd53993c99ac85dcac3",
          "bytes": 2490,
          "sha256": "25857916fe6f7f96e2084323b4508d99fcd0928da0792e7647d42406ba164ba1"
        },
        {
          "path": ".git/objects/34/c9f39ad5bb039f51140c173fe12d8210a69d90",
          "bytes": 1004,
          "sha256": "e709e0d99a202214fc58a4d1819d4e4b8db85052ae29f5af141de82d0b4ffb09"
        },
        {
          "path": ".git/objects/37/7022323307e7d912fa10d68e24e6022622a746",
          "bytes": 5149,
          "sha256": "bf5297d93c7a823d94eb14cca75aca416c968b9846b07b128d6b7b3792c3f2e1"
        },
        {
          "path": ".git/objects/37/ce94643da932578d4c9051be676e241d935921",
          "bytes": 426,
          "sha256": "15f2b12e9d6ff22b79720487f6ce442feb98d98569e80d390adc315d5269ab14"
        },
        {
          "path": ".git/objects/38/04a617066e542a36393d04bdb989bf8cc56eeb",
          "bytes": 8329,
          "sha256": "36f066fa436dcffb27413478a16def7f566e12ee5f8a065c02a3995a8bf9683a"
        },
        {
          "path": ".git/objects/38/ff706e15718fca50bc5014124158b3a686fc7c",
          "bytes": 3267,
          "sha256": "b215ea9b3abc60f3830c734466d29616b483d0f5c59e42573219b2284f7fe622"
        },
        {
          "path": ".git/objects/3b/fafd69ab196d1b921086633f18741f88a1ad53",
          "bytes": 1367,
          "sha256": "f2201c055eaf510e072726ac393eb23c7198bd93edbc9a3f62994b8579233ad2"
        },
        {
          "path": ".git/objects/3f/bde1d1286bd50891ecc04cedc916dc91569908",
          "bytes": 3701,
          "sha256": "3c96867fffbaf3259af96c65cc4e0e07dce44cee5ab62020d252b8eb2d2f24b0"
        },
        {
          "path": ".git/objects/41/ca550f9912b9cd5ce69a3fcef63ebb674e4452",
          "bytes": 1407,
          "sha256": "13bb0e056d0a3220c162c21ca370aebc73a3328ab7f1bf92beb7cabb67a42fab"
        },
        {
          "path": ".git/objects/42/250ba7bad639c476b29cbc4d6b50907668d8d9",
          "bytes": 2710,
          "sha256": "ce849e3258f4f160e5e4a398fa327bac5e8abdf92117b4a048e5d0a57f89e985"
        },
        {
          "path": ".git/objects/4f/fa3ca8638c9b6f47e31454b5d0c86ec7cb5149",
          "bytes": 4280,
          "sha256": "358096b3ac35f21a9344be9c88e4b2b2fa2455ee7d547c3d3e70988c93eb1920"
        },
        {
          "path": ".git/objects/51/9441d43bd21b70dd11a37bebb0cd08f0a6fb40",
          "bytes": 2632,
          "sha256": "7e5c0de125109f0e9772d903e98896d56ee14f961a8be09495c9cb22101fd7e5"
        },
        {
          "path": ".git/objects/53/14186e3681645a925e49defa8d66ae4f7ecb43",
          "bytes": 3267,
          "sha256": "1e97414c923282a5e8ef7d730c64bb036edc2e6f73138df72758e7eb7ccd34cf"
        },
        {
          "path": ".git/objects/56/1d565cc893b2eb7ebc23df44ef6aad16137f5e",
          "bytes": 275,
          "sha256": "b7a6ed2e5e41c5340b586f60664aad8517bb02d2b30f8d5382d44fbe18993512"
        },
        {
          "path": ".git/objects/5b/2171708eb68d6564fe6abe1a866caa8e057902",
          "bytes": 140,
          "sha256": "6cb0a4288b841a8c9efcee341688e05b7abf8998f1323617e2a0d37965c933a9"
        },
        {
          "path": ".git/objects/5b/2a31ce3005f988b7f1281b74b0b4b21478df25",
          "bytes": 5234,
          "sha256": "4bb69455c05ed91792543060f4d8c9316e09ee6a81a60e035a3b87e8b07ddf9c"
        },
        {
          "path": ".git/objects/5c/a429a25c1bd430ee7befe2317cd7dda951d897",
          "bytes": 5255,
          "sha256": "37a9b5395ee1cae203fc8cf3868b060dc64c45888c6587d77dec02a3fdc7a1a5"
        },
        {
          "path": ".git/objects/61/e295f63a5bc21682c156e37b73e1e158817ac1",
          "bytes": 631,
          "sha256": "066bc77e252a08b2b0a344cc02500b31f66da65474907980dd832e412f6480c6"
        },
        {
          "path": ".git/objects/63/b5fddfb792497951c4abaabdfd70316500a842",
          "bytes": 12698,
          "sha256": "99fb02bd24dd4f977b6c28c7d3d667f0a8ead32e82cf82eff82ec9b71541bfbc"
        },
        {
          "path": ".git/objects/64/d0e849891f16bab09916ab1e2c8ec8c97f58ca",
          "bytes": 2546,
          "sha256": "ab9b5a317b502db0da6a95c74410633756cccd1b38930bd1952558ba63f749a8"
        },
        {
          "path": ".git/objects/66/0455d4fca94cefc5c24d29da297d2c11d1b695",
          "bytes": 166,
          "sha256": "c2a49550e8d35794afc591e03497367860d4713a279f9532bc282c9fca3328fc"
        },
        {
          "path": ".git/objects/68/2d36bac17f7d3a0d680d7f6946d5f4e5b64ff1",
          "bytes": 4858,
          "sha256": "5dd1d501aa0067a020138a7d854875df30a549016c86b97361790c6398d6d38a"
        },
        {
          "path": ".git/objects/68/b36cf4d8f305ecefc7f92c5b2f250c887b44d9",
          "bytes": 569,
          "sha256": "5a1adcc5eb14e56107bcfa8e053e3ba98d0588424cb003f2f53c11a87e16ce3c"
        },
        {
          "path": ".git/objects/6e/9384a3cd9a54a4004b0367d12bde4359f01178",
          "bytes": 5993,
          "sha256": "c76c238c9683a86116ef7132726eedb3fed62a548d5d90ef7813dfb50b1ec14e"
        },
        {
          "path": ".git/objects/72/29467b40eb36419b6c513d1b402d66b1ed4738",
          "bytes": 3280,
          "sha256": "465920f783ea874011ab85732e3ab83f830968ff8d96667271cde27d7f3d7d5d"
        },
        {
          "path": ".git/objects/73/93bfc0fc7292423a01f3702e275a3053a237c5",
          "bytes": 8335,
          "sha256": "52963ab7a4e5b6c1dbb2f4424822181bd31481c8d8e9aa1ac2275dd5f37dcad6"
        },
        {
          "path": ".git/objects/74/6717a8b0665890724e3b8850d7335b44259bec",
          "bytes": 2323,
          "sha256": "9d04460216f57a9e2ab1cd7964d7dbb9611ae3179fede9d8dc855c44465c34ff"
        },
        {
          "path": ".git/objects/76/716146dc1405c5fcd605503d11f1679b458da4",
          "bytes": 3354,
          "sha256": "951f523515db02abeb3384921f4edfba16867cc61a015d75fa256db58a72d62b"
        },
        {
          "path": ".git/objects/82/7837f1faa166b363ac8b3140bc76b96fe98517",
          "bytes": 13090,
          "sha256": "7f956282f46d1f5d1dabb54c9a660c3de38ae838a166c17ad24bd999c2f7b804"
        },
        {
          "path": ".git/objects/85/793b02ba9bb9832eaf10e4b174665f7d2f3a28",
          "bytes": 7085,
          "sha256": "9bde77c3389b7f861128a94dd01663c826a929a996e848de0234feef2b5b689a"
        },
        {
          "path": ".git/objects/8c/6fdd4565cb7bc6ac1d913665c29e2164d29423",
          "bytes": 11851,
          "sha256": "c6f465ed630d2ee789854cdff7e2292c58f6946358f8504f8dc6d9aa27e39e99"
        },
        {
          "path": ".git/objects/8f/545a5e980c9e152537b896e1aa5d1ea9d6adee",
          "bytes": 1821,
          "sha256": "e2df4c6f74a22668d4893a96a0ea74ca77ee157f6f1c254551b2322efaf06d7e"
        },
        {
          "path": ".git/objects/8f/ba0080378f4f03766703ce4186a90f027242d4",
          "bytes": 559,
          "sha256": "f785dc5c027219cce15b3bf8b6da6a8e3be14ca6fba403f13460a9a3c6992541"
        },
        {
          "path": ".git/objects/94/6233e70ad32cc32ddc754cd30548d04d1f8782",
          "bytes": 1496,
          "sha256": "c252e3d45e2645e6980725bd46b5078a8e4bc8760fe1c3aaf2487592902ed11a"
        },
        {
          "path": ".git/objects/96/5a3f2a7ae904caa879824a7cdc0966bec2757e",
          "bytes": 3132,
          "sha256": "78187b6a088ee9728e7ef0d1475cd1bc589673bae13921a87f7df406d20166da"
        },
        {
          "path": ".git/objects/9b/c3696500ffc3b48d447f2a8995a7df46ad1f05",
          "bytes": 1045,
          "sha256": "5678b441de617dd72f4f79ef16399860831c36aa0ee9720a6a0ef66630eecd4b"
        },
        {
          "path": ".git/objects/9c/373ee36fc7f7489cf6dc8355c9ad3c4ef9bc82",
          "bytes": 146,
          "sha256": "183be3dbce760422b9c105fdcbf48a13fdb6c8ccbd8aabe41840f9b8d6ae51f7"
        },
        {
          "path": ".git/objects/9e/67b64e82bf41e88c65c769105f266de560de8c",
          "bytes": 1550,
          "sha256": "0ede08e69ab267b20ccbfd70c7c1d8378bf421534e887ac464578f6f3700fbb8"
        },
        {
          "path": ".git/objects/9e/ae53893f5a3921f597cb8efd30b63db1447ab3",
          "bytes": 2411,
          "sha256": "fc015ac19c0ae631558c033b868fe0017db4c787faf289fdc6cbd43927ddc62c"
        },
        {
          "path": ".git/objects/a3/fd883a10e0cf529954b249c9f627ac7164dce0",
          "bytes": 13615,
          "sha256": "ff25d3a1b54b2bac1ffaba939eec806ab7fc2c19e27b25a3432c4b2d832830c2"
        },
        {
          "path": ".git/objects/a5/b8590aa7e984f59343917ea342bbf4df2abb59",
          "bytes": 2201,
          "sha256": "de40c10bf21d9700730c94df2dcc52536f289eeb2cf7659f59dbfa20b4290aef"
        },
        {
          "path": ".git/objects/a5/db8248f1a8bb54b3eb89acd905ed2fd60e64fe",
          "bytes": 930,
          "sha256": "5987fc9a9b31b4266aad444c7ae4d4c3a1452b61a9bd475acf37b038ecccce1c"
        },
        {
          "path": ".git/objects/aa/d337e452df737a755af62eb4f2210b030e72fc",
          "bytes": 11632,
          "sha256": "c97574d109f0174faf77fe100f56d2c7eebe97a241e50a740e0c836798f2a43b"
        },
        {
          "path": ".git/objects/ad/fe1b3fd6723f71a93e39a77ccf041007762ecb",
          "bytes": 721,
          "sha256": "21fa65de76c4cae4fcfea4702bf75b8678c2ceca283d85a589484b18c3d07444"
        },
        {
          "path": ".git/objects/b3/022342512d2ae7dc0626c972165c5ab1206392",
          "bytes": 495,
          "sha256": "2d597656d8e7b42b8ba161adf5cd3217b164c4f08d71dedb7bf1b2dee93f910a"
        },
        {
          "path": ".git/objects/ba/fcf2bc3eec71a78d49beade9bc57a792eb4a8c",
          "bytes": 158,
          "sha256": "2e6670d664916dfce44bc34f3a3ae5dd3ca3a44cf7afba9ebaff3303c7555b64"
        },
        {
          "path": ".git/objects/bd/e70f560c7dcdfefbc54a053bc9e0b3e919c472",
          "bytes": 3351,
          "sha256": "1ecbe97b42e2cc9010b1a06d2d7c5a29816295235c37c063aeb27fc03b5d1a48"
        },
        {
          "path": ".git/objects/c9/d966e25d4af1f0b3884eba88f551ef7006ba13",
          "bytes": 5696,
          "sha256": "26b275ed4d48079f5917c51ffcc133d92ffb84740ce1c3713628113e1c45d10d"
        },
        {
          "path": ".git/objects/cc/15408e41bb28143e81c42be26972dd50e16305",
          "bytes": 8925,
          "sha256": "25664c74ecb10de7b0ade1e71da7fb4da2db2831928d0af27d033445d21cf24f"
        },
        {
          "path": ".git/objects/cd/62fefd10e235ca381184ffd169e240737a6104",
          "bytes": 35892,
          "sha256": "70f7b41d7f4b47f54ccdb3ed6e5b01308956ba97476c9ec1a6877340440d8424"
        },
        {
          "path": ".git/objects/d0/b1d84eded0d1ef891bfdb219b56ad19d9b91f8",
          "bytes": 4949,
          "sha256": "64b9a31adbf5b0e11108a6ae796a5d1d604317b271d88c85c752d9e287a3d76b"
        },
        {
          "path": ".git/objects/d1/c506138e8d1e37db8c3bf51b7a3562a7e80611",
          "bytes": 61,
          "sha256": "14558812dcdc510fecc2602565aef6a7e4d76c7fa11fb63152f62070f00313c6"
        },
        {
          "path": ".git/objects/d7/f1d07f3112fa64db3fb0b894577d11a8c363f1",
          "bytes": 6839,
          "sha256": "981b47cdcc59fb4448b47f4f3c59813c73d86ac6ae5b10c44bbe4eae674f42af"
        },
        {
          "path": ".git/objects/e7/93ccbedcbdb5c81e34f541bde92c10f8cde633",
          "bytes": 6886,
          "sha256": "93008483061b1cf2cb299eacce957717c2b7c6dfe67b9dba59a799a13dc7cced"
        },
        {
          "path": ".git/objects/eb/10f2bc15f123a9dd78d504057ee9f0e6d2af23",
          "bytes": 3106,
          "sha256": "cf593d028ffd75a8f5edd7932538f4243d1ca96de0d00a4986b1b66900c37fd5"
        },
        {
          "path": ".git/objects/eb/4bdf341d09d654f994b03816c39064497ff355",
          "bytes": 499,
          "sha256": "2d96fd0798cb80b10e68cb29c8f06d617c0aab62510ed39749e2d3031a392778"
        },
        {
          "path": ".git/objects/ed/c0d5565db72ed20b1f02a607b92b5c6eaea989",
          "bytes": 7275,
          "sha256": "9036b9784150cb21d671195ba67c75eb6a8cf7cc8be4f00720aff64873a2cf24"
        },
        {
          "path": ".git/objects/f1/bba688e87a7c89940b48c4422ce12c0e23bc62",
          "bytes": 7379,
          "sha256": "2317742a473bb4436985ff1343a0c1082dcd831f4bb78afc7d86061dbf1fea89"
        },
        {
          "path": ".git/objects/f7/a977af30ecd797a7bed96b0ce0c9792d27b8ff",
          "bytes": 8192,
          "sha256": "23592b5a49505d41ef12e206faed8f8e8eff742a3d2b01c4f24290eb754f3329"
        },
        {
          "path": ".git/objects/fb/49ab4b38c7036485130edf3cd0957c71f54590",
          "bytes": 2747,
          "sha256": "ff216bbb674250e56d208951857cf11dd294d2f6d9abb727dbf51cfff774fffb"
        },
        {
          "path": ".git/objects/fd/092268ba0d4ba3e41d1a594a6a0f0093029775",
          "bytes": 3003,
          "sha256": "3f8f4b98258f209eb91bf6e83659cf1a7b171d48499aeabd879103c63d04c203"
        },
        {
          "path": ".git/refs/heads/main",
          "bytes": 41,
          "sha256": "71a0f8e30af20c42fca670205fd36a1243591dc44c3b94c55f849df8e0c6c4ff"
        },
        {
          "path": "change-map.json",
          "bytes": 9268,
          "sha256": "df022ecd7693e08cf23118c6186b70f8749e2a9b15e9e5ca24fff23b221f1a9d"
        },
        {
          "path": "diff-index.json",
          "bytes": 28020,
          "sha256": "8a5592ca2d55d2cab68fcafe5c771f8c68473a693801861e6b7d801e3fa354f6"
        },
        {
          "path": "diff-shards/S-0009.md",
          "bytes": 2481,
          "sha256": "6cbbb46b46a589f406f5f27121958f23a6ead3bd26b5dd41286e485a245e2fef"
        },
        {
          "path": "diff-shards/S-0010.md",
          "bytes": 25300,
          "sha256": "f693e00c228b87eeb9615cc423fb20704b11277276dafdcd3ca7f4e3680d7e40"
        },
        {
          "path": "diff-shards/S-0011.md",
          "bytes": 1919,
          "sha256": "c28a335d499dabbcb4aaed277741f53ea8b409fb5d706eb99b2326acc256bec4"
        },
        {
          "path": "diff-shards/S-0012.md",
          "bytes": 9512,
          "sha256": "d20c6a00d0550c88f540acf06ec5de34d958b9b4efe57dd079024cf79e2496f2"
        },
        {
          "path": "diff-shards/S-0013.md",
          "bytes": 14609,
          "sha256": "830482464ab41548879447be82f377d69eb83a2a349bac29187bdf3dac4aeb51"
        },
        {
          "path": "diff-shards/S-0014.md",
          "bytes": 988,
          "sha256": "5b38cf5805554dd41eecb86d30f179c1066a5bd844f54bf0655459accd0aabc5"
        },
        {
          "path": "diff-shards/S-0015.md",
          "bytes": 22283,
          "sha256": "45f520c78291014378c687ae87fdf8d1b5bc5636533c736fd12ee7bbece7acc3"
        },
        {
          "path": "diff-shards/S-0016.md",
          "bytes": 21655,
          "sha256": "8b66bf13205510cf95d861647a370486a2b2fda40970c91363df209cd7c7b3b4"
        },
        {
          "path": "diff-shards/S-0017.md",
          "bytes": 23121,
          "sha256": "24fe2f14d6ae1036560938f575ce1588827464cc6aec3b60c0a04baa8cecd277"
        },
        {
          "path": "diff-shards/S-0018.md",
          "bytes": 40715,
          "sha256": "174f613d965714d1401d983894f8331bc6647881fa1fb255356023c8ef00e949"
        },
        {
          "path": "diff-shards/S-0019.md",
          "bytes": 7823,
          "sha256": "cb32038701b5a7434318f64a2216dd92f5cd439fc0423a30538f9fefe65e9f85"
        },
        {
          "path": "diff-shards/S-0038.md",
          "bytes": 32905,
          "sha256": "4e0857c116af881b30f49eebb1275097fe71168ad193e8f9ec478c922a725541"
        },
        {
          "path": "diff-shards/S-0039.md",
          "bytes": 17365,
          "sha256": "d84bc372aaeb77349269197e8e36c41cd4bacb98d97ee740ae2429818855dca5"
        },
        {
          "path": "diff-shards/S-0040.md",
          "bytes": 41109,
          "sha256": "1ff006a8a44e747de29d5581c2280b684b7aa528c6e5831f94b584050bbd70a4"
        },
        {
          "path": "diff-shards/S-0041.md",
          "bytes": 15462,
          "sha256": "6c42e68ead4b9c2a87f1a85e24f692b7a8090c625edd22b1b50dafb101ca830a"
        },
        {
          "path": "diff-shards/S-0042.md",
          "bytes": 9111,
          "sha256": "fbcf3bf584260d0bad8dd6897f62b1fe6308dadeb3aea10efc20d1215d6d7100"
        },
        {
          "path": "diff-shards/S-0043.md",
          "bytes": 9637,
          "sha256": "994a415317aa453c1febd989fdeae0ef86ae64bc7d19b2363f1f3b422e080b4d"
        },
        {
          "path": "diff-shards/S-0044.md",
          "bytes": 39931,
          "sha256": "d81e95650dcecb1fa33a61062db59af196dff1e5d4b44cf34d6517dde48cab4f"
        },
        {
          "path": "diff-shards/S-0045.md",
          "bytes": 6286,
          "sha256": "89cffa584674bb9a6a8e8f1ac595fef37170738fd7c3cc045dbf29dda26a12ad"
        },
        {
          "path": "diff-shards/S-0046.md",
          "bytes": 7498,
          "sha256": "2233c83a6f36e9c530bf9f140c568aa90f76471b3038770b106595c49a53cea2"
        },
        {
          "path": "diff-shards/S-0047.md",
          "bytes": 8867,
          "sha256": "cd6bf9f09f55e7fdbb6227e6d4dde8907bbb1b0a269b927ffdf3f7e12fce4e4a"
        },
        {
          "path": "diff-shards/S-0048.md",
          "bytes": 13542,
          "sha256": "956553e46de64396f2a838e989ab945f3ce6368f3c82624009491687060665bd"
        },
        {
          "path": "diff-shards/S-0049.md",
          "bytes": 10030,
          "sha256": "e65c5405605ac9315f7ee19bca02c7beab28b4f449d6e06634f26df717b1bf77"
        },
        {
          "path": "diff-shards/S-0050.md",
          "bytes": 44789,
          "sha256": "35c157698c43da0da0c4904ca878c833629dcf45e20ea52e0cef19e0ed3cc21f"
        },
        {
          "path": "diff-shards/S-0051.md",
          "bytes": 14122,
          "sha256": "bc67e37dc309e93d0e2755858eb3459dc2606fa10313e7e12e5effd5afa19493"
        },
        {
          "path": "diff-shards/S-0052.md",
          "bytes": 9417,
          "sha256": "4a2032ae40466d5f9474df2ea320edc67bb14b2a53f5c89ada3de610c22e66ca"
        },
        {
          "path": "diff-shards/S-0053.md",
          "bytes": 5654,
          "sha256": "b50127af5274942d5336f1d357c173a68f1cf0812062fa8a91f8098cd4935ab8"
        },
        {
          "path": "diff-shards/S-0054.md",
          "bytes": 3753,
          "sha256": "4f8315b9c8ce8bc615ba5a881026e47fdefdd4f2a5452ce17c3fe3ade255b10e"
        },
        {
          "path": "diff-shards/S-0055.md",
          "bytes": 7942,
          "sha256": "f98c95ea445129caa958bc2baa2aa512e227a9f24c3a4def4c9da9b5bb5fd161"
        },
        {
          "path": "diff-shards/S-0056.md",
          "bytes": 30177,
          "sha256": "3676bf90c3bcff495fa12cd571e80f087bf06359e6edd2c711a3a2d58ef5fd8f"
        },
        {
          "path": "diff-shards/S-0057.md",
          "bytes": 6257,
          "sha256": "f6b162424b2f72888a0383c7c31c1dc92eac0f11ed0e8f1d2969fc1b2c0b5205"
        },
        {
          "path": "diff-shards/S-0058.md",
          "bytes": 4413,
          "sha256": "10ba1e67651704be9176f2f95248d169fb1fba018640e605bc467bb70cb8590d"
        },
        {
          "path": "diff-shards/S-0059.md",
          "bytes": 1019,
          "sha256": "6f476227bff76bd61e6a7ac1c773b60619bfe06e229df852b38ea585a3db8b38"
        },
        {
          "path": "diff-shards/S-0060.md",
          "bytes": 6774,
          "sha256": "550f94b9a4b9222a8eaf06b0c3e5387323130abce38c1c817fca29f3cf0fd56a"
        },
        {
          "path": "diff-shards/S-0061.md",
          "bytes": 933,
          "sha256": "c2a8aae4b49b0be5d65ccd8a0561f587df5bb2ec65d844a8cb1524dc061f1c2c"
        },
        {
          "path": "diff-shards/S-0062.md",
          "bytes": 2359,
          "sha256": "4184ea365530cdf2161c59289fadc48681d71b6b315639d276889c703fe2afcc"
        },
        {
          "path": "diff-shards/S-0063.md",
          "bytes": 34106,
          "sha256": "c1a9286ca6ca2787a473f0143dd2efd1240cf6ebb591865bd1440a5e19e8fb77"
        },
        {
          "path": "diff-shards/S-0064.md",
          "bytes": 16086,
          "sha256": "607252922b41d879a2e6276d0ec35c9a2684b151fe75a339fb432fe9d8f983f3"
        },
        {
          "path": "diff-shards/S-0065.md",
          "bytes": 4895,
          "sha256": "cc770f3f34eda6a8a50d6b493f67aacd6d0f7cb729b1540ae1038a83628cc684"
        },
        {
          "path": "diff-shards/S-0066.md",
          "bytes": 14212,
          "sha256": "943bc5e7e663e90c8305c4eeeb3365f1af7500305f38cb25bb952928e8fb2e82"
        },
        {
          "path": "diff-shards/S-0067.md",
          "bytes": 2876,
          "sha256": "6a43379b7d4f8a003db49acf041523cb55bd1afa36ea12bf2d0ff5c31f15fd1f"
        },
        {
          "path": "diff-shards/S-0068.md",
          "bytes": 40665,
          "sha256": "8b564905ea7ed4bbaebda98262d3989f13c4bdde5b0ba298e9c8f1bcc12383ad"
        },
        {
          "path": "diff-shards/S-0069.md",
          "bytes": 3452,
          "sha256": "8de687204d0850cbdf64425c9ec9c6267ea44e0b4b32f22797a439cd9a341879"
        },
        {
          "path": "diff-shards/S-0070.md",
          "bytes": 1412,
          "sha256": "4b04d6ad5a5f3aed1117c4311f8dee3e7362f49b2a617fd81909f2b0d5e63e25"
        },
        {
          "path": "diff-shards/S-0071.md",
          "bytes": 710,
          "sha256": "1781b6df22e63ad6cd373146e231f8c57c66d3da8d59c999254aa12a38cc6332"
        },
        {
          "path": "diff-shards/S-0072.md",
          "bytes": 2914,
          "sha256": "d31a7b1e420315f2c1a77108d986c164b09271c660b1c92e62149dc6322b7ede"
        },
        {
          "path": "diff-shards/S-0073.md",
          "bytes": 24536,
          "sha256": "783888aa69a0e1278afb2582179188e1a78b313c6a5b3fc68599c1f829f2212c"
        },
        {
          "path": "diff-shards/S-0074.md",
          "bytes": 35548,
          "sha256": "6f11f366d6f0c09406a8942f2a4fbe12a195af0d711601f6ca855c909348ea9f"
        },
        {
          "path": "diff-shards/S-0075.md",
          "bytes": 8828,
          "sha256": "aee10c8661b152506d88cc6de29e0b1bd0d6be425d2b980bc7c27a9478ea0587"
        },
        {
          "path": "diff-shards/S-0076.md",
          "bytes": 10990,
          "sha256": "35dca299229bf209764a84bce47cef6eb58c00faed3a1623f67f60129ed11efc"
        },
        {
          "path": "diff-shards/S-0077.md",
          "bytes": 15220,
          "sha256": "eeb81a30cc60ea562cbd61dcf3baa255db8ba78162d706a77b5b3d5ecca10e44"
        },
        {
          "path": "diff-shards/S-0078.md",
          "bytes": 14091,
          "sha256": "44b008fa1eaa43d5a4705791ef5e933eefbe4e138de3be08e5937d7f274a1ac5"
        },
        {
          "path": "diff-shards/S-0079.md",
          "bytes": 15556,
          "sha256": "195aefab7e160ac4e75a9cddd6bfe30a8c67abe1c414d5310bc279d5a93bcff1"
        },
        {
          "path": "diff-shards/S-0080.md",
          "bytes": 1534,
          "sha256": "ade1cf1aa3dda83923532294fe2f54677ebe282b3a733fef44f11516da080cac"
        },
        {
          "path": "diff-shards/S-0081.md",
          "bytes": 4679,
          "sha256": "85fece6656e908246a86839d0a55bc2293b5bae0636cdc169fb72b0ef4cff1d0"
        },
        {
          "path": "evidence/test-summary.json",
          "bytes": 650,
          "sha256": "74d2a0a20d9f67ebc8a79a354a261d2a213a63f5f70051e4470f685070e2dccc"
        },
        {
          "path": "requirements/acceptance_criteria.md",
          "bytes": 23260,
          "sha256": "cf0e4c56e47a44c905795cc45774d9ffb42c8e6f5f48aca8387ad54a6318dcee"
        },
        {
          "path": "requirements/approved_spec.json",
          "bytes": 82130,
          "sha256": "c20340c04f585e0413c05f175e256e256710df4101d00152100e6f751a599ec9"
        },
        {
          "path": "requirements/test_evidence.json",
          "bytes": 179,
          "sha256": "e605cd383dda22f956c11f456bfc47b9a0a2175d28981cb0e0d007c6cae0211e"
        },
        {
          "path": "review-instructions.md",
          "bytes": 1082,
          "sha256": "e4aa97302c6f305bb4193419bec9c62946e4820b85a888b987736bfa9a79215f"
        },
        {
          "path": "source.json",
          "bytes": 291,
          "sha256": "cfff2d0d10f489f553bd318e92dea9792dd718bdc20c8b61e1c5a2492e0bb3d0"
        }
      ]
    },
    "subject_kind": "phase",
    "phase_id": "P4",
    "review_track": null,
    "review_scope": "phase",
    "review_kind": null
  }
}
```
