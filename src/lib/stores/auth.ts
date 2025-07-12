import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { navigationStore } from './navigation';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';

// User type based on Firebase User
export interface User {
  id: string; // This will be the Firebase UID
  email: string;
  name?: string;
}

// Auth state
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

function createAuthStore() {
  const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true
  };

  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,

    // Initialize auth state
    init: () => {
      if (browser && auth) {
        // Listen to Firebase auth state changes
        onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
          if (firebaseUser) {
            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || undefined
            };
            set({
              user,
              isAuthenticated: true,
              isLoading: false
            });
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false
            });
          }
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    },

    // Login function
    login: async (email: string, password: string): Promise<void> => {
      if (!auth) throw new Error('Firebase auth not initialized');
      
      update(state => ({ ...state, isLoading: true }));

      try {
        // Use Firebase Auth to sign in
        await signInWithEmailAndPassword(auth, email, password);
        // The onAuthStateChanged listener will handle updating the store
      } catch (error) {
        update(state => ({ ...state, isLoading: false }));
        throw error;
      }
    },

    // Logout function
    logout: async () => {
      if (!auth) return;
      
      try {
        await signOut(auth);
        // The onAuthStateChanged listener will handle updating the store
      } catch (error) {
        console.error('Logout error:', error);
        // Force logout locally even if Firebase signOut fails
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }

      // Clear navigation state on logout
      navigationStore.clear();
    }
  };
}

export const authStore = createAuthStore();
