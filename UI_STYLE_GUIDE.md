# ElementPay — UI Style Guide

> Single source of truth for all surfaces: landing page, dashboard, modals, forms.
> Every component must reference these tokens and patterns. No ad-hoc colors.

---

## 1. Design Philosophy

| Principle | Description |
|---|---|
| **Brand-first** | Every interactive element traces back to the brand purple `#4339CA`. No rainbow gradients. |
| **Clean & airy** | Generous whitespace, rounded corners (`2xl`/`full`), subtle shadows. No heavy borders or dark outlines. |
| **Single hierarchy** | One primary CTA per view. Supporting actions use outlined or ghost variants. |
| **Consistent density** | Cards use `p-5 sm:p-6`. Inputs use `px-3 py-2.5`. Spacing between sections is `space-y-5`. |
| **Light + Dark** | All colors are CSS custom properties. Dark mode swaps via `[data-theme="dark"]` on `<html>`. |
| **No redundancy** | Data (balances, fees) appears exactly once per view. |

---

## 2. Color Tokens

### 2.1 Semantic Variables (CSS Custom Properties)

All dashboard components use `--ep-*` prefixed variables. Landing page keeps its existing `--landing-*` variables (they are intentionally aligned).

```
:root (light)                              [data-theme="dark"]
──────────────────────────────────────────  ──────────────────────────────
--ep-accent:          #4339CA              --ep-accent:          #6C63FF
--ep-accent-hover:    #3630A3              --ep-accent-hover:    #5B52E0
--ep-accent-muted:    rgba(67,57,202,0.08) --ep-accent-muted:    rgba(108,99,255,0.12)
--ep-accent-subtle:   rgba(67,57,202,0.05) --ep-accent-subtle:   rgba(108,99,255,0.06)

--ep-bg:              #F8F6FC             --ep-bg:              #0F0E14
--ep-bg-card:         #FFFFFF             --ep-bg-card:         #1A1924
--ep-bg-input:        #FAF9FC             --ep-bg-input:        #22212E
--ep-bg-elevated:     #FFFFFF             --ep-bg-elevated:     #252435

--ep-border:          #E5E3EF             --ep-border:          #2E2D3D
--ep-border-focus:    rgba(67,57,202,0.30) --ep-border-focus:   rgba(108,99,255,0.40)

--ep-heading:         #1A1A1A             --ep-heading:         #F0EFF4
--ep-body:            #4A4845             --ep-body:            #B0ADBA
--ep-muted:           #78716C             --ep-muted:           #6E6B7B

--ep-card-shadow:     0 4px 24px rgba(67,57,202,0.06)
                                          0 4px 24px rgba(0,0,0,0.30)
--ep-card-shadow-hover: 0 8px 32px rgba(67,57,202,0.10)
                                          0 8px 32px rgba(0,0,0,0.40)
```

### 2.2 Status Colors (Same in both themes)

| Status | Background | Text |
|---|---|---|
| Success | `bg-emerald-50` / dark: `bg-emerald-500/10` | `text-emerald-600` |
| Error | `bg-red-50` / dark: `bg-red-500/10` | `text-red-500` |
| Warning | `bg-amber-50` / dark: `bg-amber-500/10` | `text-amber-600` |
| Info / Pending | `bg-[var(--ep-accent-muted)]` | `text-[var(--ep-accent)]` |

### 2.3 Forbidden Colors

Do **NOT** use these in new code:
- `from-blue-600 to-red-600` gradient (old Spend Crypto)
- `from-green-500 to-teal-400` gradient (old Deposit Crypto)
- Raw `bg-gray-50`, `bg-gray-100`, `border-gray-200` — use `--ep-*` tokens instead
- `text-gray-900`, `text-gray-600` — use `--ep-heading`, `--ep-body`, `--ep-muted`

---

## 3. Typography

| Role | Class |
|---|---|
| Page title | `text-xl font-bold tracking-tight text-[var(--ep-heading)]` |
| Section title | `text-lg font-semibold text-[var(--ep-heading)]` |
| Card title | `text-base font-semibold text-[var(--ep-heading)]` |
| Eyebrow / Label | `text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ep-muted)]` |
| Body | `text-sm text-[var(--ep-body)] leading-relaxed` |
| Caption / Helper | `text-xs text-[var(--ep-muted)]` |
| Large number | `text-3xl sm:text-4xl font-bold text-[var(--ep-heading)]` |
| Accent label | `text-sm font-medium text-[var(--ep-accent)]` |

---

## 4. Component Anatomy

### 4.1 Card

```
rounded-2xl
border border-[var(--ep-border)]
bg-[var(--ep-bg-card)]
shadow-[var(--ep-card-shadow)]
p-5 sm:p-6
```
Hover (optional): `hover:shadow-[var(--ep-card-shadow-hover)] transition-shadow duration-200`

### 4.2 Buttons

**Primary (CTA)**
```
rounded-full px-6 py-3 text-sm font-semibold text-white
bg-[var(--ep-accent)] hover:bg-[var(--ep-accent-hover)]
shadow-[0_2px_16px_rgba(67,57,202,0.25)]
hover:shadow-[0_4px_24px_rgba(67,57,202,0.35)]
transition-all duration-200
disabled:opacity-50
```

**Secondary (Outlined)**
```
rounded-full px-5 py-2.5 text-sm font-medium
text-[var(--ep-accent)] border border-[var(--ep-accent)]/20
bg-[var(--ep-accent-muted)]
hover:bg-[var(--ep-accent)]/15 hover:border-[var(--ep-accent)]/30
transition-all duration-200
```

**Ghost**
```
rounded-full px-4 py-2 text-sm font-medium
text-[var(--ep-body)] hover:text-[var(--ep-heading)]
hover:bg-[var(--ep-accent-subtle)]
transition-colors duration-150
```

**Icon Button**
```
rounded-full p-2
text-[var(--ep-muted)] hover:text-[var(--ep-accent)]
hover:bg-[var(--ep-accent-muted)]
transition-colors duration-150
```

### 4.3 Inputs

```
w-full rounded-xl
border border-[var(--ep-border)]
bg-[var(--ep-bg-input)]
px-3 py-2.5 text-sm text-[var(--ep-heading)]
placeholder:text-[var(--ep-muted)]
focus:outline-none focus:border-[var(--ep-border-focus)]
focus:ring-2 focus:ring-[var(--ep-accent)]/10
transition-colors duration-150
```

**With inline action (e.g. Max button)**
Wrap in `relative` container. Button: `absolute right-2 top-1/2 -translate-y-1/2 rounded-full text-xs px-2.5 py-1 bg-[var(--ep-accent-muted)] text-[var(--ep-accent)] hover:bg-[var(--ep-accent)]/15 font-semibold`

### 4.4 Tab Switcher (Payment Method)

Container: `rounded-xl bg-[var(--ep-bg-input)] p-1 flex gap-1`
Tab (active): `rounded-lg px-4 py-2 text-sm font-medium bg-[var(--ep-bg-card)] text-[var(--ep-heading)] shadow-sm`
Tab (inactive): `rounded-lg px-4 py-2 text-sm font-medium text-[var(--ep-muted)] hover:text-[var(--ep-heading)] transition-colors`

### 4.5 Sidebar

- Container: `fixed top-0 left-0 h-screen w-64 bg-[var(--ep-bg-card)] border-r border-[var(--ep-border)] z-40`
- Logo: `w-9 h-9 rounded-xl bg-[var(--ep-accent)]` with `w-4 h-4 rounded-md bg-white` inner mark
- Nav item (active): `rounded-xl bg-[var(--ep-accent-muted)] text-[var(--ep-accent)] font-semibold`
- Nav item (hover): `rounded-xl hover:bg-[var(--ep-accent-subtle)] text-[var(--ep-body)]`
- Nav icon (active): `text-[var(--ep-accent)]`; inactive: `text-[var(--ep-muted)]`
- Sub-link (active): `text-[var(--ep-accent)] bg-[var(--ep-accent-muted)] rounded-lg`
- Footer: theme toggle + optional user avatar

### 4.6 Transaction Summary Panel (SendCrypto right column)

```
rounded-2xl border border-[var(--ep-border)]
bg-[var(--ep-bg-input)] p-5
```
Row: `flex justify-between items-center py-2`
Row label: `text-sm text-[var(--ep-muted)]`
Row value: `text-sm font-medium text-[var(--ep-heading)]`
Divider total row: `border-t border-[var(--ep-border)] pt-3 mt-1`
Total label: `text-base font-semibold text-[var(--ep-heading)]`

### 4.7 Status Badges

```
rounded-full px-2.5 py-0.5 text-xs font-medium
```
Colors per §2.2 status table.

### 4.8 Address Pill

```
rounded-full px-4 py-1.5
text-xs font-mono
bg-[var(--ep-accent-muted)]
text-[var(--ep-accent)]
border border-[var(--ep-accent)]/20
```

---

## 5. Layout & Spacing

| Context | Spec |
|---|---|
| Dashboard page padding | `px-6 py-6` |
| Section gap | `space-y-5` |
| Card internal padding | `p-5 sm:p-6` |
| Grid gutters | `gap-5 sm:gap-6` |
| Modal max width | `max-w-2xl` (single-column) or `max-w-4xl` (two-column) |
| Sidebar width | `w-64` (desktop), full overlay (mobile) |
| Mobile overlay | `fixed inset-0 bg-black/40 backdrop-blur-sm z-30` |

---

## 6. Modal & Dialog

- `DialogContent`: `rounded-2xl border border-[var(--ep-border)] bg-[var(--ep-bg-card)] shadow-xl p-5 sm:p-6`
- `DialogTitle`: `text-lg font-semibold text-[var(--ep-heading)]`
- Close icon: `text-[var(--ep-muted)] hover:text-[var(--ep-heading)]`
- Overlay: `bg-black/40 backdrop-blur-sm`

---

## 7. Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| Use `--ep-accent` (`#4339CA`) as the sole brand color | Use `blue-600→red-600` or `green-500→teal-400` gradients |
| Show wallet balance exactly **once** per modal | Repeat balance in both form sections and summary panel |
| Place Max button **inside** the amount input field | Float Max as a separate component outside the input |
| Use `rounded-full` for primary CTAs | Mix `rounded-xl`, `rounded-full`, and `rounded-lg` for CTAs |
| Use `rounded-2xl` for cards | Use `rounded-xl` or `rounded-lg` for cards |
| Use `transition-all duration-200` for interactive elements | Add Framer Motion for basic hover/focus effects |
| Reference CSS variables for all colors | Hardcode Tailwind color classes like `bg-gray-100` |
| Use eyebrow pattern for section labels | Use plain `text-sm text-gray-600` labels |

---

## 8. Dark Mode Implementation

1. Toggle sets `data-theme="dark"` on `<html>` and persists to `localStorage`.
2. All `--ep-*` variables have dark-mode overrides in `globals.css`.
3. Status colors (emerald, red, amber) use opacity-based backgrounds that work on any base.
4. Images / logos should use `brightness` or `invert` filter if needed — no separate dark assets.

---

## 9. File Reference

| File | Purpose |
|---|---|
| `src/app/globals.css` | All `--ep-*` variable definitions (light + dark) |
| `src/lib/useTheme.ts` | Theme toggle hook |
| `src/components/dashboard/Sidebar.tsx` | Navigation chrome |
| `src/components/dashboard/DashboardHeader.tsx` | Page header bar |
| `src/components/dashboard/QuickActions.tsx` | Balance card + action buttons |
| `src/components/dashboard/CryptoPrices.tsx` | Token price ticker |
| `src/components/dashboard/TransactionList.tsx` | Transaction history |
| `src/components/dashboard/sendCrypto/SendCryptoModal.tsx` | Spend Crypto modal |
| `src/components/dashboard/sendCrypto/PayToMobileMoney.tsx` | Payment form inside Spend Crypto |
| `src/components/dashboard/depositCrypto/DepositCryptoModal.tsx` | Deposit Crypto modal |
