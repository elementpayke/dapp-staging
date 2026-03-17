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
  // Scroll USDC
  "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4": {
    address: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4",
    decimals: 6,
  },
  // Arbitrum WXM
  "0xb6093b61544572ab42a0e43af08abafd41bf25a6": {
    address: "0xb6093b61544572ab42a0e43af08abafd41bf25a6",
    decimals: 18,
  },
  // Polygon USDC (native)
  "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359": {
    address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
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


