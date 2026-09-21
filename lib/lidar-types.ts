// Shared data contract for the LiDAR perception stream.
// These types define the exact shape of every frame the UI consumes,
// whether it comes from the mock generator or the real FastAPI backend.

export type LidarObjectType = "vehicle" | "pedestrian" | "hazard"

export interface LidarObject {
  id: number
  type: LidarObjectType
  /** forward distance from ego, in meters (+ = ahead) */
  x: number
  /** lateral offset from ego, in meters (+ = left) */
  y: number
  /** longitudinal velocity, m/s */
  vx: number
  /** lateral velocity, m/s */
  vy: number
}

export interface FoveaTiers {
  /** near ring resolution, cm (0-10 m) */
  near: number
  /** mid ring resolution, cm (10-30 m) */
  mid: number
  /** far ring resolution, cm (30-100 m) */
  far: number
}

export interface LidarFrame {
  timestamp: number
  /** longitudinal velocity in km/h */
  vehicle_speed: number
  fps: number
  /** perception pipeline latency, ms */
  latency: number
  /** human-readable coverage, e.g. "80 × 80 m" */
  range: string
  objects: LidarObject[]
  fovea: FoveaTiers
}

export type StreamStatus = "connecting" | "live" | "disconnected"
