"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useT } from "@/components/i18n-provider";

export function TrendChart({
  completion,
  activity,
  labels,
}: {
  completion: { month: string; count: number }[];
  activity: { month: string; hours: number }[];
  labels: { completion: string; activity: string };
}) {
  const t = useT();
  const months = [...new Set([...completion.map((c) => c.month), ...activity.map((a) => a.month)])].sort();
  const data = months.map((month) => ({
    month,
    completions: completion.find((c) => c.month === month)?.count ?? 0,
    hours: activity.find((a) => a.month === month)?.hours ?? 0,
  }));

  if (data.length === 0) {
    return <p className="text-sm text-[var(--brand-muted)]">{t("form.noActivityYet")}</p>;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="var(--brand-line)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "var(--brand-muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--brand-line)" }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: "var(--brand-muted)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: "var(--brand-muted)" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid var(--brand-line)",
              fontSize: 12,
              boxShadow: "var(--shadow-card)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            yAxisId="left"
            dataKey="completions"
            name={labels.completion}
            fill="var(--brand-red)"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="hours"
            name={labels.activity}
            stroke="var(--brand-ink)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
