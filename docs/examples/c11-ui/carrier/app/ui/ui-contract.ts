// Minimal copy of PaperBuilder frontend/src/ui/ui-contract.ts.
// Kept only the four symbols the carrier consumes: LineageIdentity, UiAsyncState,
// UiNonReadyState and uiStateMessage. Removed the type-only imports from
// ../backtest-workbench and ../strategy-api and every symbol that depends on them.
export type LineageIdentity = {
  strategy_version_id: string;
  task_id?: string | null;
  run_id?: string | null;
  runspec_hash?: string | null;
  source_identity?: string | null;
  market_segment_id?: string | null;
};

export type UiAsyncState<T = never> =
  | { kind: "loading"; label?: string }
  | { kind: "empty"; label?: string }
  | { kind: "ready"; data: T }
  | { kind: "error"; reason: string; recovery?: string }
  | { kind: "unknown"; reason: string }
  | { kind: "unavailable"; reason: string; recovery?: string }
  | { kind: "mismatch"; reason: string; recovery?: string };

/** States that need an announcement. `ready` deliberately clears the panel. */
export type UiNonReadyState = Exclude<UiAsyncState<unknown>, { kind: "ready" }>;

export type UiStateMessage = {
  tone: "neutral" | "danger" | "warning";
  text: string;
  recovery?: string;
};

export function uiStateMessage(state: UiNonReadyState): UiStateMessage {
  switch (state.kind) {
    case "loading":
      return { tone: "neutral", text: state.label ?? "正在读取…" };
    case "empty":
      return { tone: "neutral", text: state.label ?? "暂无可展示的数据" };
    case "error":
      return { tone: "danger", text: state.reason, ...(state.recovery ? { recovery: state.recovery } : {}) };
    case "unknown":
      return { tone: "neutral", text: state.reason };
    case "unavailable":
    case "mismatch":
      return { tone: "warning", text: state.reason, ...(state.recovery ? { recovery: state.recovery } : {}) };
  }
}
