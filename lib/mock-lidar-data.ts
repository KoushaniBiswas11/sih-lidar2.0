import type { LidarFrame, LidarObject } from "./lidar-types"

// -----------------------------------------------------------------------------
// MOCK LiDAR DATA GENERATOR
// -----------------------------------------------------------------------------
// This is a stand-in for the real perception pipeline. It produces frames with
// the exact same shape (LidarFrame) that the FastAPI backend will emit, so the
// UI never needs to change when the real source is plugged in.
// -----------------------------------------------------------------------------

interface MockObjectState extends LidarObject {
  // internal jitter phase so pedestrians/vehicles feel organic
  phase: number
}

const RANGE_LABEL = "80 × 80 m"
const MAX_FORWARD = 78 // meters ahead before an object recycles to the far edge
const MIN_FORWARD = -8 // meters behind ego before recycling

function seedObjects(): MockObjectState[] {
  return [
    { id: 1, type: "vehicle", x: 18.5, y: -2.2, vx: 4.2, vy: 0.1, phase: 0 },
    { id: 2, type: "vehicle", x: 42.0, y: 2.8, vx: 6.5, vy: -0.05, phase: 1.2 },
    { id: 3, type: "pedestrian", x: 11.2, y: 4.6, vx: 0.1, vy: 0.6, phase: 2.1 },
    { id: 4, type: "pedestrian", x: 24.0, y: -5.1, vx: 0.0, vy: -0.4, phase: 3.4 },
    { id: 5, type: "hazard", x: 33.0, y: 4.1, vx: 0, vy: 0, phase: 0 },
    { id: 6, type: "hazard", x: 55.0, y: -4.0, vx: 0, vy: 0, phase: 0 },
    { id: 7, type: "vehicle", x: 66.0, y: -1.6, vx: 8.1, vy: 0, phase: 4.8 },
  ]
}

/**
 * Creates a stateful mock stream. Call `next()` to advance the simulation by
 * `dt` seconds and receive a fully-formed LidarFrame.
 */
export function createMockStream() {
  let objects = seedObjects()
  let speedKmh = 62
  let speedTargetKmh = 62
  let t = 0

  function retargetSpeed() {
    // Wander the target speed within a realistic urban/highway band.
    speedTargetKmh = 34 + Math.random() * 58 // 34 - 92 km/h
  }
  let sinceRetarget = 0

  function next(dt: number): LidarFrame {
    t += dt
    sinceRetarget += dt
    if (sinceRetarget > 3.5) {
      retargetSpeed()
      sinceRetarget = 0
    }

    // Ease current speed toward the target for smooth needle-like motion.
    speedKmh += (speedTargetKmh - speedKmh) * Math.min(1, dt * 0.6)
    const egoMps = speedKmh / 3.6

    objects = objects.map((o) => {
      const next = { ...o }
      next.phase += dt

      // Objects move in their own frame; relative to a moving ego, they also
      // stream backward at ego speed. Static hazards only stream backward.
      const relVx = o.vx - egoMps
      next.x = o.x + relVx * dt

      if (o.type === "pedestrian") {
        // gentle lateral sway
        next.y = o.y + o.vy * dt + Math.sin(o.phase * 1.7) * dt * 0.4
      } else {
        next.y = o.y + o.vy * dt
      }

      // Recycle objects that fall behind or run off the far edge so the scene
      // stays populated indefinitely.
      if (next.x < MIN_FORWARD) {
        next.x = MAX_FORWARD
        next.y = (Math.random() - 0.5) * 9
      } else if (next.x > MAX_FORWARD) {
        next.x = MIN_FORWARD
        next.y = (Math.random() - 0.5) * 9
      }

      // Keep lateral position inside a believable corridor band.
      next.y = Math.max(-6.5, Math.min(6.5, next.y))
      return next
    })

    return {
      timestamp: Date.now(),
      vehicle_speed: Math.round(speedKmh),
      fps: 24.5 + Math.sin(t * 0.9) * 1.4 + (Math.random() - 0.5) * 0.4,
      latency: 18.5 + Math.sin(t * 1.3) * 2.2 + (Math.random() - 0.5) * 1.1,
      range: RANGE_LABEL,
      fovea: { near: 5, mid: 15, far: 50 },
      objects: objects.map(({ phase, ...rest }) => rest),
    }
  }

  return { next }
}
