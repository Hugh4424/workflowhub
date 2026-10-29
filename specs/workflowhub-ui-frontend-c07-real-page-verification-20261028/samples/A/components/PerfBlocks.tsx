import type { ReactNode } from "react"
import EquityCurve from "./EquityCurve"

/* 策略列表 / 模拟列表共用：六项指标 + 权益曲线 */

export interface SixMetrics {
  netProfit: string; maxDrawdown: string; winRate: string; orderCount: string; sharpe: string; profitFactor: string
}

function Metric({ label, top, bottomLabel, bottom, topGreen, bottomRed }: {
  label: string
  top: string
  bottomLabel: string
  bottom: string
  topGreen?: boolean
  bottomRed?: boolean
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className={`mt-1 text-[17px] font-semibold tabular-nums ${topGreen ? "text-emerald-400" : "text-slate-100"}`}>{top}</div>
      <div className="mt-3 text-[11px] text-slate-500">{bottomLabel}</div>
      <div className={`mt-1 text-[15px] font-medium tabular-nums ${bottomRed ? "text-rose-400" : "text-slate-200"}`}>{bottom}</div>
    </div>
  )
}

/** 六项指标；m 为空时以同宽占位显示 empty */
export function MetricsBlock({ m, empty }: { m: SixMetrics | null; empty?: ReactNode }) {
  if (!m) {
    return (
      <div className="flex h-[104px] w-full max-w-[300px] shrink-0 items-center justify-center rounded-lg border border-dashed border-white/[0.06] px-4 text-center text-[12px] text-slate-500">
        {empty ?? "六项表现不可计算"}
      </div>
    )
  }
  return (
    <div className="flex w-full max-w-[300px] shrink-0 justify-between gap-4 sm:gap-8">
      <Metric label="净利润" top={m.netProfit} bottomLabel="最大回撤" bottom={m.maxDrawdown} topGreen={!m.netProfit.startsWith("-")} bottomRed />
      <Metric label="胜率" top={m.winRate} bottomLabel="订单数量" bottom={m.orderCount} />
      <Metric label="夏普" top={m.sharpe} bottomLabel="盈亏比" bottom={m.profitFactor} />
    </div>
  )
}

/** 权益曲线卡；seed 为空时居中显示 empty，保留顶部标签与底部日期 */
export function EquityBlock({ title, right, seed, startDate, endDate, maxDrawdown, empty }: {
  title: string; right: string; seed: number | null; startDate: string; endDate: string; maxDrawdown?: string; empty?: string
}) {
  return (
    <div className="hidden shrink-0 xl:block">
      <div className="w-[280px] rounded-lg border border-white/[0.06] bg-[#0a0e16] p-2.5">
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>{title}</span>
          <span>{right}</span>
        </div>
        <div className="relative mt-1 h-[70px]">
          {seed != null ? (
            <EquityCurve seed={seed} width={256} height={70} />
          ) : (
            <div className="flex h-full items-center justify-center text-[11px] text-slate-600">{empty ?? "无法绘制"}</div>
          )}
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-600">
          <span>{startDate}</span>
          {maxDrawdown && <span className="text-rose-400/80">最大回撤 {maxDrawdown}</span>}
          <span>{endDate}</span>
        </div>
      </div>
    </div>
  )
}
