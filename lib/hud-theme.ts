// Semantic color palette shared by the panels and the canvas renderer.
// Kept in one place so the HUD and the LiDAR view stay perfectly in sync.

export const HUD = {
  bg: "#05070d",
  panel: "#0a0e17",
  panelBorder: "rgba(148, 163, 184, 0.14)",
  gridLine: "rgba(148, 163, 184, 0.10)",

  cyan: "#22d3ee", // primary system / ego
  green: "#22c55e", // drivable terrain
  greenDim: "rgba(34, 197, 94, 0.16)",
  orange: "#f59e0b", // static hazards / boundaries
  red: "#fb2c6b", // dynamic objects
  yellow: "#eab308", // fovea envelope

  text: "#e2e8f0",
  textDim: "#64748b",
} as const
