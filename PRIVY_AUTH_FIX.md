# Privy JWT Auth Race Condition — Root Cause & Fix

## Problem

After OTP verification, users were stuck at "Preparing wallet connection…" or seeing
dual Privy sessions open simultaneously. Console logs showed:

```
⚠️ Silent auth failure detected — state is 'done' but onAuthenticated never fired
```

…followed seconds later by:

```
✅ Privy authenticated via custom JWT
```

The token was **valid** but the app was declaring failure before authentication had
time to propagate.

---

## Root Cause — Race Condition in Privy SDK v3.13.1

Inside `@privy-io/react-auth`, the internal hook `useSyncJwtBasedAuthState` (minified
as function `Ji`) has an effect whose dependency array includes `authenticated`:

```
useEffect(() => {
  // t() calls getExternalJwt() → authenticate() → onAuthenticated() → setAuthenticated(true)
  t();
}, [... , authenticated]);
```

**What happens:**

1. **Call 1**: `getExternalJwt()` → token → `authenticate()` →
   `onAuthenticated()` fires → `setAuthenticated(true)` → `state = "done"`

2. `setAuthenticated(true)` changes `authenticated`, which is in the **dependency
   array** → the effect **re-fires**.

3. **Call 2**: `getExternalJwt()` returns the same cached token → Privy sees the
   duplicate token and takes a **fast path**:
   `if (lastToken === token) return void setState({ status: "done" })` — sets
   status to `"done"` **without** calling `onAuthenticated`.

4. Our old `PrivyAuthSync` checked: *"state is 'done' AND my `authSucceededRef`
   hasn't been set → must be a failure"*. But the second "done" raced with the
   first call's state updates, so `authSucceededRef` was not yet set in time.

5. `authSyncStore.status` was set to `"failed"` → `WalletChoiceStep` saw the
   failure → auto-called `login()` → opened a **second Privy session** → embedded
   wallet auto-connected AND login modal appeared simultaneously.

**The cascade:**

```
state="done" (2nd call)  →  premature "failed"  →  auto login()
                             ↓                       ↓
                        badges of failure       dual Privy session
```

---

## Fix

### 1. PrivyAuthSync — Use `usePrivy().authenticated` as source of truth

**Before:** Relied on `authSucceededRef` (set inside `onAuthenticated` callback) to
determine if "done" meant success or failure.

**After:** Watch `usePrivy().authenticated` directly via a dedicated effect. When it
flips to `true` while `isOtpVerified` is also `true`, immediately set
`authSyncStore.status = "authenticated"`. This fires reliably regardless of hook
timing because `authenticated` is Privy's React state — it propagates on the same
render cycle that triggers the second "done".

Additionally, replaced the **instant** "silent failure" detection with a **5-second
grace period**. If `state.status === "done"` but `authenticated` is still `false`,
a timer starts. After 5 seconds, it re-checks `authSyncStore.getState().status` —
if the `authenticated` watcher hasn't set it to `"authenticated"` by then, **only
then** is `"failed"` declared.

Key changes:
- Added `const { authenticated } = usePrivy()`
- Added authenticated watcher effect
- Replaced `authSucceededRef` with `failureTimerRef`
- 5-second grace period before declaring failure

### 2. WalletChoiceStep — No auto `login()`, no stale cleanup

**Before:**
- Called `privyLogout()` on mount to "clear stale sessions" — this **killed active
  JWT auth sessions** for returning users.
- Auto-called `login()` when `authSyncStore.status === "failed"` or on timeout —
  creating the dual-session / embedded-wallet-auto-connect bug.

**After:**
- Removed stale session cleanup entirely (no more `privyLogout()` on mount).
- Removed all automatic `login()` calls — buttons simply stay disabled until
  `authenticated` is `true`.
- Both buttons gate on `authenticated` from `usePrivy()`:
  - Embedded: `disabled={creating || !privyReady}` (where `privyReady = ready && authenticated`)
  - External: `disabled={creating || !authenticated}`
- Added explicit **"Taking too long? Try another way"** fallback button that
  appears after 15 seconds — this is the **only** path to `login()` and requires
  an explicit user click.

---

## Key Insight

> `state.status === "done"` means **"Privy finished processing"** — NOT **"auth
> succeeded"**. Only `usePrivy().authenticated === true` definitively indicates
> that the Privy session is authenticated.

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/auth/PrivyAuthSync.tsx` | Added `usePrivy().authenticated` watcher, 5s grace period, removed `authSucceededRef` |
| `src/components/auth/WalletChoiceStep.tsx` | Removed stale cleanup, removed auto `login()`, added explicit "Try another way" fallback |

## SDK Version

- `@privy-io/react-auth` v3.13.1
- Race condition is in the internal `useSyncJwtBasedAuthState` hook (minified as
  function `Ji` in `dist/esm/index-C47JxA4c.mjs`)
