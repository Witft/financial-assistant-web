export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: String;
  date: string;
  amount: number;
  category: string;
  description: string;
  source: string;
  type: TransactionType;
}

export interface AiDiagnosisResult {
  success: boolean;
  result: String;
}
