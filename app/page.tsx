"use client"

import { useLidarStream } from "@/hooks/use-lidar-stream"
import { HudHeader } from "@/components/hud/hud-header"
import { LidarView } from "@/components/hud/lidar-view"
import { VelocityCard } from "@/components/hud/velocity-card"
import { RiskLegend } from "@/components/hud/risk-legend"
import { SystemStatus } from "@/components/hud/system-status"

export default function Page() {
  const { frame, frameRef, status, lastUpdate } = useLidarStream()
  const live = status === "live"

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-[#05070d] text-slate-200">
      <HudHeader frame={frame} />

      <div className="flex min-h-0 flex-1 gap-3 p-3">
        {/* LEFT — live perception view (~68%) */}
        <div className="min-h-0 basis-0 grow-[68]">
          <LidarView frameRef={frameRef} />
        </div>

        {/* RIGHT — metrics + legend + status (~32%) */}
        <div className="flex min-h-0 basis-0 grow-[32] flex-col gap-3">
          <VelocityCard frame={frame} live={live} />
          <RiskLegend />
          <SystemStatus status={status} lastUpdate={lastUpdate} />
        </div>
      </div>
    </main>
  )
}
