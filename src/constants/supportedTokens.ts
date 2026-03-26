export interface SupportedToken {
  symbol: string;
  name: string;
  chain: string;
  chainLogo: string;
  tokenLogo: string;
  tokenAddress: string;
  explorerUrl: string;
  /** Whether this token supports EIP-2612 permit (gasless approve) */
  supportsPermit: boolean;
}

export const SUPPORTED_TOKENS: SupportedToken[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    chain: "Base",
    chainLogo: "/Base_Symbol_Blue.svg",
    tokenLogo: "/usd-coin-usdc-logo.png",
    tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", 
    explorerUrl: "https://basescan.org",
    supportsPermit: true,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    chain: "Lisk",
    chainLogo: "/lisk-lsk-logo.png",
    tokenLogo: "/tether-usdt-logo.png",
    tokenAddress: "0x05D032ac25d322df992303dCa074EE7392C117b9", 
    explorerUrl: "https://blockscout.lisk.com",
    supportsPermit: false,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    chain: "Scroll",
    chainLogo: "/Scroll_Logomark.13ce0216.png",
    tokenLogo: "/usd-coin-usdc-logo.png",
    tokenAddress: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4", 
    explorerUrl: "https://scrollscan.com",
    supportsPermit: true,
  },
  {
    symbol: "WXM",
    name: "WXM Coin",
    chain: "Arbitrum",
    chainLogo: "/arbitrum-arb-logo.png",
    tokenLogo: "/wxm-token-logo-256x256.png",
    tokenAddress: "0xB6093B61544572Ab42A0E43AF08aBaFD41bf25A6", 
    explorerUrl: "https://arbiscan.io",
    supportsPermit: false,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    chain: "Polygon",
    chainLogo: "/polygon-matic-logo.svg",
    tokenLogo: "/usd-coin-usdc-logo.png",
    tokenAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    explorerUrl: "https://polygonscan.com",
    supportsPermit: true,
  }
];

/** Chains that Privy cannot sponsor gas for embedded wallets */
export const EMBEDDED_WALLET_UNSUPPORTED_CHAINS: string[] = ["Scroll", "Lisk"];

/** Return the token list filtered for the current wallet type */
export function getAvailableTokens(isEmbeddedWallet: boolean): SupportedToken[] {
  if (!isEmbeddedWallet) return SUPPORTED_TOKENS;
  return SUPPORTED_TOKENS.filter(
    (t) => !EMBEDDED_WALLET_UNSUPPORTED_CHAINS.includes(t.chain),
  );
}
