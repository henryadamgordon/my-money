import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type User 
} from 'firebase/auth';
import { auth } from './firebase';
import { writable } from 'svelte/store';

// Auth store to track user state
export const user = writable<User | null>(null);
export const loading = writable(true);

// Initialize auth state listener
if (auth) {
  onAuthStateChanged(auth, (firebaseUser) => {
    user.set(firebaseUser);
    loading.set(false);
  });
}

// Login function
export async function login(email: string, password: string) {
  if (!auth) throw new Error('Firebase auth not initialized');
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

// Signup function
export async function signup(email: string, password: string) {
  if (!auth) throw new Error('Firebase auth not initialized');
  
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

// Logout function
export async function logout() {
  if (!auth) throw new Error('Firebase auth not initialized');
  
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return auth?.currentUser !== null;
}
