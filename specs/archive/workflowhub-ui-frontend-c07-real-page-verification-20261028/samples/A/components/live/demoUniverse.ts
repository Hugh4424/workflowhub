/* 全站唯一的五品种演示口径：配置表 / 模拟卡 / 工作台 / 台账筛选 / 业务日志 同读 */
export const SYMS = ["NQ", "ES", "GC", "CL", "ZN"] as const
export type Sym = (typeof SYMS)[number]

export type SimState = "running" | "closed" | "delayed" | "recovering" | "stopped"
export const SIM_STATE_WORD: Record<SimState, string> = { running: "运行中", closed: "休市等待", delayed: "行情延迟", recovering: "恢复中", stopped: "已停止" }

export interface DemoSim {
  id: string
  sym: Sym
  strategy: string // 策略简称
  ver: string
  state: SimState
  contract: string // 数据源合约
  group: string // 绑定账户组
  tail: string // 账户尾号
}
export const simName = (s: Pick<DemoSim, "sym" | "strategy">) => `${s.sym} ${s.strategy}`

/** 五路默认接入（与监控五行同口径：策略 / 版本 / 合约 / 账户组） */
export const DEMO_SIMS: DemoSim[] = [
  { id: "sim-001", sym: "NQ", strategy: "吸收反转", ver: "v5", state: "running", contract: "NQZ6", group: "G1", tail: "4821" },
  { id: "sim-011", sym: "ES", strategy: "开盘区间突破", ver: "v3", state: "running", contract: "ESZ6", group: "G1", tail: "4821" },
  { id: "sim-009", sym: "GC", strategy: "趋势回踩", ver: "v2", state: "delayed", contract: "GCZ6", group: "G2", tail: "4821" },
  { id: "sim-014", sym: "CL", strategy: "库存日动量", ver: "v4", state: "closed", contract: "CLX6", group: "G2", tail: "4821" },
  { id: "sim-016", sym: "ZN", strategy: "利差均值回归", ver: "v1", state: "recovering", contract: "ZNZ6", group: "G3", tail: "9043" },
  // 备选（选择模拟 / 更换时可见）
  { id: "sim-008", sym: "NQ", strategy: "区间失衡", ver: "v12", state: "running", contract: "NQZ6", group: "G1", tail: "4821" },
  { id: "sim-004", sym: "NQ", strategy: "吸收反转 · 历史验证", ver: "v5", state: "stopped", contract: "NQZ6", group: "G1", tail: "4821" },
  { id: "sim-012", sym: "ES", strategy: "VWAP 回归", ver: "v3", state: "closed", contract: "ESZ6", group: "G1", tail: "4821" },
  { id: "sim-013", sym: "GC", strategy: "避险动量", ver: "v4", state: "stopped", contract: "GCZ6", group: "G2", tail: "4821" },
  { id: "sim-015", sym: "CL", strategy: "夜盘均值回归", ver: "v1", state: "stopped", contract: "CLX6", group: "G2", tail: "4821" },
  { id: "sim-017", sym: "ZN", strategy: "利率事件", ver: "v3", state: "closed", contract: "ZNZ6", group: "G3", tail: "9043" },
]
export const DEFAULT_LINKS: Record<Sym, string> = { NQ: "sim-001", ES: "sim-011", GC: "sim-009", CL: "sim-014", ZN: "sim-016" }
export const simById = (id: string | null | undefined) => DEMO_SIMS.find((s) => s.id === id)
