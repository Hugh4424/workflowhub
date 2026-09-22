# 已撤回 plan/tasks 草案的审查处置（非当前权威）

旧审查 attempt：`quality/reviews/attempts/d71c3c96-05d9-55a7-a2dd-996e21843925/attempt.json`。整体 `unavailable(REVIEW_QUORUM_INCOMPLETE)`；三路异源输出可读，`codex/luna` 因 `SAME_SOURCE` 失败。该 attempt 评审的是撤回前的 `plan.md/tasks.md`，不证明当前 `spec.md + phases/**`，不得复用为当前材料的审查通过。

| 当时 finding | 当时处置 | 在当前材料中的状态 |
| --- | --- | --- |
| P3 漏 review unavailable、过期答复、材料漂移 | fixed | `phases/P3.md` L1 场景继续列明三类失败；新材料仍待独立审查。 |
| AC-38 缺人工证据 | fixed | `phases/P3.md` 要求逐 AC 证据；AC-38 的真实人工原件仍待 build-code，不能标 achieved。 |
| T003 把已修 cold-start 当 RED | fixed | 当前 Phase P1 将冷启动列回归，不把它当目标 RED。 |
| OPEN-002/003 无 owner/oracle/evidence | fixed | OPEN-002 见 `research/atomic-ledger-cost-check.md`；OPEN-003 仅保留 Decision/Source/Map 历史 provenance，不作为验收绑定。 |
| AC-46 在两个实施 Phase 重复归属 | fixed | 当前 `phases/P1.md` 负责 post runtime，`phases/P3.md` 仅最终 readback；实施文件写面不重复。 |

本文件只保留撤回材料上的处置历史。当前的独立 Phase 文件产生新材料身份，后续正式 merged review 必须以其真实原件为输入；不为追求空 findings 重派同一旧材料。
