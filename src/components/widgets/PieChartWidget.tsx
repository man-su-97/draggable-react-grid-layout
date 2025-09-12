"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

type PieChartWidgetProps = {
  data?: Array<{ label: string; value: number }>;
  title?: string;
};

// 🎨 Expanded color palette (Tailwind-inspired)
const COLORS = [
  "#f87171", // red
  "#60a5fa", // blue
  "#34d399", // green
  "#fbbf24", // yellow
  "#a78bfa", // purple
  "#fb923c", // orange
  "#22d3ee", // cyan
  "#e879f9", // pink
];

export default function PieChartWidget({ data, title }: PieChartWidgetProps) {
  const demoData = [
    { label: "Apples", value: 400 },
    { label: "Bananas", value: 300 },
    { label: "Cherries", value: 200 },
    { label: "Dates", value: 100 },
  ];

  const chartData = data ?? demoData;

  return (
    <div className="w-full h-full flex flex-col">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius="40%" // donut style
            outerRadius="70%"
            paddingAngle={3}
            label
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
