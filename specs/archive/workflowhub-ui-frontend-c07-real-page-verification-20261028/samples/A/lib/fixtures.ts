// Source-derived canonical ten-record input from Downloads/UI SimulationBoard.tsx.
// All values are controlled synthetic design fixtures. Source-specific registry
// differences are preserved as source defects rather than silently reconciled.
export type Period = '今日' | '本周' | '本月';
export type SimStatus =
  | "draft"
  | "preparing"
  | "running"
  | "lagging"
  | "isolated"
  | "stopping"
  | "completed"
  | "failed"
  | "incomplete_close"
  | "market_closed"
  | "delayed"
  | "recovering"
  | "manual_stopped"

export type RunKind = "live_sim" | "replay_exec" | "data_only" | "historical_replay"

export type FactState = "confirmed" | "confirmed_empty" | "unavailable"
export type Evidence = "confirmed" | "partial" | "unavailable"
export type LampState = "ok" | "warn" | "error" | "na"

export interface Fact { state: FactState; text: string }
export interface Lamp { label: string; state: LampState }

export interface Metrics {
  netPnl: string
  winRate: string
  sharpe: string
  maxDrawdown: string
  orders: string
  profitFactor: string
}

export interface Simulation {
  id: string
  name: string
  strategy: string
  version: string
  contract: string
  session: string
  status: SimStatus
  runKind: RunKind
  runId: string | null
  runDuration: string | null
  endedAt: string | null
  metrics: Metrics | null
  metricsNote?: string
  today: string
  last7: string
  fills: string
  sampleDays: string
  position: Fact
  lastMarketTime: Fact
  health: Lamp[]
  evidence: Evidence
  todayLoss: Fact
  dailyLimitLeft: Fact
  anomaly: string | null
  seed: number
  startDate: string
  endDate: string
  /** 该记录在这些区间内没有数据（显示 未提供） */
  noData?: Period[]
}

export interface RunRec { n: number; start: string; end: string | null; reason: string }


const LAMP_LABELS = ['行情接收','行情记录','足迹计算','策略推进','模拟执行','结果保存'];
function lamps(states:LampState[]):Lamp[]{return LAMP_LABELS.map((label,i)=>({label,state:states[i]??'na'}))}
export const SIMS: Simulation[] = [
  {
    id: "sim-001", name: "NQ 吸收反转", strategy: "吸收反转", version: "v5",
    contract: "NQZ6", session: "RTH 09:30–16:00 ET", status: "running", runKind: "live_sim",
    runId: "RUN-20260827-001", runDuration: "3 天 12 小时", endedAt: null,
    metrics: { netPnl: "+$1,820.00", winRate: "66.7%", sharpe: "4.2", maxDrawdown: "-$340.00", orders: "3", profitFactor: "2.8" },
    today: "+$87.50（浮动）", last7: "+$1,240.00 · 5 session", fills: "3 次", sampleDays: "9 日",
    position: { state: "confirmed", text: "多 1 手 @ 21,430.25" }, lastMarketTime: { state: "confirmed", text: "14:52:03 ET" },
    health: lamps(["ok", "ok", "ok", "ok", "ok", "ok"]), evidence: "confirmed",
    todayLoss: { state: "confirmed_empty", text: "$0.00" }, dailyLimitLeft: { state: "confirmed", text: "$2,000.00" },
    anomaly: null, seed: 3, startDate: "2026-07-01", endDate: "进行中",
  },
  {
    id: "sim-011", name: "ES 开盘区间突破", strategy: "开盘区间突破", version: "v3",
    contract: "ESZ6", session: "RTH 09:30–16:00 ET", status: "running", runKind: "live_sim",
    runId: "RUN-20260827-011", runDuration: "2 天 6 小时", endedAt: null,
    metrics: { netPnl: "+$420.00", winRate: "55.6%", sharpe: "1.6", maxDrawdown: "-$260.00", orders: "9", profitFactor: "1.5" },
    today: "+$62.50（浮动）", last7: "+$420.00 · 4 session", fills: "9 次", sampleDays: "5 日",
    position: { state: "confirmed_empty", text: "Flat（无持仓）" }, lastMarketTime: { state: "confirmed", text: "14:52:02 ET" },
    health: lamps(["ok", "ok", "ok", "ok", "ok", "ok"]), evidence: "confirmed",
    todayLoss: { state: "confirmed_empty", text: "$0.00" }, dailyLimitLeft: { state: "confirmed", text: "$2,000.00" },
    anomaly: null, seed: 63, startDate: "2026-08-22", endDate: "进行中",
  },
  {
    id: "sim-009", name: "GC 趋势回踩", strategy: "趋势回踩", version: "v2",
    contract: "GCZ6", session: "ETH 18:00–17:00 ET", status: "delayed", runKind: "live_sim",
    runId: "RUN-20260827-009", runDuration: "2 天 6 小时", endedAt: null,
    metrics: { netPnl: "+$300.00", winRate: "60.0%", sharpe: "1.9", maxDrawdown: "-$200.00", orders: "5", profitFactor: "1.8" },
    today: "+$0.00", last7: "+$300.00 · 3 session", fills: "5 次", sampleDays: "3 日",
    position: { state: "confirmed", text: "多 1 手 @ 2,642.10" }, lastMarketTime: { state: "confirmed", text: "14:49:12 ET（延迟 3 分）" },
    health: lamps(["warn", "ok", "ok", "warn", "ok", "ok"]), evidence: "confirmed",
    todayLoss: { state: "confirmed_empty", text: "$0.00" }, dailyLimitLeft: { state: "confirmed", text: "$2,000.00" },
    anomaly: null, seed: 52, startDate: "2026-08-25", endDate: "进行中",
  },
  {
    id: "sim-014", name: "CL 库存日动量", strategy: "库存日动量", version: "v4",
    contract: "CLX6", session: "ETH 18:00–17:00 ET", status: "market_closed", runKind: "live_sim",
    runId: "RUN-20260827-014", runDuration: "1 天 9 小时", endedAt: null,
    metrics: { netPnl: "-$120.00", winRate: "45.5%", sharpe: "0.4", maxDrawdown: "-$380.00", orders: "11", profitFactor: "0.9" },
    today: "休市", last7: "-$120.00 · 2 session", fills: "11 次", sampleDays: "2 日",
    position: { state: "confirmed_empty", text: "Flat（无持仓）" }, lastMarketTime: { state: "confirmed", text: "14:30:00 ET（休市）" },
    health: lamps(["ok", "ok", "ok", "ok", "ok", "ok"]), evidence: "confirmed",
    todayLoss: { state: "confirmed_empty", text: "$0.00" }, dailyLimitLeft: { state: "confirmed", text: "$2,000.00" },
    anomaly: null, seed: 77, startDate: "2026-08-26", endDate: "进行中", noData: ["今日"],
  },
  {
    id: "sim-016", name: "ZN 利差均值回归", strategy: "利差均值回归", version: "v1",
    contract: "ZNZ6", session: "ETH 18:00–17:00 ET", status: "recovering", runKind: "live_sim",
    runId: "RUN-20260827-016", runDuration: "2 天 1 小时", endedAt: null,
    metrics: { netPnl: "+$210.00", winRate: "62.5%", sharpe: "1.8", maxDrawdown: "-$150.00", orders: "8", profitFactor: "1.9" },
    today: "+$30.00", last7: "+$210.00 · 3 session", fills: "8 次", sampleDays: "3 日",
    position: { state: "confirmed_empty", text: "Flat（无持仓）" }, lastMarketTime: { state: "confirmed", text: "14:50:41 ET" },
    health: lamps(["warn", "ok", "ok", "ok", "ok", "ok"]), evidence: "confirmed",
    todayLoss: { state: "confirmed_empty", text: "$0.00" }, dailyLimitLeft: { state: "confirmed", text: "$2,000.00" },
    anomaly: null, seed: 29, startDate: "2026-08-25", endDate: "进行中",
  },
  {
    id: "sim-002", name: "ICT 流动性扫单 · 日盘验证", strategy: "ict_liquidity_fvg", version: "v316",
    contract: "NQZ6", session: "RTH 09:30–16:00 ET", status: "preparing", runKind: "live_sim",
    runId: null, runDuration: null, endedAt: null, metrics: null, metricsNote: "尚未产生 run",
    today: "今日无运行", last7: "今日无运行", fills: "0 次", sampleDays: "0 日",
    position: { state: "confirmed_empty", text: "Flat（无持仓）" }, lastMarketTime: { state: "confirmed_empty", text: "尚未接收行情" },
    health: lamps(["na", "na", "na", "na", "na", "na"]), evidence: "confirmed",
    todayLoss: { state: "confirmed_empty", text: "$0.00" }, dailyLimitLeft: { state: "confirmed", text: "$2,000.00" },
    anomaly: null, seed: 7, startDate: "—", endDate: "—",
  },
  {
    id: "sim-003", name: "未完成拍卖 · 夜盘", strategy: "unfinished_auction", version: "v747",
    contract: "NQZ6", session: "ON 18:00–09:30 ET", status: "draft", runKind: "live_sim",
    runId: null, runDuration: null, endedAt: null, metrics: null, metricsNote: "草稿，尚未预检",
    today: "今日无运行", last7: "今日无运行", fills: "0 次", sampleDays: "0 日",
    position: { state: "confirmed_empty", text: "Flat（无持仓）" }, lastMarketTime: { state: "confirmed_empty", text: "尚未接收行情" },
    health: lamps(["na", "na", "na", "na", "na", "na"]), evidence: "confirmed",
    todayLoss: { state: "confirmed_empty", text: "$0.00" }, dailyLimitLeft: { state: "confirmed", text: "$2,000.00" },
    anomaly: null, seed: 12, startDate: "—", endDate: "—",
  },
  {
    id: "sim-004", name: "NQ 吸收反转 · 历史验证", strategy: "吸收反转", version: "v5",
    contract: "NQZ6", session: "RTH 09:30–16:00 ET", status: "completed", runKind: "replay_exec",
    runId: "RUN-20260827-002", runDuration: null, endedAt: "2026-08-27 16:02 ET",
    metrics: { netPnl: "+$1,245.00", winRate: "71.4%", sharpe: "5.1", maxDrawdown: "-$280.00", orders: "7", profitFactor: "3.2" },
    today: "今日无运行", last7: "非实时，不计入", fills: "7 次", sampleDays: "18 日",
    position: { state: "confirmed_empty", text: "Flat（已确认平仓）" }, lastMarketTime: { state: "confirmed", text: "2026-08-27 16:00 ET" },
    health: lamps(["ok", "ok", "ok", "ok", "ok", "ok"]), evidence: "confirmed",
    todayLoss: { state: "confirmed_empty", text: "$0.00" }, dailyLimitLeft: { state: "confirmed", text: "$2,000.00" },
    anomaly: null, seed: 19, startDate: "2026-08-01", endDate: "2026-08-27",
  },
  {
    id: "sim-005", name: "SMC 突破回踩 · 日盘", strategy: "smc_breakout_retest", version: "v329",
    contract: "NQZ6", session: "RTH 09:30–16:00 ET", status: "failed", runKind: "live_sim",
    runId: "RUN-20260827-003", runDuration: null, endedAt: "2026-08-27 10:56 ET",
    metrics: null, metricsNote: "运行失败，六项指标不可计算",
    today: "有运行、无成交", last7: "证据不可用", fills: "0 次", sampleDays: "证据不可用",
    position: { state: "unavailable", text: "证据不可用" }, lastMarketTime: { state: "confirmed", text: "10:56:42 ET" },
    health: lamps(["error", "error", "warn", "error", "error", "warn"]), evidence: "unavailable",
    todayLoss: { state: "confirmed_empty", text: "$0.00" }, dailyLimitLeft: { state: "confirmed", text: "$2,000.00" },
    anomaly: "行情连接中断；策略推进停止", seed: 24, startDate: "2026-08-27", endDate: "2026-08-27",
  },
  {
    id: "sim-010", name: "足迹 POC 回归 · 收尾未完成", strategy: "footprint_poc_revert", version: "v512",
    contract: "NQZ6", session: "RTH 09:30–16:00 ET", status: "incomplete_close", runKind: "live_sim",
    runId: "RUN-20260826-011", runDuration: null, endedAt: "2026-08-26 15:40 ET",
    metrics: null, metricsNote: "未完成收尾，仅已确认亏损计入 carry-in",
    today: "今日无运行", last7: "部分已确认", fills: "5 次（1 未闭合）", sampleDays: "部分已确认",
    position: { state: "unavailable", text: "证据不可用" }, lastMarketTime: { state: "confirmed", text: "2026-08-26 15:38 ET" },
    health: lamps(["ok", "ok", "warn", "warn", "ok", "error"]), evidence: "partial",
    todayLoss: { state: "confirmed", text: "-$210.00（carry-in）" }, dailyLimitLeft: { state: "confirmed", text: "$1,790.00" },
    anomaly: "未完成收尾 · 保护状态未知", seed: 15, startDate: "2026-08-20", endDate: "2026-08-26",
  },
]


export interface SimInfo {
  id: string
  name: string
  strategy: string
  version: string
  contract: string
  session: string
  runId: string | null
  status: "live" | "completed" | "failed" | "incomplete" | "draft" | "ready"
  runKind: "live_sim" | "replay_exec" | "data_only" | "historical_replay"
}


export const SIM_DATA: Record<string, SimInfo> = {
  "sim-001": { id: "sim-001", name: "NQ 吸收反转", strategy: "吸收反转", version: "v5", contract: "NQZ6", session: "RTH 09:30–16:00 ET", runId: "RUN-20260827-001", status: "live", runKind: "live_sim" },
  "sim-011": { id: "sim-011", name: "ES 开盘区间突破", strategy: "开盘区间突破", version: "v3", contract: "ESZ6", session: "RTH 09:30–16:00 ET", runId: "RUN-20260827-011", status: "live", runKind: "live_sim" },
  "sim-002": { id: "sim-002", name: "ICT 流动性扫单 · 日盘验证", strategy: "ict_liquidity_fvg", version: "v316", contract: "NQU25-CME", session: "RTH 09:30–16:00 ET", runId: null, status: "ready", runKind: "live_sim" },
  "sim-003": { id: "sim-003", name: "未完成拍卖 · 夜盘", strategy: "unfinished_auction", version: "v747", contract: "NQU25-CME", session: "ON 18:00–09:30 ET", runId: null, status: "draft", runKind: "live_sim" },
  "sim-004": { id: "sim-004", name: "NQ 吸收反转 · 历史验证", strategy: "footprint_absorption_reversal", version: "v5", contract: "NQU25-CME", session: "RTH 09:30–16:00 ET", runId: "RUN-20260827-002", status: "completed", runKind: "replay_exec" },
  "sim-005": { id: "sim-005", name: "SMC 突破回踩 · 日盘", strategy: "smc_breakout_retest", version: "v329", contract: "NQU25-CME", session: "RTH 09:30–16:00 ET", runId: "RUN-20260827-003", status: "failed", runKind: "live_sim" },
  "sim-006": { id: "sim-006", name: "足迹 Delta 翻转 · 验证", strategy: "footprint_delta_flip", version: "v463", contract: "NQU25-CME", session: "RTH 09:30–16:00 ET", runId: "RUN-20260827-004", status: "incomplete", runKind: "live_sim" },
  "sim-008": { id: "sim-008", name: "NQ 区间失衡 · CME 日盘", strategy: "footprint_imbalance_range", version: "v12", contract: "NQU25-CME", session: "RTH 09:30–16:00 ET", runId: "RUN-20260827-008", status: "live", runKind: "live_sim" },
  "sim-014": { id: "sim-014", name: "CL 库存日动量", strategy: "库存日动量", version: "v4", contract: "CLX6", session: "ETH 18:00–17:00 ET", runId: "RUN-20260827-014", status: "live", runKind: "live_sim" },
  "sim-016": { id: "sim-016", name: "ZN 利差均值回归", strategy: "利差均值回归", version: "v1", contract: "ZNZ6", session: "ETH 18:00–17:00 ET", runId: "RUN-20260827-016", status: "live", runKind: "live_sim" },
  "sim-009": { id: "sim-009", name: "GC 趋势回踩", strategy: "趋势回踩", version: "v2", contract: "GCZ6", session: "ETH 18:00–17:00 ET", runId: "RUN-20260827-009", status: "live", runKind: "live_sim" },
}


// Controlled sample quote from original SimWorkbench CURR_P; never a market lookup.
export const MOCK_NQ_QUOTE = 21432.00;
export const MOCK_NQ_TICK_SIZE = 0.25;
export const MOCK_NQ_POSITION_ENTRY = MOCK_NQ_QUOTE - 1.75;
