import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, onAuthChange, tokenStorage, type ApiUser } from "@/lib/api";
import * as authApi from "@/lib/auth";

type AuthContextValue = {
  user: ApiUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<ApiUser>;
  register: (email: string, password: string, displayName?: string) => Promise<ApiUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hydrate from localStorage immediately so auth state is available fast.
    const stored = tokenStorage.getUser();
    setUser(stored);

    // If a token exists, fetch fresh user data (includes displayName, role, avatarUrl)
    // and update localStorage so stale data is replaced silently.
    if (stored && tokenStorage.getAccess()) {
      apiFetch<ApiUser>("/api/v1/auth/me")
        .then((fresh) => {
          tokenStorage.set({
            accessToken:  tokenStorage.getAccess()!,
            refreshToken: tokenStorage.getRefresh()!,
            user: fresh,
          });
          setUser(fresh);
        })
        .catch(() => {
          // Token expired or invalid — leave user as-is; refresh will handle it
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    const unsub = onAuthChange(() => {
      setUser(tokenStorage.getUser());
    });
    return () => { unsub(); };
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    loading,
    login: authApi.login,
    register: authApi.register,
    logout: authApi.logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
