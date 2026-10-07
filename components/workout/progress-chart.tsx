"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMeasure } from "@/lib/workout/format-progress";
import type { ProgressPoint } from "@/lib/workout/types";

type ProgressChartProps = {
  points: ProgressPoint[];
};

export function ProgressChart({ points }: ProgressChartProps) {
  if (points.length < 2) return null;

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = min === max ? Math.max(Math.abs(min) * 0.08, 1) : (max - min) * 0.25;
  const unit = points[points.length - 1]?.unit ?? "";

  const data = points.map((point) => ({
    label: point.label,
    value: point.value,
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e3e1db" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#5c675f" }}
            axisLine={{ stroke: "#e3e1db" }}
            tickLine={false}
          />
          <YAxis
            domain={[min - pad, max + pad]}
            tick={{ fontSize: 12, fill: "#5c675f" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            formatter={(value) => [
              formatMeasure(Number(value), unit),
              unit === "s" ? "Duración" : "Carga",
            ]}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#1f8a56"
            strokeWidth={2}
            dot={{ r: 4, fill: "#1f8a56", stroke: "#1f8a56" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
