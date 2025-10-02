import { CleanedTransaction } from '../types';
import { format } from 'date-fns';

export function getMonthlyVolumeByBranch(data: CleanedTransaction[]): Map<string, Map<string, number>> {
  const result = new Map<string, Map<string, number>>();
  for (const tx of data) {
    const branch = tx.branchId ?? 'Unknown';
    const month = format(tx.transactionDate, 'yyyy-MM');
    const byMonth = result.get(branch) ?? new Map<string, number>();
    byMonth.set(month, (byMonth.get(month) ?? 0) + Math.abs(tx.transactionAmount));
    result.set(branch, byMonth);
  }
  return result;
}

export function detectAnomalousTransactions(data: CleanedTransaction[], zThreshold = 3): CleanedTransaction[] {
  // Compute per-customer stats
  const amountsByCust = new Map<number, number[]>();
  for (const tx of data) {
    const arr = amountsByCust.get(tx.customerId) ?? [];
    arr.push(Math.abs(tx.transactionAmount));
    amountsByCust.set(tx.customerId, arr);
  }
  const meanStd = new Map<number, { mean: number; std: number }>();
  for (const [cid, arr] of amountsByCust) {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, arr.length - 1);
    const std = Math.sqrt(variance);
    meanStd.set(cid, { mean, std });
  }
  return data.filter(tx => {
    const stats = meanStd.get(tx.customerId)!;
    const val = Math.abs(tx.transactionAmount);
    if (!stats || stats.std === 0) return false;
    const z = (val - stats.mean) / stats.std;
    return z >= zThreshold;
  });
}

// Simple LTV model: revenue = transaction fee + balance carry revenue.
// Defaults: 0.1% fee on deposits/withdrawals, 0.05% transfers; monthly balance margin in bps.
export function calculateCustomerLTV(customerId: number, data: CleanedTransaction[], opts?: {
  feeDeposit?: number; feeWithdrawal?: number; feeTransfer?: number; monthlyBalanceMarginBps?: number;
}): number {
  const { feeDeposit = 0.001, feeWithdrawal = 0.001, feeTransfer = 0.0005, monthlyBalanceMarginBps = 10 } = opts ?? {};
  const custTx = data.filter(d => d.customerId === customerId);
  let revenue = 0;

  for (const tx of custTx) {
    const amt = Math.abs(tx.transactionAmount);
    if (tx.transactionType === 'Deposit') revenue += amt * feeDeposit;
    else if (tx.transactionType === 'Withdrawal') revenue += amt * feeWithdrawal;
    else if (tx.transactionType === 'Transfer') revenue += amt * feeTransfer;
  }

  // Approximate balance margin using 'accountBalanceAfter' snapshot when present
  const byMonth = new Map<string, number>();
  for (const tx of custTx) {
    if (tx.accountBalanceAfter != null && Number.isFinite(tx.accountBalanceAfter)) {
      const k = format(tx.transactionDate, 'yyyy-MM');
      // keep last balance in the month
      byMonth.set(k, tx.accountBalanceAfter);
    }
  }
  const monthlyMarginRate = monthlyBalanceMarginBps / 10000; // bps to decimal
  for (const [, bal] of byMonth) {
    revenue += Math.max(0, bal) * monthlyMarginRate;
  }

  return Number(revenue.toFixed(2));
}
