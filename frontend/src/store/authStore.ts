import { create } from "zustand";

interface AuthStore {
  isAuthenticated: boolean;
  principal: string | null;
  isLoading: boolean;
  setAuth: (principal: string) => void;
  clearAuth: () => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  principal: null,
  isLoading: true,
  setAuth: (principal) => set({ isAuthenticated: true, principal, isLoading: false }),
  clearAuth: () => set({ isAuthenticated: false, principal: null, isLoading: false }),
  setLoading: (v) => set({ isLoading: v }),
}));
