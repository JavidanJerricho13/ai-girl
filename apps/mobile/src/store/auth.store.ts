import { create } from 'zustand';
import { apiService } from '../services/api.service';
import { websocketService } from '../services/websocket.service';

export interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  credits: number;
  isPremium: boolean;
  premiumUntil?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username?: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateCredits: (credits: number) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.login({ email, password });
      set({ user: response.user, isAuthenticated: true, isLoading: false });
      
      // Connect WebSocket after successful login
      await websocketService.connect();
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Login failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  register: async (email, password, username) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiService.register({ email, password, username });
      set({ user: response.user, isAuthenticated: true, isLoading: false });
      
      // Connect WebSocket after successful registration
      await websocketService.connect();
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Registration failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiService.logout();
    } finally {
      websocketService.disconnect();
      set({ user: null, isAuthenticated: false, error: null });
    }
  },

  loadUser: async () => {
    try {
      set({ isLoading: true });
      const isAuth = await apiService.isAuthenticated();
      
      if (isAuth) {
        const user = await apiService.getMe();
        set({ user, isAuthenticated: true, isLoading: false });
        
        // Connect WebSocket
        await websocketService.connect();
      } else {
        set({ isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  updateCredits: (credits) => {
    set((state) => ({
      user: state.user ? { ...state.user, credits } : null,
    }));
  },

  clearError: () => {
    set({ error: null });
  },
}));
