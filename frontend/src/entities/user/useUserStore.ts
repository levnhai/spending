import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/shared/lib/api';

export type UserRoleType = 'PERSONAL' | 'SALES';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  currency?: string;
  language?: string;
  role?: UserRoleType;
  hiddenMenus?: string[]; // Danh sách các href của menu bị ẩn
}

interface UserState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hiddenMenus: string[];
  role: UserRoleType;
  theme: 'dark' | 'light';
  showAmount: boolean;

  // Actions
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setHiddenMenus: (menus: string[]) => void;
  toggleTheme: () => void;
  toggleShowAmount: () => void;
  toggleMenuVisibility: (href: string) => Promise<void>;
  resetMenuVisibility: () => Promise<void>;
  switchRole: (newRole: UserRoleType) => Promise<void>;
  initAuth: () => void;
  setAuth: (user: User, token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
}

const saveTokenToStorage = (token: string | null) => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('finflow_token', token);
  } else {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('finflow_token');
  }
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hiddenMenus: [],
      role: 'PERSONAL',
      theme: 'dark',
      showAmount: true,

      setUser: (user) =>
        set({
          user,
          hiddenMenus: user.hiddenMenus || [],
          role: user.role || 'PERSONAL',
        }),

      setToken: (token) => {
        set({ token, isAuthenticated: !!token });
        saveTokenToStorage(token);
      },

      setHiddenMenus: (menus) => {
        set({ hiddenMenus: menus });
      },

      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: next });
        if (typeof window !== 'undefined') {
          if (next === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },

      toggleShowAmount: () => {
        set({ showAmount: !get().showAmount });
      },

      switchRole: async (newRole: UserRoleType) => {
        set({ role: newRole });
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, role: newRole } });
          try {
            await api.put('/auth/profile', { role: newRole });
          } catch (e) {
            console.error('Failed to sync user role to server', e);
          }
        }
      },

      toggleMenuVisibility: async (href: string) => {
        const currentHidden = get().hiddenMenus || [];
        const isCurrentlyHidden = currentHidden.includes(href);
        const nextHidden = isCurrentlyHidden
          ? currentHidden.filter((item) => item !== href)
          : [...currentHidden, href];

        set({ hiddenMenus: nextHidden });

        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, hiddenMenus: nextHidden } });
        }

        try {
          await api.put('/auth/profile', { hiddenMenus: nextHidden });
        } catch (e) {
          console.error('Failed to sync hiddenMenus to server', e);
        }
      },

      resetMenuVisibility: async () => {
        set({ hiddenMenus: [] });
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, hiddenMenus: [] } });
        }

        try {
          await api.put('/auth/profile', { hiddenMenus: [] });
        } catch (e) {
          console.error('Failed to reset hiddenMenus on server', e);
        }
      },

      initAuth: () => {
        if (typeof window !== 'undefined') {
          const storedToken =
            localStorage.getItem('auth_token') ||
            localStorage.getItem('finflow_token') ||
            get().token;

          if (storedToken) {
            saveTokenToStorage(storedToken);
            set({ token: storedToken, isAuthenticated: true });
          }
          if (get().theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },

      setAuth: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          hiddenMenus: user.hiddenMenus || [],
          role: user.role || 'PERSONAL',
        });
        saveTokenToStorage(token);
      },

      login: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          hiddenMenus: user.hiddenMenus || [],
          role: user.role || 'PERSONAL',
        });
        saveTokenToStorage(token);
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          hiddenMenus: [],
          role: 'PERSONAL',
        });
        saveTokenToStorage(null);
      },
    }),
    {
      name: 'user-storage',
    },
  ),
);
