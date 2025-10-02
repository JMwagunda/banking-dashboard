import React, { useState } from 'react';
import { parseCsv } from '../utils/csv';
import { validateAndClean } from '../utils/validation';
import { CleanedTransaction, ValidationError } from '../types';

interface Props {
  onData: (clean: CleanedTransaction[], errors: ValidationError[]) => void;
}

const FileLoader: React.FC<Props> = ({ onData }) => {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string>();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setLoading(true);
    setFileName(f.name);
    try {
      const rows = await parseCsv(f);
      const { clean, errors } = validateAndClean(rows);
      onData(clean, errors);
    } catch (err) {
      console.error(err);
      onData([], [{ rowIndex: -1, reason: 'Failed to parse CSV: ' + (err as Error).message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ border: '1px dashed #ccc', padding: 12, borderRadius: 8 }}>
      <input type="file" accept=".csv,text/csv" onChange={handleFile} />
      {fileName && <div>Loaded: {fileName}</div>}
      {loading && <div>Parsing...</div>}
    </div>
  );
};

export default FileLoader;
