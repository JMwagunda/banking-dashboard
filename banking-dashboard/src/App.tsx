import React, { useMemo, useState } from 'react';
import FileLoader from './components/FileLoader';
import BranchVolumeChart from './components/BranchVolumeChart';
import SeasonalityChart from './components/SeasonalityChart';
import AnomaliesTable from './components/AnomaliesTable';
import LTVChart from './components/LTVChart';
import TopBranchesChart from './components/TopBranchesChart';
import { CleanedTransaction, ValidationError } from './types';

const App: React.FC = () => {
  const [data, setData] = useState<CleanedTransaction[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [branchFilter, setBranchFilter] = useState<string>('all');

  const branches = useMemo(() => Array.from(new Set(data.map(d => d.branchId ?? 'Unknown'))).sort(), [data]);
  const filtered = useMemo(() => branchFilter === 'all' ? data : data.filter(d => (d.branchId ?? 'Unknown') === branchFilter), [branchFilter, data]);

  function onData(clean: CleanedTransaction[], errs: ValidationError[]) {
    setData(clean);
    setErrors(errs);
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, Arial, sans-serif', padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <h1>Banking Data Visualization</h1>
      <p>Upload the CSV file located at <code>data/Comprehensive_Banking_Database.csv</code>. The app cleans, validates, and visualizes the dataset.</p>

      <FileLoader onData={onData} />

      {errors.length > 0 && (
        <details style={{ marginTop: 8 }}>
          <summary>{errors.length} data issues detected — click to expand</summary>
          <ul>
            {errors.slice(0, 200).map((e, i) => (
              <li key={i}>Row {e.rowIndex + 2}: {e.reason}</li>
            ))}
            {errors.length > 200 && <li>...and {errors.length - 200} more</li>}
          </ul>
        </details>
      )}

      {data.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' }}>
            <label>Branch filter:</label>
            <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
              <option value="all">All</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <span>Records: {filtered.length.toLocaleString()}</span>
          </div>

          <div className="grid">
            <div className="card"><BranchVolumeChart data={filtered} /></div>
            <div className="card"><SeasonalityChart data={filtered} /></div>
            <div className="card"><TopBranchesChart data={filtered} /></div>
            <div className="card"><LTVChart data={filtered} /></div>
            <div className="card"><AnomaliesTable data={filtered} /></div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
