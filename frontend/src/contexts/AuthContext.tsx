import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getAuthClient, resetAgent } from "../services/actor";
import { getMyAgentProfile } from "../services/agent";

export type UserRole = "agent" | "homeowner" | null;

interface AuthState {
  isAuthenticated: boolean;
  principal: string | null;
  role: UserRole;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  principal: null,
  role: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

async function detectRole(): Promise<UserRole> {
  try {
    const profile = await getMyAgentProfile();
    return profile ? "agent" : "homeowner";
  } catch {
    return "homeowner";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const client = getAuthClient();
        const authed = await client.isAuthenticated();
        if (authed) {
          const identity = await client.getIdentity();
          setPrincipal(identity.getPrincipal().toText());
          setRole(await detectRole());
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
        setRole(await detectRole());
      },
    });
  }

  async function logout() {
    const client = getAuthClient();
    await client.logout();
    resetAgent();
    setPrincipal(null);
    setIsAuthenticated(false);
    setRole(null);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, principal, role, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
