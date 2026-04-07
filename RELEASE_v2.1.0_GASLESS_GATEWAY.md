# Element Pay v2.1.0 — Zero Gas, Zero Setup

**Release Date:** March 31, 2026
**Codename:** Gasless Gateway
**Type:** Feature Release — Embedded Wallets & Gas Sponsorship

---

## Overview

Element Pay v2.1.0 removes the two biggest barriers to crypto payments: wallet setup and gas fees. Users can now transact on-chain with a Privy-powered embedded wallet — no browser extension required — while an ERC-4337 paymaster sponsors every transaction, making gas costs invisible.

---

## Highlights

### Embedded Wallets

After email OTP verification, users can create a Privy-managed wallet in one tap. No MetaMask, no seed phrases, no prior crypto knowledge needed. The wallet is created and secured by Privy, linked to the user's Element Pay account, and ready to transact immediately.

### Gas Sponsorship (ERC-4337)

All embedded wallet transactions are routed through smart accounts with paymaster sponsorship. Users never see a gas prompt or pay network fees. The `useGaslessTransfer` hook handles ERC-20 `approve()` calls via `SmartWalletsProvider`, sending UserOperations with paymaster data.

### Privy-Sponsored Withdrawals

Token transfers from embedded wallets are fully gas-sponsored via Privy's `useSendTransaction`, with built-in balance checks, gas estimation, multi-chain configuration, and structured error handling (`usePrivySponsoredWithdrawal`).

### Smart Transfer Routing

A unified `useTransfer` hook automatically selects the optimal approval path:

| Wallet Type | Token Support | Path | Who Pays Gas? |
|---|---|---|---|
| Embedded (Privy) | Any | `embedded-gasless` | Paymaster (free) |
| External | EIP-2612 permit | `external-permit` | No gas needed |
| External | Standard ERC-20 | `external-standard` | User |

### Custom JWT Auth Bridge

Seamless single-round-trip authentication chain (HS256 → RS256) with a 3-tier token cache (ref → store → HTTP fallback) to prevent API loops and minimize latency. Privy session stays alive without redundant HTTP calls.

### Wallet Choice UX

New onboarding step lets users pick between:

- **Embedded wallet (recommended)** — Privy creates and manages the wallet. Zero setup, gasless transactions.
- **External wallet** — Connect MetaMask, Coinbase Wallet, Rabby, or any WalletConnect-compatible wallet.

---

## New Components & Hooks

| File | Purpose |
|---|---|
| `PrivyAuthSync` | Bridges ElementPay auth → Privy session via custom JWT. 3-tier token cache with circuit breaker. |
| `PrivyWalletListener` | Watches for wallet availability post-auth, registers with backend. |
| `WalletChoiceStep` | UI for embedded vs external wallet selection. |
| `useGaslessTransfer` | ERC-4337 paymaster-sponsored `approve()` via smart wallet client. |
| `useTransfer` | Unified hook — auto-detects wallet type and routes to optimal approval path. |
| `usePrivySponsoredWithdrawal` | Full sponsored withdrawal flow with gas estimation and error handling. |
| `usePermitTransfer` | EIP-2612 permit signature collection for external wallets. |

---

## Auth Flow

```
Email OTP → Verify → HS256 token → RS256 bridge → Privy custom auth
  → Wallet Choice (embedded or external)
    → Wallet created/connected → Registered with backend → Dashboard
```

The RS256 Privy token is obtained server-side during OTP verification (zero extra client HTTP calls). On page reload, a single fallback call to `/api/auth/privy-token` refreshes the cache.

---

## Technical Stack

| Component | Detail |
|---|---|
| **Wallet SDK** | Privy `@privy-io/react-auth` v3.13.1 |
| **Smart Accounts** | `@privy-io/react-auth/smart-wallets` (ERC-4337) |
| **Chain** | Base (primary), multi-chain ready (Lisk, Scroll) |
| **Auth** | Email OTP → HS256 → RS256 JWT bridge → Privy custom auth |
| **Framework** | Next.js 15.5.12, React 19, TypeScript |
| **State** | Zustand (authStore, transactionStore, onboardingStore) |
| **Styling** | Tailwind CSS with `--ep-*` design tokens |

---

## Configuration Requirements

For embedded wallets and gas sponsorship to function, the following must be configured in the [Privy Dashboard](https://dashboard.privy.io):

1. **Custom JWT Auth** enabled
2. **JWKS URL** set to the backend's RS256 public key endpoint
3. **Embedded Wallets** enabled
4. **Smart Wallets** enabled (for ERC-4337 paymaster sponsorship)
5. **Paymaster policy** configured for the target chain(s)

---

## Builds on v2.0.0 (Element Refined)

This release extends the v2.0.0 foundation which delivered the redesigned UI, email-based auth, SmileID KYC, multi-chain support, and secure API proxy layer. See `RELEASE_v2.0.0_ELEMENT_REFINED.md` for the full v2.0.0 changelog.
