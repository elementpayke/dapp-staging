export interface SupportedToken {
  symbol: string;
  name: string;
  chain: string;
  chainLogo: string;
  tokenLogo: string;
  tokenAddress: string;
  explorerUrl: string;
}

export const SUPPORTED_TOKENS: SupportedToken[] = [
  {
    symbol: "USDT",
    name: "Tether USD",
    chain: "Lisk",
    chainLogo: "/lisk-lsk-logo.png",
    tokenLogo: "/tether-usdt-logo.png",
    tokenAddress: "0x05D032ac25d322df992303dCa074EE7392C117b9", 
    explorerUrl: "https://blockscout.lisk.com", 
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    chain: "Base",
    chainLogo: "/Base_Symbol_Blue.svg",
    tokenLogo: "/usd-coin-usdc-logo.png",
    tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", 
    explorerUrl: "https://basescan.org",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    chain: "Scroll",
    chainLogo: "/Scroll_Logomark.13ce0216.png",
    tokenLogo: "/usd-coin-usdc-logo.png",
    tokenAddress: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4", 
    explorerUrl: "https://scrollscan.com", 
  },
  {
    symbol: "WXM",
    name: "WXM Coin",
    chain: "Arbitrum",
    chainLogo: "/arbitrum-arb-logo.png",
    tokenLogo: "/wxm-token-logo-256x256.png",
    tokenAddress: "0xB6093B61544572Ab42A0E43AF08aBaFD41bf25A6", 
    explorerUrl: "https://arbiscan.io",
  }
];
