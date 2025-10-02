import React from 'react';
import { CleanedTransaction } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const TopBranchesChart: React.FC<{ data: CleanedTransaction[] }> = ({ data }) => {
  const totals = new Map<string, number>();
  for (const tx of data) {
    const b = tx.branchId ?? 'Unknown';
    totals.set(b, (totals.get(b) ?? 0) + Math.abs(tx.transactionAmount));
  }
  const rows = Array.from(totals.entries())
    .map(([branch, total]) => ({ branch, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);

  return (
    <div>
      <h3>Branch Performance (Total Volume)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={rows} layout="vertical">
          <XAxis type="number" />
          <YAxis type="category" dataKey="branch" width={120} />
          <Tooltip />
          <Bar dataKey="total" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TopBranchesChart;
