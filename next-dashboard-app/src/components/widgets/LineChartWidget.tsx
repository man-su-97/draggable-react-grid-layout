'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
} from 'recharts';
import { ChartData } from '@/types/types';

type LineChartWidgetProps = {
  data?: ChartData[];
  title?: string;
};

export default function LineChartWidget({ data, title }: LineChartWidgetProps) {
  // Fallback demo dataset
  const demoData: ChartData[] = [
    { label: 'Jan', value: 400 },
    { label: 'Feb', value: 300 },
    { label: 'Mar', value: 200 },
    { label: 'Apr', value: 278 },
    { label: 'May', value: 189 },
    { label: 'Jun', value: 239 },
    { label: 'Jul', value: 349 },
  ];

  // Use incoming data or demo fallback
  const chartData = data ?? demoData;

  // Chart styling colors
  const COLORS = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-5)',
  ];

  return (
    <div className="w-full h-full flex flex-col bg-card border border-border rounded-md p-2">
      {title && <h3 className="text-lg font-semibold mb-2 text-card-foreground">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData.map((d) => ({ label: d.label, value: d.value }))}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-muted)" />
          <XAxis dataKey="label" stroke="var(--color-muted-foreground)" />
          <YAxis stroke="var(--color-muted-foreground)" />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke={COLORS[0]}
            strokeWidth={2}
            dot={{
              r: 3,
              stroke: 'var(--color-background)',
              strokeWidth: 1,
              fill: COLORS[0],
            }}
            activeDot={{
              r: 7,
              fill: 'var(--color-primary)',
              stroke: 'white',
              strokeWidth: 2,
              style: { filter: 'drop-shadow(0 0 6px var(--color-primary))' },
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
