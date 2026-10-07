import type { ProgressPoint } from "@/lib/workout/types";

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

export function formatMeasure(value: number, unit: string): string {
  return `${formatNumber(value)} ${unit}`;
}

export function formatDelta(delta: number, unit: string): string {
  const amount = formatNumber(Math.abs(delta));
  if (delta > 0) return `+${amount} ${unit}`;
  if (delta < 0) return `−${amount} ${unit}`;
  return `0 ${unit}`;
}

export function formatLatest(point: ProgressPoint | undefined): string {
  if (!point) return "—";
  if (point.durationSec != null) return formatMeasure(point.durationSec, "s");
  if (point.left || point.right) {
    const loads = [point.left?.load, point.right?.load].filter(
      (load): load is number => load != null,
    );
    return `${loads.map(formatNumber).join(" · ")} ${point.unit}`;
  }
  return formatMeasure(point.value, point.unit);
}

export function formatSetDetail(point: ProgressPoint): string {
  if (point.durationSec != null) return `${formatNumber(point.durationSec)} s`;
  if (point.left || point.right) {
    const parts: string[] = [];
    if (point.left) {
      parts.push(`L ${formatNumber(point.left.load)} × ${point.left.reps ?? "—"}`);
    }
    if (point.right) {
      parts.push(`R ${formatNumber(point.right.load)} × ${point.right.reps ?? "—"}`);
    }
    return parts.join(" · ");
  }
  if (point.reps != null) return `${formatNumber(point.value)} × ${point.reps}`;
  return formatNumber(point.value);
}

export function progressCaption(point: ProgressPoint): string {
  return point.durationSec != null ? "longest set" : "heaviest set of the last workout";
}
