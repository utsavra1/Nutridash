import { create } from "zustand";
import { User } from "../types";
import { persist } from "zustand/middleware";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setAccessToken: (accessToken) => {
        // a cookie for middleware
        if (accessToken) {
          document.cookie = `nutridash_access_token=${accessToken}; path=/; max-age=86400`; // 1 day
        } else {
          document.cookie = `nutridash_access_token=; path=/; max-age=0`;
        }
        set({ accessToken });
      },

      logout: () => {
        document.cookie = `nutridash_access_token=; path=/; max-age=0`;
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: "nutridash-auth-storage", 
    }
  )
);