export type TransactionType = 'expense' | 'income' | 'transfer';
export type SourceType = 'wechat' | 'alipay' | 'other';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  description?: string;
  source: SourceType;
  type: TransactionType;
}

export interface AiDiagnosisResult {
  success: boolean;
  result: String;
}
