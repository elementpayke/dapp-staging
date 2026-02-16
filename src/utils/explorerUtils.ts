/**
 * explorerUtils.ts
 * Centralised blockchain explorer helper.
 * Import this wherever you need to resolve an explorer URL, name, or network label
 * from a transaction's tokenSymbol.
 */

export interface ExplorerInfo {
  url: string;    // Full explorer URL with tx hash appended
  name: string;   // Explorer display name  e.g. "Basescan"
  network: string; // Network label          e.g. "Base"
}

/**
 * Returns the correct blockchain explorer details for a given token symbol and tx hash.
 *
 * Matching is done by checking whether the uppercased tokenSymbol contains
 * a known keyword, so it works for symbols like "BASE_USDC", "SCROLL_USDC",
 * "LISK_ETH", etc.
 *
 * Falls back to Base / Basescan if no keyword matches.
 */
export const getExplorerInfo = (tokenSymbol: string, hash: string): ExplorerInfo => {
  const symbol = (tokenSymbol ?? "").toUpperCase();

  if (symbol.includes("SCROLL")) {
    return {
      url: `https://scrollscan.com/tx/${hash}`,
      name: "Scrollscan",
      network: "Scroll",
    };
  }
  if (symbol.includes("LISK")) {
    return {
      url: `https://blockscout.lisk.com/tx/${hash}`,
      name: "Lisk Explorer",
      network: "Lisk",
    };
  }
  if (symbol.includes("ETH") && !symbol.includes("BASE")) {
    return {
      url: `https://etherscan.io/tx/${hash}`,
      name: "Etherscan",
      network: "Ethereum",
    };
  }
  if (symbol.includes("POLYGON") || symbol.includes("MATIC")) {
    return {
      url: `https://polygonscan.com/tx/${hash}`,
      name: "Polygonscan",
      network: "Polygon",
    };
  }
  if (symbol.includes("ARB")) {
    return {
      url: `https://arbiscan.io/tx/${hash}`,
      name: "Arbiscan",
      network: "Arbitrum",
    };
  }
  if (symbol.includes("OP") || symbol.includes("OPTIMISM")) {
    return {
      url: `https://optimistic.etherscan.io/tx/${hash}`,
      name: "Optimism Explorer",
      network: "Optimism",
    };
  }

  // Default → Base
  return {
    url: `https://basescan.org/tx/${hash}`,
    name: "Basescan",
    network: "Base",
  };
};