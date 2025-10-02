import React from 'react';
import { CleanedTransaction } from '../types';
import { format } from 'date-fns';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

const SeasonalityChart: React.FC<{ data: CleanedTransaction[] }> = ({ data }) => {
  const byMonth = new Map<string, number>();
  for (const tx of data) {
    const m = format(tx.transactionDate, 'yyyy-MM');
    byMonth.set(m, (byMonth.get(m) ?? 0) + Math.abs(tx.transactionAmount));
  }
  const chartData = Array.from(byMonth.entries()).map(([month, total]) => ({ month, total })).sort((a,b)=> a.month.localeCompare(b.month));
  return (
    <div>
      <h3>Seasonal Trends (Monthly Total Volume)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="total" stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SeasonalityChart;
