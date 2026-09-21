import type { LidarFrame } from "@/lib/lidar-types"

interface VelocityCardProps {
  frame: LidarFrame | null
  live: boolean
}

export function VelocityCard({ frame, live }: VelocityCardProps) {
  const speed = frame ? frame.vehicle_speed : 0

  return (
    <section className="relative flex flex-col items-center justify-center rounded-md border border-slate-800/70 bg-[#0a0e17] px-6 py-8">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
          Longitudinal Velocity
        </span>
      </div>

      <div className="mt-4 flex items-baseline">
        <span className="font-mono text-7xl font-bold leading-none tabular-nums text-white tracking-tight">
          {speed}
        </span>
      </div>
      <span className="mt-3 text-xs uppercase tracking-[0.3em] text-slate-500">
        km / h
      </span>

      <div className="absolute right-3 top-3 flex items-center gap-1.5">
        <span
          className={`h-1.5 w-1.5 rounded-full ${live ? "animate-pulse bg-cyan-400" : "bg-slate-600"}`}
        />
        <span
          className="text-[9px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: live ? "#22d3ee" : "#64748b" }}
        >
          {live ? "Live" : "Idle"}
        </span>
      </div>
    </section>
  )
}
