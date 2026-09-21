"use client"

import { useEffect, useRef, useState } from "react"
import { createLidarSource } from "@/lib/lidar-source"
import type { LidarFrame, StreamStatus } from "@/lib/lidar-types"

/**
 * Subscribes to the active LiDAR source and exposes the latest frame + status.
 *
 * `frameRef` always holds the most recent frame without triggering re-renders,
 * so the high-frequency canvas can read it inside its own animation loop while
 * the React panels update from `frame` state at a comfortable cadence.
 */
export function useLidarStream() {
  const [frame, setFrame] = useState<LidarFrame | null>(null)
  const [status, setStatus] = useState<StreamStatus>("connecting")
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())
  const frameRef = useRef<LidarFrame | null>(null)

  useEffect(() => {
    const source = createLidarSource()
    const unsubscribe = source.subscribe(
      (next) => {
        frameRef.current = next
        setFrame(next)
        setLastUpdate(Date.now())
      },
      (next) => setStatus(next),
    )
    return unsubscribe
  }, [])

  return { frame, frameRef, status, lastUpdate }
}
