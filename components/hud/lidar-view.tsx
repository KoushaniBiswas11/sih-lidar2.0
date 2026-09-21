"use client"

import { useEffect, useRef } from "react"
import { HUD } from "@/lib/hud-theme"
import type { LidarFrame, LidarObject } from "@/lib/lidar-types"

interface LidarViewProps {
  frameRef: React.MutableRefObject<LidarFrame | null>
}

// Visible forward window in meters (rings are drawn at 10/20/30 m).
const VISIBLE_RANGE = 46
const CORRIDOR_HALF_WIDTH = 3.6 // meters from center to each road boundary
const LABEL_RINGS = [10, 20, 30]

interface DisplayObject extends LidarObject {
  sx: number // smoothed forward (m)
  sy: number // smoothed lateral (m)
}

export function LidarView({ frameRef }: LidarViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // Smoothed positions keyed by object id, so objects glide instead of teleport.
  const displayRef = useRef<Map<number, DisplayObject>>(new Map())

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    let width = 0
    let height = 0
    let dpr = 1

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = container.clientWidth
      height = container.clientHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    const render = () => {
      const frame = frameRef.current
      const cx = width / 2
      const egoY = height * 0.82
      const topPad = height * 0.06
      const ppm = (egoY - topPad) / VISIBLE_RANGE // pixels per meter

      const toX = (lateral: number) => cx - lateral * ppm
      const toY = (forward: number) => egoY - forward * ppm

      // ---- clear ----
      ctx.fillStyle = HUD.bg
      ctx.fillRect(0, 0, width, height)

      // ---- drivable corridor (green) ----
      const roadLeft = toX(CORRIDOR_HALF_WIDTH)
      const roadRight = toX(-CORRIDOR_HALF_WIDTH)
      ctx.fillStyle = HUD.greenDim
      ctx.fillRect(roadLeft, 0, roadRight - roadLeft, height)

      // ---- orange road boundaries ----
      ctx.strokeStyle = HUD.orange
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(roadLeft, 0)
      ctx.lineTo(roadLeft, height)
      ctx.moveTo(roadRight, 0)
      ctx.lineTo(roadRight, height)
      ctx.stroke()

      // ---- concentric distance rings ----
      ctx.font = "10px ui-monospace, monospace"
      for (const r of LABEL_RINGS) {
        const radius = r * ppm
        ctx.beginPath()
        ctx.strokeStyle = HUD.gridLine
        ctx.lineWidth = 1
        ctx.arc(cx, egoY, radius, Math.PI, 2 * Math.PI)
        ctx.stroke()
        ctx.fillStyle = HUD.textDim
        ctx.textAlign = "center"
        ctx.fillText(`${r}m`, cx, egoY - radius + 12)
      }

      // ---- speed-steered fovea envelope (yellow dashed) ----
      const speed = frame?.vehicle_speed ?? 0
      // Elongate forward with speed; keep a stable lateral half-width.
      const foveaForward = 12 + speed * 0.22 // meters ahead
      const foveaBack = 5
      const foveaHalfW = 7.5
      const fCenterY = toY((foveaForward - foveaBack) / 2)
      const fRadiusY = ((foveaForward + foveaBack) / 2) * ppm
      const fRadiusX = foveaHalfW * ppm
      ctx.save()
      ctx.setLineDash([6, 5])
      ctx.strokeStyle = HUD.yellow
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.ellipse(cx, fCenterY, fRadiusX, fRadiusY, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()

      // ---- adaptive resolution tier labels ----
      ctx.textAlign = "left"
      ctx.font = "9px ui-monospace, monospace"
      ctx.fillStyle = "rgba(234, 179, 8, 0.75)"
      const tierX = roadRight + 10
      ctx.fillText(`${frame?.fovea.near ?? 5} cm`, tierX, toY(6))
      ctx.fillText(`${frame?.fovea.mid ?? 15} cm`, tierX, toY(20))
      ctx.fillText(`${frame?.fovea.far ?? 50} cm`, tierX, toY(38))

      // ---- objects (smoothed) ----
      if (frame) {
        const seen = new Set<number>()
        for (const o of frame.objects) {
          seen.add(o.id)
          const prev = displayRef.current.get(o.id)
          if (!prev) {
            displayRef.current.set(o.id, { ...o, sx: o.x, sy: o.y })
          } else {
            // If an object recycled across the map, snap instead of sliding.
            const jumped = Math.abs(o.x - prev.sx) > 30
            const ease = 0.18
            prev.sx = jumped ? o.x : prev.sx + (o.x - prev.sx) * ease
            prev.sy = jumped ? o.y : prev.sy + (o.y - prev.sy) * ease
            prev.type = o.type
            prev.vx = o.vx
            prev.vy = o.vy
          }
        }
        for (const id of displayRef.current.keys()) {
          if (!seen.has(id)) displayRef.current.delete(id)
        }

        for (const o of displayRef.current.values()) {
          drawObject(ctx, o, toX(o.sy), toY(o.sx), ppm)
        }
      }

      // ---- ego vehicle (cyan triangle) ----
      drawEgo(ctx, cx, egoY)

      raf = requestAnimationFrame(render)
    }

    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [frameRef])

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-md border border-slate-800/70 bg-[#05070d]"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      <span className="pointer-events-none absolute left-4 top-3 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
        Live LiDAR Perception · Bird&apos;s-Eye View
      </span>
    </div>
  )
}

function drawEgo(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save()
  ctx.fillStyle = HUD.cyan
  ctx.shadowColor = HUD.cyan
  ctx.shadowBlur = 10
  ctx.beginPath()
  ctx.moveTo(x, y - 12)
  ctx.lineTo(x - 9, y + 9)
  ctx.lineTo(x + 9, y + 9)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // subtle heading line
  ctx.strokeStyle = "rgba(34, 211, 238, 0.35)"
  ctx.lineWidth = 1
  ctx.setLineDash([3, 4])
  ctx.beginPath()
  ctx.moveTo(x, y - 12)
  ctx.lineTo(x, y - 60)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawObject(
  ctx: CanvasRenderingContext2D,
  o: DisplayObject,
  x: number,
  y: number,
  ppm: number,
) {
  const dynamic = o.type === "vehicle" || o.type === "pedestrian"
  const color = dynamic ? HUD.red : HUD.orange
  const distance = Math.hypot(o.sx, o.sy)

  if (o.type === "vehicle") {
    const w = 2.0 * ppm
    const h = 4.2 * ppm
    ctx.fillStyle = color
    ctx.strokeStyle = "rgba(34, 197, 94, 0.9)"
    ctx.lineWidth = 1.5
    ctx.beginPath()
    roundRect(ctx, x - w / 2, y - h / 2, w, h, 3)
    ctx.fill()
    ctx.stroke()
  } else if (o.type === "pedestrian") {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, 4.5, 0, Math.PI * 2)
    ctx.fill()
  } else {
    // static hazard: short orange bar
    const w = 1.2 * ppm
    const h = 1.6 * ppm
    ctx.fillStyle = color
    ctx.fillRect(x - w / 2, y - h / 2, w, h)
  }

  // Only label nearby / high-risk objects to avoid clutter.
  if (dynamic && distance < 26 && o.sx > -2) {
    const speedKmh = Math.round(Math.hypot(o.vx, o.vy) * 3.6)
    ctx.textAlign = "left"
    ctx.fillStyle = HUD.text
    ctx.font = "bold 9px ui-monospace, monospace"
    const lx = x + 12
    const ly = y - 6
    ctx.fillText(o.type.toUpperCase(), lx, ly)
    ctx.fillStyle = HUD.textDim
    ctx.font = "9px ui-monospace, monospace"
    ctx.fillText(`${distance.toFixed(1)} m`, lx, ly + 11)
    ctx.fillText(`${speedKmh} km/h`, lx, ly + 22)
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
}
