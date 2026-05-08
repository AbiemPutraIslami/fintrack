export type TransactionType = "income" | "expense" | "transfer";

export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'ewallet';
  initialBalance: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string; // ISO string
  accountId?: string;
  toAccountId?: string;
  transferCharge?: number;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}
