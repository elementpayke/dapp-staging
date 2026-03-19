# Privy Auth Flow Report

## Flow Summary

1. OTP verification calls `POST /api/auth/verify-otp`.
2. The backend returns the app session tokens, and the route immediately fetches an RS256 token from `POST /api/auth/privy/token`.
3. `PrivyAuthSync` feeds that RS256 token into Privy custom JWT auth.
4. After Privy auth is ready, the user explicitly chooses one of two wallet paths:
   - `Proceed with your Element Wallet` for an existing embedded wallet
   - `I have my own wallet` for an external wallet via `linkWallet()`
5. The app only registers a wallet with the backend after the user explicitly chooses it.

## Fixes Applied

- Removed every active dependency on `user.wallet.address` for wallet selection.
- Added a shared explicit-selection helper in `src/lib/privy-wallet-selection.ts`.
- Removed the external-wallet fallback that treated wagmi's current address as selected before an external wallet had actually been chosen.
- Updated `WalletStep`, `WalletConnection`, `PrivyWalletListener`, and `useWallet()` to resolve the active address only from the user's chosen wallet path.
- Updated `TokenContext` to wait for the app's explicitly selected and registered wallet before auto-detecting chains or token balances.
- Changed the embedded-wallet CTA copy to `Proceed with your Element Wallet` whenever Privy reports an embedded linked account.
- Kept the Privy JWT session alive during external-wallet cancel/error flows.
- Reset only the wallet attempt state on cancel/error so the user can retry with a different wallet.

## Notes

- The embedded Privy wallet is now treated as selectable, not automatically selected.
- External-wallet linking still uses the Privy JWT session for authentication and backend registration, but `wallet-linking` only starts after Privy resolves a real external wallet selection.
- `useWallet()` now reports connected only when an explicitly selected wallet address exists.
