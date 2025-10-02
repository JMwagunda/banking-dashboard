import React from 'react';
import { CleanedTransaction } from '../types';
import { calculateCustomerLTV } from '../utils/analytics';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const LTVChart: React.FC<{ data: CleanedTransaction[] }> = ({ data }) => {
  const customerIds = Array.from(new Set(data.map(d => d.customerId)));
  const rows = customerIds.map(cid => ({ cid, ltv: calculateCustomerLTV(cid, data) }))
    .sort((a,b) => b.ltv - a.ltv)
    .slice(0, 20);
  return (
    <div>
      <h3>Top 20 Customers by Estimated LTV</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={rows}>
          <XAxis dataKey="cid" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="ltv" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LTVChart;
