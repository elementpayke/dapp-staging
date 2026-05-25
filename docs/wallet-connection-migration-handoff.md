# Wallet Connection Migration Handoff (ElementPay -> ElementPayBusiness)

## Purpose
Use this document as the exact instruction set for an implementation agent that will migrate and improve wallet connection logic from `dapp-staging` into the ElementPayBusiness dashboard.

Primary goal:
- Support both custodial (Privy embedded) and non-custodial (external) wallets.
- Ensure every signed-in user has an embedded wallet by default.
- Allow users to also connect external wallets and switch between wallet types.
- Use the selected wallet for balances and transaction flows (Send Money UI and Wallets page).

---

## Improved Prompt For The Other Agent

```md
You are implementing wallet connection logic in the ElementPayBusiness dashboard.

Reference implementation exists in the dapp-staging repo. Recreate the same behavior, but with cleaner structure and explicit ownership of auth, wallet selection, and wallet registration states.

Objective:
1. Implement wallet support for both:
   - Embedded wallet (custodial, Privy)
   - External wallet (non-custodial, MetaMask/Coinbase/WalletConnect)
2. Default behavior: every user who signs in must have an embedded wallet available.
3. Users can optionally connect one or more external wallets.
4. Users can view supported token balances for the currently selected wallet.
5. Wallet selection must drive transaction execution in Send Money UI and Wallets page.

Required behavior:
- On sign-in and OTP verification:
  - Sync app auth session to Privy custom JWT auth.
  - If user already has a registered embedded wallet, fast-track and mark wallet as ready.
  - Else, create embedded wallet (or auto-select existing embedded wallet) and register/link it.
- External wallet flow:
  - Allow linking external wallets through Privy modal.
  - Handle modal dismiss safely (resume wallet choice step, no stuck loading state).
  - Register newly linked external wallet with backend.
- Wallet resolution:
  - Resolve selected wallet from explicit preference (`embedded` or `external`) and linked wallets.
  - Never silently switch wallet type without user intent.
- Token and network behavior:
  - Show balances for supported tokens using selected wallet address.
  - Restrict embedded-wallet token list based on unsupported sponsorship chains.
  - Support chain switch when selecting token/network.
- Disconnect behavior:
  - Unified disconnect: Privy logout -> wagmi disconnect -> local wallet store cleanup.
- Edge cases:
  - Handle stale Privy session when app auth is no longer valid.
  - Avoid duplicate wallet registration API calls.
  - Surface wallet ownership conflict errors clearly.

Code structure requirements:
- Extract reusable wallet domain logic into clear modules:
  - provider setup
  - auth sync
  - wallet registration listener
  - wallet selection resolver
  - wallet store and auth store
  - token/balance context
- Avoid duplicated side effects across components.
- Keep UI orchestration separate from wallet domain logic.

Source mapping from dapp-staging (replicate and improve):
- Providers and Privy/wagmi setup:
  - src/app/providers.tsx
- Wallet resolution and wallet hook:
  - src/lib/privy-wallet-selection.ts
  - src/hooks/useWallet.ts
- Auth and modal state machine:
  - src/stores/authStore.ts
  - src/stores/authModalStore.ts
- Privy auth sync + wallet listener:
  - src/components/auth/PrivyAuthSync.tsx
  - src/components/auth/PrivyWalletListener.tsx
- Wallet choice and onboarding flow:
  - src/components/auth/OTPStep.tsx
  - src/components/auth/WalletChoiceStep.tsx
  - src/components/wallet-connection/wallet-connection.tsx
  - src/components/dashboard/SwitchWalletModal.tsx
- Token and balance logic:
  - src/context/TokenContext.tsx
  - src/hooks/useTokenBalance.ts
  - src/constants/supportedTokens.ts
- API bridge/auth services:
  - src/services/auth.ts
  - src/app/api/auth/connect-wallet/route.ts
  - src/app/api/auth/privy-token/route.ts

Delivery criteria:
- A signed-in user always has an embedded wallet available.
- User can connect external wallet(s) and switch wallet preference.
- Selected wallet address is the single source of truth for balances and transactions.
- Supported token balances render correctly for selected wallet.
- Send Money UI and Wallets page both consume the same selected wallet logic.
- No stuck states when Privy modal is dismissed.
- No duplicate wallet registration calls.
- Conflict errors are shown with clear user-facing messaging.

Implementation notes:
- Keep existing business dashboard UX style, but do not keep current fragmented wallet state management.
- Prefer composable hooks/services and deterministic state transitions.
- Add targeted tests for wallet selection, auth sync race conditions, and wallet-linking edge cases.
```

---

## File Map In dapp-staging (What To Port)

### 1) Provider and SDK wiring
- `src/app/providers.tsx`
  - Privy provider config (`embeddedWallets.createOnLogin = users-without-wallets`)
  - Wagmi provider bridge (`@privy-io/wagmi`)
  - Smart wallets provider
  - Global mount of auth/wallet sync components (`PrivyAuthSync`, `PrivyWalletListener`)

### 2) Auth and wallet state sources of truth
- `src/stores/authStore.ts`
  - App auth flags (`isOtpVerified`, `isWalletRegistered`, `isAuthenticated`)
  - `walletPreference` (`embedded | external | null`)
  - Connected wallet address set and Privy token bridge field
- `src/stores/authModalStore.ts`
  - Auth step state machine (`email -> otp -> wallet-choice -> wallet-linking`)
  - External wallet selection pending/open flags for modal-dismiss resilience

### 3) Privy custom JWT sync and race-condition handling
- `src/components/auth/PrivyAuthSync.tsx`
  - Uses `useSubscribeToJwtAuthWithFlag`
  - Pulls RS256 token from app API bridge
  - Handles cached token reuse, expiry checks, and failure circuit breaker

### 4) Wallet registration side effects
- `src/components/auth/PrivyWalletListener.tsx`
  - Waits for all conditions before linking wallet:
    - wallet-connecting mode
    - OTP verified
    - Privy authenticated
    - wallet address present
  - Calls backend connect-wallet API once, deduped with guard ref
  - Handles modal dismiss and ownership conflict recovery

### 5) Wallet selection resolver and consumer hook
- `src/lib/privy-wallet-selection.ts`
  - Explicit wallet selection resolver based on preference and linked wallets
- `src/hooks/useWallet.ts`
  - Unified selected wallet address
  - Connection flags, ENS lookup, USDC balance wiring
  - Unified disconnect flow

### 6) OTP and wallet choice onboarding flow
- `src/components/auth/OTPStep.tsx`
  - Verifies OTP and stores app auth state
  - Fast-tracks users with existing embedded wallet
- `src/components/auth/WalletChoiceStep.tsx`
  - Embedded wallet creation/reuse path
  - External wallet link path (linkWallet)
  - Timeout fallback path
- `src/components/wallet-connection/wallet-connection.tsx`
  - Public connect/disconnect CTA logic
  - Stale Privy session cleanup

### 7) Dashboard wallet switching and external wallet linking
- `src/components/dashboard/SwitchWalletModal.tsx`
  - Switch active wallet
  - Link additional external wallet
  - Register unregistered external wallet before making active

### 8) Token support and wallet-based balances
- `src/constants/supportedTokens.ts`
  - Supported token list and embedded wallet unsupported chains
- `src/context/TokenContext.tsx`
  - Selected token + chain switching
  - Uses selected wallet address from resolver
  - Chain/token auto-detection logic based on balances
- `src/hooks/useTokenBalance.ts`
  - Token-specific balance retrieval for selected wallet

### 9) Backend/API bridges
- `src/services/auth.ts`
  - `connectWallet`, `verifyOTP`, `getPrivyToken`
  - Ownership conflict error helpers
- `src/app/api/auth/connect-wallet/route.ts`
  - Server route proxy for wallet registration
- `src/app/api/auth/privy-token/route.ts`
  - Server route to obtain Privy-compatible RS256 token

---

## Suggested Migration Steps For The Agent

1. Set up Privy + wagmi + smart wallet providers in the business app root providers.
2. Create auth and wallet stores with explicit wallet preference and linking states.
3. Implement Privy custom JWT sync module and mount globally.
4. Implement wallet listener side effect module and mount globally.
5. Implement wallet resolver utility and unify all wallet-address reads through it.
6. Port OTP -> wallet-choice flow with embedded-first default.
7. Port external wallet linking and wallet-switching modal behavior.
8. Port token context and balance hooks, keyed by selected wallet address.
9. Wire Send Money UI and Wallets page to selected wallet source of truth.
10. Add tests for modal dismiss recovery, wallet dedupe, and auth-sync race cases.

---

## Acceptance Checklist

- [ ] New user signs in and has embedded wallet available automatically.
- [ ] Existing user with embedded wallet skips unnecessary linking steps.
- [ ] User can connect external wallet and it is registered exactly once.
- [ ] User can switch between embedded and external wallets.
- [ ] Selected wallet drives balances and transaction sender.
- [ ] Token list/balance behavior respects embedded wallet chain constraints.
- [ ] Dismissing Privy modal does not leave broken loading states.
- [ ] Wallet ownership conflict is surfaced with clear error text.
- [ ] Disconnect clears all relevant providers/stores in correct order.

---

## Notes On Improvements Over dapp-staging

While porting, improve architecture by:
- Reducing cross-component side effects and hidden coupling.
- Keeping wallet domain logic in reusable hooks/services.
- Keeping UI components mostly declarative and event-driven.
- Centralizing selected-wallet computation and wallet registration guards.
