import { HUD } from "@/lib/hud-theme"

interface LegendRow {
  label: string
  color: string
  dashed?: boolean
}

const ROWS: LegendRow[] = [
  { label: "Drivable Terrain Layer", color: HUD.green },
  { label: "Static Hazards (Curbs / Walls)", color: HUD.orange },
  { label: "Dynamic Objects (Vehicles / Peds)", color: HUD.red },
  { label: "Speed-Steered Fovea Envelope", color: HUD.yellow, dashed: true },
]

export function RiskLegend() {
  return (
    <section className="rounded-md border border-slate-800/70 bg-[#0a0e17] p-5">
      <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
        Semantic Risk Map
      </h2>
      <ul className="flex flex-col gap-3">
        {ROWS.map((row) => (
          <li key={row.label} className="flex items-center gap-3">
            {row.dashed ? (
              <span
                className="h-3 w-3 shrink-0 rounded-[2px] border-2 border-dashed"
                style={{ borderColor: row.color }}
              />
            ) : (
              <span
                className="h-3 w-3 shrink-0 rounded-[2px]"
                style={{ backgroundColor: row.color }}
              />
            )}
            <span className="text-[13px] text-slate-300">{row.label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
