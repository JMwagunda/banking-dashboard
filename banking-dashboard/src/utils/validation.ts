import { CleanedTransaction, RawCsvRow, ValidationError } from '../types';
import { parseAmount, normalizeGender, parseDate, normalizeTransactionType } from './parsing';

const EPS = 0.01;
const MIN_AGE = 18;
const MAX_AGE = 120;

function close(a: number, b: number, eps = EPS): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) <= eps;
}

export function rowToCleaned(row: RawCsvRow, rowIndex: number): CleanedTransaction | null {
  const customerId = Number(row['Customer ID'] ?? row['CustomerID']);
  const transactionDate = parseDate(row['Transaction Date'] ?? row['Last Transaction Date']);
  const transactionType = normalizeTransactionType(row['Transaction Type']);
  const transactionAmount = parseAmount(row['Transaction Amount']);
  const accountBalanceAfter = parseAmount(row['Account Balance After Transaction'] ?? row['Account Balance']);
  const age = row['Age'] != null && row['Age'] !== '' ? Number(row['Age']) : undefined;
  const gender = normalizeGender(row['Gender']);
  const transactionId = (row['TransactionID'] ?? row['Transaction Id'] ?? row['TxnID'] ?? '').toString() || undefined;
  const accountOpeningDate = parseDate(row['Date Of Account Opening'] ?? row['Account Opening Date']);
  const lastTransactionDate = parseDate(row['Last Transaction Date']);

  if (!Number.isFinite(customerId) || !transactionDate || !Number.isFinite(transactionAmount)) {
    return null;
  }

  return {
    customerId,
    name: [row['First Name'], row['Last Name']].filter(Boolean).join(' ') || undefined,
    age: age,
    gender,
    accountType: row['Account Type'],
    branchId: (row['Branch ID'] ?? row['Branch Code'] ?? '').toString() || undefined,
    transactionId,
    transactionDate,
    transactionType,
    transactionAmount,
    accountBalanceAfter: Number.isFinite(accountBalanceAfter) ? accountBalanceAfter : undefined,
    accountOpeningDate,
    lastTransactionDate,
    raw: row
  };
}

export function validateAndClean(rows: RawCsvRow[]): { clean: CleanedTransaction[]; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const clean: CleanedTransaction[] = [];
  const seenTxn = new Set<string>();
  const ageByCustomer = new Map<number, number>();
  const lastBalanceByCustomer = new Map<number, number>();

  rows.forEach((row, idx) => {
    const ct = rowToCleaned(row, idx);
    if (!ct) {
      errors.push({ rowIndex: idx, reason: 'Missing required fields (CustomerID, TransactionDate, TransactionAmount).', row });
      return;
    }

    // Deduplicate by TransactionID if present, else by composite key
    const stableKey = ct.transactionId
      ? `id:${ct.transactionId}`
      : `k:${ct.customerId}|${ct.transactionDate.toISOString()}|${ct.transactionType}|${ct.transactionAmount}|${ct.branchId ?? ''}`;
    if (seenTxn.has(stableKey)) {
      errors.push({ rowIndex: idx, reason: 'Duplicate transaction', row });
      return;
    }
    seenTxn.add(stableKey);

    // Age range
    if (ct.age !== undefined && (ct.age < MIN_AGE || ct.age > MAX_AGE)) {
      errors.push({ rowIndex: idx, reason: `Age out of range [${MIN_AGE}-${MAX_AGE}]`, row });
      // We drop this record
      return;
    }
    // Age consistency
    if (ct.age !== undefined) {
      if (!ageByCustomer.has(ct.customerId)) {
        ageByCustomer.set(ct.customerId, ct.age);
      } else {
        const baseAge = ageByCustomer.get(ct.customerId)!;
        if (ct.age !== baseAge) {
          errors.push({ rowIndex: idx, reason: `Age inconsistency for customer ${ct.customerId} (saw ${ct.age}, expected ${baseAge})`, row });
          // Keep record but null out inconsistent age to avoid propagating bad data
          ct.age = undefined;
        }
      }
    }

    // Deposit must be positive
    if (ct.transactionType === 'Deposit' && ct.transactionAmount <= 0) {
      errors.push({ rowIndex: idx, reason: 'Deposit amount must be positive', row });
      return;
    }

    // Balance reconciliation if we have balances
    if (ct.accountBalanceAfter !== undefined) {
      const prev = lastBalanceByCustomer.get(ct.customerId);
      if (prev !== undefined) {
        let expected = prev;
        if (ct.transactionType === 'Deposit') expected = prev + ct.transactionAmount;
        else if (ct.transactionType === 'Withdrawal' || ct.transactionType === 'Payment' || ct.transactionType === 'Fee') expected = prev - ct.transactionAmount;
        else if (ct.transactionType === 'Transfer') {
          // Unknown direction; skip strict check
          expected = ct.accountBalanceAfter;
        }
        if (!close(ct.accountBalanceAfter, expected)) {
          errors.push({
            rowIndex: idx,
            reason: `Balance mismatch. Expected ~${expected.toFixed(2)} from prev ${prev.toFixed(2)} and ${ct.transactionType} ${ct.transactionAmount.toFixed(2)}, saw ${ct.accountBalanceAfter.toFixed(2)}`,
            row
          });
          // Keep record but do not update chain
          lastBalanceByCustomer.set(ct.customerId, ct.accountBalanceAfter);
        } else {
          lastBalanceByCustomer.set(ct.customerId, ct.accountBalanceAfter);
        }
      } else {
        // Initialize chain with first known balance
        lastBalanceByCustomer.set(ct.customerId, ct.accountBalanceAfter);
      }
    }

    clean.push(ct);
  });

  // Sort clean by customer/date for downstream processing
  clean.sort((a, b) => a.customerId - b.customerId || a.transactionDate.getTime() - b.transactionDate.getTime());

  return { clean, errors };
}
