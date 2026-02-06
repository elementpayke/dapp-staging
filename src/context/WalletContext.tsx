/**
 * @deprecated This file is no longer used.
 *
 * Wallet connection is now handled by:
 * - Privy (@privy-io/react-auth) for authentication and wallet modal
 * - @privy-io/wagmi for bridging Privy with wagmi hooks
 * - src/hooks/useWallet.ts for the unified wallet hook
 * - src/lib/useWallet.ts for the Zustand wallet store
 *
 * Do NOT import from this file. Use `useWallet` from `@/hooks/useWallet` instead.
 */

export {};
