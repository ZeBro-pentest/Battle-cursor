import type React from "react";

export function getCanvasStyle(activeEffects: Set<string>): React.CSSProperties {
  const filters: string[] = [];
  if (activeEffects.has("blur")) filters.push("blur(4px)");
  if (activeEffects.has("darkness")) filters.push("brightness(0.05)");
  return filters.length ? { filter: filters.join(" ") } : {};
}
