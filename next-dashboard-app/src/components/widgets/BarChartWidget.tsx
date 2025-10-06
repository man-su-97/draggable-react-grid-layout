'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip,
  Cell,
} from 'recharts';
import { ChartData } from '@/types/types';

type BarChartWidgetProps = {
  /** Array of label–value pairs for bar data */
  data?: ChartData[];
  /** Chart title shown above the visualization */
  title?: string;
};

export default function BarChartWidget({ data, title }: BarChartWidgetProps) {
  // Fallback demo data (used when widget is empty)
  const demoData: ChartData[] = [
    { label: 'Jan', value: 400 },
    { label: 'Feb', value: 300 },
    { label: 'Mar', value: 500 },
    { label: 'Apr', value: 200 },
  ];

  const chartData = data ?? demoData;

  // Color palette from theme variables
  const COLORS = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-5)',
  ];

  return (
    <div className="w-full h-full flex flex-col bg-card border border-border rounded-md p-2">
      {title && (
        <h3 className="text-lg font-semibold mb-2 text-card-foreground">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-muted)" />
          <XAxis dataKey="label" stroke="var(--color-muted-foreground)" />
          <YAxis stroke="var(--color-muted-foreground)" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-card-foreground)',
            }}
          />
          <Legend />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                className="transition-all duration-300 hover:opacity-80"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
