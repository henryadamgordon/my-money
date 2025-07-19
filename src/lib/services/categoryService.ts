import { db } from '$lib/firebase';
import { browser } from '$app/environment';
import { 
	collection, 
	addDoc, 
	getDocs, 
	query, 
	where, 
	updateDoc, 
	doc, 
	deleteDoc,
	orderBy 
} from 'firebase/firestore';

export interface Category {
	id: string;
	name: string;
	color: string;
	icon: string;
	userId: string;
	createdAt: string;
	updatedAt: string;
}

export interface CategoryData {
	name: string;
	color: string;
	icon: string;
}

export class CategoryService {
	private static readonly COLLECTION_NAME = 'categories';

	static async addCategory(categoryData: CategoryData, userId: string): Promise<string> {
		try {
			if (!browser) {
				throw new Error('This operation can only be performed in the browser');
			}
			
			if (!db) {
				throw new Error('Firestore database not initialized');
			}
			
			if (!userId) {
				throw new Error('User ID is required');
			}
			
			if (!categoryData.name?.trim()) {
				throw new Error('Category name is required');
			}
			
			console.log('Adding category:', { categoryData, userId });
			
			const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
				...categoryData,
				userId,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			});
			
			console.log('Category added successfully with ID:', docRef.id);
			return docRef.id;
		} catch (error) {
			console.error('Error adding category:', error);
			throw new Error(`Failed to add category: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	static async getCategories(userId: string): Promise<Category[]> {
		try {
			if (!browser || !db) {
				return [];
			}
			
			const q = query(
				collection(db, this.COLLECTION_NAME),
				where('userId', '==', userId),
				orderBy('name')
			);
			const querySnapshot = await getDocs(q);
			
			return querySnapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data()
			} as Category));
		} catch (error) {
			console.error('Error getting categories:', error);
			throw new Error('Failed to load categories');
		}
	}

	static async updateCategory(categoryId: string, categoryData: Partial<CategoryData>): Promise<void> {
		try {
			if (!browser || !db) {
				throw new Error('This operation can only be performed in the browser');
			}
			
			const categoryRef = doc(db, this.COLLECTION_NAME, categoryId);
			await updateDoc(categoryRef, {
				...categoryData,
				updatedAt: new Date().toISOString()
			});
		} catch (error) {
			console.error('Error updating category:', error);
			throw new Error('Failed to update category');
		}
	}

	static async deleteCategory(categoryId: string): Promise<void> {
		try {
			if (!browser || !db) {
				throw new Error('This operation can only be performed in the browser');
			}
			
			await deleteDoc(doc(db, this.COLLECTION_NAME, categoryId));
		} catch (error) {
			console.error('Error deleting category:', error);
			throw new Error('Failed to delete category');
		}
	}

	// Get default categories for new users
	static getDefaultCategories(): CategoryData[] {
		return [
			{ name: 'Food & Dining', color: '#FF6B6B', icon: '🍽️' },
			{ name: 'Transportation', color: '#4ECDC4', icon: '🚗' },
			{ name: 'Shopping', color: '#45B7D1', icon: '🛍️' },
			{ name: 'Entertainment', color: '#96CEB4', icon: '🎬' },
			{ name: 'Bills & Utilities', color: '#FFEAA7', icon: '⚡' },
			{ name: 'Healthcare', color: '#DDA0DD', icon: '🏥' },
			{ name: 'Education', color: '#98D8C8', icon: '📚' },
			{ name: 'Travel', color: '#F7DC6F', icon: '✈️' },
			{ name: 'Salary', color: '#82E0AA', icon: '💰' },
			{ name: 'Investment', color: '#85C1E9', icon: '📈' }
		];
	}

	// Initialize default categories for new users
	static async initializeDefaultCategories(userId: string): Promise<void> {
		try {
			if (!browser || !db) {
				return;
			}
			
			const existingCategories = await this.getCategories(userId);
			if (existingCategories.length === 0) {
				const defaultCategories = this.getDefaultCategories();
				const promises = defaultCategories.map(category => 
					this.addCategory(category, userId)
				);
				await Promise.all(promises);
			}
		} catch (error) {
			console.error('Error initializing default categories:', error);
			// Don't throw error here as it's not critical
		}
	}
}
