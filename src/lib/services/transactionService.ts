import { db } from '$lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, type Timestamp } from 'firebase/firestore';
import { browser } from '$app/environment';
import type { Transaction } from '$lib/types/transaction';

export class TransactionService {
	private static readonly COLLECTION_NAME = 'transactions';

	static async addTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
		if (!browser || !db) {
			throw new Error('Database not available');
		}

		try {
			const now = new Date();
			const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
				...transaction,
				createdAt: now,
				updatedAt: now
			});
			return docRef.id;
		} catch (error) {
			console.error('Error adding transaction:', error);
			throw new Error('Failed to add transaction');
		}
	}

	static async getTransactions(userId: string, startDate?: Date, endDate?: Date): Promise<Transaction[]> {
		if (!browser || !db) {
			console.warn('Database not available, returning empty array');
			return [];
		}

		try {
			const constraints = [
				where('userId', '==', userId)
			];

			if (startDate) {
				constraints.push(where('transactionDate', '>=', startDate));
			}
			if (endDate) {
				constraints.push(where('transactionDate', '<=', endDate));
			}

			const q = query(
				collection(db, this.COLLECTION_NAME),
				...constraints,
				orderBy('transactionDate', 'desc')
			);
			
			const querySnapshot = await getDocs(q);
			const transactions: Transaction[] = [];
			
			querySnapshot.forEach((doc) => {
				const data = doc.data();
				transactions.push({
					id: doc.id,
					...data,
					transactionDate: data.transactionDate?.toDate() || new Date(),
					registrationDate: data.registrationDate?.toDate() || new Date(),
					createdAt: data.createdAt?.toDate(),
					updatedAt: data.updatedAt?.toDate()
				} as Transaction);
			});
			
			return transactions;
		} catch (error) {
			console.error('Error fetching transactions:', error);
			throw new Error('Failed to fetch transactions');
		}
	}

	static async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
		if (!browser || !db) {
			throw new Error('Database not available');
		}

		try {
			const docRef = doc(db, this.COLLECTION_NAME, id);
			await updateDoc(docRef, {
				...updates,
				updatedAt: new Date()
			});
		} catch (error) {
			console.error('Error updating transaction:', error);
			throw new Error('Failed to update transaction');
		}
	}

	static async deleteTransaction(id: string): Promise<void> {
		if (!browser || !db) {
			throw new Error('Database not available');
		}

		try {
			const docRef = doc(db, this.COLLECTION_NAME, id);
			await deleteDoc(docRef);
		} catch (error) {
			console.error('Error deleting transaction:', error);
			throw new Error('Failed to delete transaction');
		}
	}
}
