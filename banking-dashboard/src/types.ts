export type Gender = 'Male' | 'Female' | 'Other';
export type TransactionType = 'Deposit' | 'Withdrawal' | 'Transfer' | 'Payment' | 'Fee' | 'Other';

export interface RawCsvRow {
  'Customer ID'?: string;
  'CustomerID'?: string;
  'First Name'?: string;
  'Last Name'?: string;
  'Age'?: string;
  'Gender'?: string;
  'Address'?: string;
  'City'?: string;
  'Contact Number'?: string;
  'Email'?: string;
  'Account Type'?: string;
  'Account Balance'?: string;
  'Date Of Account Opening'?: string;
  'Account Opening Date'?: string;
  'Last Transaction Date'?: string;
  'TransactionID'?: string;
  'Transaction Id'?: string;
  'TxnID'?: string;
  'Transaction Date'?: string;
  'Transaction Type'?: string;
  'Transaction Amount'?: string;
  'Account Balance After Transaction'?: string;
  'Branch ID'?: string;
  'Branch Code'?: string;
  [key: string]: any;
}

export interface CleanedTransaction {
  customerId: number;
  name?: string;
  age?: number;
  gender?: Gender;
  accountType?: string;
  branchId?: string;
  transactionId?: string;
  transactionDate: Date;
  transactionType: TransactionType;
  transactionAmount: number;
  accountBalanceAfter?: number;
  accountOpeningDate?: Date | null;
  lastTransactionDate?: Date | null;
  raw?: RawCsvRow;
}

export interface ValidationError {
  rowIndex: number;
  reason: string;
  row?: RawCsvRow;
}
