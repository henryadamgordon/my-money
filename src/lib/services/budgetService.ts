import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  type DocumentData 
} from 'firebase/firestore';
import { db } from '../firebase';

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

const COLLECTION_NAME = 'budgetItems';

export class BudgetService {
  // Add a new budget item
  static async addBudgetItem(budgetItem: Omit<BudgetItem, 'id' | 'userId'>, userId: string): Promise<string> {
    if (!db) throw new Error('Firestore not initialized');
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...budgetItem,
      userId,
      createdAt: new Date().toISOString()
    });
    
    return docRef.id;
  }

  // Get all budget items for a user
  static async getBudgetItems(userId: string): Promise<BudgetItem[]> {
    if (!db) throw new Error('Firestore not initialized');
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const budgetItems: BudgetItem[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as DocumentData;
      budgetItems.push({
        id: doc.id,
        name: data.name,
        type: data.type,
        amount: data.amount,
        isRecurrent: data.isRecurrent,
        dueDay: data.dueDay,
        dueDate: data.dueDate,
        owner: data.owner,
        paymentMethod: data.paymentMethod,
        category: data.category,
        createdAt: data.createdAt,
        userId: data.userId
      });
    });
    
    // Sort by createdAt descending (newest first)
    return budgetItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Update a budget item
  static async updateBudgetItem(id: string, updates: Partial<Omit<BudgetItem, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  // Delete a budget item
  static async deleteBudgetItem(id: string): Promise<void> {
    if (!db) throw new Error('Firestore not initialized');
    
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
}
