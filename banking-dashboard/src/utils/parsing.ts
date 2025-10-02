import { Gender, TransactionType } from '../types';

export function parseAmount(amount: string | number | null | undefined): number {
  if (amount == null) return NaN;
  if (typeof amount === 'number') return amount;
  const trimmed = amount.trim();
  if (!trimmed) return NaN;
  if (/^(n\/a|na|null|undefined|-+)$/i.test(trimmed)) return NaN;
  const normalized = trimmed.replace(/[^0-9.-]+/g, '');
  if (normalized === '' || normalized === '-' || normalized === '.') return NaN;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : NaN;
}

export function normalizeGender(gender: string | null | undefined): Gender {
  if (!gender) return 'Other';
  const g = gender.toString().trim().toLowerCase();
  if (['m', 'male', 'man'].includes(g)) return 'Male';
  if (['f', 'female', 'woman'].includes(g)) return 'Female';
  return 'Other';
}

export function parseDate(dateString: string | Date | null | undefined): Date | null {
  if (!dateString) return null;
  if (dateString instanceof Date) return Number.isNaN(dateString.getTime()) ? null : dateString;
  const s = dateString.trim();
  if (!s) return null;
  // ISO or locale-parseable
  const iso = Date.parse(s);
  if (!Number.isNaN(iso)) return new Date(iso);
  // Try MM/DD/YYYY
  const mdy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (mdy) {
    const [, mm, dd, yyyy] = mdy;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  // Try YYYY/MM/DD
  const ymd = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (ymd) {
    const [, yyyy, mm, dd] = ymd;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function normalizeTransactionType(t: string | null | undefined): TransactionType {
  if (!t) return 'Other';
  const s = t.toString().trim().toLowerCase();
  if (['deposit', 'dep'].includes(s)) return 'Deposit';
  if (['withdrawal', 'withdraw', 'wd'].includes(s)) return 'Withdrawal';
  if (['transfer', 'xfer', 'txn transfer'].includes(s)) return 'Transfer';
  if (['payment', 'card payment', 'cc payment'].includes(s)) return 'Payment';
  if (['fee', 'charges'].includes(s)) return 'Fee';
  return 'Other';
}
