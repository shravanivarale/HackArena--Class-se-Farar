# Implementation Tasks
## VitalScore Finance — Task Breakdown

This task list is generated directly from the approved Requirements.md and design.md documents.

---

## 1. Infrastructure Setup

- [ ] 1.1 Set up AWS infrastructure in Mumbai region (ap-south-1)
- [ ] 1.2 Configure PostgreSQL RDS Multi-AZ instance
- [ ] 1.3 Configure Redis ElastiCache Multi-AZ cluster
- [ ] 1.4 Set up InfluxDB on EC2 Multi-AZ
- [ ] 1.5 Configure AWS API Gateway
- [ ] 1.6 Set up ECS Fargate cluster for microservices
- [ ] 1.7 Configure AWS SQS message queue for transaction events
- [ ] 1.8 Set up S3 buckets for backups and model artifacts
- [ ] 1.9 Configure CloudFront CDN
- [ ] 1.10 Set up monitoring with CloudWatch and Datadog
- [ ] 1.11 Configure CI/CD pipeline with GitHub Actions
- [ ] 1.12 Set up Docker registry (ECR)

---

## 2. Database Schema Creation

- [ ] 2.1 Create User Profile schema in PostgreSQL
  - [ ] 2.1.1 userId (uuid-v4, primary key)
  - [ ] 2.1.2 createdAt, kycStatus fields
  - [ ] 2.1.3 incomeProfile (bracket, declaredMonthlyIncome, incomeType)
  - [ ] 2.1.4 locationProfile (type, state, city)
  - [ ] 2.1.5 leagueId, algorandAddress, sbtAssetId
  - [ ] 2.1.6 householdConfig (sharedExpenses array)
  - [ ] 2.1.7 consentFlags (escrowEnabled, squadEnabled, etc.)
  - [ ] 2.1.8 notificationPreferences
- [ ] 2.2 Create Transaction Record schema in PostgreSQL
  - [ ] 2.2.1 txnId (uuid-v4, primary key)
  - [ ] 2.2.2 userToken, externalRef, amount, currency, date
  - [ ] 2.2.3 merchantNormalized, merchantRaw
  - [ ] 2.2.4 category (primary, secondary, confidence, source)
  - [ ] 2.2.5 isRecurring, isShared, sharedUserShare
  - [ ] 2.2.6 isManualEntry, userOverride, flaggedForReview
- [ ] 2.3 Create VitalScore Snapshot schema in PostgreSQL
  - [ ] 2.3.1 snapshotId (uuid-v4, primary key)
  - [ ] 2.3.2 userId, timestamp, periodType
  - [ ] 2.3.3 score, band, trajectory
  - [ ] 2.3.4 components (necessityRatio, savingsRatio, debtPenalty, streakBonus, challengeBonus, inflationAdjustment)
  - [ ] 2.3.5 inputSummary (essentialSpendAvg3M, discretionarySpendAvg3M, incomeAvg3M, activeChallenges, streakDays)
- [ ] 2.4 Create Challenge schema in PostgreSQL
  - [ ] 2.4.1 challengeId (uuid-v4, primary key)
  - [ ] 2.4.2 userId, weekStartDate, type, description
  - [ ] 2.4.3 target (category, currentBaseline, targetValue, unit)
  - [ ] 2.4.4 difficulty, status
  - [ ] 2.4.5 stake (enabled, amount, currency, escrowContractId, escrowTxnId, lockedAt)
  - [ ] 2.4.6 completedAt, verificationData
  - [ ] 2.4.7 rewards (vitalPoints, scoreBonusApplied, yieldShareEarned)
- [ ] 2.5 Create Squad schema in PostgreSQL
  - [ ] 2.5.1 squadId (uuid-v4, primary key)
  - [ ] 2.5.2 name, creatorUserId, memberUserIds array
  - [ ] 2.5.3 configuration (contributionAmount, contributionFrequency, seasonDuration, seasonStartDate, seasonEndDate)
  - [ ] 2.5.4 treasury (algorandContractId, currentBalance, totalContributed, currentDefiProtocol, currentAPY, totalYieldAccumulated)
  - [ ] 2.5.5 status, leaderboardRank
  - [ ] 2.5.6 memberContributions array
- [ ] 2.6 Create time-series schema in InfluxDB for transaction events
- [ ] 2.7 Create indexes on userId, date, category fields
- [ ] 2.8 Set up database migration scripts

---

## 3. User Profile Service

- [ ] 3.1 Implement User Profile Service microservice
  - [ ] 3.1.1 POST /users endpoint (create new user profile)
  - [ ] 3.1.2 GET /users/{userId} endpoint (get user profile)
  - [ ] 3.1.3 PATCH /users/{userId} endpoint (update user profile)
  - [ ] 3.1.4 GET /users/{userId}/league endpoint (get league assignment)
  - [ ] 3.1.5 POST /users/{userId}/income endpoint (submit income declaration)
  - [ ] 3.1.6 GET /users/{userId}/settings endpoint (get notification preferences)
  - [ ] 3.1.7 PATCH /users/{userId}/settings endpoint (update notification preferences)
- [ ] 3.2 Implement league assignment logic
  - [ ] 3.2.1 Tier 1: <₹25K/month
  - [ ] 3.2.2 Tier 2: ₹25K–75K
  - [ ] 3.2.3 Tier 3: ₹75K–2L
  - [ ] 3.2.4 Tier 4: >₹2L
- [ ] 3.3 Implement household configuration management
- [ ] 3.4 Implement consent flag management
- [ ] 3.5 Write unit tests for User Profile Service (>90% coverage)
- [ ] 3.6 Write integration tests for User Profile Service

---

## 4. Authentication and Authorization

- [x] 4.1 Integrate Web3Auth for social login
  - [x] 4.1.1 Google OAuth integration
  - [x] 4.1.2 Apple OAuth integration
  - [x] 4.1.3 Phone number OTP integration
- [x] 4.2 Implement automatic non-custodial Algorand wallet creation
- [x] 4.3 Implement JWT token generation (24h expiry)
- [x] 4.4 Implement JWT refresh token logic (30-day validity)
- [x] 4.5 Implement JWT validation middleware
- [x] 4.6 Implement authorization levels (USER, SQUAD_MEMBER, B2B_ADMIN, SYSTEM)
- [x] 4.7 Implement POST /auth/login endpoint
- [x] 4.8 Implement POST /auth/refresh endpoint
- [x] 4.9 Implement POST /auth/logout endpoint
- [ ] 4.10 Write unit tests for authentication flows
- [ ] 4.11 Write integration tests for authentication flows

---

## 5. Transaction Ingestion Service

- [x] 5.1 Implement Transaction Ingestion Service microservice
  - [x] 5.1.1 POST /connections endpoint (create bank/UPI connection)
  - [x] 5.1.2 GET /connections/{userId} endpoint (get all connections)
  - [x] 5.1.3 DELETE /connections/{connectionId} endpoint (revoke connection)
  - [x] 5.1.4 POST /transactions/manual endpoint (add manual transaction)
  - [x] 5.1.5 GET /transactions/{userId} endpoint (get transaction history with pagination)
  - [x] 5.1.6 PATCH /transactions/{txnId}/category endpoint (override category)
- [x] 5.2 Integrate Razorpay Payment Gateway
  - [x] 5.2.1 Implement RBI-compliant consent flows
  - [x] 5.2.2 Implement 90-day historical data pull on onboarding
  - [x] 5.2.3 Implement polling logic (active users: 4h, standard: 24h)
- [x] 5.3 Implement transaction normalization pipeline
  - [x] 5.3.1 Deduplication (hash of amount + merchant + date)
  - [x] 5.3.2 Merchant name normalization (string similarity matching)
  - [x] 5.3.3 PII tokenization layer
  - [x] 5.3.4 Rule-based category assignment (Layer 1)
  - [ ] 5.3.5 ML category confidence scoring (Layer 2)
  - [ ] 5.3.6 User confirmation queue for confidence < 0.70
- [x] 5.4 Implement event publishing to SQS message queue
- [x] 5.5 Implement shared expense tagging and proportional split
- [x] 5.6 Implement recurring transaction detection and auto-tagging
- [ ] 5.7 Write unit tests for Transaction Ingestion Service (>85% coverage)
- [ ] 5.8 Write integration tests with Razorpay API sandbox

---

## 6. AI/ML Categorization Engine

- [ ] 6.1 Implement rule-based classifier (Layer 1)
  - [ ] 6.1.1 Create merchant rules dictionary for Essential categories
    - [ ] 6.1.1.1 Groceries (SWIGGY_GROCERY, BIGBASKET, etc.)
    - [ ] 6.1.1.2 Utilities (BSES, MAHANAGAR_GAS, etc.)
    - [ ] 6.1.1.3 Transport (IRCTC, etc.)
    - [ ] 6.1.1.4 EMI/Loan Repayment (HDFC_EMI, etc.)
  - [ ] 6.1.2 Create merchant rules dictionary for Discretionary categories
    - [ ] 6.1.2.1 Dining Out (SWIGGY, ZOMATO, etc.)
    - [ ] 6.1.2.2 Subscriptions (NETFLIX, SPOTIFY, etc.)
    - [ ] 6.1.2.3 Shopping (MYNTRA, etc.)
    - [ ] 6.1.2.4 Entertainment (BOOKMYSHOW, etc.)
  - [ ] 6.1.3 Implement pattern matching logic
  - [ ] 6.1.4 Return confidence score of 0.95 for rule matches
- [ ] 6.2 Implement ML classifier (Layer 2)
  - [ ] 6.2.1 Set up fine-tuned multilingual BERT model
  - [ ] 6.2.2 Implement feature extraction (merchant name, amount, day-of-week, recurring flag, user history)
  - [ ] 6.2.3 Implement per-user personalization layer using 90-day history
  - [ ] 6.2.4 Implement online learning on user overrides
  - [ ] 6.2.5 Implement weekly batch retraining on aggregated data
  - [ ] 6.2.6 Optimize inference latency to <200ms per transaction
- [ ] 6.3 Implement federated learning for on-device personalization
- [ ] 6.4 Deploy ML model to AWS SageMaker
- [ ] 6.5 Write unit tests for categorization engine (>85% coverage)
- [ ] 6.6 Test with real merchant name corpus
- [ ] 6.7 Validate 85% accuracy on day one, 92% accuracy after 45 days

---

## 7. Score Engine Service

- [x] 7.1 Implement Score Engine Service microservice
  - [x] 7.1.1 GET /score/{userId} endpoint (get current score and metadata)
  - [x] 7.1.2 GET /score/{userId}/history endpoint (get score history)
  - [x] 7.1.3 GET /score/{userId}/forecast endpoint (get 30-day projection)
  - [x] 7.1.4 GET /score/{userId}/breakdown endpoint (get score component breakdown)
  - [x] 7.1.5 POST /score/{userId}/recalculate endpoint (trigger manual recalculation)
  - [x] 7.1.6 POST /score/{userId}/emergency endpoint (enable Emergency Mode)
- [x] 7.2 Implement core score calculation formula
  - [x] 7.2.1 Calculate necessity ratio: E / (E+D)
  - [x] 7.2.2 Calculate savings ratio: (I - (E+D)) / I
  - [x] 7.2.3 Apply base formula: S' = 60 × (E / E+D) + 40 × (I − (E+D) / I)
  - [x] 7.2.4 Clamp savings ratio to minimum -0.5 for overspend scenarios
  - [x] 7.2.5 Scale to 0-1000 range
  - [x] 7.2.6 Apply debt penalty: (0.10 × Debt/I) × 1000, max 100 points
  - [x] 7.2.7 Apply streak bonus: up to +50 points
  - [x] 7.2.8 Apply challenge bonus: up to +30 points
  - [x] 7.2.9 Apply inflation adjustment
  - [x] 7.2.10 Clamp final score to 0-1000 range
- [x] 7.3 Implement edge case handling
  - [x] 7.3.1 I = 0 (no income) → return "NO_DATA"
  - [x] 7.3.2 E+D = 0 (zero spending) → set necessity ratio to 1, compute on savings only
  - [x] 7.3.3 Handle negative savings (overspending)
- [x] 7.4 Implement 3-month weighted rolling average
  - [x] 7.4.1 Current month: 50% weight
  - [x] 7.4.2 Prior month 1: 25% weight
  - [x] 7.4.3 Prior month 2: 25% weight
  - [x] 7.4.4 Apply to income (I)
  - [x] 7.4.5 Apply to essential spending (E)
  - [x] 7.4.6 Apply to discretionary spending (D)
- [x] 7.5 Implement score band classification
  - [x] 7.5.1 800-1000: "Vital Elite"
  - [x] 7.5.2 600-799: "Vital Strong"
  - [x] 7.5.3 400-599: "Vital Warning"
  - [x] 7.5.4 200-399: "Vital Critical"
  - [x] 7.5.5 0-199: "Vital Emergency"
- [x] 7.6 Implement real-time score update on transaction events
  - [x] 7.6.1 Subscribe to SQS transaction event queue
  - [x] 7.6.2 Trigger micro-update calculation within 60 seconds
  - [x] 7.6.3 Use cached rolling averages for performance
- [x] 7.7 Implement nightly batch recalculation
  - [x] 7.7.1 Schedule at 02:00 local time
  - [x] 7.7.2 Apply full 3-month rolling averages
  - [x] 7.7.3 Apply inflation adjustments from CPI data
  - [x] 7.7.4 Apply seasonal normalization
- [x] 7.8 Implement dynamic score calibration
  - [x] 7.8.1 Planned expense flagging and temporary penalty relaxation
  - [x] 7.8.2 CPI data integration for monthly inflation adjustments
  - [x] 7.8.3 Urban/rural location profile adjustments
  - [x] 7.8.4 Emergency Mode: re-weight essential spending to 80%
  - [x] 7.8.5 Spending anomaly detection (>300% of 90-day average)
  - [x] 7.8.6 User confirmation prompt for anomalies
- [x] 7.9 Implement 30-day score forecast
  - [x] 7.9.1 Project current spending velocity forward 30 days
  - [x] 7.9.2 Apply scheduled recurring transactions
  - [x] 7.9.3 Compute projected score at 7-day intervals
  - [x] 7.9.4 Generate "current pattern continues" scenario
  - [x] 7.9.5 Generate "optimized" scenario (20% discretionary reduction)
  - [x] 7.9.6 Detect projected band drops and trigger proactive alerts
- [x] 7.10 Implement streak tracking
  - [x] 7.10.1 Track daily savings streaks
  - [x] 7.10.2 Calculate streak bonus (up to +50 points)
  - [x] 7.10.3 Detect streak breaks and send notifications within 2 hours
  - [x] 7.10.4 Implement streak freeze (max 2 per month)
- [ ] 7.11 Write unit tests for Score Engine (>95% coverage)
- [ ] 7.12 Test all edge cases from requirements
- [ ] 7.13 Write integration tests for score calculation

---

## 8. Gamification Service

- [x] 8.1 Implement Gamification Service microservice
  - [x] 8.1.1 GET /challenges/{userId} endpoint (get current week's challenges)
  - [x] 8.1.2 POST /challenges/{userId}/stake endpoint (commit stake)
  - [x] 8.1.3 GET /challenges/{userId}/history endpoint (get challenge history)
  - [x] 8.1.4 POST /squads endpoint (create new Squad)
  - [x] 8.1.5 POST /squads/{squadId}/join endpoint (join Squad)
  - [x] 8.1.6 GET /squads/{squadId} endpoint (get Squad details)
  - [x] 8.1.7 GET /leagues/{userId} endpoint (get league position)
  - [x] 8.1.8 GET /badges/{userId} endpoint (get earned badges)
  - [x] 8.1.9 GET /streaks/{userId} endpoint (get streak data)
  - [x] 8.1.10 POST /streaks/{userId}/freeze endpoint (use streak freeze)
- [x] 8.2 Implement weekly challenge generation
  - [x] 8.2.1 Generate exactly 3 personalized challenges per week
  - [x] 8.2.2 Analyze prior 30-day spending patterns
  - [x] 8.2.3 Generate REDUCE_CATEGORY challenge from top overspent discretionary category
  - [x] 8.2.4 Generate SAVINGS_VELOCITY challenge
  - [x] 8.2.5 Generate structural improvement challenge (CANCEL_SUBSCRIPTION, BUILD_EMERGENCY_FUND, or INVESTMENT_ACTION)
  - [x] 8.2.6 Set difficulty levels: Easy (10-15% improvement), Medium (20-30%), Hard (30-50%)
  - [x] 8.2.7 Set stake ranges based on difficulty
- [x] 8.3 Implement challenge lifecycle management
  - [x] 8.3.1 Challenge creation and assignment
  - [x] 8.3.2 Challenge deadline tracking
  - [x] 8.3.3 Challenge completion verification using bank transaction data
  - [x] 8.3.4 Award VitalPoints on completion
  - [x] 8.3.5 Apply score bonus (+15 to +50 based on difficulty)
  - [x] 8.3.6 Apply -5 point notification on failure (not score deduction)
  - [x] 8.3.7 Offer revised easier version on failure
  - [x] 8.3.8 Track challenge completion rate for SBT metadata
- [x] 8.4 Implement commitment escrow integration
  - [x] 8.4.1 Allow users to stake ₹50-₹500 (₹1,000 for Hard challenges)
  - [x] 8.4.2 Lock funds in Algorand smart contract on stake confirmation
  - [x] 8.4.3 Verify challenge completion at deadline using bank data
  - [x] 8.4.4 Return stake + yield share on success within 24 hours
  - [x] 8.4.5 Forfeit stake to community pool on failure
  - [x] 8.4.6 Display community pool balance and estimated yield share
  - [x] 8.4.7 Extend verification window by 48h if no bank data available
  - [x] 8.4.8 Never hold stake funds in VitalScore-controlled accounts
- [x] 8.5 Implement league system
  - [x] 8.5.1 Assign users to leagues based on income bracket
  - [x] 8.5.2 Maintain anonymous weekly leaderboards per league
  - [x] 8.5.3 Award "Vital Elite" badge to top 10% each week
  - [x] 8.5.4 Update leaderboards weekly
- [x] 8.6 Implement Squad Savings Pools
  - [x] 8.6.1 Allow Squad creation with 3-8 members
  - [x] 8.6.2 Define contribution amount (₹100-₹10,000/week)
  - [x] 8.6.3 Define season duration (30, 60, or 90 days)
  - [x] 8.6.4 Send weekly contribution reminders 24h before deadline
  - [x] 8.6.5 Notify all members on missed contributions
  - [x] 8.6.6 Track contribution streaks per member
  - [x] 8.6.7 Track challenge completion rate per member
- [x] 8.7 Implement DeFi yield management for Squads
  - [x] 8.7.1 Route Squad pool funds to highest-yield audited DeFi protocol
  - [x] 8.7.2 Support Aave, Compound, Algorand-native pools
  - [x] 8.7.3 Only use protocols with security audit within past 12 months
  - [x] 8.7.4 Display current APY on Squad dashboard (updated daily)
  - [x] 8.7.5 Auto re-route if protocol security event or APY < 2%
  - [x] 8.7.6 Return 100% principal to all members at season end
  - [x] 8.7.7 Distribute yield weighted by VitalScore improvement percentage
  - [x] 8.7.8 Use multi-signature Algorand smart contract for treasury
- [ ] 8.8 Implement Squad leaderboard
  - [ ] 8.8.1 Rank Squads by average member VitalScore improvement
  - [ ] 8.8.2 Award "Champion Squad" badge to top 10% per season
  - [ ] 8.8.3 Award "Full Season" achievement for zero dropouts
- [ ] 8.9 Write unit tests for Gamification Service (>90% coverage)
- [ ] 8.10 Write integration tests for full challenge lifecycle
- [ ] 8.11 Write integration tests for Squad lifecycle

---

## 9. Blockchain Integration Service

- [ ] 9.1 Implement Blockchain Integration Service microservice
  - [ ] 9.1.1 POST /nft/mint/{userId} endpoint (mint Soul-Bound Token)
  - [ ] 9.1.2 POST /nft/update/{userId} endpoint (update monthly snapshot)
  - [ ] 9.1.3 GET /nft/{userId} endpoint (get NFT metadata and IPFS hash)
  - [ ] 9.1.4 POST /escrow/lock endpoint (lock challenge stake)
  - [ ] 9.1.5 POST /escrow/release/{escrowId} endpoint (release stake)
  - [ ] 9.1.6 POST /squad/create endpoint (deploy Squad treasury contract)
  - [ ] 9.1.7 POST /squad/{squadId}/deposit endpoint (record contribution)
  - [ ] 9.1.8 POST /squad/{squadId}/distribute endpoint (trigger season-end distribution)
  - [ ] 9.1.9 GET /token/balance/{userId} endpoint (get VitalToken balance)
  - [ ] 9.1.10 POST /token/issue/{userId} endpoint (issue reward tokens)
- [ ] 9.2 Implement Algorand smart contracts in PyTeal
  - [ ] 9.2.1 SoulBoundNFT.py contract
    - [ ] 9.2.1.1 State: owner_address, transfer_restricted=True
    - [ ] 9.2.1.2 mint() method
    - [ ] 9.2.1.3 update_metadata() method
    - [ ] 9.2.1.4 verify() method
    - [ ] 9.2.1.5 Enforce no transfer restriction
    - [ ] 9.2.1.6 Restrict delete to system admin only
  - [ ] 9.2.2 ChallengeEscrow.py contract
    - [ ] 9.2.2.1 State: user_address, stake_amount, challenge_id, deadline, verified
    - [ ] 9.2.2.2 lock_stake() method
    - [ ] 9.2.2.3 verify_completion() method with VitalScore API oracle
    - [ ] 9.2.2.4 release_success() method
    - [ ] 9.2.2.5 release_failure() method
    - [ ] 9.2.2.6 Implement 48h extension fallback if verification unavailable
  - [ ] 9.2.3 SquadTreasury.py contract
    - [ ] 9.2.3.1 State: member_addresses[], contributions{}, yield_accumulated, season_end
    - [ ] 9.2.3.2 deposit() method
    - [ ] 9.2.3.3 route_to_defi() method
    - [ ] 9.2.3.4 record_yield() method
    - [ ] 9.2.3.5 distribute_weighted() method
    - [ ] 9.2.3.6 Implement 3-of-5 multi-sig for system keys
    - [ ] 9.2.3.7 Implement unanimous member approval for emergency withdrawal
  - [ ] 9.2.4 VitalToken.py (Algorand Standard Asset)
    - [ ] 9.2.4.1 Configure as standard ASA
    - [ ] 9.2.4.2 Control issuance via VitalScore system wallet
    - [ ] 9.2.4.3 Support token burns for partner merchant redemption
- [ ] 9.3 Implement IPFS integration for NFT metadata storage
  - [ ] 9.3.1 Store Soul-Bound NFT metadata on IPFS
  - [ ] 9.3.2 Record IPFS hash on-chain
  - [ ] 9.3.3 Never store raw transaction data or PII in metadata
- [ ] 9.4 Implement NFT metadata structure
  - [ ] 9.4.1 standard, ownerAddress, createdAt
  - [ ] 9.4.2 monthlySnapshots array (score, band, trajectory, challengeCompletionRate, streakDays, squadParticipant, inputHash)
  - [ ] 9.4.3 badges array (id, earnedAt)
  - [ ] 9.4.4 aggregateSummary (lifetimeHighScore, averageScore12M, totalChallengesCompleted, etc.)
- [ ] 9.5 Implement monthly NFT snapshot updates
  - [ ] 9.5.1 Schedule on 1st of each month
  - [ ] 9.5.2 Include VitalScore, band, trajectory
  - [ ] 9.5.3 Include challenge completion rate, streak length
  - [ ] 9.5.4 Include squad participation flag
  - [ ] 9.5.5 Include cryptographic hash of scoring inputs (not raw data)
- [ ] 9.6 Implement trajectory badges
  - [ ] 9.6.1 "Improving" badge for 6 consecutive months of improvement
  - [ ] 9.6.2 "Vital Strong Sustained" badge for 12 months above 700
- [ ] 9.7 Implement blockchain transaction queue
  - [ ] 9.7.1 Queue all on-chain writes in Redis
  - [ ] 9.7.2 Process queue every 30 seconds under normal load
  - [ ] 9.7.3 Batch transactions where possible
  - [ ] 9.7.4 Priority queue: escrow releases > NFT mints > token issuance
  - [ ] 9.7.5 Retry with exponential backoff (max 3 hours)
  - [ ] 9.7.6 Alert on-call if queue depth > 1000
- [ ] 9.8 Implement blockchain failure fallback
  - [ ] 9.8.1 Retry 3x with exponential backoff (1s, 4s, 16s)
  - [ ] 9.8.2 Persist failed actions in Redis queue
  - [ ] 9.8.3 Continue application flow off-chain
  - [ ] 9.8.4 Drain queue when Algorand RPC recovers
  - [ ] 9.8.5 For escrow: do NOT proceed if stake cannot be locked
- [ ] 9.9 Deploy contracts to Algorand testnet
- [ ] 9.10 Run testnet for minimum 30 days
- [ ] 9.11 Conduct third-party security audit of all PyTeal contracts
- [ ] 9.12 Deploy contracts to Algorand mainnet after audit approval
- [ ] 9.13 Write unit tests for Blockchain Integration Service (>80% coverage)
- [ ] 9.14 Write integration tests on Algorand testnet

---

## 10. Third-Party NFT Verification

- [ ] 10.1 Implement shareable verification link generation
- [ ] 10.2 Display only score history, trajectory, and badges (never raw data)
- [ ] 10.3 Require explicit user consent before link activation
- [ ] 10.4 Set default link expiry to 30 days
- [ ] 10.5 Allow user to extend or revoke links
- [ ] 10.6 Implement zero-knowledge proof verification
- [ ] 10.7 Allow third parties to verify link authenticity via Algorand blockchain
- [ ] 10.8 No account creation required for verifiers
- [ ] 10.9 Write unit tests for verification flows
- [ ] 10.10 Write integration tests for verification flows

---

## 11. Notification System

- [ ] 11.1 Implement push notification service
  - [ ] 11.1.1 Morning daily digest notification (previous day's score change + one insight)
  - [ ] 11.1.2 Real-time overspend alert (discretionary >80% of monthly budget)
  - [ ] 11.1.3 Proactive forecast warning (7 days and 3 days before projected band drop)
  - [ ] 11.1.4 Streak rescue notification (no savings activity in 22+ hours)
  - [ ] 11.1.5 Challenge urgency notification (deadline within 24 hours)
  - [ ] 11.1.6 Vital Emergency notification (score 0-199)
- [ ] 11.2 Implement notification frequency preferences
  - [ ] 11.2.1 Essential only
  - [ ] 11.2.2 Standard
  - [ ] 11.2.3 Full
- [ ] 11.3 Enforce maximum 5 notifications per day per user
- [ ] 11.4 Integrate with push notification service (Firebase Cloud Messaging or similar)
- [ ] 11.5 Write unit tests for notification logic
- [ ] 11.6 Write integration tests for notification delivery

---

## 12. KYC and Compliance

- [ ] 12.1 Integrate Aadhaar-based e-KYC for Indian users
- [ ] 12.2 Implement KYC requirement before enabling escrow and Squad Pool features
- [ ] 12.3 Allow score and tracking features without KYC
- [ ] 12.4 Integrate AML transaction monitoring via RegTech API
- [ ] 12.5 Store KYC data encrypted in India-resident data centers
- [ ] 12.6 Comply with RBI data localization requirements
- [ ] 12.7 Maintain AML alert logs auditable by regulatory bodies
- [ ] 12.8 Write unit tests for KYC flows
- [ ] 12.9 Write integration tests for KYC flows

---

## 13. Data Privacy and Security

- [ ] 13.1 Implement AES-256 encryption at rest for all user data
- [ ] 13.2 Implement TLS 1.3 encryption in transit
- [ ] 13.3 Implement PII tokenization at ingestion layer
- [ ] 13.4 Ensure raw PII never propagates to scoring, gamification, or blockchain services
- [ ] 13.5 Implement data export function (JSON format, 48h delivery)
- [ ] 13.6 Implement data deletion function (30-day permanent removal)
- [ ] 13.7 Ensure bank connections are read-only (no write access or payment initiation)
- [ ] 13.8 Never sell, license, or share individual user data without explicit consent
- [ ] 13.9 Implement anonymized aggregated insights (10,000+ user minimum)
- [ ] 13.10 Comply with India's DPDP Act 2023
- [ ] 13.11 Comply with RBI Account Aggregator Framework
- [ ] 13.12 Comply with GDPR for international users
- [ ] 13.13 Implement automated daily backups with point-in-time recovery (1-hour granularity)
- [ ] 13.14 Write security audit documentation
- [ ] 13.15 Conduct penetration testing

---

## 14. External-Facing REST API

- [ ] 14.1 Implement API Gateway with rate limiting
- [ ] 14.2 Implement standard response format (success, data, meta, error)
- [ ] 14.3 Implement error response format with error codes
- [ ] 14.4 Implement authentication endpoints
  - [ ] 14.4.1 POST /auth/login
  - [ ] 14.4.2 POST /auth/refresh
  - [ ] 14.4.3 POST /auth/logout
- [ ] 14.5 Implement score endpoints
  - [ ] 14.5.1 GET /score (current score with breakdown)
  - [ ] 14.5.2 GET /score/history?months=12
  - [ ] 14.5.3 GET /score/forecast
- [ ] 14.6 Implement transaction endpoints
  - [ ] 14.6.1 GET /transactions?page=1&limit=50
  - [ ] 14.6.2 POST /transactions (add manual transaction)
  - [ ] 14.6.3 PATCH /transactions/{id} (override category)
- [ ] 14.7 Implement challenge endpoints
  - [ ] 14.7.1 GET /challenges
  - [ ] 14.7.2 POST /challenges/{id}/stake
  - [ ] 14.7.3 DELETE /challenges/{id}/stake
- [ ] 14.8 Implement squad endpoints
  - [ ] 14.8.1 POST /squads
  - [ ] 14.8.2 GET /squads
  - [ ] 14.8.3 GET /squads/{id}
  - [ ] 14.8.4 POST /squads/{id}/contribute
- [ ] 14.9 Implement NFT endpoints
  - [ ] 14.9.1 GET /nft
  - [ ] 14.9.2 GET /nft/verify-link
- [ ] 14.10 Implement leaderboard endpoints
  - [ ] 14.10.1 GET /leaderboard/league
  - [ ] 14.10.2 GET /leaderboard/squads
- [ ] 14.11 Implement settings endpoints
  - [ ] 14.11.1 GET /settings
  - [ ] 14.11.2 PATCH /settings
  - [ ] 14.11.3 POST /settings/connect-bank
  - [ ] 14.11.4 DELETE /settings/connections/{id}
  - [ ] 14.11.5 POST /settings/emergency-mode
- [ ] 14.12 Write API documentation (OpenAPI/Swagger)
- [ ] 14.13 Write integration tests for all API endpoints

---

## 15. Frontend - React Native Mobile App

- [ ] 15.1 Set up React Native project structure
- [ ] 15.2 Implement authentication screens
  - [ ] 15.2.1 Login screen (Google, Apple, Phone OTP)
  - [ ] 15.2.2 Onboarding flow (5 screens max)
  - [ ] 15.2.3 Bank connection screen (Razorpay integration)
- [ ] 15.3 Implement home screen
  - [ ] 15.3.1 VitalScore display with heartbeat visualization
  - [ ] 15.3.2 Heartbeat color and rhythm based on score band
    - [ ] 15.3.2.1 Vital Elite (800-1000): deep green, strong rhythm
    - [ ] 15.3.2.2 Vital Strong (600-799): green, steady rhythm
    - [ ] 15.3.2.3 Vital Warning (400-599): amber, irregular rhythm
    - [ ] 15.3.2.4 Vital Critical (200-399): red, erratic
    - [ ] 15.3.2.5 Vital Emergency (0-199): red flatline
  - [ ] 15.3.3 Real-time score updates (within 60 seconds of transaction)
  - [ ] 15.3.4 Score breakdown component
  - [ ] 15.3.5 30-day forecast display (current pattern + optimized scenarios)
  - [ ] 15.3.6 Streak counter display
- [ ] 15.4 Implement transaction screens
  - [ ] 15.4.1 Transaction list with pagination
  - [ ] 15.4.2 Transaction detail view
  - [ ] 15.4.3 Category override interface
  - [ ] 15.4.4 Manual transaction entry form
  - [ ] 15.4.5 Shared expense tagging interface
- [ ] 15.5 Implement challenge screens
  - [ ] 15.5.1 Weekly challenges list (3 challenges)
  - [ ] 15.5.2 Challenge detail view with target and progress
  - [ ] 15.5.3 Stake commitment interface
  - [ ] 15.5.4 Community pool balance display
  - [ ] 15.5.5 Challenge history view
  - [ ] 15.5.6 Challenge completion celebration animation
- [ ] 15.6 Implement Squad screens
  - [ ] 15.6.1 Squad creation form
  - [ ] 15.6.2 Squad invitation interface
  - [ ] 15.6.3 Squad dashboard (members, contributions, treasury balance, APY)
  - [ ] 15.6.4 Squad leaderboard
  - [ ] 15.6.5 Contribution tracking per member
  - [ ] 15.6.6 Season end distribution summary
- [ ] 15.7 Implement league and leaderboard screens
  - [ ] 15.7.1 User's league position display
  - [ ] 15.7.2 Anonymous league leaderboard
  - [ ] 15.7.3 Squad leaderboard
- [ ] 15.8 Implement NFT screens
  - [ ] 15.8.1 Soul-Bound NFT display
  - [ ] 15.8.2 Monthly snapshot history
  - [ ] 15.8.3 Badges display
  - [ ] 15.8.4 Verification link generation interface
  - [ ] 15.8.5 Verification link sharing options
- [ ] 15.9 Implement settings screens
  - [ ] 15.9.1 Profile settings
  - [ ] 15.9.2 Notification preferences
  - [ ] 15.9.3 Bank connections management
  - [ ] 15.9.4 Emergency Mode toggle
  - [ ] 15.9.5 Data export request
  - [ ] 15.9.6 Account deletion request
- [ ] 15.10 Implement push notification handling
- [ ] 15.11 Implement offline mode and data caching
- [ ] 15.12 Implement error handling and user feedback
- [ ] 15.13 Implement loading states and skeleton screens
- [ ] 15.14 Optimize performance for smooth 60fps animations
- [ ] 15.15 Test on iOS devices
- [ ] 15.16 Test on Android devices
- [ ] 15.17 Conduct accessibility testing
- [ ] 15.18 Conduct usability testing

---

## 16. Frontend - React.js Web App

- [ ] 16.1 Set up React.js project structure
- [ ] 16.2 Implement authentication screens (same as mobile)
- [ ] 16.3 Implement home screen (same as mobile, responsive design)
- [ ] 16.4 Implement transaction screens (same as mobile, responsive design)
- [ ] 16.5 Implement challenge screens (same as mobile, responsive design)
- [ ] 16.6 Implement Squad screens (same as mobile, responsive design)
- [ ] 16.7 Implement league and leaderboard screens (same as mobile, responsive design)
- [ ] 16.8 Implement NFT screens (same as mobile, responsive design)
- [ ] 16.9 Implement settings screens (same as mobile, responsive design)
- [ ] 16.10 Implement responsive design for desktop, tablet, mobile
- [ ] 16.11 Implement browser notification handling
- [ ] 16.12 Test on Chrome, Firefox, Safari, Edge
- [ ] 16.13 Conduct accessibility testing (WCAG 2.1 AA)
- [ ] 16.14 Conduct usability testing

---

## 17. B2B Corporate Wellness Dashboard

- [ ] 17.1 Implement B2B employer dashboard
  - [ ] 17.1.1 Aggregate workforce financial health metrics
  - [ ] 17.1.2 Average score band distribution chart
  - [ ] 17.1.3 Challenge completion rates chart
  - [ ] 17.1.4 Squad participation chart
  - [ ] 17.1.5 Never display individual employee data
  - [ ] 17.1.6 Monthly aggregate wellness report (PDF export)
- [ ] 17.2 Implement company-wide Squad season configuration
- [ ] 17.3 Implement custom challenge theme configuration
- [ ] 17.4 Implement employee opt-in management
- [ ] 17.5 Write unit tests for B2B dashboard
- [ ] 17.6 Write integration tests for B2B dashboard

---

## 18. Performance Optimization

- [ ] 18.1 Optimize API response time to <500ms at 95th percentile for home screen
- [ ] 18.2 Optimize score update to display within 60 seconds of transaction
- [ ] 18.3 Implement caching strategy with Redis
  - [ ] 18.3.1 Cache rolling averages for real-time score updates
  - [ ] 18.3.2 Cache user profiles
  - [ ] 18.3.3 Cache leaderboards
  - [ ] 18.3.4 Set appropriate TTL for each cache type
- [ ] 18.4 Implement database query optimization
  - [ ] 18.4.1 Add indexes on frequently queried fields
  - [ ] 18.4.2 Optimize N+1 queries
  - [ ] 18.4.3 Use connection pooling
- [ ] 18.5 Implement auto-scaling rules
  - [ ] 18.5.1 API CPU > 70% for 2 min → scale out by 2 instances
  - [ ] 18.5.2 Score engine queue depth > 5,000 → scale out by 3 instances
  - [ ] 18.5.3 DB connection pool > 80% → promote read replica
  - [ ] 18.5.4 Blockchain queue depth > 2,000 → alert on-call
  - [ ] 18.5.5 Cache hit rate < 60% → expand Redis cluster
- [ ] 18.6 Conduct load testing for 1 million concurrent users
- [ ] 18.7 Conduct load testing for 100,000 concurrent score reads (<500ms p95)
- [ ] 18.8 Conduct load testing for 10,000 concurrent transaction ingestions (<2s p95)
- [ ] 18.9 Conduct load testing for 1,000 concurrent blockchain writes

---

## 19. Monitoring and Observability

- [ ] 19.1 Set up CloudWatch dashboards
  - [ ] 19.1.1 API latency metrics
  - [ ] 19.1.2 Error rate metrics
  - [ ] 19.1.3 Database performance metrics
  - [ ] 19.1.4 Queue depth metrics
  - [ ] 19.1.5 Cache hit rate metrics
- [ ] 19.2 Set up Datadog integration
  - [ ] 19.2.1 Application performance monitoring
  - [ ] 19.2.2 Distributed tracing
  - [ ] 19.2.3 Log aggregation
- [ ] 19.3 Set up PagerDuty for on-call alerts
  - [ ] 19.3.1 Critical: API down, database down, blockchain queue > 1000
  - [ ] 19.3.2 Warning: High latency, high error rate, cache issues
- [ ] 19.4 Implement health check endpoints for all services
- [ ] 19.5 Implement uptime monitoring (target: 99.9%)
- [ ] 19.6 Set up automated alerting rules

---

## 20. Testing

- [ ] 20.1 Write unit tests for all services (coverage targets per service)
- [ ] 20.2 Write integration tests for all API endpoints
- [ ] 20.3 Write integration tests for Razorpay API sandbox
- [ ] 20.4 Write integration tests for Algorand testnet
- [ ] 20.5 Write end-to-end tests for critical user flows
  - [ ] 20.5.1 Onboarding → score calculation → first challenge
  - [ ] 20.5.2 Challenge stake → completion → reward
  - [ ] 20.5.3 Squad creation → contributions → season end distribution
  - [ ] 20.5.4 NFT mint → monthly update → verification link
- [ ] 20.6 Conduct security testing
  - [ ] 20.6.1 Penetration testing
  - [ ] 20.6.2 Smart contract audit (third-party)
  - [ ] 20.6.3 Vulnerability scanning
- [ ] 20.7 Conduct performance testing (load tests)
- [ ] 20.8 Conduct accessibility testing (WCAG 2.1 AA)
- [ ] 20.9 Conduct usability testing with target users

---

## 21. Deployment and DevOps

- [ ] 21.1 Set up staging environment
- [ ] 21.2 Set up production environment (Mumbai region)
- [ ] 21.3 Set up DR environment (Singapore region)
- [ ] 21.4 Implement blue-green deployment strategy
- [ ] 21.5 Implement automated rollback on error spike
- [ ] 21.6 Implement smoke tests post-deployment
- [ ] 21.7 Implement 15-minute monitoring window before full traffic routing
- [ ] 21.8 Set up automated daily backups
- [ ] 21.9 Test point-in-time recovery (1-hour granularity)
- [ ] 21.10 Document deployment procedures
- [ ] 21.11 Document rollback procedures
- [ ] 21.12 Document disaster recovery procedures

---

## 22. Documentation

- [ ] 22.1 Write API documentation (OpenAPI/Swagger)
- [ ] 22.2 Write developer onboarding guide
- [ ] 22.3 Write architecture documentation
- [ ] 22.4 Write database schema documentation
- [ ] 22.5 Write smart contract documentation
- [ ] 22.6 Write deployment guide
- [ ] 22.7 Write monitoring and alerting guide
- [ ] 22.8 Write incident response playbook
- [ ] 22.9 Write user documentation
- [ ] 22.10 Write privacy policy
- [ ] 22.11 Write terms of service
- [ ] 22.12 Write data processing agreement (for B2B)

---

## 23. Phase 1 - Hackathon MVP (Week 1-2)

- [ ] 23.1 Implement core score calculation engine (formula only, no ML)
- [ ] 23.2 Implement rule-based transaction categorization
- [ ] 23.3 Implement heartbeat home screen UI
- [ ] 23.4 Implement single challenge generation (manual, no escrow)
- [ ] 23.5 Implement basic Squad creation and contribution tracking
- [ ] 23.6 Implement SBT minting on Algorand testnet (one user)
- [ ] 23.7 Integrate Web3Auth (Google login → wallet)
- [ ] 23.8 Integrate Razorpay for one test bank account
- [ ] 23.9 Create demo flow: onboard → score → challenge → squad → NFT

---

## 24. Phase 2 - Beta Launch (Month 1-3)

- [ ] 24.1 Implement ML categorization engine v1.0
- [ ] 24.2 Implement full challenge escrow on Algorand mainnet
- [ ] 24.3 Implement Squad DeFi yield routing (Aave integration)
- [ ] 24.4 Implement Vitality Forecast feature
- [ ] 24.5 Implement push notification system
- [ ] 24.6 Integrate KYC (Aadhaar e-KYC)
- [ ] 24.7 Implement league and leaderboard system
- [ ] 24.8 Implement full privacy and data deletion flows

---

## 25. Phase 3 - Scale (Month 3-6)

- [ ] 25.1 Implement federated learning for categorization personalization
- [ ] 25.2 Implement B2B corporate wellness dashboard
- [ ] 25.3 Implement multi-bank connection support
- [ ] 25.4 Implement Scenario Simulator
- [ ] 25.5 Implement VitalToken reward system
- [ ] 25.6 Implement third-party NFT verification API
- [ ] 25.7 Optimize performance to 1M concurrent users

---

*Task list generated from approved Requirements.md and design.md | VitalScore Finance*
