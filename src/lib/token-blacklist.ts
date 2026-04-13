// In-memory token blacklist. For horizontally scaled deploys, move to Redis.
const revokedTokens = new Set<string>();

// Periodic cleanup: remove all when set grows large (expired tokens can't be replayed anyway)
const MAX_SIZE = 1000;

export function revokeToken(token: string): void {
  if (revokedTokens.size >= MAX_SIZE) revokedTokens.clear();
  revokedTokens.add(token);
}

export function isTokenRevoked(token: string): boolean {
  return revokedTokens.has(token);
}
