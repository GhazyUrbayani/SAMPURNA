import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'staff';

export interface AppUser {
  email: string;
  name: string;
  role: UserRole;
  initials: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AppUser | null;
  login: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  logout: () => void;
}

const STORAGE_KEY = 'sampurna_auth_user';

const ACCOUNTS: Record<string, { password: string; user: AppUser }> = {
  'manager@sampurna.id': {
    password: 'demo123',
    user: { email: 'manager@sampurna.id', name: 'Operations Manager', role: 'admin', initials: 'OM' },
  },
  'staff@sampurna.id': {
    password: 'staff123',
    user: { email: 'staff@sampurna.id', name: 'Cleaning Staff', role: 'staff', initials: 'CS' },
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch { localStorage.removeItem(STORAGE_KEY); }
    }
  }, []);

  const login = (email: string, password: string) => {
    const account = ACCOUNTS[email.trim().toLowerCase()];
    if (!account || account.password !== password) {
      return { ok: false as const, error: 'Invalid email or password' };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account.user));
    setUser(account.user);
    return { ok: true as const };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
