import type { SWRConfiguration } from "swr";
import { mutate } from "swr";
import { fetchApi, getActiveOrgId, getAuthToken } from "@/lib/api";

/**
 * Fast, non-cryptographic string hash (djb2) to safely identify tokens without
 * exposing raw JWT contents or signatures in cache keys or logs.
 */
export function hashToken(token: string | null): string {
  if (!token) return "anon";
  let hash = 5381;
  for (let i = 0; i < token.length; i++) {
    hash = ((hash << 5) + hash) ^ token.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

/**
 * SWR Key tuple: [endpointWithQuery, orgId, tokenIdentityHash]
 * Guaranteed to partition cache by tenant and authenticated identity.
 */
export type SwrKeyTuple = [string, number | "global", string];

/**
 * Builds an isolated SWR cache key tuple.
 * Never includes raw auth tokens.
 */
export function buildSwrKey(
  endpoint: string,
  orgId: number | null | undefined = getActiveOrgId(),
  tokenHash: string = hashToken(getAuthToken()),
): SwrKeyTuple {
  return [endpoint, orgId != null ? orgId : "global", tokenHash];
}

/**
 * Global fetcher for SWR. Handles both raw endpoint strings and compound key tuples.
 */
export async function swrFetcher<T = unknown>(key: string | SwrKeyTuple): Promise<T> {
  const endpoint = Array.isArray(key) ? key[0] : key;
  return fetchApi<T>(endpoint);
}

/**
 * Global SWR configuration.
 * - Deduplicates identical requests within 5000ms.
 * - Revalidates on window focus and network reconnect.
 * - Caps retries at 2 to avoid hammering server on persistent failures.
 * - Retains previous data across key changes (smooth transitions).
 */
export const swrConfig: SWRConfiguration = {
  fetcher: swrFetcher,
  dedupingInterval: 5000,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  errorRetryCount: 2,
  keepPreviousData: true,
};

/**
 * Mutates all cached keys matching a specific resource prefix.
 * Example: `mutateResource("/api/projects")` or `mutateResource("/api/tasks")`.
 */
export async function mutateResource(resourcePrefix: string) {
  return mutate(
    (key) => {
      if (typeof key === "string") {
        return key.startsWith(resourcePrefix);
      }
      if (Array.isArray(key) && typeof key[0] === "string") {
        return key[0].startsWith(resourcePrefix);
      }
      return false;
    },
    undefined,
    { revalidate: true },
  );
}

/**
 * Clears the entire SWR cache.
 * Called immediately on logout and organization switch to ensure zero cross-tenant leakage.
 */
export async function clearAllSwrCache() {
  return mutate(() => true, undefined, { revalidate: false });
}
