import { createContext, useMemo, useState, type ReactNode } from "react";
import { login, logout } from "@/features/auth/api/authApi";
import { authTokenStore } from "@/features/auth/api/authTokenStore";
import type { AuthSession, LoginPayload } from "@/features/auth/types/auth.types";

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  signIn: (payload: LoginPayload) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => authTokenStore.getSession());

  const signIn = async (payload: LoginPayload) => {
    const nextSession = await login(payload);
    authTokenStore.setSession(nextSession);
    setSession(nextSession);
  };

  const signOut = async () => {
    try {
      await logout();
    } finally {
      authTokenStore.clearSession();
      setSession(null);
    }
  };

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session?.accessToken),
      signIn,
      signOut,
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
