# P13 候选生成说明

这不是正式最终交付。运行只读官方命令：`node tools/cli/stage-runtime.mjs status --action=begin --stage=build-code --project=workflowhub --task=workflowhub-thin-core-card-04-20260919`，exit 0；stdout/stderr 原件保存在本目录。身份由 stdout 读取：`revision-3ce06a4d0f1643e8d3ffda4b49baa9ac9df8a23081cf34d71d99b244f2805646` / `870b92175454f8b7691149b8eb672c12d8814665`。旧阶段行的 provenance 为 `stale`。

从当前 P1–P12 卡片逐字提取 `gate_cmd` 和 `### Tnnn —`，P8/P9/P11 按现行多命令结构处理；共 12 个相位、26 个任务。所有 gate 与 Task 维持非通过，因为没有当前树的完整业务及独立质量原件。外置旧树收据只作带哈希历史证据。每条 `evidence_refs` 都重新打开文件并计算 SHA-256；候选引用 60 条（含同源引用），不匹配或超出允许根 1 条。拒绝项在 `sha256-manifest.json` 和 JSON `source_verification.rejected_refs` 中逐条列明，未静默跳过。

候选 Markdown 的第一段为“没做到”，对 12 个相位和 26 个任务均各有一条状态、原因、影响和负责人；再列路线适用与执行事实。没有写独立叙述记录、用户答复或正式回执。候选 JSON/MD 自身哈希及全部原件回读记录在 `sha256-manifest.json`。
