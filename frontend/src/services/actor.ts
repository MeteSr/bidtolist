import { AuthClient } from "@icp-sdk/auth/client";
import { HttpAgent } from "@icp-sdk/core/agent";
import { Ed25519KeyIdentity } from "@icp-sdk/core/identity";

export type OpenIdProvider = "google" | "apple" | "microsoft";

const DFX_NETWORK = (process.env as any).DFX_NETWORK || "local";
const IS_LOCAL    = DFX_NETWORK === "local";

// @icp-sdk/auth v6 local II URL — /authorize is where the ICRC-29 heartbeat
// listener lives; opening the root URL causes a 120-second establish-timeout.
export const II_URL = IS_LOCAL
  ? "http://id.ai.localhost:4943/authorize"
  : "https://id.ai/authorize";

let _authClient: AuthClient | null = null;
let _agent:      HttpAgent | null  = null;

export function getAuthClient(openIdProvider?: OpenIdProvider): AuthClient {
  if (!_authClient) {
    // v6: synchronous constructor; identityProvider is set at creation time
    _authClient = new AuthClient({
      identityProvider: II_URL,
      ...(openIdProvider ? { openIdProvider } : {}),
    });
  }
  return _authClient;
}

export async function getAgent(): Promise<HttpAgent> {
  if (!_agent) {
    if (IS_LOCAL && import.meta.env.DEV) {
      // Fixed-seed identity for local dev — survives hot-reloads without II
      const seed = new Uint8Array(32).fill(1);
      const identity = Ed25519KeyIdentity.generate(seed);
      _agent = await HttpAgent.create({ identity, host: "http://localhost:4943" });
    } else {
      const client   = getAuthClient();
      // v6: getIdentity() is async
      const identity = await client.getIdentity();
      _agent = await HttpAgent.create({
        identity,
        host: IS_LOCAL ? "http://localhost:4943" : "https://ic0.app",
      });
    }
    if (IS_LOCAL) {
      await Promise.race([
        _agent.fetchRootKey(),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error("fetchRootKey timeout")), 2000)
        ),
      ]).catch((err: unknown) => {
        console.warn("[actor] fetchRootKey failed — running in mock mode:", err);
      });
    }
  }
  return _agent;
}

export function resetAgent() {
  _agent = null;
}

export function setAgentForTesting(agent: HttpAgent) {
  _agent = agent;
}

// ── Auth helpers ──────────────────────────────────────────────────────────────

export async function login(openIdProvider?: OpenIdProvider): Promise<void> {
  // Reset so a fresh AuthClient is created with the chosen provider.
  // openIdProvider tells II to show Google / Apple / Microsoft one-click flow
  // and automatically creates an II anchor linked to that account.
  _authClient = null;
  const client = getAuthClient(openIdProvider);
  try {
    await client.signIn({ maxTimeToLive: BigInt(8 * 60 * 60 * 1_000_000_000) });
  } catch (err) {
    console.error("[actor] signIn failed:", err);
    throw err;
  }
  resetAgent();
}

export async function logout(): Promise<void> {
  const client = getAuthClient();
  await client.logout();
  resetAgent();
  _authClient = null;
}

// v6: isAuthenticated() is synchronous — checks localStorage expiration flag
export function isAuthenticated(): boolean {
  try {
    return getAuthClient().isAuthenticated();
  } catch {
    return false;
  }
}

export async function getPrincipal(): Promise<string> {
  const client   = getAuthClient();
  // v6: getIdentity() is async
  const identity = await client.getIdentity();
  return identity.getPrincipal().toText();
}

// Local-dev bypass — deterministic Ed25519 identity, no II required.
export async function loginWithLocalIdentity(): Promise<string> {
  if (!IS_LOCAL) throw new Error("loginWithLocalIdentity() must not be called in production");
  const seed = new Uint8Array(32).fill(1);
  const identity = Ed25519KeyIdentity.generate(seed);
  _agent = await HttpAgent.create({ identity, host: "http://localhost:4943" });
  await Promise.race([
    _agent.fetchRootKey(),
    new Promise<void>((_, reject) => setTimeout(() => reject(new Error("fetchRootKey timeout")), 2000)),
  ]).catch((err: unknown) => {
    console.warn("[actor] fetchRootKey failed — mock mode:", err);
  });
  return identity.getPrincipal().toText();
}
