"use client"

import { useEffect, useState } from "react"
import type { StreamStatus } from "@/lib/lidar-types"

interface SystemStatusProps {
  status: StreamStatus
  lastUpdate: number
}

export function SystemStatus({ status, lastUpdate }: SystemStatusProps) {
  const [ago, setAgo] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setAgo(Date.now() - lastUpdate), 120)
    return () => clearInterval(id)
  }, [lastUpdate])

  const live = status === "live"
  const streamText =
    status === "live"
      ? "LiDAR STREAM CONNECTED"
      : status === "connecting"
        ? "ESTABLISHING LiDAR STREAM"
        : "LiDAR STREAM LOST"

  return (
    <section className="flex items-center justify-between rounded-md border border-slate-800/70 bg-[#0a0e17] px-5 py-3">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2.5 w-2.5">
          {live && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
          )}
          <span
            className="relative inline-flex h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: live ? "#22c55e" : "#64748b" }}
          />
        </span>
        <div className="flex flex-col leading-tight">
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: live ? "#22c55e" : "#94a3b8" }}
          >
            {live ? "System Live" : "System Standby"}
          </span>
          <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
            {streamText}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end leading-tight">
        <span className="text-[9px] uppercase tracking-[0.16em] text-slate-500">
          Last Update
        </span>
        <span className="font-mono text-xs tabular-nums text-slate-300">
          {Math.round(ago)} ms ago
        </span>
      </div>
    </section>
  )
}
