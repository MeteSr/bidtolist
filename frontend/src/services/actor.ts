import { AuthClient } from "@icp-sdk/auth/client";
import { HttpAgent } from "@icp-sdk/core/agent";
import { Ed25519KeyIdentity } from "@icp-sdk/core/identity";

const DFX_NETWORK = (process.env as any).DFX_NETWORK || "local";
const IS_LOCAL    = DFX_NETWORK !== "ic";

export const II_URL = IS_LOCAL
  ? "http://id.ai.localhost:4943/authorize"
  : "https://id.ai/authorize";

let _authClient: AuthClient | null = null;
let _agent:      HttpAgent | null  = null;

export function getAuthClient(): AuthClient {
  if (!_authClient) {
    _authClient = new AuthClient({ identityProvider: II_URL });
  }
  return _authClient;
}

export async function getAgent(): Promise<HttpAgent> {
  if (!_agent) {
    if (IS_LOCAL && import.meta.env.DEV) {
      // Fixed-seed identity for local dev — survives hot-reloads
      const seed = new Uint8Array(32).fill(1);
      const identity = Ed25519KeyIdentity.generate(seed);
      _agent = await HttpAgent.create({ identity, host: "http://localhost:4943" });
      await Promise.race([
        _agent.fetchRootKey(),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error("fetchRootKey timeout")), 2000)
        ),
      ]).catch((err: unknown) => {
        console.warn("[actor] fetchRootKey failed — running in mock mode:", err);
      });
    } else {
      const client   = getAuthClient();
      const identity = await client.getIdentity();
      _agent = await HttpAgent.create({
        identity,
        host: IS_LOCAL ? "http://localhost:4943" : "https://ic0.app",
      });
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
  }
  return _agent;
}

export function resetAgent() {
  _agent = null;
}

export function setAgentForTesting(agent: HttpAgent) {
  _agent = agent;
}
