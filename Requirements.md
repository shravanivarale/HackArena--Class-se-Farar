Requirements Document
VitalScore Finance — AI-Driven Gamified Financial Wellness on Blockchain

Introduction
VitalScore Finance is an AI-powered, blockchain-backed mobile and web application that transforms personal financial management into a gamified, socially accountable experience. The system assigns each user a real-time Financial Vitality Score (0–1000) based on the ratio of essential to discretionary spending, savings velocity, stability streaks, and financial recovery behavior. It incentivizes healthy financial habits through behavioral gamification, commitment-device economics (on-chain challenge escrow), group savings pools with DeFi yield, and a portable on-chain financial reputation system (Soul-Bound NFT).
The platform targets India's 500M+ UPI users first, with architecture designed for Southeast Asia expansion in Phase 2. It operates across B2C (individual users) and B2B (corporate financial wellness) channels.

Requirements
1. Financial Vitality Score Engine
1.1 Core Score Calculation
User Story: As a user, I want to see a single, real-time score that reflects the health of my financial behavior so that I can understand my financial wellness at a glance without reading complex data.
Acceptance Criteria:

WHEN a transaction is recorded THEN the system SHALL recalculate the VitalScore within 60 seconds and update the home screen display
The score SHALL be calculated using the formula: S' = 60 × (E / E+D) + 40 × (I − (E+D) / I) where E = essential spending, D = discretionary spending, I = net income
The score SHALL be clamped to the range 0–1000 after applying all penalties and bonuses
The score SHALL apply a debt penalty of (delta × Debt/I) where delta = 10% for outstanding high-interest credit obligations
The score SHALL apply a streak bonus of up to +50 points for consecutive months of score improvement
A nightly batch recalculation SHALL run applying 3-month rolling averages, inflation adjustments, and seasonal normalization
The system SHALL support real-time micro-updates on the home screen triggered by each new transaction
The score SHALL never display as negative or above 1000 regardless of inputs

1.2 Score Bands and Classification
User Story: As a user, I want my score to be classified into meaningful status levels so that I understand what my number means without needing to interpret it myself.
Acceptance Criteria:

WHEN a score falls between 800–1000 THEN the system SHALL classify the user as "Vital Elite" and display a deep green strong-rhythm heartbeat
WHEN a score falls between 600–799 THEN the system SHALL classify the user as "Vital Strong" and display a green steady-rhythm heartbeat
WHEN a score falls between 400–599 THEN the system SHALL classify the user as "Vital Warning" and display an amber irregular-rhythm heartbeat
WHEN a score falls between 200–399 THEN the system SHALL classify the user as "Vital Critical" and display a red erratic heartbeat
WHEN a score falls between 0–199 THEN the system SHALL classify the user as "Vital Emergency", display a red flatline warning, and trigger an urgent in-app notification
The heartbeat visualization SHALL update its color, amplitude, and rhythm in real time as the score changes

1.3 Dynamic Score Calibration
User Story: As a freelancer with irregular income, I want the score to understand that my income varies month-to-month so that I am not unfairly penalized for natural income volatility.
Acceptance Criteria:

The system SHALL use a 3-month weighted rolling average for income (I) where the current month contributes 50% weight and each of the two prior months contributes 25%
The system SHALL use a 3-month weighted rolling average for essential and discretionary spending with the same weighting
WHEN a user flags a calendar event as a planned expense (festival, wedding, medical) THEN the system SHALL temporarily relax the score penalty for elevated spending in that category during that period
The system SHALL integrate CPI data monthly and adjust essential spending thresholds upward when category-specific inflation exceeds 5% year-over-year
The system SHALL apply urban or rural location profiles to adjust baseline necessity allowances per user registration data
WHEN a user enables Emergency Mode THEN the system SHALL re-weight essential spending at 80% for that month, reducing the punitive effect of unavoidable large expenses
WHEN E+D = 0 (zero spending month) THEN the system SHALL set the necessity ratio to 1 and compute score based on savings ratio only
WHEN I = 0 (no income recorded) THEN the system SHALL display "No Data" and not render a score
WHEN the system detects a spending anomaly greater than 300% of the user's 90-day category average THEN it SHALL prompt the user to confirm or flag the transaction before including it in scoring

1.4 Household and Shared Expense Support
User Story: As someone who shares expenses with family or housemates, I want to allocate shared costs proportionally so that my score reflects only my financial responsibility.
Acceptance Criteria:

The system SHALL allow users to tag any transaction as "household shared" and specify a percentage split (e.g., 50%, 33%, 25%)
The system SHALL apply only the user's proportional share of shared transactions to the score calculation
Shared expense tags SHALL persist for recurring transactions and auto-apply to future instances of the same merchant/amount


2. AI Transaction Categorization
2.1 Automatic Categorization
User Story: As a user, I want my transactions to be automatically sorted into essential and discretionary categories so that I don't have to manually classify hundreds of transactions each month.
Acceptance Criteria:

WHEN a new transaction is ingested THEN the system SHALL categorize it as Essential or Discretionary within 5 seconds using the rule-based classification layer
The rule-based layer SHALL achieve a minimum of 85% categorization accuracy on known merchants from day one of user onboarding
The ML categorization model SHALL improve accuracy to above 92% within 45 days of user activity as it learns user-specific patterns
The system SHALL support the following Essential sub-categories: Rent/Mortgage, Groceries, Utilities, Transport, Insurance, Education, Healthcare, EMI/Loan Repayment
The system SHALL support the following Discretionary sub-categories: Dining Out, Entertainment, Subscriptions, Shopping, Travel, Personal Care, Gifting
WHEN a transaction cannot be confidently classified (confidence < 70%) THEN the system SHALL prompt the user to categorize it manually
User manual overrides SHALL be used as training signals to improve the ML model for that user's profile

2.2 User Control and Override
User Story: As a user who considers my gym membership essential to my health, I want to reclassify specific recurring expenses so that my score reflects my personal priorities.
Acceptance Criteria:

The system SHALL allow users to override any transaction's category at any time
The system SHALL allow users to set permanent category rules for recurring merchants (e.g., "Always classify Cult.fit as Essential")
WHEN a user overrides a category THEN the system SHALL retroactively re-score all historical transactions from that merchant using the new classification
The system SHALL allow users to mark specific subscriptions for cancellation review with a "Review" flag


3. Gamification System
3.1 Weekly Challenge Engine
User Story: As a user, I want to receive personalized weekly financial challenges so that I have concrete, achievable actions to improve my score rather than vague advice.
Acceptance Criteria:

The system SHALL generate exactly 3 personalized challenges per week for each active user
Challenges SHALL be generated based on the user's actual spending patterns from the prior 30 days
Each challenge SHALL include: a specific measurable target, a deadline, a difficulty level (Easy/Medium/Hard), and an optional stake amount
Challenge targets SHALL be specific and quantified (e.g., "Reduce dining spend from ₹4,200 to ₹2,800 this week" not "spend less on dining")
Easy challenges SHALL target 10–15% behavior improvement; Medium 20–30%; Hard 30–50%
WHEN a user completes a challenge THEN the system SHALL award VitalPoints and update the score with a +15 to +50 point bonus depending on difficulty
WHEN a user fails a challenge THEN the system SHALL apply a -5 point score notification (not a score deduction) and offer a revised easier version
The system SHALL track challenge completion rate as a component of the Soul-Bound NFT metadata

3.2 Commitment Escrow (On-Chain Stakes)
User Story: As a user who wants real motivation to follow through on my financial goals, I want to optionally stake real money on my challenges so that I have genuine skin in the game.
Acceptance Criteria:

The system SHALL allow users to opt into staking ₹50 to ₹500 on any challenge (Hard challenges allow up to ₹1,000)
WHEN a user confirms a stake THEN the system SHALL lock the funds in an Algorand smart contract escrow immediately
The escrow contract SHALL automatically verify challenge completion using connected bank transaction data at the challenge deadline
WHEN a challenge is successfully completed THEN the escrow contract SHALL return the full stake plus a proportional share of the community yield pool to the user's wallet within 24 hours
WHEN a challenge is failed THEN the escrow contract SHALL forfeit the stake to the community yield pool with no manual intervention required
The system SHALL display the current community pool balance and estimated yield share to users before they confirm a stake
WHEN no bank data is available to verify completion THEN the system SHALL extend the verification window by 48 hours before defaulting to failure
The system SHALL never hold user stake funds in any VitalScore-controlled account; all funds SHALL remain in the smart contract

3.3 Streaks and Leagues
User Story: As a competitive person, I want to see how my financial behavior compares to others at my income level so that I feel motivated by fair competition rather than discouraged by comparing myself to high earners.
Acceptance Criteria:

The system SHALL assign each user to a league based on self-reported and verified income bracket (Tier 1: <₹25K/month, Tier 2: ₹25K–75K, Tier 3: ₹75K–2L, Tier 4: >₹2L)
The system SHALL maintain anonymous weekly leaderboards within each league based on VitalScore
The system SHALL award a "Vital Elite" badge to the top 10% of each league each week
The system SHALL track daily savings streaks and display a streak counter on the home screen
WHEN a user breaks a streak THEN the system SHALL send a push notification within 2 hours of the streak-breaking event
The system SHALL offer a streak freeze (maximum 2 per month) to protect streaks during confirmed emergencies

3.4 Vitality Forecast
User Story: As a user, I want to see where my score is heading based on my current spending trajectory so that I can take action before my score drops rather than reacting after.
Acceptance Criteria:

The system SHALL display a 30-day score projection on the home screen updated daily
The forecast SHALL use current spending velocity, trailing 14-day category trends, and scheduled recurring transactions
The forecast SHALL display at minimum two scenarios: "If current pattern continues" and "Optimized" (what score would be if discretionary spending reduced by 20%)
WHEN the forecast projects a score drop below the user's current band threshold THEN the system SHALL send a proactive alert at least 7 days before the projected drop date


4. Soul-Bound Vitality NFT
4.1 NFT Minting and Structure
User Story: As a user who has been financially disciplined for over a year, I want my financial behavior history to be permanently recorded and verifiable so that I can use it as a trust signal with lenders, landlords, or employers without sharing my actual transaction data.
Acceptance Criteria:

The system SHALL mint a Soul-Bound Token (SBT) on Algorand for each user at account creation
The SBT SHALL be updated with a new monthly snapshot on the 1st of each month
The SBT SHALL be non-transferable — transfer restrictions SHALL be enforced at the smart contract level
Each monthly snapshot SHALL include: VitalScore value, score band classification, challenge completion rate (%), streak length, squad participation flag, score trajectory tag (Improving/Stable/Declining), and a cryptographic hash of the scoring inputs (not raw data)
The SBT metadata SHALL be stored on IPFS with the IPFS hash recorded on-chain
The system SHALL never store raw transaction data, bank account details, or personal identifiers in the NFT metadata
WHEN a user's score improves for 6 consecutive months THEN the SBT SHALL receive an "Improving" trajectory badge
WHEN a user's score stays above 700 for 12 consecutive months THEN the SBT SHALL receive a "Vital Strong Sustained" badge

4.2 Third-Party Verification
User Story: As a lender or employer, I want to verify a user's financial behavior history without accessing their private financial data so that I can make informed trust decisions with user consent.
Acceptance Criteria:

The system SHALL provide a shareable verification link for each user's SBT that displays only the score history, trajectory, and badges — never raw data
WHEN a user shares their verification link THEN the system SHALL require the user to explicitly confirm consent before the link is activated
Verification links SHALL expire after 30 days by default, with user option to extend or revoke at any time
The system SHALL support zero-knowledge proof verification allowing users to prove specific claims (e.g., "score above 700 for 12 months") without revealing the full score history
Third-party verifiers SHALL be able to verify link authenticity via the Algorand blockchain without creating an account on VitalScore


5. Squad Savings Pools
5.1 Squad Formation and Management
User Story: As someone who saves better with social accountability, I want to form a savings group with friends and family where everyone contributes regularly and our shared pool earns yield so that saving feels like a team sport.
Acceptance Criteria:

The system SHALL allow any user to create a Squad with 3 to 8 members (including the creator)
Squad creators SHALL define: contribution amount (₹100–₹10,000/week), season duration (30, 60, or 90 days), and membership list
WHEN all invited members confirm participation THEN the Squad Season SHALL begin within 24 hours
The system SHALL support mixed membership — friends, family, or colleagues in the same Squad
WHEN a Squad is active THEN each member SHALL receive weekly contribution reminders 24 hours before the contribution deadline
WHEN a member misses a contribution THEN the system SHALL notify all Squad members (transparency by default, with opt-out option)

5.2 DeFi Yield Management
User Story: As a Squad member, I want our pooled savings to earn better returns than a savings account automatically so that participation in a Squad is financially beneficial beyond just accountability.
Acceptance Criteria:

The system SHALL automatically route Squad pool funds to the highest-yield audited DeFi protocol available each week (Aave, Compound, or Algorand-native pools)
Yield routing decisions SHALL be made by the system automatically — no manual selection required from users
The system SHALL only route funds to protocols that have passed a third-party security audit within the past 12 months
The system SHALL display the current APY being earned by each Squad on the Squad dashboard, updated daily
WHEN the system detects a protocol security event or APY drop below 2% annualized THEN it SHALL automatically re-route to the next best protocol within 6 hours
At season end, the system SHALL return 100% of principal to all Squad members regardless of individual challenge performance
The yield generated by the season pool SHALL be distributed to members weighted by each member's individual VitalScore improvement percentage over the season
The Squad treasury SHALL be managed by a multi-signature Algorand smart contract requiring no VitalScore company intervention for fund movement

5.3 Squad Leaderboard and Social Features
User Story: As a Squad member, I want to see how our Squad performs against other Squads so that our group feels motivated by collective achievement.
Acceptance Criteria:

The system SHALL maintain a public Squad leaderboard ranked by average member VitalScore improvement per season
Top 10% of Squads per season SHALL receive a "Champion Squad" badge and early access to new features for the following season
The system SHALL display each Squad member's contribution streak and challenge completion rate within the Squad view (visible only to Squad members)
WHEN a Squad completes a full 90-day season with zero member dropouts THEN the system SHALL award a "Full Season" achievement to all members


6. User Onboarding and Authentication
6.1 Zero-Friction Onboarding
User Story: As a new user, I want to sign up and see my first VitalScore within 5 minutes without needing to understand blockchain or create a crypto wallet manually so that the technology doesn't create a barrier to using the product.
Acceptance Criteria:

The system SHALL support sign-up via Google, Apple, and phone number (OTP)
WHEN a user signs up THEN the system SHALL automatically create a non-custodial Algorand wallet via Web3Auth without displaying seed phrases or wallet addresses to the user
The system SHALL connect to bank accounts and UPI via the Razorpay Payment Gateway using standard payment flows
WHEN bank data is successfully connected THEN the system SHALL pull the prior 90 days of transaction history and compute the first VitalScore within 3 minutes
The onboarding flow SHALL complete in 5 screens or fewer before the user sees their first VitalScore
WHEN a user does not wish to connect bank accounts THEN the system SHALL offer manual transaction entry as a fallback
The system SHALL request only the minimum permissions required: read-only transaction data access, no write access, no payment initiation

6.2 KYC and Compliance
User Story: As a regulatory authority, I want the platform to perform proper user identity verification so that the system cannot be used for financial fraud or money laundering.
Acceptance Criteria:

The system SHALL perform Aadhaar-based e-KYC for all Indian users before enabling challenge escrow or Squad Pool features
The system SHALL implement AML transaction monitoring via RegTech API integration
KYC data SHALL be stored in encrypted, India-resident data centers in compliance with RBI data localization requirements
The system SHALL maintain AML alert logs auditable by authorized regulatory bodies
WHEN a user fails KYC THEN the system SHALL allow score and tracking features but disable all financial transaction features (escrow, squad pools)


7. Notifications and Engagement
7.1 Push Notification System
User Story: As a user, I want timely, relevant notifications that prompt action at the right moment so that I stay engaged with my financial health without being overwhelmed by irrelevant alerts.
Acceptance Criteria:

The system SHALL send a morning daily digest notification summarizing the previous day's score change and one actionable insight
WHEN a transaction pushes the user's discretionary spending above 80% of their monthly discretionary budget THEN the system SHALL send a real-time overspend alert
WHEN a 30-day forecast projects a score band drop THEN the system SHALL send a proactive warning at 7 days and again at 3 days before the projected threshold crossing
WHEN a streak is at risk of breaking (no savings activity in 22+ hours) THEN the system SHALL send a streak rescue notification
WHEN a challenge deadline is within 24 hours and incomplete THEN the system SHALL send a challenge urgency notification
The system SHALL allow users to configure notification frequency preferences: Essential only, Standard, or Full
The system SHALL never send more than 5 notifications in a single calendar day to any user


8. Data Privacy and Security
8.1 Data Protection
User Story: As a privacy-conscious user, I want full control over my data and confidence that my financial information is protected so that I can trust the platform with my most sensitive information.
Acceptance Criteria:

All user data SHALL be encrypted at rest using AES-256 and in transit using TLS 1.3
Personal identifiers SHALL be tokenized at the ingestion layer and SHALL NOT propagate to scoring, gamification, or blockchain services in raw form
The system SHALL provide a data export function allowing users to download all their data in JSON format within 48 hours of request
The system SHALL provide a data deletion function that permanently removes all user data within 30 days of account deletion request
Bank connections SHALL be read-only — the system SHALL request no write access or payment initiation permissions
The system SHALL never sell, license, or share individual user data with third parties without explicit user consent
Anonymized and aggregated insights (10,000+ user minimum aggregation) MAY be licensed to financial institutions with user opt-in consent
The system SHALL comply with India's DPDP Act 2023, RBI Account Aggregator Framework, and GDPR for international users


9. B2B Corporate Wellness
9.1 Employer Dashboard
User Story: As an HR manager, I want to offer VitalScore as a financial wellness benefit to my employees without accessing any individual employee's financial data so that I can improve workforce wellbeing while respecting privacy.
Acceptance Criteria:

The system SHALL provide a B2B employer dashboard showing aggregate, anonymized workforce financial health metrics (average score band distribution, challenge completion rates, squad participation)
The employer dashboard SHALL NEVER display any individual employee's score, transaction data, or financial information
The system SHALL support company-wide Squad seasons that HR teams can configure and launch
Employers SHALL be able to customize challenge themes (e.g., "Emergency Fund Month" or "Debt Reduction Season")
The system SHALL provide monthly aggregate wellness reports in PDF format for HR teams
Employee participation in the employer program SHALL be fully voluntary and opted-in by each individual employee


10. Performance and Reliability
Acceptance Criteria:

The system SHALL maintain 99.9% uptime for core scoring and home screen features
Score updates SHALL display on the home screen within 60 seconds of a new transaction being recorded
The system SHALL handle a minimum of 1 million concurrent users without performance degradation
API response time for the home screen data load SHALL be under 500ms at the 95th percentile
The system SHALL queue blockchain transactions during high-load periods and process them within 15 minutes without user-facing impact
The system SHALL gracefully degrade: if the blockchain layer is unavailable, core scoring and tracking SHALL continue to function using off-chain data
The system SHALL perform automated daily backups of all user data with point-in-time recovery capability to within 1 hour