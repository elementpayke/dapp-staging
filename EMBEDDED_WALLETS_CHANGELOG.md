# Embedded Wallets — Implementation Changelog

> **Branch:** `feat/embedded-wallets`
> **Date:** March 2026
> **Stack:** Next.js 15.5.12 · Privy SDK v3.13.1 · Zustand · Wagmi · Base chain

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Auth Flow — End to End](#auth-flow--end-to-end)
4. [New Files](#new-files)
5. [Modified Files](#modified-files)
6. [Token Chain (HS256 → RS256)](#token-chain-hs256--rs256)
7. [Anti-Loop & Caching Strategy](#anti-loop--caching-strategy)
8. [Gasless Transactions](#gasless-transactions)
9. [Dev Environment Notes](#dev-environment-notes)
10. [Privy Dashboard Configuration](#privy-dashboard-configuration)

---

## Overview

This feature adds **Privy Embedded Wallets** to ElementPay, allowing users to transact on-chain without installing MetaMask or any browser extension. After verifying their email via OTP, users choose between:

- **Embedded wallet** (recommended) — Privy creates and manages a wallet for them. Zero setup, gasless transactions via ERC-4337 smart accounts.
- **External wallet** — Connect MetaMask, Coinbase Wallet, Rabby, or any WalletConnect-compatible wallet.

The key technical challenge was bridging ElementPay's existing HTTP-only cookie auth (HS256 JWTs) with Privy's JWT-based custom auth (RS256 JWTs), doing so in a single round-trip, and keeping the Privy session alive without looping API calls.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        providers.tsx                             │
│                                                                 │
│  PrivyProvider                                                  │
│    └─ QueryClientProvider                                       │
│         └─ WagmiProvider                                        │
│              └─ SmartWalletsProvider                            │
│                   ├─ PrivyAuthSync      (JWT bridge)            │
│                   ├─ PrivyWalletListener (wallet registration)  │
│                   ├─ AuthModal           (UI flow)              │
│                   └─ App children                               │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Role |
|---|---|
| `PrivyAuthSync` | Bridges ElementPay auth → Privy session via `useSubscribeToJwtAuthWithFlag`. Manages RS256 token cache. |
| `PrivyWalletListener` | Watches for wallet address availability after Privy authenticates. Registers wallet with backend. |
| `WalletChoiceStep` | UI for embedded vs external wallet selection. Calls `createWallet()` for embedded. |
| `AuthModal` | 5-step modal: email → otp → wallet-choice → wallet → wallet-linking |

---

## Auth Flow — End to End

```
User enters email
      │
      ▼
  EmailStep ──POST /api/auth/request-otp──► Backend sends OTP
      │
      ▼
  OTPStep ──POST /api/auth/verify-otp──┐
      │                                 │
      │  Server-side chain:             │
      │  1. Verify OTP → get HS256      │
      │  2. POST /auth/privy/token      │
      │     (Bearer: HS256)             │
      │  3. Get RS256 JWT back          │
      │                                 │
      ◄────{ user, privy_token }────────┘
      │
      │  Client stores:
      │  • setAuth(user)           → authStore (persisted)
      │  • setPrivyToken(rs256)    → authStore (ephemeral)
      │
      ▼
  PrivyAuthSync picks up isOtpVerified=true
      │  getExternalJwt() → returns cached RS256 token
      │
      ▼
  Privy SDK authenticates via custom JWT
      │  POST https://auth.privy.io/api/v1/custom_jwt_account/authenticate
      │
      ▼
  WalletChoiceStep shows (ready && authenticated)
      │
      ├──► "Create wallet for me" → createWallet()
      │         │
      │         ▼
      │    PrivyWalletListener detects wallet address
      │         │
      │         ▼
      │    POST /api/auth/connect-wallet → Backend registers wallet
      │         │
      │         ▼
      │    setWalletRegistered(true) → Navigate to /dashboard
      │
      └──► "I have my own wallet" → WalletStep (MetaMask/WC flow)
                │
                ▼
           Same PrivyWalletListener → connect-wallet → dashboard
```

---

## New Files

### `src/components/auth/PrivyAuthSync.tsx`

Side-effect component (renders `null`). Mounted once in `providers.tsx`.

- Uses `useSubscribeToJwtAuthWithFlag` to sync ElementPay's `isOtpVerified` flag with Privy's session.
- **3-tier token cache** to avoid redundant HTTP calls:
  1. **Ref cache** (`tokenCacheRef`) — persists across re-renders, checked first on every call
  2. **Store cache** (`authStore.privyToken`) — set during OTP verification, consumed on first `getExternalJwt` call
  3. **HTTP fallback** (`POST /api/auth/privy-token`) — used on page reload when caches are empty
- JWT expiry checked with 60-second margin before `exp` claim.
- Circuit breaker: stops HTTP fetching after 3 consecutive failures.
- Caches clear on logout (`onUnauthenticated`).

### `src/components/auth/WalletChoiceStep.tsx`

UI step shown after OTP verification. Two options:

- **Embedded (recommended):** Requires `usePrivy().ready && authenticated`. 15-second timeout shows error state. Auto-recovers if Privy authenticates after timeout. Calls `createWallet()` directly.
- **External:** Always available. Navigates to `WalletStep` for MetaMask/WC connection.

### `src/components/auth/PrivyWalletListener.tsx`

Global listener watching four conditions:
1. `walletConnecting` — user initiated wallet flow
2. `isOtpVerified` — valid ElementPay session
3. `authenticated` — Privy is authenticated
4. Privy wallet address available

When all conditions are met, registers the wallet with the backend via `POST /api/auth/connect-wallet`. Handles conflicts (409/403), Privy modal dismissal, and errors.

### `src/app/api/auth/privy-token/route.ts`

Server-side proxy route:
1. Reads HS256 access token from HTTP-only cookie
2. Calls backend `POST /auth/privy/token` with Bearer auth
3. Returns `{ token: <RS256 JWT> }`
4. Diagnostic logging validates the returned token is RS256

Used by `PrivyAuthSync` as HTTP fallback (page reload scenarios).

### `src/hooks/useGaslessTransfer.ts`

Hook exposing `gaslessApprove(params)` for ERC-4337 paymaster-sponsored transactions:
- Uses `useSmartWallets()` from `@privy-io/react-auth/smart-wallets`
- Encodes ERC-20 `approve()` call
- Sends via smart wallet client with paymaster sponsorship
- Returns `{ gaslessApprove, smartWalletReady }`

---

## Modified Files

### `src/app/api/auth/verify-otp/route.ts`

**Server-side Privy token chaining** — after OTP verification succeeds:
1. Extracts `accessToken` from the backend response
2. Immediately calls `POST /auth/privy/token` using that token (not cookies — they aren't set yet)
3. Returns `privy_token` alongside user data in the response
4. Privy token failure is **non-blocking** — returns `privy_token: null`
5. Diagnostic logging validates RS256 algorithm

This eliminates a second round-trip — the client gets both user data and the Privy RS256 token in one call.

### `src/services/auth.ts`

- Added `privy_token?: string` to `OTPVerifyResponse` interface
- `verifyOTP()` extracts `privy_token` from response (handles nested `raw.data.privy_token`)
- Added `getPrivyToken()` function — `POST /api/auth/privy-token`, returns `{ token: string }`

### `src/stores/authStore.ts`

New fields:
- `privyToken: string | null` — ephemeral RS256 JWT. **NOT persisted** to localStorage (excluded via `partialize`). Reset in `clearAuth()`.
- `walletPreference: WalletPreference` — `"embedded" | "external" | null`. **IS persisted**. Records user's wallet type selection.

New actions:
- `setPrivyToken(token)` — stores the pre-fetched RS256 token
- `setWalletPreference(pref)` — records wallet choice

### `src/stores/authModalStore.ts`

`openAuthModal()` now handles resume logic:
1. `isWalletRegistered` → no-op (already registered)
2. `isOtpVerified` → resume at `"wallet-choice"` step
3. Live OTP for `pendingEmail` → resume at `"otp"` step
4. Otherwise → start at `"email"` step

Added `hideModal()` — hides modal without clearing `walletConnecting` (for Privy modal handoff).

### `src/components/auth/OTPStep.tsx`

After successful OTP verification:
1. Calls `setAuth(user)` with `kyc_status` defaulting to `"none"`
2. **Stores RS256 token**: `useAuthStore.getState().setPrivyToken(res.privy_token)` if present
3. Navigates to `"wallet-choice"` step

### `src/components/auth/AuthModal.tsx`

- Added `"wallet-choice"` and `"wallet-linking"` to 5-step flow
- Close blocked during `wallet-linking` (API in-flight)
- `handleClose` no longer calls `clearPending()` — preserves auth state for resume
- Progress dots and step labels updated

### `src/components/landingPage/HeroSection.tsx`

Simplified `handleCTA`:
- If fully authenticated → navigate to `/dashboard`
- Otherwise → `openAuthModal()` (which correctly resumes at wallet-choice if OTP verified)
- Removed hard-coded `setStep("wallet")` that was bypassing wallet-choice

### `src/components/landingPage/PreviewForm.tsx`

Same simplification as HeroSection:
- If authenticated → dashboard
- Otherwise → `openAuthModal()`
- Removed hard-coded `setStep("wallet")` bypass

### `src/app/providers.tsx`

PrivyProvider configuration:
- `appId: "cmkn2mzls02apjp0cvfjkr4ab"`
- `loginMethods: ["wallet"]`
- `defaultChain: base`
- `embeddedWallets.ethereum.createOnLogin: "off"` — manual creation via WalletChoiceStep, not auto on login
- Mounts `PrivyAuthSync`, `PrivyWalletListener`, and `AuthModal` at the provider level
- Wrapped in `SmartWalletsProvider` for ERC-4337 gasless transactions

---

## Token Chain (HS256 → RS256)

ElementPay's backend issues HS256 session tokens. Privy requires RS256 JWTs verified via JWKS. The bridge works as follows:

```
Backend endpoint: POST /auth/privy/token
  Input:  Bearer <HS256 access token>
  Output: { token: "<RS256 JWT>", token_type: "bearer" }
```

**Primary path** (OTP verification — zero extra HTTP calls on client):
```
Client → POST /api/auth/verify-otp → Next.js server
  Next.js: verify OTP → get HS256 token → chain /auth/privy/token → get RS256
  Response: { user, privy_token: "<RS256>" }
Client: stores RS256 in authStore.privyToken (ephemeral)
PrivyAuthSync: consumes from cache → passes to Privy SDK
```

**Fallback path** (page reload — one HTTP call):
```
PrivyAuthSync: no cache → POST /api/auth/privy-token → Next.js server
  Next.js: read HS256 from cookie → /auth/privy/token → RS256
  Response: { token: "<RS256>" }
PrivyAuthSync: caches in tokenCacheRef for subsequent calls
```

---

## Anti-Loop & Caching Strategy

### Problem
Privy's `useSubscribeToJwtAuthWithFlag` calls `getExternalJwt` multiple times — for initial auth, session validation, and periodic refresh. Without caching:
- Each call hit `/api/auth/privy-token` → new RS256 → Privy re-authenticated → triggered another call → infinite loop

### Solution: 3-Tier Token Cache

```
getExternalJwt() called by Privy
  │
  ├─ Check tokenCacheRef (ref, survives re-renders)
  │   └─ Valid? → return immediately (zero HTTP)
  │
  ├─ Check authStore.privyToken (from OTP verify)
  │   └─ Valid? → move to tokenCacheRef → return (zero HTTP)
  │
  └─ HTTP fallback (POST /api/auth/privy-token)
      └─ Success? → cache in tokenCacheRef → return
      └─ Failure? → increment failure count (circuit breaks at 3)
```

- Token validity: `exp > now + 60s` (60-second margin)
- Cache clears on: logout, new login, `onUnauthenticated` callback
- Typical session: **1 HTTP call** (at OTP verify), then all subsequent `getExternalJwt` calls return the cached token instantly

---

## Gasless Transactions

`useGaslessTransfer` hook provides ERC-4337 paymaster-sponsored transactions:

```typescript
const { gaslessApprove, smartWalletReady } = useGaslessTransfer();

// User pays zero gas — paymaster sponsors the transaction
await gaslessApprove({
  tokenAddress: "0x...",
  spenderAddress: "0x...",
  amount: parseUnits("100", 6),
});
```

- Uses `SmartWalletsProvider` from `@privy-io/react-auth/smart-wallets`
- Smart wallet is created alongside the embedded wallet
- Transactions sent as UserOperations with paymaster data

---

## Dev Environment Notes

### Turbopack on Windows
`pnpm dev` uses Webpack (not Turbopack) for stability on Windows. Turbopack's atomic file writes conflict with Windows file locking (antivirus, indexing), causing frequent `ENOENT` crashes on `.next/static/development/_buildManifest.js.tmp.*`.

Available scripts:
- `pnpm dev` — Webpack dev server (stable)
- `pnpm dev:turbo` — Turbopack dev server (may crash on Windows)
- `pnpm build` — Production build with Turbopack (stable, single-pass)

If you want to use Turbopack for dev, exclude `.next` from Windows Defender:
```powershell
Add-MpExclusion -Path "C:\Users\Administrator\ELEMENT_PAY\dapp-staging\.next"
```

---

## Privy Dashboard Configuration

For the embedded wallet flow to work, the following must be configured in the [Privy Dashboard](https://dashboard.privy.io):

1. **Custom JWT Auth** enabled
2. **JWKS URL** set to: `https://sandbox.elementpay.net/api/v1/auth/jwks.json` (must match the backend's RS256 public key endpoint)
3. **Issuer (`iss`)** claim must match what the backend puts in the RS256 token
4. **Embedded Wallets** enabled for the app
5. **Smart Wallets** enabled (for gasless transactions)
6. **Supported chains**: Base, Arbitrum, Lisk, Scroll

### Environment Variables

```env
NEXT_PUBLIC_PRIVY_APP_ID=cmkn2mzls02apjp0cvfjkr4ab
BACKEND_URL=https://sandbox.elementpay.net/api/v1
```

`BACKEND_URL` already includes the `/api/v1` prefix — all `fetchBackend()` calls use short paths like `/auth/verify-otp`, never `/api/v1/auth/verify-otp`.
