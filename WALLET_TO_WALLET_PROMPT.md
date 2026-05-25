# Task: Wallet-to-Wallet Funding + P2P Send + Receive for Element Pay dApp

## Project context
- Repo: Element Pay dApp (Next.js 15, React 19, TypeScript)
- Branch: `feature/landing-overhaul-auth-kyc` (or current)
- Stack: Privy (`@privy-io/react-auth` 3.13.1) + `@privy-io/wagmi` 4.0.1 + wagmi 2 + viem 2 + ERC-4337 smart wallets via `@privy-io/react-auth/smart-wallets`
- Existing flows: Offramp (crypto → KES via M-Pesa) and Onramp (KES → crypto via STK push)
- On login, users choose either a **Privy embedded wallet** or an **external wallet** (MetaMask, Coinbase Wallet, Phantom, Rabby, WalletConnect, Rainbow)
- On the Privy dashboard, "Cross-chain bridging" is already enabled (Solana → EVM funding source)

## Goal
Add three capabilities so users can move tokens between wallets:

1. **Fund** their embedded wallet (card, external wallet transfer, Solana→Base bridge via Privy's built-in UI)
2. **Send** tokens peer-to-peer to any other wallet address (same-chain)
3. **Receive** tokens (show address + QR)

## Scope decisions (locked in)
- **EVM only** — start with **Base** and USDC specifically
- **Same-chain transfers only** — no bridging on the send side. If we ever want cross-chain sends, that's a separate project (LI.FI / Socket SDK)
- **Destination wallet for funding = embedded wallet only.** External-wallet users are expected to fund themselves via their own wallet's UX
- **No KYC limits** for now
- **Gas sponsorship**: only sponsor the P2P send *from embedded wallets*. Funding itself doesn't need sponsorship (the onramp/bridge provider bakes fees into their quote; external-wallet-initiated transfers pay their own gas)

## Current code touchpoints
| File | Role |
|------|------|
| `src/app/providers.tsx` (lines 127-165) | PrivyProvider config — `embeddedWallets.ethereum.createOnLogin` is currently `"off"`, needs changing |
| `src/hooks/useTransfer.ts` | Detects wallet type (embedded / external) and routes to optimal approval path — reuse this pattern |
| `src/hooks/useGaslessTransfer.ts` | Has `gaslessApprove` using Privy smart wallet client + paymaster. Need to add `gaslessTransfer` sibling |
| `src/hooks/useWallet.ts` | Returns current wallet address (handles external/embedded selection) |
| `src/lib/privy-wallet-selection.ts` | `getExplicitSelectedWalletAddress` helper |
| `src/components/dashboard/QuickActions.tsx` | Where Send/Receive/Fund buttons should live (dynamic, ssr:false) |
| `src/components/dashboard/DashboardHeader.tsx` | Alternative home for "Fund" button |
| `src/components/dashboard/sendCrypto/SendCryptoModal.tsx` | Existing offramp modal — reference for validation patterns |
| `src/constants/tokenConfig.ts` | Token decimals / addresses — use getTokenConfig |

## Implementation plan (do in this order)

### Step 1 — Enable embedded wallets for users without one
In `src/app/providers.tsx`, change:
```ts
embeddedWallets: {
  ethereum: { createOnLogin: "off" },
}
```
to:
```ts
embeddedWallets: {
  ethereum: { createOnLogin: "users-without-wallets" },
}
```
This only creates an embedded wallet for users who didn't connect an external one. External-wallet users are unaffected.

### Step 2 — Add `gaslessTransfer` to `src/hooks/useGaslessTransfer.ts`
Mirror `gaslessApprove` but encode ERC-20 `transfer(recipient, amount)` instead of `approve`.

ABI:
```ts
const ERC20_TRANSFER_ABI = [{
  name: "transfer", type: "function", stateMutability: "nonpayable",
  inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }],
  outputs: [{ name: "", type: "bool" }],
}] as const;
```

Signature:
```ts
async function gaslessTransfer(params: {
  tokenAddress: `0x${string}`;
  recipient: `0x${string}`;
  amount: string;
  decimals?: number;
}): Promise<string>  // returns txHash
```

Export it alongside `gaslessApprove`.

### Step 3 — Add "Fund Wallet" button
Use `useFundWallet` from `@privy-io/react-auth`. Only show when the user's active wallet is the embedded one. Lock to Base + USDC for v1:
```ts
const { fundWallet } = useFundWallet();
await fundWallet(embeddedAddress, { chain: base, asset: "USDC" });
```
Place the button in `QuickActions.tsx`. Gate visibility on `walletType === "embedded"` from `useTransfer`.

### Step 4 — Build `SendToWalletModal`
Path: `src/components/dashboard/sendToWallet/SendToWalletModal.tsx`

Fields:
- Recipient address (validated with viem's `isAddress`; resolve ENS optionally via wagmi's `useEnsAddress`)
- Token (default USDC on Base; v1 can hardcode)
- Amount (with balance check from `useWallet`)

Submit logic:
```ts
if (walletType === "embedded") {
  // Sponsored — paymaster covers gas
  await gaslessTransfer({ tokenAddress, recipient, amount, decimals });
} else {
  // External — user pays gas via wagmi writeContract
  await writeContract({ address: tokenAddress, abi: erc20Abi, functionName: "transfer", args: [recipient, parseUnits(amount, decimals)] });
}
```

No approve step (unlike the offramp — plain `transfer` doesn't need allowance).

Show clear "Base network only" warning above the recipient field.

Render it in `QuickActions.tsx` as a dynamic import with `ssr:false`, matching the existing offramp/onramp pattern.

### Step 5 — Build `ReceiveModal`
Path: `src/components/dashboard/receive/ReceiveModal.tsx`

- Display current active wallet address (from `useWallet`)
- QR code via `qrcode.react` (already in deps)
- Copy-to-clipboard button
- Chain label: "Base (Ethereum L2)" with warning: "Only send Base-network tokens to this address"

Render in `QuickActions.tsx`.

## Gotchas to watch

1. **Smart-wallet address ≠ EOA address.** Embedded users have a 4337 smart account that differs from the Privy EOA. The QR and "Receive" flow must show the **smart account address** (the one holding funds), not the EOA. Verify `getExplicitSelectedWalletAddress` in `src/lib/privy-wallet-selection.ts` returns the right one for embedded users — if it returns the EOA, the funded USDC will sit somewhere the UI doesn't see.

2. **Chain label clarity.** USDC on Base ≠ USDC on Arbitrum. If a recipient sends Arbitrum USDC to a Base address, the user sees nothing. Lock both Send and Receive UIs to one chain per action and label loudly.

3. **Paymaster cost.** Every gasless P2P send from an embedded wallet costs the business gas. Worth flagging to the team — may eventually want a min-amount threshold to discourage dust.

4. **Don't break offramp.** The offramp's gateway `approve` → backend `createOrder` flow in `SendCryptoModal` must keep using `gaslessApprove`. The new `gaslessTransfer` is a separate peer-to-peer primitive, not a replacement.

5. **Create-on-login behavior.** `"users-without-wallets"` means the embedded wallet only appears for users who chose embedded at login. Existing external-wallet users won't suddenly get one. If the team wants every user to have a fundable embedded wallet regardless of login method, switch to `"all-users"` — but confirm first.

## Deliverable
PR to `feature/landing-overhaul-auth-kyc` (or whatever the current feature branch is — check `git status` first) implementing Steps 1-5 in order. Each step should be verifiable before moving on. Don't commit unless I explicitly ask.

## Start here
Run `git status` and read `src/hooks/useGaslessTransfer.ts` and `src/components/dashboard/QuickActions.tsx` first to confirm nothing has drifted since this prompt was written.
