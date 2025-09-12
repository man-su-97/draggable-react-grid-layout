"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

type BarChartWidgetProps = {
  data?: Array<{ label: string; value: number }>;
  title?: string;
};

export default function BarChartWidget({ data, title }: BarChartWidgetProps) {
  const demoData = [
    { label: "Jan", value: 400 },
    { label: "Feb", value: 300 },
    { label: "Mar", value: 500 },
    { label: "Apr", value: 200 },
  ];

  const chartData = data ?? demoData;

  // 🎨 Define colors (Tailwind palette, but you can customize)
  const colors = ["#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa"];

  return (
    <div className="w-full h-full flex flex-col">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value">
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
