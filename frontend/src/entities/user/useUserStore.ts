import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  currency: string;
  theme: string;
}

interface UserState {
  user: User | null;
  token: string | null;
  theme: 'dark' | 'light';
  showAmount: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  toggleTheme: () => void;
  toggleShowAmount: () => void;
  initAuth: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  token: null,
  theme: 'dark',
  showAmount: false, // Mặc định là HIDE (ẩn tiền)

  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('finflow_token', token);
      localStorage.setItem('finflow_user', JSON.stringify(user));
    }
    set({ user, token });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('finflow_token');
      localStorage.removeItem('finflow_user');
    }
    set({ user: null, token: null });
  },

  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { theme: newTheme };
    });
  },

  toggleShowAmount: () => {
    set((state) => ({ showAmount: !state.showAmount }));
  },

  initAuth: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('finflow_token');
      const userStr = localStorage.getItem('finflow_user');
      const savedTheme = (localStorage.getItem('finflow_theme') as 'dark' | 'light') || 'dark';

      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          set({ token, user, theme: savedTheme });
        } catch (e) {
          localStorage.removeItem('finflow_token');
          localStorage.removeItem('finflow_user');
        }
      }
    }
  },
}));
