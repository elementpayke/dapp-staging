/**
 * Token configuration for Element Pay integration.
 * Fetches token data from the API and caches it.
 */
export interface TokenConfig {
  address: string;
  decimals: number;
  symbol?: string;
  chainId?: number;
  chainName?: string;
}

export interface ApiTokenResponse {
  status: string;
  message: string;
  data: Array<{
    symbol: string;
    decimals: number;
    address: string;
    chain_id: number;
    chain_name: string;
    env: string;
  }>;
}

// Cache for token configurations
let tokenCache: Map<string, TokenConfig> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch tokens from the API
 */
export const fetchTokenConfigs = async (): Promise<Map<string, TokenConfig>> => {
  const now = Date.now();
  
  // Return cached data if still valid
  if (tokenCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return tokenCache;
  }

  try {
    const response = await fetch('/api/meta/tokens?env=live');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tokens: ${response.status}`);
    }

    const result: ApiTokenResponse = await response.json();
    
    if (result.status !== 'success' || !result.data) {
      throw new Error('Invalid API response');
    }

    // Build the token map (using lowercase address as key for case-insensitive lookup)
    const newCache = new Map<string, TokenConfig>();
    
    for (const token of result.data) {
      newCache.set(token.address.toLowerCase(), {
        address: token.address,
        decimals: token.decimals,
        symbol: token.symbol,
        chainId: token.chain_id,
        chainName: token.chain_name,
      });
    }

    tokenCache = newCache;
    cacheTimestamp = now;
    
    return tokenCache;
  } catch (error) {
    console.error('Error fetching token configs:', error);
    // Return existing cache if available, even if expired
    if (tokenCache) {
      return tokenCache;
    }
    return new Map();
  }
};

/**
 * Get token config by address (case-insensitive) - async version
 */
export const getTokenConfig = async (address: string): Promise<TokenConfig | null> => {
  const tokens = await fetchTokenConfigs();
  const normalizedAddress = address.toLowerCase();
  return tokens.get(normalizedAddress) || null;
};

/**
 * Get token config synchronously from cache (returns null if cache not initialized)
 * Use this only when you're sure the cache has been populated via fetchTokenConfigs()
 */
export const getTokenConfigSync = (address: string): TokenConfig | null => {
  if (!tokenCache) {
    return null;
  }
  const normalizedAddress = address.toLowerCase();
  return tokenCache.get(normalizedAddress) || null;
};

/**
 * Initialize the token cache - call this early in your app lifecycle
 */
export const initializeTokenCache = async (): Promise<void> => {
  await fetchTokenConfigs();
};

/**
 * Clear the token cache (useful for testing or forcing a refresh)
 */
export const clearTokenCache = (): void => {
  tokenCache = null;
  cacheTimestamp = 0;
};


