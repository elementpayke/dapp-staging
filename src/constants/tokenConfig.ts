/**
 * Token configuration for Element Pay integration.
 * Maps token addresses to their identifiers for API calls.
 */
export interface TokenConfig {
  address: string;
  decimals: number;
}

export const TOKEN_CONFIG: Record<string, TokenConfig> = {
  // Base USDC
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913": {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
  },
  // Lisk USDT
  "0x05D032ac25d322df992303dCa074EE7392C117b9": {
    address: "0x05D032ac25d322df992303dCa074EE7392C117b9",
    decimals: 6,
  },
};

/**
 * Get token config by address (case-insensitive)
 */
export const getTokenConfig = (address: string): TokenConfig | null => {
  const normalizedAddress = address.toLowerCase();
  const entry = Object.entries(TOKEN_CONFIG).find(
    ([key]) => key.toLowerCase() === normalizedAddress
  );
  return entry ? entry[1] : null;
};

