import React from 'react';
import { CleanedTransaction } from '../types';
import { detectAnomalousTransactions } from '../utils/analytics';

const AnomaliesTable: React.FC<{ data: CleanedTransaction[] }> = ({ data }) => {
  const anomalies = detectAnomalousTransactions(data, 3).slice(0, 100);
  return (
    <div>
      <h3>Anomalous Transactions (top 100)</h3>
      <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid #eee' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Customer</th>
              <th style={{ textAlign: 'left' }}>Date</th>
              <th style={{ textAlign: 'left' }}>Type</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'left' }}>Branch</th>
            </tr>
          </thead>
          <tbody>
            {anomalies.map((tx, i) => (
              <tr key={(tx.transactionId ?? '') + i}>
                <td>{tx.customerId}</td>
                <td>{tx.transactionDate.toISOString().slice(0,10)}</td>
                <td>{tx.transactionType}</td>
                <td style={{ textAlign: 'right' }}>{tx.transactionAmount.toFixed(2)}</td>
                <td>{tx.branchId ?? 'Unknown'}</td>
              </tr>
            ))}
            {anomalies.length === 0 && <tr><td colSpan={5} style={{ textAlign:'center' }}>No anomalies detected.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnomaliesTable;
