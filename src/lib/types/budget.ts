export interface BudgetItem {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'savings';
  amount: number;
  isRecurrent: boolean;
  dueDay?: number;
  dueDate?: string;
  owner: string;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'check' | 'other';
  category?: string; // Category ID reference
  createdAt: string;
  userId: string;
}

export interface BudgetFormData {
  name: string;
  type: 'income' | 'expense' | 'savings';
  amount: number;
  isRecurrent: boolean;
  dueDay?: number;
  dueDate?: string;
  owner: string;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'check' | 'other';
  category?: string;
}
