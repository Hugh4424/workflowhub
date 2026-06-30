# 需求质量检查清单

> task_id: m13b-build-spec-deepening | spec version: 1.0.0 | 生成时间: 2026-06-30
> 来源 spec: specs/m13b-build-spec-deepening/spec.md

---

## 一、规格书质量

### 语言与可读性

- [x] 无实现细节泄露（无编程语言、框架、API 名称）
- [x] 聚焦用户价值与业务需求（质量事实契约、自检、审查均以行为描述）
- [x] 非技术干系人可读（速读卡 30 秒可懂）
- [x] 所有必填章节已完成（速读卡/问题陈述/背景目标边界/用户场景/FR/不做/验收/影响范围/附录）

### 需求完整性

- [x] 所有 [NEEDS CLARIFICATION] 标记已解决（无残留）
- [x] 所有功能需求可测试、无歧义（每个 FR 有 Given/When/Then 场景）
- [x] 成功标准可度量（AC 均有明确验证方式）
- [x] 成功标准不含实现细节
- [x] 所有验收场景已定义（AC-01 至 AC-18）
- [x] 边界情况已标识（TASK_TRACKING_ROOT 未设置、metrics 写入失败、Spec-Purity 命中等）
- [x] 范围已明确界定（IN 18 项、OUT 8 项）
- [x] 依赖和假设已记录（影响范围章节 + Known Gaps 附录）

### 功能就绪

- [x] 每条功能需求有明确验收标准（AC-01~AC-18 与 FR 一一对应）
- [x] 用户场景覆盖主要流程（10 个场景覆盖正常/失败/降级路径）
- [x] 功能满足成功标准中定义的可度量目标
- [x] 无实现细节泄漏进规格书

---

## 二、决策对齐检查

| 决策 | 已在 spec 中覆盖 | 覆盖位置 |
|------|-----------------|---------|
| D1 质量事实契约最小实现 | [x] | FR-CONTRACT-001/002 |
| D2 spec-ladder + 三层小节 + 7 条自检 + Spec-Purity | [x] | FR-LADDER, FR-STRUCTURE, FR-SELFCHECK |
| D3 独立三角度审查 1-AI-3-angle | [x] | FR-REVIEW-001/002 |
| D4 行为验证 + 摩擦捕获 + --task-dir | [x] | FR-BEHAV, FR-FRICTION, FR-TASKDIR |
| D5 Known Gaps + handoff required_reads | [x] | FR-STRUCTURE-002, FR-CONTRACT-001 第5项 |
| D6 TASK_TRACKING_ROOT 完整落地 | [x] | FR-TRACKING-001/002 |
| D7 scope-triage + spec↔decision-log 一致性（非阻断） | [x] | FR-SCOPETRIAGE-001, FR-ALIGN-001 |
| D8 FR编号 + AC计数 + artifact-first + REQ-COMM | [x] | FR-NUMBERING, FR-ACCOUNT, FR-ARTIFACT, FR-COMM |

---

## 三、宪法符合性检查（F 条款相关）

| 条款 | 判据 | 结论 |
|------|------|------|
| F3 物理事实靠机器校验但不阻断 | 自检 grep/计数均为记录，不阻断 | [x] 符合 |
| F4 质量靠异源审查与人而非阻断式质量门 | 所有质量检查为浮现+人判断，无阻断门 | [x] 符合 |
| F5 gate 谨慎添加 | CUT 列表明确排除所有阻断门 | [x] 符合 |
| F7 推进与不可逆操作经人确认 | 无自动推进，人审在 SKILL.md 保留 | [x] 符合 |
| F8 简单优先 | spec-ladder 判断后选最简档位 B，不堆冗余章节 | [x] 符合 |
| F9 可证伪不假绿 | 未知值填 unknown，不伪造 pass | [x] 符合 |
| F10 反过度工程 | F10 四问已在 spec-ladder 判断中执行 | [x] 符合 |

---

## 四、FR 格式检查

- [x] 所有 FR 使用 FR-{DOMAIN}-NNN 格式（正则 `FR-[A-Z]+-[0-9]{3}` 可验证）
- [x] DOMAIN 枚举覆盖：CONTRACT / LADDER / STRUCTURE / SELFCHECK / REVIEW / BEHAV / FRICTION / TASKDIR / TRACKING / NUMBERING / ACCOUNT / ARTIFACT / COMM / SCOPETRIAGE / ALIGN
- [x] NNN 在各 DOMAIN 内连续从 001 起

---

## 五、阻断语言检查（Spec-Purity 阻断门语义）

- [x] spec.md 不含以阻断门语义使用的"阻断" — 非目标段落中引用均作为 CUT 说明
- [x] spec.md 不含 BLOCK 作为执行门
- [x] spec.md 不含"不能进""必须停止"等推进封锁语义

---

## 六、产物完整性

- [x] `specs/m13b-build-spec-deepening/spec.md` 已写入
- [x] `specs/m13b-build-spec-deepening/checklists/requirements.md` 已写入（本文件）
- [ ] `specs/m13b-build-spec-deepening/spec-acceptance-count.json` 待写入
- [ ] `specs/m13b-build-spec-deepening/spec-clarify-scan.md` 待写入
- [ ] metrics recordSkeleton 待调用

---

## 七、Known Gaps 确认

- [x] Known Gaps 段存在（附录 B，5 条）
- [x] 每条 gap 有明确描述，不含"待定"空占位

---

## 八、FR 统计

| 域 | FR 数量 |
|----|---------|
| FR-CONTRACT | 2 |
| FR-LADDER | 2 |
| FR-STRUCTURE | 2 |
| FR-SELFCHECK | 2 |
| FR-REVIEW | 2 |
| FR-BEHAV | 2 |
| FR-FRICTION | 1 |
| FR-TASKDIR | 1 |
| FR-TRACKING | 2 |
| FR-NUMBERING | 1 |
| FR-ACCOUNT | 1 |
| FR-ARTIFACT | 1 |
| FR-COMM | 2 |
| FR-SCOPETRIAGE | 1 |
| FR-ALIGN | 1 |
| **合计** | **23** |

AC 数量：18（AC-01 至 AC-18）
