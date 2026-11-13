// Minimal copy of PaperBuilder frontend/src/ui/ui-contract.ts.
// Kept only the symbol the carrier still consumes: LineageIdentity (UiLineage).
// P8 N3: the async-state types and their message helper were removed together
// with the async-state panel, their only consumer.
// Removed the type-only imports from ../backtest-workbench and ../strategy-api
// and every symbol that depends on them.
export type LineageIdentity = {
  strategy_version_id: string;
  task_id?: string | null;
  run_id?: string | null;
  runspec_hash?: string | null;
  source_identity?: string | null;
  market_segment_id?: string | null;
};
