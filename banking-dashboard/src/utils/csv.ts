import Papa, { ParseResult } from 'papaparse';
import { RawCsvRow } from '../types';

export function parseCsv(file: File): Promise<RawCsvRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawCsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results: ParseResult<RawCsvRow>) => {
        resolve(results.data);
      },
      error: (err: unknown) => reject(err as any)
    });
  });
}
