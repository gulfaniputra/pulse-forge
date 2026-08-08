'use client';

import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface MetricsDataPoint {
  day: string;
  flagKey: string;
  count: number;
}

interface FlagMetricsChartProps {
  data: MetricsDataPoint[];
}

export function FlagMetricsChart({ data }: FlagMetricsChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-sm">
        No evaluation data available in the last 7 days.
      </div>
    );
  }

  // Transform data for Recharts & group by date.
  const grouped: Record<string, Record<string, number>> = {};
  data.forEach((item) => {
    const date = new Date(item.day).toISOString().split('T')[0];
    if (!grouped[date]) grouped[date] = {};
    grouped[date][item.flagKey] = (grouped[date][item.flagKey] || 0) + item.count;
  });

  const chartData = Object.entries(grouped).map(([date, counts]) => ({
    date,
    ...counts,
  }));

  const flagKeys = [...new Set(data.map((d) => d.flagKey))];
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <XAxis dataKey="date" stroke="#64748b" />
        <YAxis stroke="#64748b" allowDecimals={false} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
          labelStyle={{ color: '#e2e8f0' }}
        />
        <Legend wrapperStyle={{ color: '#e2e8f0' }} />
        {flagKeys.map((key, index) => (
          <Bar key={key} dataKey={key} fill={colors[index % colors.length]} stackId="stack" />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
