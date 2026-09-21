import type { LidarFrame, StreamStatus } from "./lidar-types"
import { createMockStream } from "./mock-lidar-data"

// ═══════════════════════════════════════════════════════════════════════════
//  LiDAR STREAM SOURCE  —  THE ONLY FILE TO TOUCH WHEN WIRING THE REAL BACKEND
// ═══════════════════════════════════════════════════════════════════════════
//
//  The entire UI talks to a LidarSource through `subscribe()`. It does not know
//  or care whether frames come from the in-browser mock generator or from a
//  Python FastAPI WebSocket server.
//
//  TO GO LIVE:
//    1. Set USE_MOCK = false  (or NEXT_PUBLIC_LIDAR_WS_URL in the environment).
//    2. Point WS_URL at your FastAPI endpoint, e.g. "ws://localhost:8000/ws".
//    3. Make sure the server emits JSON matching the `LidarFrame` type
//       in lib/lidar-types.ts.
//
//  Nothing in components/ needs to change.
// ═══════════════════════════════════════════════════════════════════════════

const WS_URL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_LIDAR_WS_URL) ||
  "ws://localhost:8000/ws"

// Flip to false once the FastAPI backend is running.
const USE_MOCK = !(typeof process !== "undefined" && process.env.NEXT_PUBLIC_LIDAR_WS_URL)

// Target update rate for the mock (Hz). The real backend controls its own rate.
const MOCK_HZ = 25

export interface LidarSource {
  /**
   * Begin streaming. `onFrame` fires for every frame, `onStatus` for
   * connection lifecycle changes. Returns an unsubscribe/cleanup function.
   */
  subscribe: (
    onFrame: (frame: LidarFrame) => void,
    onStatus?: (status: StreamStatus) => void,
  ) => () => void
}

// ─────────────────────────────────────────────────────────────────────────────
//  MOCK SOURCE  (default in the v0 preview / offline demo)
// ─────────────────────────────────────────────────────────────────────────────
function createMockSource(): LidarSource {
  return {
    subscribe(onFrame, onStatus) {
      onStatus?.("connecting")
      const stream = createMockStream()
      const dt = 1 / MOCK_HZ
      let raf = 0
      let last = performance.now()

      // Emit one frame immediately so the UI is never blank.
      const connectTimer = setTimeout(() => {
        onStatus?.("live")
        const tick = () => {
          const now = performance.now()
          if (now - last >= dt * 1000) {
            last = now
            onFrame(stream.next(dt))
          }
          raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      }, 350)

      return () => {
        clearTimeout(connectTimer)
        cancelAnimationFrame(raf)
        onStatus?.("disconnected")
      }
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  REAL SOURCE  (FastAPI WebSocket — used when USE_MOCK is false)
// ─────────────────────────────────────────────────────────────────────────────
function createWebSocketSource(url: string): LidarSource {
  return {
    subscribe(onFrame, onStatus) {
      let ws: WebSocket | null = null
      let closed = false
      let reconnectTimer: ReturnType<typeof setTimeout> | null = null

      const connect = () => {
        if (closed) return
        onStatus?.("connecting")
        ws = new WebSocket(url)

        ws.onopen = () => onStatus?.("live")

        ws.onmessage = (event) => {
          try {
            const frame = JSON.parse(event.data) as LidarFrame
            onFrame(frame)
          } catch {
            // Ignore malformed frames rather than tearing down the stream.
          }
        }

        ws.onclose = () => {
          onStatus?.("disconnected")
          if (!closed) {
            reconnectTimer = setTimeout(connect, 1500) // auto-reconnect
          }
        }

        ws.onerror = () => ws?.close()
      }

      connect()

      return () => {
        closed = true
        if (reconnectTimer) clearTimeout(reconnectTimer)
        ws?.close()
      }
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  FACTORY — pick the active source once, in one place.
// ─────────────────────────────────────────────────────────────────────────────
export function createLidarSource(): LidarSource {
  return USE_MOCK ? createMockSource() : createWebSocketSource(WS_URL)
}
