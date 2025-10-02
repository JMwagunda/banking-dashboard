import React from 'react';
import { CleanedTransaction } from '../types';
import { getMonthlyVolumeByBranch } from '../utils/analytics';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

function toDataset(vol: Map<string, Map<string, number>>) {
  const monthsSet = new Set<string>();
  for (const [, byMonth] of vol) {
    for (const m of byMonth.keys()) monthsSet.add(m);
  }
  const months = Array.from(monthsSet).sort();
  const branches = Array.from(vol.keys()).sort();

  return months.map(month => {
    const row: Record<string, number | string> = { month };
    for (const b of branches) {
      row[b] = vol.get(b)?.get(month) ?? 0;
    }
    return row;
  });
}

const BranchVolumeChart: React.FC<{ data: CleanedTransaction[] }> = ({ data }) => {
  const vol = getMonthlyVolumeByBranch(data);
  const chartData = toDataset(vol);
  const branches = Array.from(vol.keys()).sort();
  const colors = ['#8884d8','#82ca9d','#ffc658','#ff7f50','#8dd1e1','#a4de6c','#d0ed57','#a28bff'];
  return (
    <div>
      <h3>Monthly Transaction Volume by Branch</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          {branches.map((b, i) => (
            <Bar key={b} dataKey={b} stackId="a" fill={colors[i % colors.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BranchVolumeChart;
