# Element Refined — v2.0.0

**Release Date:** March 11, 2026
**Codename:** Element Refined
**Type:** Major Release — Full Platform Overhaul

---

## Overview

**Element Refined** represents a ground-up transformation of the ElementPay dApp. This release delivers a completely redesigned user interface, a new authentication and identity verification system, expanded multi-chain support, and hardened API security — culminating in a platform that is faster, more polished, and production-ready for scale.

---

## What's New

### UI Beautification & Design System

The entire application has been rebuilt around a new design system anchored by the `--ep-*` CSS token architecture, ensuring pixel-perfect consistency across every surface — landing page, dashboard, modals, and forms.

- **Brand-first design language** — All interactive elements trace back to the ElementPay brand palette with semantic color tokens for light and dark themes.
- **Redesigned Landing Page** — New `HeroSection` with interactive preview forms for OffRamp and OnRamp flows, dynamic CTAs, and full theme responsiveness.
- **Overhauled Dashboard** — New `QuickActions` component with live KES wallet balance, token/network selectors, and streamlined crypto send/deposit entry points. Refined `OverviewPage` layout and improved `TransactionList` empty states.
- **Modal Refresh** — `SendCryptoModal`, `DepositCryptoModal`, `DepositCryptoReceipt`, `KYCRequiredModal`, and `TransactionDetailModal` all rebuilt with consistent card anatomy, spacing, and shadow tokens.
- **Progress & Processing States** — New animated `ProgressPopup` with `ProcessingHeader`, `ProgressIndicator`, `StatusMessage`, detail rows for transaction info, and confetti animations on success.
- **Full Mobile Responsiveness** — Every component adapts gracefully from mobile to desktop: responsive dialog widths, stacked grids, sticky confirm buttons, proper `inputMode` for mobile keyboards, and orientation-aware layouts.
- **Light + Dark Theme Parity** — Both themes fully supported with no hardcoded colors. Theme toggle works consistently across all pages.
- **Failed Transaction Highlighting** — Visual row highlighting for failed and declined transactions in the transaction list.

### Authentication & KYC

A complete identity layer has been introduced, moving ElementPay from wallet-only access to a full user account system.

- **Email-Based Authentication** — New OTP-based email login flow with session token management and secure cookie storage.
- **Session Management** — Access token refresh mechanisms, session guards (`useSessionGuard`), and authenticated fetch utilities for all API calls.
- **Wallet Linking** — OTP-verified wallet linking flow tying wallet addresses to user profiles, with comprehensive error handling.
- **SmileID KYC Integration** — Full Know Your Customer flow with SmileID: KYC initiation, callback handling, verification status checks, and access token refresh upon successful verification.
- **Transaction Limits** — New users operate under base limits; KYC-verified users unlock higher thresholds.
- **Onboarding Flow** — New wallet connection step and onboarding form guiding first-time users through setup.

### New Integrations & Multi-Chain Support

- **LISK & SCROLL Networks** — New logo assets and configuration for Lisk and Scroll chain support.
- **In-Modal Network Switching** — Users can switch networks directly within `SendCryptoModal` and `DepositCryptoModal` without leaving their transaction flow.
- **WalletConnect IndexedDB Repair** — Automatic repair function for WalletConnect storage corruption, improving connection reliability.
- **Smart Wallet Detection** — Coinbase Smart Wallet and other EIP-4337 wallet compatibility with safe chain switching via connector-based provider detection.
- **Expanded Wallet Support** — Prioritized wallet list (Base, MetaMask, Phantom, Rabby) with mobile-first `wallet_connect` ordering and Rainbow wallet addition.

### API Security & Backend Hardening

- **Secure API Proxy Layer** — All sensitive API calls routed through Next.js server-side API routes (`/api/element-pay/`), eliminating client-side API key exposure.
- **Token Refresh Mechanism** — Automatic access token refresh for order creation and protected endpoints.
- **Dynamic Fee Structure** — Backend-driven tiered fee bands replace hardcoded charges, with real-time calculation utilities (`getTotalCost`, `calculateMaxSpendableFiat`).

### Transaction Flow Improvements

- **Real-Time Transaction Summary** — Fully reactive summaries with live balance, exchange rate, and fee dependencies.
- **Pre-Transaction Validation** — Multi-level guards: form validation (min 10 KES, numeric checks), balance affordability checks, and execution-time guards before approval.
- **Approve-Only OffRamp Mode** — Support for transactions requiring only token approval without immediate execution.
- **STK Push Timeout Handling** — Graceful timeout with user-friendly messaging when M-Pesa STK push verification exceeds maximum attempts.
- **Actionable Error Messages** — Backend error codes mapped to clear, human-readable messages with suggested next steps.

---

## Technical Highlights

| Area | Detail |
|---|---|
| **Framework** | Next.js with App Router, React 18, TypeScript |
| **State Management** | Zustand stores (`authStore`, `transactionStore`, `onboardingStore`, `kycModalStore`) |
| **Styling** | Tailwind CSS with CSS custom properties (`--ep-*` design tokens) |
| **Wallet Integration** | Privy + wagmi + viem with EIP-5749/EIP-6963 provider handling |
| **Auth** | Email OTP → Access Token → Secure HTTP-only cookies |
| **KYC** | SmileID SDK integration with callback route |
| **API Security** | Server-side proxy routes, no client-side API keys |

---

## Rollback

A snapshot of the previous production state is preserved as `main-backup-2026-03-10` on the live remote for immediate rollback if needed.

---

**ElementPay Team — Q1 2026**
