import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  login as actorLogin,
  logout as actorLogout,
  isAuthenticated as actorIsAuthenticated,
  getPrincipal,
  type OpenIdProvider,
} from "../services/actor";
import { getMyAgentProfile } from "../services/agent";

export type UserRole = "agent" | "homeowner" | null;

interface AuthState {
  isAuthenticated: boolean;
  principal: string | null;
  role: UserRole;
  isLoading: boolean;
  login: (provider?: OpenIdProvider) => Promise<void>;
  loginWithRole: (intendedRole: "homeowner" | "agent", provider?: OpenIdProvider) => Promise<UserRole>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  principal: null,
  role: null,
  isLoading: true,
  login: async () => {},
  loginWithRole: async () => "homeowner",
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
        if (typeof window !== "undefined" && (window as any).__e2e_principal) {
          setPrincipal((window as any).__e2e_principal);
          setRole((window as any).__e2e_role || "homeowner");
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
        // v6: isAuthenticated() is synchronous
        const authed = actorIsAuthenticated();
        if (authed) {
          setPrincipal(await getPrincipal());
          setRole(await detectRole());
        }
        setIsAuthenticated(authed);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function login(provider?: OpenIdProvider) {
    await actorLogin(provider);
    setPrincipal(await getPrincipal());
    setIsAuthenticated(true);
    setRole(await detectRole());
  }

  async function loginWithRole(intendedRole: "homeowner" | "agent", provider?: OpenIdProvider): Promise<UserRole> {
    await actorLogin(provider);
    setPrincipal(await getPrincipal());
    setIsAuthenticated(true);
    const detected = await detectRole();
    // If they already have an agent profile, honour that; otherwise use their selection.
    const finalRole: UserRole = detected === "agent" ? "agent" : intendedRole;
    setRole(finalRole);
    return finalRole;
  }

  async function logout() {
    await actorLogout();
    setPrincipal(null);
    setIsAuthenticated(false);
    setRole(null);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, principal, role, isLoading, login, loginWithRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
