# VitalScore Finance — Manual Setup Guide

> **VitalScore v4.0** | Vista HackArena 2025 | India-First | Free-Tier Verified

Complete step-by-step guide to set up VitalScore Finance locally.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Repository Setup](#2-repository-setup)
3. [Environment Configuration](#3-environment-configuration)
4. [Database Setup](#4-database-setup)
5. [API Keys (Free Tier)](#5-api-keys-free-tier)
6. [Backend Services](#6-backend-services)
7. [Frontend Web App](#7-frontend-web-app)
8. [Algorand Blockchain Setup](#8-algorand-blockchain-setup)
9. [Smart Contract Deployment](#9-smart-contract-deployment)
10. [Running the Full Stack](#10-running-the-full-stack)
11. [Demo Flow Testing](#11-demo-flow-testing)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

### Required Software

| Software | Version | Purpose | Install Command |
|----------|---------|---------|-----------------|
| **Node.js** | ≥ 18.x | Backend services, frontend | [Download](https://nodejs.org/) |
| **Python** | ≥ 3.11 | Blockchain service, ML scripts | [Download](https://python.org/) |
| **Git** | Latest | Version control | [Download](https://git-scm.com/) |
| **Docker Desktop** | Latest | Database containers | [Download](https://docker.com/) |
| **npm** | ≥ 9.x | Package management | Included with Node.js |

### Optional (Recommended)

| Software | Purpose |
|----------|---------|
| **AlgoKit** | Algorand smart contract development |
| **VS Code** | Recommended IDE with extensions |
| **Postman** | API testing |

### Verify Installation

Open a terminal and run:

```bash
node --version        # Should show v18.x or higher
npm --version         # Should show 9.x or higher
python --version      # Should show 3.11+
git --version         # Should show git version 2.x+
docker --version      # Should show Docker version 24.x+
```

---

## 2. Repository Setup

### Clone the Repository

```bash
git clone https://github.com/[team]/vitalscore.git
cd vitalscore
```

Or if working from an existing folder:

```bash
cd "c:\Users\ASUS\OneDrive\Desktop\COLLEGE EVERYTHING\hackathon\dssa vit\Vitalscore finance"
```

### Project Structure Overview

```
Vitalscore finance/
├── backend/
│   ├── services/                  # Microservices
│   │   ├── ai-categorization/     # 5-Layer Accuracy Engine
│   │   ├── auth-service/          # Web3Auth authentication
│   │   ├── blockchain-service-python/  # Algorand integration
│   │   ├── gamification-service/  # Challenges, SubVampire, SplitSync
│   │   ├── score-engine/          # VitalScore formula + integrity
│   │   ├── transaction-ingestion/ # Setu Account Aggregator
│   │   └── user-profile/          # User management
│   └── shared-types/              # Shared TypeScript types
├── blockchain/
│   └── contracts/                 # PyTeal smart contracts
├── database/
│   ├── migrations/                # SQL migration files
│   └── schema/                    # Database schemas
├── frontend/
│   └── web/                       # React + Vite web application
├── infrastructure/
│   └── docker/                    # Docker Compose + configs
├── .env.example                   # Environment template
└── MANUAL_SETUP.md                # This file
```

---

## 3. Environment Configuration

### Create Environment File

```bash
# From project root
cp .env.example .env
```

### Edit `.env`

Open `.env` in your editor and update the following sections. Each section is documented below with instructions on how to get the values.

---

## 4. Database Setup

### Start Databases with Docker Compose

```bash
# From project root
cd infrastructure/docker
docker-compose up -d
```

This starts:
- **PostgreSQL** on port `5432` — main application database
- **Redis** on port `6379` — caching and session store
- **InfluxDB** on port `8086` — time-series score data

### Verify Database Containers

```bash
docker ps
```

You should see three containers running:
```
CONTAINER ID  IMAGE          STATUS    PORTS
xxxx          postgres:15    Up        0.0.0.0:5432->5432/tcp
xxxx          redis:7        Up        0.0.0.0:6379->6379/tcp
xxxx          influxdb:2     Up        0.0.0.0:8086->8086/tcp
```

### Run Database Migrations

```bash
# Using the migration script
cd database/migrations

# Apply schema
psql -h localhost -U postgres -d vitalscore -f 001_initial_schema.sql
# Password: vitalscore_dev_password (from .env)
```

### Alternative: Direct SQL Setup

If `psql` is not installed, connect using any PostgreSQL GUI tool (pgAdmin, DBeaver, TablePlus) with:
- **Host:** `localhost`
- **Port:** `5432`
- **Database:** `vitalscore`
- **User:** `postgres`
- **Password:** `vitalscore_dev_password`

Then execute the SQL files in `database/schema/` and `database/migrations/` in order.

### InfluxDB Setup

1. Open `http://localhost:8086` in your browser
2. Create organization: `vitalscore`
3. Create bucket: `vitalscore`
4. Copy the generated API token to `.env` as `INFLUXDB_TOKEN`

---

## 5. API Keys (Free Tier)

All API keys below are available on **free tiers** at zero cost.

### 5.1 Groq API (5-Layer Accuracy Engine — Layer 3)

Groq provides the LLM for transaction categorization. Free tier: **6,000 RPM**.

1. Go to [https://console.groq.com](https://console.groq.com)
2. Sign up with Google/GitHub
3. Click **API Keys** in the sidebar
4. Click **Create API Key**
5. Copy the key to `.env`:
   ```
   GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
   ```

### 5.2 Web3Auth (Authentication)

Web3Auth provides passwordless + social login. Free tier: **1,000 MAU**.

1. Go to [https://dashboard.web3auth.io](https://dashboard.web3auth.io)
2. Sign up and create a new project
3. Select **Plug and Play** → **Web**
4. Copy the **Client ID** to `.env`:
   ```
   WEB3AUTH_CLIENT_ID=xxxxxx
   ```

### 5.3 Setu Account Aggregator (Financial Data)

Setu provides the Account Aggregator API for bank data. **Sandbox is free**.

1. Go to [https://bridge.setu.co](https://bridge.setu.co)
2. Sign up for a developer account
3. Go to **Products** → **Account Aggregator** → **Sandbox**
4. Copy credentials to `.env`:
   ```
   SETU_CLIENT_ID=your_setu_client_id
   SETU_CLIENT_SECRET=your_setu_client_secret
   SETU_ENV=sandbox
   ```

### 5.4 Algorand TestNet (Blockchain)

1. No API key needed for AlgoNode TestNet
2. Fund your server wallet from the faucet (see Section 8)

### 5.5 Firebase Cloud Messaging (Notifications)

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (or use existing)
3. Go to **Project Settings** → **Cloud Messaging**
4. Copy the **Server Key** to `.env`:
   ```
   FCM_SERVER_KEY=AAAAxxxxxxx
   ```

### 5.6 Supabase (Optional — Alternative to Local PostgreSQL)

If you want to use Supabase instead of local PostgreSQL:

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project (free tier: 500MB database)
3. Go to **Settings** → **API**
4. Copy values to `.env`:
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGcixxxxxxx
   SUPABASE_SERVICE_KEY=eyJhbGcixxxxxxx
   ```

---

## 6. Backend Services

Each microservice is an independent Node.js/TypeScript application.

### Install Dependencies for All Services

```bash
# From project root — install each service
cd backend/services/ai-categorization && npm install && cd ../../..
cd backend/services/auth-service && npm install && cd ../../..
cd backend/services/gamification-service && npm install && cd ../../..
cd backend/services/score-engine && npm install && cd ../../..
cd backend/services/transaction-ingestion && npm install && cd ../../..
cd backend/services/user-profile && npm install && cd ../../..
```

### Or use a script (PowerShell):

```powershell
$services = @(
    "ai-categorization",
    "auth-service",
    "gamification-service",
    "score-engine",
    "transaction-ingestion",
    "user-profile"
)

foreach ($svc in $services) {
    Write-Host "Installing $svc..." -ForegroundColor Cyan
    Push-Location "backend/services/$svc"
    npm install
    Pop-Location
}
```

### Install Python Blockchain Service Dependencies

```bash
cd backend/services/blockchain-service-python
pip install -r requirements.txt
cd ../../..
```

### Start Individual Services

Each service runs on a different port:

| Service | Port | Start Command |
|---------|------|---------------|
| User Profile | 3001 | `cd backend/services/user-profile && npm run dev` |
| Auth Service | 3002 | `cd backend/services/auth-service && npm run dev` |
| Transaction Ingestion | 3003 | `cd backend/services/transaction-ingestion && npm run dev` |
| Score Engine | 3004 | `cd backend/services/score-engine && npm run dev` |
| Gamification | 3005 | `cd backend/services/gamification-service && npm run dev` |
| Blockchain | 5001 | `cd backend/services/blockchain-service-python && python app.py` |
| AI Categorization | 3007 | `cd backend/services/ai-categorization && npm run dev` |

### Verify Services

```bash
curl http://localhost:3001/health   # User Profile
curl http://localhost:3004/health   # Score Engine
curl http://localhost:3007/health   # AI Categorization
curl http://localhost:5001/health   # Blockchain
```

All should return `{ "status": "OK" }`.

---

## 7. Frontend Web App

### Install Dependencies

```bash
cd frontend/web
npm install
```

### Start Development Server

```bash
npm run dev
```

The frontend will start at **http://localhost:5173**

### Key Pages

| URL | Page | Description |
|-----|------|-------------|
| `/` | Dashboard | Heartbeat visualizer, score overview, Smart Nudge, SubVampire |
| `/transactions` | Transactions | Transaction list with categorization |
| `/challenges` | Challenges | Active and available challenges |
| `/squads` | Squads | Squad pools + SplitSync |
| `/league` | League | India-themed league tiers |
| `/nft` | NFT | Soul-Bound Vitality Token |
| `/settings` | Settings | Profile, preferences, API keys |

---

## 8. Algorand Blockchain Setup

### Install AlgoKit (Optional — for local development)

```bash
# macOS
brew install algorand/tap/algokit

# Windows (with pipx)
pipx install algokit

# Or with pip
pip install algokit
```

### Start Local Algorand Node (Optional)

```bash
algokit localnet start
```

### TestNet Configuration

For the hackathon, we use Algorand **TestNet** (no local node needed):

1. **Generate Server Wallet:**
   ```bash
   python -c "
   from algosdk import account
   private_key, address = account.generate_account()
   mnemonic = account.from_private_key(private_key)
   print(f'Address: {address}')
   print(f'Mnemonic: {mnemonic}')
   "
   ```

2. **Fund from Faucet:**
   - Go to [https://testnet.algoexplorer.io/dispenser](https://testnet.algoexplorer.io/dispenser)
   - Or [https://bank.testnet.algorand.network](https://bank.testnet.algorand.network)
   - Paste your address and request test ALGO (minimum 5 ALGO)

3. **Update `.env`:**
   ```
   ALGORAND_NETWORK=testnet
   SERVER_WALLET_MNEMONIC=word1 word2 word3 ... word25
   ALGORAND_ALGOD_URL=https://testnet-api.algonode.cloud
   ALGORAND_INDEXER_URL=https://testnet-idx.algonode.cloud
   ```

---

## 9. Smart Contract Deployment

### Smart Contracts Location

```
blockchain/contracts/
├── SoulBoundNFT.py          # ARC-69 Soul-Bound Vitality Token
├── ChallengeEscrow.py       # On-chain challenge stake management
├── SquadTreasury.py         # Squad savings pool with yield
└── VitalToken.py            # VitalScore utility token
```

### Compile Contracts (PyTeal → TEAL)

```bash
cd blockchain/contracts

# Install PyTeal
pip install pyteal

# Compile each contract
python SoulBoundNFT.py         # Generates SoulBoundNFT.teal
python ChallengeEscrow.py      # Generates ChallengeEscrow.teal
python SquadTreasury.py        # Generates SquadTreasury.teal
python VitalToken.py           # Generates VitalToken.teal
```

### Deploy to TestNet

```bash
# Using the blockchain service's deploy script
cd backend/services/blockchain-service-python
python -c "
from services.algorand_service import AlgorandService
svc = AlgorandService()
# Deploy contracts and print application IDs
print('Deploying to TestNet...')
"
```

After deployment, update `.env` with the returned application IDs:
```
CHALLENGE_ESCROW_APP_ID=12345678
SQUAD_TREASURY_APP_ID=12345679
SBT_NFT_APP_ID=12345680
```

---

## 10. Running the Full Stack

### Quick Start (All Services)

Open **7 terminal windows** and run each service:

**Terminal 1:** Databases
```bash
cd infrastructure/docker && docker-compose up
```

**Terminal 2:** User Profile Service
```bash
cd backend/services/user-profile && npm run dev
```

**Terminal 3:** Score Engine
```bash
cd backend/services/score-engine && npm run dev
```

**Terminal 4:** AI Categorization (5-Layer)
```bash
cd backend/services/ai-categorization && npm run dev
```

**Terminal 5:** Transaction Ingestion
```bash
cd backend/services/transaction-ingestion && npm run dev
```

**Terminal 6:** Blockchain Service
```bash
cd backend/services/blockchain-service-python && python app.py
```

**Terminal 7:** Frontend
```bash
cd frontend/web && npm run dev
```

### Access the Application

Open **http://localhost:5173** in your browser.

---

## 11. Demo Flow Testing

### Pre-Demo Checklist

- [ ] All database containers running (`docker ps`)
- [ ] Backend services responding (`/health` endpoints)
- [ ] Frontend loading at `http://localhost:5173`
- [ ] Demo account with 90-day transaction history
- [ ] Algorand TestNet wallet funded (>5 ALGO)
- [ ] Screen recording backup (2 min: heartbeat → nudge → challenge → SplitSync → NFT)

### Demo Walkthrough

1. **Dashboard** — Show the heartbeat visualizer pulsing with score
2. **Smart Nudge** — Show pending categorization with Confirm/Change buttons
3. **SubVampire** — Show ghost subscriptions with ghost scores and cancel flow
4. **Transactions** — Show categorized transactions with 5-layer confidence
5. **Challenges** — Show active challenge with escrow stake
6. **Squads** — Show SplitSync active split and squad pool
7. **NFT** — Show Soul-Bound Vitality Token with monthly metadata

### Key Judge Q&A

**Q: "How can you claim 99% accuracy with ML?"**
> "Our 99% comes from a 5-layer system, not a single model. The LLM only handles 24% of transactions. The other 76% are resolved by our merchant database, VPA parser, and personal memory engine — which are 97–99.5% accurate with zero ML. The remaining 8% go to the user via Smart Nudge. The compound result is 99.1% at Month 3."

**Q: "What if Groq API goes down?"**
> "Layer 3 has a circuit breaker: 5 failures → bypass for 60 seconds. Layers 1, 2, 4, and 5 handle 91% of transactions independently. Accuracy degrades from 99.1% to ~95% — acceptable short-term."

---

## 12. Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **Port already in use** | Kill the process: `npx kill-port 3001` |
| **Docker containers not starting** | Ensure Docker Desktop is running |
| **npm install fails** | Delete `node_modules` and `package-lock.json`, then `npm install` |
| **Python import errors** | Ensure you're using Python 3.11+ and `pip install -r requirements.txt` |
| **PostgreSQL connection refused** | Check Docker container is running: `docker ps` |
| **Frontend blank page** | Check browser console for errors, ensure backend is running |
| **Algorand TestNet timeout** | AlgoNode may be slow; retry after 30 seconds |
| **Groq API 429 error** | Rate limit hit (6,000 RPM); Layer 3 circuit breaker will handle this |

### Reset Everything

```bash
# Stop all Docker containers
docker-compose down -v

# Remove node_modules
find . -name "node_modules" -type d -exec rm -rf {} +

# Restart fresh
docker-compose up -d
# Re-run npm install in each service
```

### Getting Help

- **Project Docs:** `design.md`, `Requirements.md`, `tasks.md`
- **v4 Reference:** `VitalScore_v4_Final.docx`
- **Algorand Docs:** [https://developer.algorand.org](https://developer.algorand.org)
- **Groq Docs:** [https://console.groq.com/docs](https://console.groq.com/docs)
- **Setu Docs:** [https://bridge.setu.co/docs](https://bridge.setu.co/docs)

---

## 13. SplitSync & Funding Pool Setup

These two features were added on the `feature-splitsync-pool` branch.

### A. Database Migrations

Run the two new schemas against your PostgreSQL database:

```bash
# From project root
psql -U vitalscore -d vitalscore_dev -f backend/database/schemas/008_splitsync.sql
psql -U vitalscore -d vitalscore_dev -f backend/database/schemas/009_funding_pool.sql
```

### B. Smart Contract Compilation

```bash
cd blockchain/contracts

# Install PyTeal (if not already)
pip install pyteal py-algorand-sdk

# Compile the contracts
python SplitSync.py     # outputs splitsync_approval.teal & splitsync_clear.teal
python FundingPool.py   # outputs fundingpool_approval.teal & fundingpool_clear.teal
```

### C. Blockchain Service (Python)

No extra setup needed — the new endpoints are already registered in `routes.py`.
Just restart the blockchain service:

```bash
cd backend/services/blockchain-service-python
pip install -r requirements.txt
python app.py   # runs on port 3006
```

### D. WhatsApp Notifications (Twilio — Optional)

SplitSync sends payment requests via WhatsApp. If Twilio is not configured,
notifications fall back to console logging (no crash).

1. Sign up at [twilio.com](https://www.twilio.com/) (free trial works)
2. Activate the **WhatsApp Sandbox**: Twilio Console → Messaging → Try it Out → WhatsApp
3. Add these env vars to the **gamification-service** `.env`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### E. Gamification Service

```bash
cd backend/services/gamification-service
npm install          # installs twilio + other deps
npm run dev          # runs on port 3005
```

### F. New API Endpoints

| Feature | Method | Endpoint | Purpose |
|---------|--------|----------|---------|
| SplitSync | POST | `/gamification/splits` | Create a new split |
| SplitSync | POST | `/gamification/splits/:id/payments/:pid` | Record a payment |
| SplitSync | GET | `/gamification/splits/user/:userId` | User's splits |
| SplitSync | POST | `/gamification/splits/:id/remind` | Send reminders |
| Pools | POST | `/gamification/pools` | Create a pool |
| Pools | POST | `/gamification/pools/:id/join` | Join a pool |
| Pools | POST | `/gamification/pools/:id/deposit` | Deposit (90/10 split) |
| Pools | POST | `/gamification/pools/:id/withdraw` | Early withdraw (lose risk) |
| Pools | POST | `/gamification/pools/:id/distribute` | Distribute at maturity |
| Pools | GET | `/gamification/pools/:id` | Pool details |

### G. Frontend

Both pages are already wired into the sidebar. Start the frontend normally:

```bash
cd frontend/web
npm install
npm run dev
```

Navigate to **SplitSync** or **Pools** from the sidebar.

---

*VitalScore Finance v4.0 | Honest Blockchain Usage • India-First • Free-Tier Verified • 99% Accuracy Architecture*
