# ElementPay Sprint Plan: Authentication, KYC & Mobile UX

**Sprint Duration:** Q1 2026  
**Created:** February 5, 2026  
**Priority:** High - Core User Flow Redesign

---

## 🎯 Sprint Overview

### Goals

1. Implement email-based authentication with OTP
2. Add transaction limits for new users
3. Integrate SmileID KYC for limit upgrades
4. Make app fully mobile responsive
5. Enable wallet switching tied to user profiles

### Dependencies

- Backend: OTP email service, access token API, user profile API
- Backend: Transaction limit enforcement
- Backend: SmileID integration endpoints
- SmileID: SDK access and API credentials

---

## 📋 Epic Breakdown

### Epic 1: Landing Page Enhancement

### Epic 2: Email Authentication & OTP Flow

### Epic 3: Access Token & Session Management

### Epic 4: User Profile & Wallet Management

### Epic 5: Transaction Limits & Enforcement

### Epic 6: KYC Integration (SmileID)

### Epic 7: Mobile Responsiveness

---

## 🔨 Detailed Task List

---

## Epic 1: Landing Page Enhancement

### Task 1.1: Add Preview Form to Landing Page

**Priority:** High | **Estimate:** 8 hours | **Dependencies:** None

**Description:**
Add interactive preview forms on landing page showing OffRamp and OnRamp functionality.

**Acceptance Criteria:**

- [ ] OffRamp preview: Amount (KES), Phone number fields, [TO CONFIRM:]Buy Goods & Paybill Option?
- [ ] OnRamp preview: Amount (KES), Token selection
- [ ] Form values stored in state/localStorage for persistence
- [ ] Clear visual distinction between OffRamp and OnRamp sections

**Files to Create/Modify:**

- `src/components/landingPage/PreviewForm.tsx` (new)
- `src/components/landingPage/HeroSection.tsx` (modify)

---

### Task 1.2: Implement Dynamic CTAs

**Priority:** High | **Estimate:** 2 hours | **Dependencies:** Task 1.1

**Description:**
Add contextual CTA buttons that change based on user intent.

**Acceptance Criteria:**

- [ ] "Convert Crypto to M-Pesa" CTA for OffRamp form
- [ ] "Buy Crypto from M-Pesa" CTA for OnRamp form
- [ ] CTAs trigger authentication modal/flow
- [ ] Track which flow user initiated (OffRamp/OnRamp)

**Files to Create/Modify:**

- `src/components/landingPage/PreviewForm.tsx`
- `src/stores/onboardingStore.ts` (new)

---

### Task 1.3: Form Data Persistence

**Priority:** Medium | **Estimate:** 4 hours | **Dependencies:** Task 1.1

**Description:**
Persist form data from landing page to dashboard after authentication.

**Acceptance Criteria:**

- [ ] Store form values in Zustand store or localStorage
- [ ] Retrieve and pre-fill dashboard forms after login
- [ ] Clear persisted data after successful transaction
- [ ] Handle edge cases (expired data, invalid values)

**Files to Create/Modify:**

- `src/stores/onboardingStore.ts`
- `src/components/dashboard/sendCrypto/SendCryptoModal.tsx`
- `src/components/dashboard/depositCrypto/DepositCryptoModal.tsx`

---

## Epic 2: Email Authentication & OTP Flow

### Task 2.1: Create Authentication Modal Component

**Priority:** High | **Estimate:** 4 hours | **Dependencies:** None

**Description:**
Build modal component for email entry and OTP verification. Use modal for faster conversion (fewer page loads).

**Acceptance Criteria:**

- [ ] Step 1: Email input with validation
- [ ] Step 2: OTP input (6 digits)
- [ ] Step 3: Wallet connection prompt
- [ ] Loading states and error handling
- [ ] Mobile-responsive design

**Files to Create/Modify:**

- `src/components/auth/AuthModal.tsx` (new)
- `src/components/auth/EmailStep.tsx` (new)
- `src/components/auth/OTPStep.tsx` (new)
- `src/components/auth/WalletStep.tsx` (new)

---

### Task 2.2: Implement OTP Request API Integration

**Priority:** High | **Estimate:** 3 hours | **Dependencies:** Task 2.1, Backend API

**Description:**
Integrate with backend API to request OTP via email.

**Acceptance Criteria:**

- [ ] POST `/api/auth/request-otp` with email
- [ ] Handle success (show OTP input)
- [ ] Handle errors (invalid email, rate limit)
- [ ] Resend OTP functionality with cooldown timer
- [ ] Email format validation before API call

**API Contract (Expected):**

```
POST /api/auth/request-otp
Body: { email: string }
Response: { success: boolean, message: string }
```

**Files to Create/Modify:**

- `src/app/api/auth/request-otp/route.ts` (new - proxy)
- `src/services/auth.ts` (new)

---

### Task 2.3: Implement OTP Verification & Token Exchange

**Priority:** High | **Estimate:** 4 hours | **Dependencies:** Task 2.2, Backend API

**Description:**
Verify OTP and exchange for access token with wallet address.

**Acceptance Criteria:**

- [ ] POST `/api/auth/verify-otp` with email, OTP, wallet address
- [ ] Receive and store access token securely
- [ ] Handle invalid OTP, expired OTP errors
- [ ] Redirect to dashboard on success
- [ ] Pre-fill form data from landing page

**API Contract (Expected):**

```
POST /api/auth/verify-otp
Body: { email: string, otp: string, wallet_address: string }
Response: { access_token: string, user: { id, email, kyc_status, limits } }
```

**Files to Create/Modify:**

- `src/app/api/auth/verify-otp/route.ts` (new - proxy)
- `src/services/auth.ts`
- `src/stores/authStore.ts` (new)

---

## Epic 3: Access Token & Session Management

### Task 3.1: Create Auth Store & Context

**Priority:** High | **Estimate:** 4 hours | **Dependencies:** Task 2.3

**Description:**
Implement secure storage and management of access tokens.

**Acceptance Criteria:**

- [ ] Zustand store for auth state (token, user, isAuthenticated)
- [ ] Persist token securely (httpOnly cookie preferred, or secure localStorage)
- [ ] Auto-refresh token before expiry
- [ ] Clear token on logout

**Files to Create/Modify:**

- `src/stores/authStore.ts`
- `src/hooks/useAuth.ts` (update existing)
- `src/context/AuthContext.tsx` (new)

---

### Task 3.2: Add Auth Headers to API Requests

**Priority:** High | **Estimate:** 2 hours | **Dependencies:** Task 3.1

**Description:**
Include access token in all authenticated API requests.

**Acceptance Criteria:**

- [ ] Create authenticated fetch wrapper
- [ ] Add `Authorization: Bearer <token>` header
- [ ] Handle 401 responses (redirect to login)
- [ ] Update existing API calls to use wrapper

**Files to Create/Modify:**

- `src/services/api.ts` (new or update)
- `src/app/api/aggregator.ts` (update)

---

### Task 3.3: Implement Protected Routes

**Priority:** High | **Estimate:** 2 hours | **Dependencies:** Task 3.1

**Description:**
Protect dashboard routes, redirect unauthenticated users.

**Acceptance Criteria:**

- [ ] Middleware or HOC to check auth status
- [ ] Redirect to landing page if not authenticated
- [ ] Preserve intended destination after login
- [ ] Loading state while checking auth

**Files to Create/Modify:**

- `src/middleware.ts` (new or update)
- `src/components/auth/ProtectedRoute.tsx` (new)
- `src/app/dashboard/layout.tsx` (update)

---

## Epic 4: User Profile & Wallet Management

### Task 4.1: Create User Profile Store

**Priority:** High | **Estimate:** 3 hours | **Dependencies:** Task 3.1

**Description:**
Store and manage user profile data including linked wallets.

**Acceptance Criteria:**

- [ ] Store user profile (email, kyc_status, limits, wallets[])
- [ ] Fetch profile on login
- [ ] Update profile on wallet changes
- [ ] Sync with backend

**Files to Create/Modify:**

- `src/stores/userStore.ts` (new)
- `src/types/user.ts` (new)

---

### Task 4.2: Implement Wallet Linking API

**Priority:** High | **Estimate:** 3 hours | **Dependencies:** Task 4.1, Backend API

**Description:**
Allow users to link multiple wallets to their profile.

**Acceptance Criteria:**

- [ ] POST `/api/user/wallets` to link new wallet
- [ ] GET `/api/user/wallets` to list linked wallets
- [ ] DELETE `/api/user/wallets/:address` to unlink wallet
- [ ] Wallet must be verified (signed message) before linking

**API Contract (Expected):**

```
POST /api/user/wallets
Body: { wallet_address: string, signature: string, message: string }
Response: { success: boolean, wallets: Wallet[] }
```

**Files to Create/Modify:**

- `src/app/api/user/wallets/route.ts` (new)
- `src/services/user.ts` (new)

---

### Task 4.3: Implement In-App Wallet Switching

**Priority:** High | **Estimate:** 6 hours | **Dependencies:** Task 4.2

**Description:**
Allow authenticated users to switch between linked wallets without re-login.

**Acceptance Criteria:**

- [ ] Wallet selector dropdown in dashboard header
- [ ] Show all linked wallets with balances
- [ ] Switch active wallet updates all balances/transactions
- [ ] Option to connect new wallet (triggers linking flow)
- [ ] Confirmation before switching during active transaction

**Files to Create/Modify:**

- `src/components/dashboard/WalletSwitcher.tsx` (new)
- `src/components/dashboard/DashboardHeader.tsx` (update)
- `src/hooks/useActiveWallet.ts` (new)

---

### Task 4.4: Update Transaction Flow for Multi-Wallet

**Priority:** Medium | **Estimate:** 3 hours | **Dependencies:** Task 4.3

**Description:**
Ensure transactions use the currently selected wallet.

**Acceptance Criteria:**

- [ ] Transaction modals use active wallet from store
- [ ] Balance fetching uses active wallet
- [ ] Transaction signing uses active wallet
- [ ] Order creation includes correct wallet address

**Files to Create/Modify:**

- `src/components/dashboard/sendCrypto/SendCryptoModal.tsx`
- `src/components/dashboard/depositCrypto/DepositCryptoModal.tsx`
- `src/hooks/useTokenBalance.ts`

---

## Epic 5: Transaction Limits & Enforcement

### Task 5.1: Fetch & Display User Limits

**Priority:** High | **Estimate:** 2 hours | **Dependencies:** Task 4.1, Backend API

**Description:**
Fetch user's transaction limits and display in UI.

**Acceptance Criteria:**

- [ ] Fetch limits from user profile endpoint
- [ ] Display daily/monthly limits in dashboard
- [ ] Show remaining limit before each transaction
- [ ] Visual warning when approaching limit

**Limits Structure (Expected):**

```typescript
interface UserLimits {
  daily_limit: number;
  monthly_limit: number;
  daily_used: number;
  monthly_used: number;
  kyc_tier: "none" | "basic" | "verified" | "corporate";
}
```

**Files to Create/Modify:**

- `src/components/dashboard/LimitIndicator.tsx` (new)
- `src/stores/userStore.ts` (update)

---

### Task 5.2: Pre-Transaction Limit Check

**Priority:** High | **Estimate:** 2 hours | **Dependencies:** Task 5.1

**Description:**
Check limits before allowing transaction to proceed.

**Acceptance Criteria:**

- [ ] Validate amount against remaining limits
- [ ] Show clear error if limit exceeded
- [ ] Prompt for KYC upgrade if limit reached
- [ ] Block transaction submission if over limit

**Files to Create/Modify:**

- `src/components/dashboard/sendCrypto/SendCryptoModal.tsx`
- `src/components/dashboard/depositCrypto/DepositCryptoModal.tsx`
- `src/utils/limitValidation.ts` (new)

---

### Task 5.3: Limit Exceeded UX Flow

**Priority:** Medium | **Estimate:** 3 hours | **Dependencies:** Task 5.2

**Description:**
Handle limit exceeded scenario gracefully.

**Acceptance Criteria:**

- [ ] Show modal when limit is reached
- [ ] Display current limit and KYC tier
- [ ] CTA to upgrade via KYC
- [ ] Option to reduce amount to fit within limit

**Files to Create/Modify:**

- `src/components/dashboard/LimitExceededModal.tsx` (new)

---

## Epic 6: KYC Integration (SmileID)

### Task 6.1: SmileID SDK Integration Setup

**Priority:** High | **Estimate:** 4 hours | **Dependencies:** SmileID credentials

**Description:**
Integrate SmileID Web SDK for identity verification.

**Acceptance Criteria:**

- [ ] Install and configure SmileID Web SDK
- [ ] Initialize SDK with partner credentials
- [ ] Handle SDK loading states
- [ ] Environment configuration (sandbox/production)

**Documentation:** https://docs.smileidentity.com/web

**Files to Create/Modify:**

- `package.json` (add SmileID SDK)
- `src/lib/smileId.ts` (new)
- `src/app/layout.tsx` (add SDK script if needed)

---

### Task 6.2: KYC Initiation Flow

**Priority:** High | **Estimate:** 4 hours | **Dependencies:** Task 6.1, Backend API

**Description:**
Create flow to start KYC verification process.

**Acceptance Criteria:**

- [ ] User selects KYC tier (basic vs corporate)
- [ ] Request KYC session from backend
- [ ] Receive SmileID session parameters
- [ ] Launch SmileID verification widget

**API Contract (Expected):**

```
POST /api/kyc/initiate
Body: { kyc_type: 'individual' | 'corporate' }
Response: { session_id: string, partner_params: object }
```

**Files to Create/Modify:**

- `src/app/api/kyc/initiate/route.ts` (new)
- `src/components/kyc/KYCModal.tsx` (new)
- `src/components/kyc/KYCTypeSelector.tsx` (new)

---

### Task 6.3: Implement Liveness & ID Check UI

**Priority:** High | **Estimate:** 6 hours | **Dependencies:** Task 6.2

**Description:**
Implement SmileID verification components for liveness and ID check.

**Acceptance Criteria:**

- [ ] Camera permission request handling
- [ ] Liveness detection capture
- [ ] ID document capture (front/back)
- [ ] Progress indicators during processing
- [ ] Error handling (camera denied, poor quality)
- [ ] Mobile-optimized UI

**Files to Create/Modify:**

- `src/components/kyc/LivenessCapture.tsx` (new)
- `src/components/kyc/IDCapture.tsx` (new)
- `src/components/kyc/KYCProgress.tsx` (new)

---

### Task 6.4: KYC Result Handling

**Priority:** High | **Estimate:** 3 hours | **Dependencies:** Task 6.3

**Description:**
Handle KYC verification results and update user status.

**Acceptance Criteria:**

- [ ] Receive callback from SmileID on completion
- [ ] Send result to backend for verification
- [ ] Update user's KYC status in store
- [ ] Show success/failure UI
- [ ] If approved, refresh user limits

**Files to Create/Modify:**

- `src/app/api/kyc/callback/route.ts` (new)
- `src/components/kyc/KYCResult.tsx` (new)
- `src/stores/userStore.ts` (update)

---

### Task 6.5: Corporate KYC Flow

**Priority:** Medium | **Estimate:** 4 hours | **Dependencies:** Task 6.4

**Description:**
Implement additional steps for corporate KYC verification.

**Acceptance Criteria:**

- [ ] Business registration document upload
- [ ] Director/signatory information collection
- [ ] Additional verification steps as required
- [ ] Different limit tiers for corporate accounts

**Files to Create/Modify:**

- `src/components/kyc/CorporateKYC.tsx` (new)
- `src/components/kyc/DocumentUpload.tsx` (new)

---

## Epic 7: Mobile Responsiveness

### Task 7.1: Audit Current Mobile Issues

**Priority:** High | **Estimate:** 2 hours | **Dependencies:** None

**Description:**
Document all mobile responsiveness issues across the app.

**Acceptance Criteria:**

- [ ] Test on multiple device sizes (320px, 375px, 414px, 768px)
- [ ] Document issues with screenshots
- [ ] Prioritize fixes by user impact
- [ ] Test in-app browsers (MetaMask, Coinbase)

---

### Task 7.2: Landing Page Mobile Optimization

**Priority:** High | **Estimate:** 4 hours | **Dependencies:** Task 7.1

**Acceptance Criteria:**

- [ ] Hero section scales properly
- [ ] Preview forms usable on mobile
- [ ] Navigation menu works on mobile
- [ ] CTAs have proper touch targets (min 44px)
- [ ] Images optimized for mobile bandwidth

**Files to Create/Modify:**

- `src/components/landingPage/HeroSection.tsx`
- `src/components/landingPage/Header.tsx`
- `src/components/landingPage/Features.tsx`

---

### Task 7.3: Dashboard Mobile Optimization

**Priority:** High | **Estimate:** 6 hours | **Dependencies:** Task 7.1

**Acceptance Criteria:**

- [ ] Sidebar collapses to hamburger menu
- [ ] Transaction modals fully usable on mobile
- [ ] Touch-friendly buttons and inputs
- [ ] Proper keyboard handling (no viewport jump)
- [ ] Bottom navigation option for key actions

**Files to Create/Modify:**

- `src/components/dashboard/Sidebar.tsx`
- `src/components/dashboard/DashboardHeader.tsx`
- `src/components/dashboard/MobileNav.tsx` (new)

---

### Task 7.4: Auth & KYC Mobile Optimization

**Priority:** High | **Estimate:** 3 hours | **Dependencies:** Tasks 2.1, 6.3

**Acceptance Criteria:**

- [ ] Auth modal works on mobile
- [ ] OTP input mobile-friendly (auto-focus next)
- [ ] KYC camera capture works on mobile browsers
- [ ] Proper handling of camera permissions on mobile

**Files to Create/Modify:**

- `src/components/auth/AuthModal.tsx`
- `src/components/auth/OTPStep.tsx`
- `src/components/kyc/LivenessCapture.tsx`

---

## 📊 Sprint Summary

### Task Count by Epic

| Epic                     | Tasks  | Estimated Hours |
| ------------------------ | ------ | --------------- |
| 1. Landing Page          | 3      | 8 hrs           |
| 2. Email Auth & OTP      | 3      | 11 hrs          |
| 3. Token & Session       | 3      | 7 hrs           |
| 4. User Profile & Wallet | 4      | 13 hrs          |
| 5. Transaction Limits    | 3      | 7 hrs           |
| 6. KYC (SmileID)         | 5      | 21 hrs          |
| 7. Mobile Responsiveness | 4      | 15 hrs          |
| **Total**                | **25** | **82 hrs**      |

### Recommended Sprint Phases

**Phase 1 (Week 1-2): Core Auth**

- Epic 2: Email Auth & OTP (Tasks 2.1-2.3)
- Epic 3: Token & Session (Tasks 3.1-3.3)
- Task 1.1: Preview Form

**Phase 2 (Week 3): User & Wallet**

- Epic 4: User Profile & Wallet (Tasks 4.1-4.4)
- Tasks 1.2, 1.3: CTAs and persistence

**Phase 3 (Week 4): Limits & KYC**

- Epic 5: Transaction Limits (Tasks 5.1-5.3)
- Epic 6: KYC (Tasks 6.1-6.4)

**Phase 4 (Week 5): Polish**

- Task 6.5: Corporate KYC
- Epic 7: Mobile Responsiveness (all tasks)

---

## 🔗 Backend API Requirements

### Auth Endpoints (Required)

```
POST /auth/request-otp      - Send OTP to email
POST /auth/verify-otp       - Verify OTP, return access token
POST /auth/refresh-token    - Refresh access token
POST /auth/logout           - Invalidate token
```

### User Endpoints (Required)

```
GET  /user/profile          - Get user profile with limits
POST /user/wallets          - Link new wallet
GET  /user/wallets          - List linked wallets
DELETE /user/wallets/:addr  - Unlink wallet
```

### KYC Endpoints (Required)

```
POST /kyc/initiate          - Start KYC session
POST /kyc/callback          - Receive SmileID results
GET  /kyc/status            - Check KYC status
```

### Limits (Backend Enforced)

```
- New users (no KYC): 10,000 KES daily / 50,000 KES monthly
- Basic KYC: 100,000 KES daily / 500,000 KES monthly
- Verified KYC: 500,000 KES daily / 2,000,000 KES monthly
- Corporate: Custom limits
```

---

## ⚠️ Risks & Mitigations

| Risk                   | Impact | Mitigation                              |
| ---------------------- | ------ | --------------------------------------- |
| SmileID SDK complexity | High   | Start integration early, use sandbox    |
| Backend API delays     | High   | Mock APIs for frontend development      |
| Mobile camera issues   | Medium | Thorough device testing                 |
| Token security         | High   | Use httpOnly cookies, implement refresh |
| User drop-off at KYC   | Medium | Clear UX, save progress                 |

---

## 📝 Notes

- **Privy Integration:** Decide if Privy should be replaced or work alongside email auth
- **Wallet Connection:** Users can still connect wallet via Privy, but session is tied to email
- **SmileID Pricing:** Confirm pricing model (per-verification cost)
- **Corporate KYC:** May need manual review process on backend

---

**Last Updated:** February 5, 2026  
**Status:** Planning  
**Owner:** Engineering Team
