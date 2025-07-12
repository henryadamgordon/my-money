import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Navigation state store
export interface NavigationState {
  currentPage: string;
  previousPage: string | null;
  isFirstVisit: boolean;
}

function createNavigationStore() {
  const initialState: NavigationState = {
    currentPage: '/',
    previousPage: null,
    isFirstVisit: true
  };

  const { subscribe, set, update } = writable<NavigationState>(initialState);

  return {
    subscribe,
    
    // Initialize navigation state from localStorage
    init: () => {
      if (browser) {
        const stored = localStorage.getItem('navigation-state');
        if (stored) {
          const parsedState = JSON.parse(stored);
          // If we have stored state, user is not on first visit
          set({
            ...parsedState,
            isFirstVisit: false
          });
        } else {
          // First time visitor
          set({
            ...initialState,
            isFirstVisit: true
          });
        }
      }
    },

    // Navigate to a new page
    navigateTo: (page: string) => {
      update(state => {
        const newState = {
          currentPage: page,
          previousPage: state.currentPage,
          isFirstVisit: false
        };
        
        if (browser) {
          localStorage.setItem('navigation-state', JSON.stringify(newState));
        }
        
        return newState;
      });
    },

    // Clear navigation state (for logout)
    clear: () => {
      if (browser) {
        localStorage.removeItem('navigation-state');
      }
      set(initialState);
    },

    // Get the page user should be redirected to after login
    getRedirectPage: (): string => {
      if (browser) {
        const stored = localStorage.getItem('navigation-state');
        if (stored) {
          const state = JSON.parse(stored);
          // If user was on login page, redirect to dashboard
          return state.currentPage === '/' || state.currentPage === '/login' 
            ? '/dashboard' 
            : state.currentPage;
        }
      }
      return '/dashboard';
    }
  };
}

export const navigationStore = createNavigationStore();
