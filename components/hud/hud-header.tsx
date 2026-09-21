import type { LidarFrame } from "@/lib/lidar-types"

interface HudHeaderProps {
  frame: LidarFrame | null
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex flex-col items-end gap-0.5 px-4 first:pl-0 last:pr-0">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      <span
        className="font-mono text-sm font-semibold tabular-nums tracking-tight"
        style={{ color: accent ? "#22d3ee" : "#e2e8f0" }}
      >
        {value}
      </span>
    </div>
  )
}

export function HudHeader({ frame }: HudHeaderProps) {
  const latency = frame ? `${frame.latency.toFixed(1)} ms` : "-- ms"
  const fps = frame ? frame.fps.toFixed(1) : "--"
  const range = frame?.range ?? "-- × -- m"
  const tier = frame ? `${frame.fovea.near} cm / ${frame.fovea.far} cm` : "-- / --"

  return (
    <header className="flex items-center justify-between border-b border-slate-800/60 bg-[#070a12] px-6 py-3">
      <div className="flex flex-col">
        <h1 className="text-lg font-bold tracking-[0.14em] text-cyan-400">
          FOVEAGRID HUD
        </h1>
        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
          Adaptive Variable-Resolution 2.5D LiDAR Perception
        </p>
      </div>

      <div className="flex items-stretch divide-x divide-slate-800/70">
        <Metric label="Latency" value={latency} accent />
        <Metric label="FPS" value={fps} />
        <Metric label="Range" value={range} />
        <Metric label="Grid Tier" value={tier} accent />
      </div>
    </header>
  )
}
