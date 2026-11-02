interface Props {
  seed: number
  width: number
  height: number
  className?: string
  strokeWidth?: number
  down?: boolean
}

// Deterministic pseudo-random equity curve (upward bias with a drawdown).
function buildSeries(seed: number, count: number, down: boolean): number[] {
  let s = seed * 9301 + 49297
  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  const pts: number[] = []
  let v = 0
  for (let i = 0; i < count; i++) {
    const drift = down ? -0.85 : 0.9
    const dip = !down && i > count * 0.55 && i < count * 0.72 ? -3.2 : 0
    v += (rand() - (down ? 0.55 : 0.42)) * 4 + drift + dip
    pts.push(v)
  }
  return pts
}

export default function EquityCurve({ seed, width, height, className, strokeWidth = 1.5, down = false }: Props) {
  const count = 90
  const pts = buildSeries(seed, count, down)
  const color = down ? "#ef4444" : "#22c55e"
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const range = max - min || 1
  const pad = 4
  const usableH = height - pad * 2

  const coords = pts.map((p, i) => {
    const x = (i / (count - 1)) * width
    const y = pad + usableH - ((p - min) / range) * usableH
    return [x, y] as const
  })

  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const area = `${line} L${width},${height} L0,${height} Z`
  const gid = `eq-${seed}`

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" />
    </svg>
  )
}
