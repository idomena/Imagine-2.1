import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch, onAuthChange, tokenStorage, type ApiUser } from "@/lib/api";
import * as authApi from "@/lib/auth";
import { actions } from "@/lib/store";

function deriveDisplayName(email: string, displayName?: string | null): string {
  if (displayName?.trim()) return displayName.trim();
  return email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function deriveUsername(email: string): string {
  return email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
}

function syncUserToStore(u: ApiUser) {
  actions.syncFromAuth({
    userId: u.id,
    name: deriveDisplayName(u.email, u.displayName),
    username: deriveUsername(u.email),
  });
}

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
    if (stored) syncUserToStore(stored);

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
          syncUserToStore(fresh);
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
