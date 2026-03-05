# Design Document
## VitalScore Finance — System Architecture and Technical Design

---

## Overview

VitalScore Finance is a cloud-native, microservices-based financial wellness platform that combines AI-driven transaction analysis, behavioral gamification, and blockchain-backed commitment mechanisms. This document defines the technical architecture, system components, data models, API contracts, and implementation decisions required to build and deploy the platform.

The system is designed for high-throughput consumer use (target: 1 million concurrent users), India-first deployment using UPI/open banking infrastructure, and progressive blockchain integration on Algorand that is invisible to end users but auditable by anyone.

---

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│   React Native (iOS/Android)    React.js (Web)              │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS / WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│                      API GATEWAY                             │
│   Node.js + AWS API Gateway                                  │
│   REST + GraphQL | Auth (OAuth2 + 2FA) | Rate Limiting       │
└──────┬────────┬────────┬────────┬────────┬───────────────────┘
       │        │        │        │        │
┌──────▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──┐ ┌──▼──────────────┐
│ User    │ │Trans│ │Score│ │Game │ │ Blockchain      │
│ Profile │ │ ingst│ │Engine│ │fica │ │ Integration     │
│ Service │ │ ion │ │     │ │ tion│ │ Service         │
└──────┬──┘ └──┬──┘ └──┬──┘ └──┬──┘ └──┬──────────────┘
       │        │        │        │        │
┌──────▼────────▼────────▼────────▼────────▼──────────────────┐
│                       DATA LAYER                             │
│  PostgreSQL (profiles)  InfluxDB (time-series)  Redis (cache)│
└──────────────────────────────────────────────────────────────┘
       │                                  │
┌──────▼──────────────┐     ┌────────────▼──────────────────┐
│   AI/ML Platform    │     │   Blockchain Layer            │
│   Python/TensorFlow │     │   Algorand + IPFS             │
│   Categorization    │     │   SBT, Escrow, Squad Treasury │
│   Predictive Scoring│     │                               │
└─────────────────────┘     └───────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────────────────┐
│               EXTERNAL INTEGRATIONS                          │
│  Razorpay (Payments/UPI)  Web3Auth  CPI Data  Push Notifications│
└─────────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Microservices with Single Responsibility** — Each service owns one domain. Services communicate via internal REST APIs. No shared databases between services.
2. **Event-Driven Score Updates** — Transaction ingestion publishes events to a message queue. Score engine and gamification service consume events asynchronously. This decouples ingestion latency from score calculation latency.
3. **Blockchain as Verification Layer, Not Application Layer** — All application logic runs off-chain. Blockchain records only events requiring trustless verification (escrow, NFT snapshots, treasury). The app works even if the blockchain layer is temporarily unavailable.
4. **Privacy by Architecture** — PII is tokenized at the ingestion boundary. Internal services never handle raw personal identifiers. Scoring works on anonymized user IDs and encrypted transaction data.
5. **Graceful Degradation** — Every blockchain-dependent feature has an off-chain fallback. Core scoring and tracking always function regardless of Algorand network status.

---

## Components

### 1. User Profile Service

**Responsibility:** Manages user identity, preferences, income profile, location classification, and league assignment.

**Internal API Endpoints:**
```
POST   /users                        → Create new user profile
GET    /users/{userId}               → Get user profile
PATCH  /users/{userId}               → Update user profile
GET    /users/{userId}/league        → Get current league assignment
POST   /users/{userId}/income        → Submit income declaration
GET    /users/{userId}/settings      → Get notification preferences
PATCH  /users/{userId}/settings      → Update notification preferences
```

**Key Data Owned:**
- User ID (internal token, never raw PII)
- Income bracket and location profile
- League assignment
- Household configuration (shared expense splits)
- Feature consent flags (escrow enabled, squad enabled, data sharing)
- KYC status and verification timestamp

---

### 2. Transaction Ingestion Service

**Responsibility:** Pulls transaction data from connected bank/UPI accounts, deduplicates, normalizes, and publishes transaction events.

**Internal API Endpoints:**
```
POST   /connections                  → Create new bank/UPI connection
GET    /connections/{userId}         → Get all connections for user
DELETE /connections/{connectionId}   → Revoke bank connection
POST   /transactions/manual          → Add manual cash transaction
GET    /transactions/{userId}        → Get transaction history (paginated)
PATCH  /transactions/{txnId}/category → Override category for a transaction
```

**Transaction Normalization Pipeline:**
```
Raw Bank Data
    │
    ▼
Deduplication (hash of amount + merchant + date)
    │
    ▼
Merchant Name Normalization (string similarity matching)
    │
    ▼
PII Tokenization (replace account numbers, user names)
    │
    ▼
Rule-Based Category Assignment (Layer 1)
    │
    ▼
ML Category Confidence Scoring (Layer 2)
    │
    ├── confidence ≥ 0.70 → Auto-assign category
    └── confidence < 0.70 → Queue for user confirmation
    │
    ▼
Publish to Message Queue → Score Engine + Gamification
```

**Polling Frequency:**
- Active users (opened app in last 7 days): Every 4 hours
- Standard users: Every 24 hours
- Initial onboarding: Immediate pull of 90-day history

---

### 3. AI/ML Categorization Engine

**Responsibility:** Provides transaction category classification using a two-layer hybrid model.

**Layer 1 — Rule-Based Classifier:**
```python
# Pseudocode
MERCHANT_RULES = {
    # Essential merchants
    "SWIGGY_GROCERY": "Essential.Groceries",
    "BIGBASKET": "Essential.Groceries",
    "BSES": "Essential.Utilities",
    "MAHANAGAR_GAS": "Essential.Utilities",
    "IRCTC": "Essential.Transport",
    "HDFC_EMI": "Essential.EMI",
    
    # Discretionary merchants
    "SWIGGY": "Discretionary.DiningOut",        # Note: Swiggy app vs Swiggy Grocery
    "ZOMATO": "Discretionary.DiningOut",
    "NETFLIX": "Discretionary.Subscriptions",
    "SPOTIFY": "Discretionary.Subscriptions",
    "MYNTRA": "Discretionary.Shopping",
    "BOOKMYSHOW": "Discretionary.Entertainment",
}

def classify_rule_based(merchant_normalized: str) -> tuple[str, float]:
    for pattern, category in MERCHANT_RULES.items():
        if pattern in merchant_normalized:
            return category, 0.95
    return None, 0.0
```

**Layer 2 — ML Classifier:**
- Model: Fine-tuned multilingual BERT for merchant name NLP
- Features: Normalized merchant name, transaction amount, day-of-week, recurring flag, user spending history
- Training data: 90-day user transaction history (per-user personalization layer)
- Retraining: Online learning on each user override, batch weekly retraining on aggregate anonymized data
- Inference latency target: < 200ms per transaction

**Federated Learning Note:** User-specific personalization models are trained on-device where possible. Only aggregated gradient updates are sent to the central model server. Raw transaction patterns are never transmitted.

---

### 4. Score Engine Service

**Responsibility:** Calculates, stores, and serves VitalScore for all users. Manages rolling averages, inflation adjustments, streak tracking, and forecast generation.

**Internal API Endpoints:**
```
GET    /score/{userId}               → Get current score and metadata
GET    /score/{userId}/history       → Get score history (monthly)
GET    /score/{userId}/forecast      → Get 30-day score projection
GET    /score/{userId}/breakdown     → Get score component breakdown
POST   /score/{userId}/recalculate   → Trigger manual recalculation
POST   /score/{userId}/emergency     → Enable Emergency Mode
```

**Score Calculation Implementation:**
```python
def calculate_vitalscore(
    user_id: str,
    period: str = "rolling_3month"
) -> ScoreResult:

    # Fetch smoothed financial data
    E = get_weighted_average_essential(user_id, period)
    D = get_weighted_average_discretionary(user_id, period)
    I = get_weighted_average_income(user_id, period)
    debt = get_outstanding_high_interest_debt(user_id)
    
    # Edge case handling
    if I == 0:
        return ScoreResult(score=None, status="NO_DATA")
    if E + D == 0:
        necessity_ratio = 1.0
        savings_ratio = 1.0
    else:
        necessity_ratio = E / (E + D)
        savings_ratio = (I - (E + D)) / I
    
    # Clamp savings ratio (overspend scenario)
    savings_ratio = max(-0.5, savings_ratio)
    
    # Base score
    alpha, beta = 0.60, 0.40
    raw_score = (alpha * necessity_ratio + beta * savings_ratio) * 1000
    
    # Penalties
    debt_penalty = min(100, (0.10 * debt / I) * 1000) if debt > 0 else 0
    
    # Bonuses
    streak_bonus = calculate_streak_bonus(user_id)    # max +50
    challenge_bonus = calculate_challenge_bonus(user_id)  # max +30
    
    # Inflation adjustment
    inflation_adj = get_category_inflation_adjustment(user_id)
    
    # Final score
    final_score = raw_score - debt_penalty + streak_bonus + challenge_bonus + inflation_adj
    final_score = max(0, min(1000, final_score))
    
    return ScoreResult(
        score=round(final_score),
        band=classify_band(final_score),
        components={
            "necessity_ratio": necessity_ratio,
            "savings_ratio": savings_ratio,
            "debt_penalty": debt_penalty,
            "streak_bonus": streak_bonus,
            "challenge_bonus": challenge_bonus
        }
    )
```

**Forecast Algorithm:**
- Project current monthly spending velocity forward 30 days
- Apply scheduled recurring transactions from calendar/past patterns
- Compute projected score at each 7-day interval
- Generate "optimized" scenario by applying 20% discretionary reduction

**Batch Recalculation Schedule:**
- Nightly at 02:00 local time: Full recalculation with rolling averages and inflation adjustments
- Real-time micro-update: Triggered on each new transaction event (simplified calculation, cached rolling averages)

---

### 5. Gamification Service

**Responsibility:** Manages the full lifecycle of challenges, streaks, leagues, badges, VitalPoints, and Squad Savings Pools.

**Internal API Endpoints:**
```
GET    /challenges/{userId}          → Get current week's challenges
POST   /challenges/{userId}/stake    → Commit stake to a challenge
GET    /challenges/{userId}/history  → Get challenge history
POST   /squads                       → Create new Squad
POST   /squads/{squadId}/join        → Join existing Squad
GET    /squads/{squadId}             → Get Squad details and standings
GET    /leagues/{userId}             → Get league position and leaderboard
GET    /badges/{userId}              → Get all earned badges
GET    /streaks/{userId}             → Get streak data
POST   /streaks/{userId}/freeze      → Use a streak freeze
```

**Challenge Generation Algorithm:**
```python
def generate_weekly_challenges(user_id: str) -> list[Challenge]:
    spending_analysis = analyze_30day_spending(user_id)
    challenges = []
    
    # Always generate one from the top overspent discretionary category
    top_category = spending_analysis.highest_discretionary_category
    challenges.append(Challenge(
        type="REDUCE_CATEGORY",
        category=top_category,
        target_reduction=0.25,  # 25% reduction target
        difficulty="MEDIUM",
        stake_range=(100, 300)
    ))
    
    # Generate one savings velocity challenge
    current_savings_rate = spending_analysis.savings_ratio
    target_savings_rate = min(current_savings_rate + 0.05, 0.30)
    challenges.append(Challenge(
        type="SAVINGS_VELOCITY",
        target=target_savings_rate,
        difficulty="EASY" if target_savings_rate < 0.15 else "MEDIUM",
        stake_range=(50, 200)
    ))
    
    # Generate one structural improvement challenge
    if spending_analysis.idle_subscriptions_detected:
        challenges.append(Challenge(type="CANCEL_SUBSCRIPTION", difficulty="EASY", stake_range=(50, 100)))
    elif spending_analysis.emergency_fund_days < 30:
        challenges.append(Challenge(type="BUILD_EMERGENCY_FUND", difficulty="HARD", stake_range=(200, 500)))
    else:
        challenges.append(Challenge(type="INVESTMENT_ACTION", difficulty="MEDIUM", stake_range=(100, 300)))
    
    return challenges
```

---

### 6. Blockchain Integration Service

**Responsibility:** Translates application events into on-chain actions. Abstracts all Algorand interaction behind a simple internal event API.

**Internal API Endpoints:**
```
POST   /nft/mint/{userId}            → Mint initial Soul-Bound Token
POST   /nft/update/{userId}          → Update monthly NFT snapshot
GET    /nft/{userId}                 → Get NFT metadata and IPFS hash
POST   /escrow/lock                  → Lock challenge stake in contract
POST   /escrow/release/{escrowId}    → Release stake (success/failure)
POST   /squad/create                 → Deploy Squad treasury contract
POST   /squad/{squadId}/deposit      → Record contribution to treasury
POST   /squad/{squadId}/distribute   → Trigger season-end distribution
GET    /token/balance/{userId}       → Get VitalToken balance
POST   /token/issue/{userId}         → Issue reward tokens for milestone
```

**On-Chain Contract Architecture:**

```
VitalScore Algorand Smart Contracts
│
├── SoulBoundNFT.py (PyTeal)
│   ├── State: owner_address, transfer_restricted=True
│   ├── Methods: mint(), update_metadata(), verify()
│   └── Restriction: No transfer allowed. Delete restricted to system admin.
│
├── ChallengeEscrow.py (PyTeal)
│   ├── State: user_address, stake_amount, challenge_id, deadline, verified
│   ├── Methods: lock_stake(), verify_completion(), release_success(), release_failure()
│   └── Oracle: Calls VitalScore verification API. Fallback: 48h extension then auto-fail.
│
├── SquadTreasury.py (PyTeal)
│   ├── State: member_addresses[], contributions{}, yield_accumulated, season_end
│   ├── Methods: deposit(), route_to_defi(), record_yield(), distribute_weighted()
│   └── Multi-sig: Requires 3-of-5 system keys OR unanimous member approval for emergency withdrawal
│
└── VitalToken.py (Algorand ASA)
    ├── Standard Algorand Standard Asset
    ├── Issuance: Controlled by VitalScore system wallet
    └── Redemption: Partner merchant API accepts token burns for discounts
```

**Algorand Transaction Costs:**
- SBT mint: 0.001 ALGO (~$0.0001) — one time per user
- Monthly NFT update: 0.001 ALGO per user per month
- Challenge escrow lock: 0.002 ALGO
- Challenge escrow release: 0.001 ALGO
- Squad treasury deploy: 0.01 ALGO per squad
- Total per active user per month: < 0.02 ALGO (~$0.002)

**Blockchain Queue:**
- All on-chain writes are queued and batched where possible
- Queue processes every 30 seconds under normal load
- During high load (>10,000 pending), queue priority: escrow releases > NFT mints > token issuance
- If Algorand RPC unavailable: queue persists in Redis, retries with exponential backoff, max 3 hours

---

## Data Models

### User Profile
```json
{
  "userId": "uuid-v4",
  "createdAt": "ISO8601",
  "kycStatus": "VERIFIED | PENDING | FAILED",
  "incomeProfile": {
    "bracket": "TIER_1 | TIER_2 | TIER_3 | TIER_4",
    "declaredMonthlyIncome": 50000,
    "incomeType": "SALARIED | FREELANCE | BUSINESS | STUDENT"
  },
  "locationProfile": {
    "type": "URBAN | RURAL",
    "state": "Maharashtra",
    "city": "Mumbai"
  },
  "leagueId": "TIER_2_Q1_2026",
  "algorandAddress": "ALGO_ADDRESS",
  "sbtAssetId": 12345678,
  "householdConfig": {
    "sharedExpenses": [
      { "merchantPattern": "Society Maintenance", "userShare": 0.5 }
    ]
  },
  "consentFlags": {
    "escrowEnabled": true,
    "squadEnabled": true,
    "anonymizedDataSharing": false,
    "b2bParticipant": false
  },
  "notificationPreferences": {
    "frequency": "STANDARD",
    "streakAlerts": true,
    "challengeAlerts": true,
    "forecastAlerts": true
  }
}
```

### Transaction Record
```json
{
  "txnId": "uuid-v4",
  "userToken": "anonymized-user-token",
  "externalRef": "bank-transaction-ref",
  "amount": 850.00,
  "currency": "INR",
  "date": "2026-01-15",
  "merchantNormalized": "ZOMATO",
  "merchantRaw": "Zomato Ltd 18001234567",
  "category": {
    "primary": "Discretionary",
    "secondary": "DiningOut",
    "confidence": 0.94,
    "source": "ML_MODEL | RULE_BASED | USER_OVERRIDE"
  },
  "isRecurring": false,
  "isShared": false,
  "sharedUserShare": 1.0,
  "isManualEntry": false,
  "userOverride": null,
  "flaggedForReview": false
}
```

### VitalScore Snapshot
```json
{
  "snapshotId": "uuid-v4",
  "userId": "uuid-v4",
  "timestamp": "ISO8601",
  "periodType": "REALTIME | NIGHTLY | MONTHLY",
  "score": 742,
  "band": "VITAL_STRONG",
  "trajectory": "IMPROVING | STABLE | DECLINING",
  "components": {
    "necessityRatio": 0.68,
    "savingsRatio": 0.18,
    "debtPenalty": 25,
    "streakBonus": 30,
    "challengeBonus": 15,
    "inflationAdjustment": 8
  },
  "inputSummary": {
    "essentialSpendAvg3M": 28000,
    "discretionarySpendAvg3M": 13000,
    "incomeAvg3M": 50000,
    "activeChallenges": 2,
    "streakDays": 22
  }
}
```

### Challenge
```json
{
  "challengeId": "uuid-v4",
  "userId": "uuid-v4",
  "weekStartDate": "2026-01-13",
  "type": "REDUCE_CATEGORY | SAVINGS_VELOCITY | CANCEL_SUBSCRIPTION | BUILD_EMERGENCY_FUND | INVESTMENT_ACTION",
  "description": "Reduce dining spend from ₹4,200 to ₹2,800 this week",
  "target": {
    "category": "DiningOut",
    "currentBaseline": 4200,
    "targetValue": 2800,
    "unit": "INR"
  },
  "difficulty": "MEDIUM",
  "status": "ACTIVE | COMPLETED | FAILED | STAKED",
  "stake": {
    "enabled": true,
    "amount": 200,
    "currency": "INR",
    "escrowContractId": "ALGO_CONTRACT_ID",
    "escrowTxnId": "ALGO_TXN_ID",
    "lockedAt": "ISO8601"
  },
  "completedAt": null,
  "verificationData": {
    "method": "BANK_DATA | MANUAL",
    "verifiedAt": null,
    "actualValue": null
  },
  "rewards": {
    "vitalPoints": 150,
    "scoreBonusApplied": 0,
    "yieldShareEarned": 0
  }
}
```

### Squad
```json
{
  "squadId": "uuid-v4",
  "name": "Family Savers 2026",
  "creatorUserId": "uuid-v4",
  "memberUserIds": ["uuid-1", "uuid-2", "uuid-3", "uuid-4"],
  "configuration": {
    "contributionAmount": 500,
    "contributionFrequency": "WEEKLY",
    "seasonDuration": 90,
    "seasonStartDate": "2026-01-01",
    "seasonEndDate": "2026-04-01"
  },
  "treasury": {
    "algorandContractId": "ALGO_CONTRACT_ID",
    "currentBalance": 24000,
    "totalContributed": 24000,
    "currentDefiProtocol": "AAVE_ALGORAND",
    "currentAPY": 4.2,
    "totalYieldAccumulated": 186.50
  },
  "status": "ACTIVE | COMPLETED | DISBANDED",
  "leaderboardRank": 12,
  "memberContributions": [
    { "userId": "uuid-1", "contributionStreak": 8, "missedContributions": 0, "vitalScoreImprovement": 45 }
  ]
}
```

### Soul-Bound NFT Metadata (IPFS)
```json
{
  "standard": "VitalScore-SBT-v1",
  "ownerAddress": "ALGO_USER_ADDRESS",
  "createdAt": "2025-06-01",
  "monthlySnapshots": [
    {
      "month": "2026-01",
      "score": 742,
      "band": "VITAL_STRONG",
      "trajectory": "IMPROVING",
      "challengeCompletionRate": 0.78,
      "streakDays": 22,
      "squadParticipant": true,
      "inputHash": "sha256-hash-of-score-inputs"
    }
  ],
  "badges": [
    { "id": "VITAL_STRONG_6M", "earnedAt": "2026-01-01" },
    { "id": "FULL_SEASON_SQUAD", "earnedAt": "2025-10-01" }
  ],
  "aggregateSummary": {
    "lifetimeHighScore": 789,
    "averageScore12M": 721,
    "totalChallengesCompleted": 34,
    "totalSquadSeasonsCompleted": 2,
    "improvingMonths": 9,
    "decliningMonths": 2
  }
}
```

---

## API Contracts

### External-Facing REST API

**Base URL:** `https://api.vitalscore.in/v1`

**Authentication:** Bearer JWT token. Tokens expire after 24 hours. Refresh tokens valid for 30 days.

```
Authentication:
POST   /auth/login                   → Login and receive JWT
POST   /auth/refresh                 → Refresh expired JWT
POST   /auth/logout                  → Invalidate session

Score:
GET    /score                        → Current score with full breakdown
GET    /score/history?months=12      → Score history
GET    /score/forecast               → 30-day projection

Transactions:
GET    /transactions?page=1&limit=50 → Paginated transaction list
POST   /transactions                 → Add manual transaction
PATCH  /transactions/{id}            → Override category

Challenges:
GET    /challenges                   → Current week's challenges
POST   /challenges/{id}/stake        → Stake on a challenge
DELETE /challenges/{id}/stake        → Withdraw stake (before deadline only)

Squads:
POST   /squads                       → Create squad
GET    /squads                       → Get user's squads
GET    /squads/{id}                  → Squad detail
POST   /squads/{id}/contribute       → Record manual contribution

NFT:
GET    /nft                          → Get NFT metadata
GET    /nft/verify-link              → Generate shareable verification link

Leaderboard:
GET    /leaderboard/league           → User's league standings
GET    /leaderboard/squads           → Public squad leaderboard

Settings:
GET    /settings                     → User settings
PATCH  /settings                     → Update settings
POST   /settings/connect-bank        → Initiate bank connection (Razorpay)
DELETE /settings/connections/{id}    → Revoke bank connection
POST   /settings/emergency-mode      → Enable emergency mode
```

**Standard Response Format:**
```json
{
  "success": true,
  "data": { },
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO8601",
    "version": "v1"
  },
  "error": null
}
```

**Error Response Format:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INSUFFICIENT_DATA",
    "message": "Less than 30 days of transaction data available. Score requires minimum 30 days.",
    "details": { }
  }
}
```

---

## Error Handling

### Error Categories and Responses

| Error Code | Category | User-Facing Message | System Action |
|---|---|---|---|
| INSUFFICIENT_DATA | Score | "Not enough data to calculate score yet. Keep using the app!" | Return partial score with confidence indicator |
| BANK_CONNECTION_FAILED | Integration | "We couldn't reach your bank. Try reconnecting." | Queue retry in 30 min. Send notification. |
| KYC_REQUIRED | Auth | "Please complete verification to use this feature." | Block escrow/squad. Allow tracking. |
| ESCROW_LOCK_FAILED | Blockchain | "Couldn't lock your stake. Your money was not moved." | Rollback. Log. Retry once. Alert ops. |
| INVALID_STAKE_AMOUNT | Validation | "Stake must be between ₹50 and ₹1,000." | Return 400 with valid range. |
| CHALLENGE_DEADLINE_PASSED | Business | "This challenge has expired." | Auto-fail. Trigger verification flow. |
| SQUAD_FULL | Business | "This squad is full (max 8 members)." | Return 409. Suggest creating new squad. |
| BLOCKCHAIN_UNAVAILABLE | Infrastructure | None shown — fallback to off-chain | Queue action. Log. Alert on-call. |

### Blockchain Failure Fallback Strategy

```
Blockchain write fails
    │
    ├── Retry 3x with exponential backoff (1s, 4s, 16s)
    │
    ├── If all retries fail:
    │   ├── Persist intended action in Redis queue
    │   ├── Continue application flow off-chain
    │   ├── Alert on-call engineer if queue depth > 1000
    │   └── Drain queue when Algorand RPC recovers
    │
    └── For escrow specifically:
        ├── Do NOT proceed with challenge if stake cannot be locked
        ├── Return clear error to user
        └── Do not deduct or hold any user funds
```

---

## Security Design

### Authentication and Authorization

```
User Login
    │
    ▼
Web3Auth Social Login (Google/Apple/Phone)
    │
    ▼
Internal JWT issued (24h expiry)
    │
    ▼
All API calls → JWT validation middleware
    │
    ├── Valid JWT → Extract userId from claims → Route to service
    └── Invalid/expired → Return 401 → Client prompts re-login
```

**Authorization Levels:**
- `USER` — Standard authenticated user. Access to own data only.
- `SQUAD_MEMBER` — Access to squad data for squads the user belongs to.
- `B2B_ADMIN` — Access to aggregate employer dashboard. No individual data.
- `SYSTEM` — Internal service-to-service. Blockchain integration service only.

### Data Encryption Architecture

```
External Request → TLS 1.3 → API Gateway
                                  │
                                  ▼
                      PII Tokenization Layer
                      (Replace account numbers, names with tokens)
                                  │
                                  ▼
                      Internal Services (work with tokens only)
                                  │
                                  ▼
                      PostgreSQL (AES-256 at rest, AWS RDS encryption)
                      InfluxDB (AES-256 at rest)
                      Redis (in-memory, TLS between services)
```

### Smart Contract Security

- All PyTeal contracts undergo mandatory third-party audit before mainnet deployment
- Testnet deployment runs for minimum 30 days before mainnet
- Escrow contracts include a maximum TVL cap (₹10 Lakhs per contract) to limit blast radius of any vulnerability
- Emergency pause function in escrow contracts controlled by 3-of-5 multi-sig system keys
- Bug bounty program active before mainnet launch (minimum ₹5 Lakhs reward pool)

---

## Testing Strategy

### Test Coverage Requirements

| Service | Unit Test Coverage | Integration Test Coverage |
|---|---|---|
| Score Engine | > 95% (all formula paths) | All edge cases from requirements |
| AI Categorization | > 85% | Real merchant name corpus |
| Blockchain Integration | > 80% | Algorand testnet full flows |
| Gamification Service | > 90% | Full challenge lifecycle |
| Transaction Ingestion | > 85% | Razorpay API sandbox |
| API Gateway | > 80% | All endpoints with auth flows |

### Key Test Scenarios

**Score Engine Edge Cases (mandatory):**
- Zero spending month → score should = 100
- No income recorded → score should = NO_DATA
- EMI-heavy user → score should reflect debt penalty
- Emergency Mode enabled → essential weight increases
- 3-month rolling average → single anomalous month should not dominate

**Blockchain Integration Tests (run on Algorand testnet):**
- Full escrow lifecycle: lock → verify success → release
- Full escrow lifecycle: lock → verify failure → redistribute
- SBT mint → update → verify non-transferability
- Squad treasury: deploy → deposit × 4 → yield → weighted distribution

**Load Testing Targets:**
- 100,000 concurrent score reads → < 500ms p95
- 10,000 concurrent transaction ingestions → < 2s p95
- 1,000 concurrent blockchain writes → queue handles gracefully, no data loss

---

## Deployment Architecture

### Infrastructure

```
Production (AWS Multi-Region):
├── Primary Region: Mumbai (ap-south-1) — India users
├── DR Region: Singapore (ap-southeast-1) — Failover
│
├── API Gateway: AWS API Gateway + Lambda (stateless)
├── Microservices: ECS Fargate (Docker containers)
├── Databases: 
│   ├── PostgreSQL: AWS RDS Multi-AZ
│   ├── InfluxDB: Self-managed on EC2 (Multi-AZ)
│   └── Redis: AWS ElastiCache (Multi-AZ)
├── Message Queue: AWS SQS (transaction events)
├── ML Platform: AWS SageMaker (model hosting + training)
├── Storage: S3 (model artifacts, backups)
├── CDN: CloudFront (static assets, API caching)
└── Monitoring: CloudWatch + Datadog + PagerDuty (on-call)
```

### CI/CD Pipeline

```
Developer Push → GitHub
    │
    ▼
GitHub Actions: Lint + Unit Tests
    │
    ▼ (pass)
Build Docker Image → Push to ECR
    │
    ▼
Deploy to Staging → Integration Tests → Blockchain Testnet Tests
    │
    ▼ (pass)
Deploy to Production (Blue/Green)
    │
    ▼
Smoke Tests → Monitor 15 minutes
    │
    ├── All clear → Route 100% traffic to new deployment
    └── Error spike → Auto-rollback to previous version
```

### Scaling Strategy

| Metric Threshold | Auto-Scaling Action |
|---|---|
| API CPU > 70% for 2 min | Scale out API service by 2 instances |
| Score engine queue depth > 5,000 | Scale out score workers by 3 instances |
| DB connection pool > 80% | Read replica promotion, connection pool expansion |
| Blockchain queue depth > 2,000 | Alert on-call, increase worker concurrency |
| Cache hit rate < 60% | Expand Redis cluster, review cache TTL settings |

---

## Implementation Phases

### Phase 1 — Hackathon MVP (36 Hours)
- [ ] Score calculation engine (core formula only, no ML yet)
- [ ] Rule-based transaction categorization
- [ ] Heartbeat home screen UI
- [ ] Single challenge generation (manual, no escrow)
- [ ] Basic Squad creation and contribution tracking
- [ ] SBT minting on Algorand testnet (one user)
- [ ] Web3Auth integration (Google login → wallet)
- [ ] Razorpay integration for one test bank account
- [ ] Demo flow: onboard → score → challenge → squad → NFT

### Phase 2 — Beta Launch (Month 1–3)
- [ ] ML categorization engine v1.0
- [ ] Full challenge escrow on Algorand mainnet
- [ ] Squad DeFi yield routing (Aave integration)
- [ ] Vitality Forecast feature
- [ ] Push notification system
- [ ] KYC integration (Aadhaar e-KYC)
- [ ] League and leaderboard system
- [ ] Full privacy and data deletion flows

### Phase 3 — Scale (Month 3–6)
- [ ] Federated learning for categorization personalization
- [ ] B2B corporate wellness dashboard
- [ ] Multi-bank connection support
- [ ] Scenario Simulator
- [ ] VitalToken reward system
- [ ] Third-party NFT verification API
- [ ] Performance optimization to 1M concurrent users

---

*Document Version: 1.0 | VitalScore Finance | Design Document for Kiro | Vicsta Hack Arena 2026*