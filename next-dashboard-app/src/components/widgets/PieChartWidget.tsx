'use client';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Sector,
  Tooltip,
} from 'recharts';
import { ChartData } from '@/types/types';
import { PieSectorDataItem } from 'recharts/types/polar/Pie';
import { SectorProps } from 'recharts';

type PieChartWidgetProps = {
  data?: ChartData[];
  title?: string;
};

type ActiveShapeProps = PieSectorDataItem & SectorProps;

const COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
];

const HIGHLIGHT_COLOR = 'var(--color-card-foreground)';

export default function PieChartWidget({ data, title }: PieChartWidgetProps) {
  const demoData: ChartData[] = [
    { label: 'Apples', value: 400 },
    { label: 'Bananas', value: 300 },
    { label: 'Cherries', value: 200 },
    { label: 'Dates', value: 100 },
  ];

  const chartData = data ?? demoData;

  return (
    <div className="w-full h-full flex flex-col bg-card border border-border rounded-md p-2">
      {title && <h3 className="text-lg font-semibold mb-2 text-card-foreground">{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius="40%"
            outerRadius="70%"
            paddingAngle={3}
            label
            activeShape={(props: ActiveShapeProps) => (
              <g>
                <text
                  x={props.cx}
                  y={props.cy}
                  dy={-10}
                  textAnchor="middle"
                  fill="var(--color-primary)"
                >
                  {props.name}
                </text>
                <Sector
                  {...props}
                  outerRadius={props.outerRadius + 8}
                  fill={HIGHLIGHT_COLOR}
                />
              </g>
            )}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
