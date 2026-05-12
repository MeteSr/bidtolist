import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getAuthClient, resetAgent } from "../services/actor";

interface AuthState {
  isAuthenticated: boolean;
  principal: string | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  principal: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const client = getAuthClient();
        const authed = await client.isAuthenticated();
        if (authed) {
          const identity = await client.getIdentity();
          setPrincipal(identity.getPrincipal().toText());
        }
        setIsAuthenticated(authed);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function login() {
    const client = getAuthClient();
    await client.login({
      onSuccess: async () => {
        resetAgent();
        const identity = await client.getIdentity();
        setPrincipal(identity.getPrincipal().toText());
        setIsAuthenticated(true);
      },
    });
  }

  async function logout() {
    const client = getAuthClient();
    await client.logout();
    resetAgent();
    setPrincipal(null);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, principal, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
