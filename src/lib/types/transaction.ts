export interface Transaction {
	id?: string;
	description: string;
	amount: number;
	transactionDate: Date;
	type: 'income' | 'expense';
	categoryId?: string;
	budgetItemId?: string;
	owner: string;
	registrationDate: Date;
	userId: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface TransactionFormData {
	description: string;
	amount: string;
	transactionDate: string;
	type: 'income' | 'expense';
	categoryId: string;
	budgetItemId: string;
	owner: string;
}
