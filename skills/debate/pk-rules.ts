// pk-rules.ts — MR-2 分类、pk 触发/退出判定规则
// 供测试和 orchestrator 共同引用，保证判定逻辑单一权威源

export type Mr2Category =
  | "problem_change" // 问题改变 — 方向级
  | "scope_priority" // 范围/优先级 — 方向级
  | "requirement_interpretation" // 对需求的解释 — 方向级
  | "implementation_only"; // 仅实现层 — 非方向级

export interface Finding {
  id: string;
  description: string;
  category: Mr2Category;
}

export interface TriggerDecision {
  triggered: boolean;
  reason: string;
  retention: { oppose: string; decision: string; basis: string };
}

const DIRECTION_LEVEL_CATEGORIES: Mr2Category[] = [
  "problem_change",
  "scope_priority",
  "requirement_interpretation",
];

// 每个方向级类别的关键词表（implementation_only 是无匹配时的兜底，不需关键词）。
const MR2_KEYWORDS: Record<Exclude<Mr2Category, "implementation_only">, string[]> = {
  problem_change: [
    "problem", "痛点", "方向", "问题改变", "核心场景", "使用场景",
    "目标变了", "根本问题", "真正的问题", "方向性",
  ],
  scope_priority: [
    "scope", "优先级", "时机", "排期", "范围", "是否做", "要不要做",
    "该不该", "先后顺序", "creep", "backlog",
  ],
  requirement_interpretation: [
    "理解", "解释", "需求分歧", "读法", "歧义", "诠释", "怎么理解",
    "需求原文", "理解不同",
  ],
};

// MR-2 分类判定：根据 finding 描述判定类别。
//
// ⚠️ 这是**确定性 fallback**，靠各类别的关键词命中计数取最高者，鲁棒性有限（自然语言无确定性边界）。
// 首选路径：由 orchestrator(LLM) 在调用前直接判定 Mr2Category 并填进 finding.category，
// 本函数只在无 LLM 判类的环境下兜底。触发/退出规则（shouldTriggerPK/shouldExitPK）
// 才是本文件作为"单一权威源"的核心，那部分是纯规则映射、确定可测。
export function classifyByMr2(description: string): Mr2Category {
  const k = description.toLowerCase();
  const tally: Record<string, number> = {};
  for (const cat of DIRECTION_LEVEL_CATEGORIES) {
    tally[cat] = MR2_KEYWORDS[cat as keyof typeof MR2_KEYWORDS]
      .filter((kw) => k.includes(kw)).length;
  }
  // 取命中数最高的方向级类别；并列时按 DIRECTION_LEVEL_CATEGORIES 顺序优先。
  const winner = DIRECTION_LEVEL_CATEGORIES.reduce((a, b) =>
    tally[a] >= tally[b] ? a : b,
  );
  return tally[winner] > 0 ? winner : "implementation_only";
}

// 判断是否触发 debate
export function shouldTriggerPK(findings: Finding[]): TriggerDecision {
  const dl = findings.filter((f) =>
    DIRECTION_LEVEL_CATEGORIES.includes(f.category),
  );
  if (dl.length > 0) {
    return {
      triggered: true,
      reason: `${dl.length} direction-level disagreement(s)`,
      retention: {
        oppose: dl.map((f) => f.description).join("; "),
        decision: "enter pk",
        basis: "MR-2 top 3 categories have unresolved direction-level disagreements",
      },
    };
  }
  return {
    triggered: false,
    reason: "All findings are implementation-level only",
    retention: {
      oppose: "No direction-level disagreements found",
      decision: "do not enter pk",
      basis:
        "MR-2 fourth category — implementation-level disputes do not trigger pk",
    },
  };
}

export type PkExitReason =
  | "verdict_produced"
  | "max_rounds_reached"
  | "all_proposals_resolved";

// D25: hitting the round cap without a verdict and with unresolved proposals
// must surface unresolved items for human arbitration rather than stop silently.
export function shouldExitPK(
  round: number,
  verdictProduced: boolean,
  allResolved: boolean,
): { exit: boolean; reason: PkExitReason | null; requiresHumanArbitration: boolean } {
  if (round >= 2) {
    return {
      exit: true,
      reason: "max_rounds_reached",
      // Capped out with no verdict and unresolved proposals → escalate to human.
      requiresHumanArbitration: !verdictProduced && !allResolved,
    };
  }
  if (verdictProduced) return { exit: true, reason: "verdict_produced", requiresHumanArbitration: false };
  if (allResolved) return { exit: true, reason: "all_proposals_resolved", requiresHumanArbitration: false };
  return { exit: false, reason: null, requiresHumanArbitration: false };
}
