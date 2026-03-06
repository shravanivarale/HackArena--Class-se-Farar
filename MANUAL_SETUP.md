# 🚀 VitalScore Finance — Complete Setup Guide (Beginner Friendly)

> This guide will walk you through EVERY step to set up VitalScore Finance on your computer.
> No step is skipped. If you're new to this, just follow step by step from top to bottom.

---

## 📋 Table of Contents

1. [What You Need to Install First](#step-1-install-required-software)
2. [Open the Project](#step-2-open-the-project)
3. [Understanding the Project Structure](#step-3-understanding-the-project-structure)
4. [Set Up Environment Variables](#step-4-set-up-environment-variables)
5. [Get Free API Keys](#step-5-get-free-api-keys)
6. [Set Up Databases (Docker)](#step-6-set-up-databases-with-docker)
7. [Set Up Databases (Without Docker — Alternative)](#step-7-set-up-databases-without-docker)
8. [Install Backend Dependencies](#step-8-install-backend-dependencies)
9. [Install Python Dependencies (Blockchain)](#step-9-install-python-dependencies-blockchain)
10. [Install Frontend Dependencies](#step-10-install-frontend-dependencies)
11. [Set Up Algorand Blockchain (TestNet)](#step-11-set-up-algorand-blockchain-testnet)
12. [Compile Smart Contracts](#step-12-compile-smart-contracts)
13. [Start the Backend Services](#step-13-start-the-backend-services)
14. [Start the Frontend](#step-14-start-the-frontend)
15. [Run the Full Project Together](#step-15-run-the-full-project-together)
16. [Test That Everything Works](#step-16-test-that-everything-works)
17. [Demo Walkthrough](#step-17-demo-walkthrough)
18. [Common Problems and Fixes](#step-18-common-problems-and-fixes)

---

## Step 1: Install Required Software

You need to install these programs on your computer first. All are free.

### 1.1 Install Node.js

Node.js runs all the backend services and the frontend.

1. Go to **https://nodejs.org/**
2. Click the **LTS** (Long Term Support) button — this downloads the installer
3. Run the downloaded installer
4. Click **Next** through all the screens, keep defaults
5. At the end, make sure **"Add to PATH"** is checked
6. Click **Install** and wait for it to finish
7. **Restart your terminal** (close and reopen PowerShell)

**Verify it worked:**
```powershell
node --version
```
You should see something like `v20.11.0` or higher. If you see an error, restart your computer and try again.

### 1.2 Install Python

Python is needed for the blockchain service and smart contracts.

1. Go to **https://www.python.org/downloads/**
2. Click **Download Python 3.12** (or latest 3.x)
3. Run the installer
4. ⚠️ **IMPORTANT:** Check the box that says **"Add Python to PATH"** at the bottom of the installer
5. Click **Install Now**
6. **Restart your terminal**

**Verify it worked:**
```powershell
python --version
```
You should see `Python 3.11.x` or `Python 3.12.x`.

### 1.3 Install Git

Git is for version control.

1. Go to **https://git-scm.com/downloads**
2. Download for Windows
3. Run the installer — keep all defaults, click **Next** through everything
4. **Restart your terminal**

**Verify it worked:**
```powershell
git --version
```

### 1.4 Install Docker Desktop (Optional — for databases)

Docker runs PostgreSQL, Redis, and InfluxDB in containers. If you prefer to install databases manually, skip to Step 7.

1. Go to **https://www.docker.com/products/docker-desktop/**
2. Click **Download for Windows**
3. Run the installer
4. After installation, **restart your computer**
5. Open Docker Desktop from your Start menu
6. Wait for it to say **"Docker Desktop is running"** (green icon in system tray)

**Verify it worked:**
```powershell
docker --version
```

> ⚠️ If Docker gives errors about WSL2, follow the on-screen instructions to install WSL2, then restart.

---

## Step 2: Open the Project

Open PowerShell (search for "PowerShell" in Start menu) and navigate to the project:

```powershell
cd "c:\Users\ASUS\OneDrive\Desktop\COLLEGE EVERYTHING\hackathon\dssa vit\Vitalscore finance"
```

Or if you cloned from GitHub:
```powershell
git clone https://github.com/[your-team]/vitalscore.git
cd vitalscore
```

**Verify you're in the right place:**
```powershell
dir
```
You should see files like `docker-compose.yml`, `README.md`, `.env`, and folders like `backend/`, `frontend/`, `blockchain/`.

---

## Step 3: Understanding the Project Structure

Here's what each folder does:

```
Vitalscore finance/
│
├── backend/                          ← All the server-side code
│   ├── services/                     ← Each feature is a separate service
│   │   ├── ai-categorization/        ← 5-Layer AI that categorizes your transactions
│   │   ├── auth-service/             ← Login system (Web3Auth)
│   │   ├── blockchain-service-python/← Algorand blockchain integration
│   │   ├── gamification-service/     ← Challenges, SubVampire, SplitSync
│   │   ├── score-engine/             ← Calculates the VitalScore (0-1000)
│   │   ├── transaction-ingestion/    ← Receives bank transactions
│   │   └── user-profile/             ← User accounts and profiles
│   └── database/                     ← Database tables and migrations
│       ├── schemas/                  ← SQL files that create the tables
│       └── migrations/               ← SQL files that update the tables
│
├── blockchain/
│   └── contracts/                    ← Algorand smart contracts (PyTeal)
│
├── frontend/
│   └── web/                          ← React website (what users see)
│
├── docker-compose.yml                ← Starts databases with one command
├── .env                              ← Your secret API keys (never share this!)
├── .env.example                      ← Template for .env
└── MANUAL_SETUP.md                   ← This file!
```

---

## Step 4: Set Up Environment Variables

The `.env` file stores all your secret keys and settings. A copy should already exist.

**Check if `.env` exists:**
```powershell
Test-Path .env
```

If it says `False`, create one:
```powershell
Copy-Item .env.example .env
```

If it says `True`, your `.env` already exists — you'll update it in the next step.

---

## Step 5: Get Free API Keys

Open the `.env` file in your text editor (VS Code, Notepad, etc.). We'll fill in the important API keys. **All of these are free.**

### 5.1 Groq API Key (Most Important — Powers AI Classification)

This makes the 5-Layer Accuracy Engine work. Without it, Layer 3 (LLM) is skipped, but Layers 1, 2, 4, 5 still work.

1. Open **https://console.groq.com** in your browser
2. Click **Sign Up** (you can use Google, GitHub, or email)
3. After signing in, click **"API Keys"** in the left sidebar
4. Click **"Create API Key"**
5. Give it a name like `vitalscore-dev`
6. Click **Submit**
7. **Copy the key** (it starts with `gsk_`)
8. Open your `.env` file and find this line:
   ```
   GROQ_API_KEY=your_groq_api_key
   ```
9. Replace `your_groq_api_key` with the key you copied:
   ```
   GROQ_API_KEY=gsk_abc123xyz789...
   ```
10. **Save the file**

### 5.2 Web3Auth Client ID (Login System)

1. Open **https://dashboard.web3auth.io** in your browser
2. Sign up (Google or email)
3. Click **"Create a New Project"**
4. Name: `VitalScore Finance`
5. Product: Select **"Plug and Play"**
6. Platform: Select **"Web"**
7. Click **"Create"**
8. Copy the **Client ID** shown on the dashboard
9. Open `.env` and find:
   ```
   WEB3AUTH_CLIENT_ID=your_web3auth_client_id
   ```
10. Replace with your Client ID and save

### 5.3 Razorpay Payment Gateway (Payments & UPI)

Razorpay handles all payments — split bill collections, UPI, cards, netbanking.

1. Open **https://dashboard.razorpay.com/** in your browser
2. Click **"Sign Up"** → create an account (free, no documents needed for Test Mode)
3. After login, you land on the Dashboard. Make sure **"Test Mode"** toggle is ON (top-left, orange banner)
4. Go to **Settings** → **API Keys** → click **"Generate Test Key"**
5. You will see:
   - **Key Id** (starts with `rzp_test_`)
   - **Key Secret** (shown only once — copy it immediately!)
6. Open `.env` and find:
   ```
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```
7. Paste your Key Id and Key Secret, then save

> 💡 If you can't sign up for Razorpay right now, that's OK. The app will still work — it will use mock payment data and log payment link URLs to the console instead of creating real ones.

### 5.4 Firebase Cloud Messaging (Push Notifications — Optional)

Only needed if you want push notifications to work.

1. Open **https://console.firebase.google.com**
2. Click **"Add Project"** → name it `VitalScore`
3. After creation, click the ⚙️ gear icon → **Project Settings**
4. Go to **"Cloud Messaging"** tab
5. Copy the **Server Key**
6. Open `.env`, find `FCM_SERVER_KEY=`, and paste it

> 💡 This is optional. The app works without notifications.

### 5.5 Summary — Which Keys Are Needed?

| Key | Required? | What Breaks Without It? |
|-----|-----------|------------------------|
| **GROQ_API_KEY** | Recommended | Layer 3 LLM is skipped (Layers 1,2,4,5 still work) |
| **WEB3AUTH_CLIENT_ID** | Optional | Login uses placeholder mode |
| **RAZORPAY_KEY_ID/SECRET** | Optional | Uses mock payment links |
| **FCM_SERVER_KEY** | Optional | No push notifications |
| Everything else | No change needed | Default values work for local dev |

---

## Step 6: Set Up Databases with Docker

> ⚠️ You must have Docker Desktop **running** before this step.
> If you don't have Docker, skip to **Step 7** for manual database setup.

### 6.1 Start Docker Desktop

1. Open **Docker Desktop** from your Start menu
2. Wait until the bottom-left corner shows a **green** icon and says "Engine running"
3. This might take 1-2 minutes

### 6.2 Start the Databases

Open PowerShell in the project folder:

```powershell
cd "c:\Users\ASUS\OneDrive\Desktop\COLLEGE EVERYTHING\hackathon\dssa vit\Vitalscore finance"
docker-compose up -d
```

> ⚠️ Note: the `docker-compose.yml` is in the **project root folder**, NOT in `infrastructure/docker/`.

This command will:
- Download PostgreSQL, Redis, InfluxDB, and other images (first time only — may take 5-10 minutes)
- Start all database containers in the background

### 6.3 Verify Databases Are Running

```powershell
docker ps
```

You should see containers like:
```
CONTAINER ID   IMAGE                    STATUS    PORTS
xxxx           postgres:15-alpine       Up        0.0.0.0:5432->5432/tcp
xxxx           redis:7-alpine           Up        0.0.0.0:6379->6379/tcp
xxxx           influxdb:2.7-alpine      Up        0.0.0.0:8086->8086/tcp
xxxx           localstack/localstack    Up        0.0.0.0:4566->4566/tcp
```

If a container failed, check its logs:
```powershell
docker logs vitalscore-postgres
```

### 6.4 Load Database Schema

The database tables are automatically created by the init scripts mounted from `backend/database/schemas/`. No manual SQL needed.

To verify the database was created:
```powershell
docker exec vitalscore-postgres psql -U postgres -d vitalscore -c "\dt"
```

This should list the tables. If you see tables, the database is ready!

### 6.5 Access Database Management Tools (Optional)

| Tool | URL | Login |
|------|-----|-------|
| **PgAdmin** (PostgreSQL GUI) | http://localhost:5050 | Email: `admin@vitalscore.local`, Password: `admin` |
| **Redis Commander** | http://localhost:8081 | No login needed |
| **InfluxDB UI** | http://localhost:8086 | User: `admin`, Password: `vitalscore_influx_password` |

---


## Step 7: Set Up Databases Without Docker

> Only follow this section if you **cannot use Docker**.

### 7.1 Install PostgreSQL Manually

1. Download from **https://www.postgresql.org/download/windows/**
2. Run the installer
3. Set password to: `vitalscore_dev_password`
4. Keep default port: `5432`
5. After install, open **pgAdmin** (installed with PostgreSQL)
6. Right-click **Databases** → **Create** → **Database**
7. Name: `vitalscore`
8. Click **Save**

### 7.2 Load the Schema

In pgAdmin, click on the `vitalscore` database, then open **Query Tool** and paste the contents of each file in `backend/database/schemas/` one at a time. Execute each one.

### 7.3 Install Redis Manually

1. Download from **https://github.com/microsoftarchive/redis/releases** (Windows port)
2. Run the installer
3. The Redis server will start automatically on port `6379`

### 7.4 InfluxDB (Optional)

InfluxDB is used for time-series score tracking. You can skip this for basic testing.

If you want it:
1. Download from **https://portal.influxdata.com/downloads/**
2. Install and start the service
3. Open **http://localhost:8086** and set up the organization as `vitalscore`

---

## Step 8: Install Backend Dependencies

Each backend service needs its own dependencies installed. Run this command from the **project root folder**:

```powershell
cd "c:\Users\ASUS\OneDrive\Desktop\COLLEGE EVERYTHING\hackathon\dssa vit\Vitalscore finance"
```

Then install dependencies for each service (one by one):

```powershell
# AI Categorization Service (5-Layer Accuracy Engine)
cd backend\services\ai-categorization
npm install
cd ..\..\..

# Authentication Service
cd backend\services\auth-service
npm install
cd ..\..\..

# Gamification Service (SubVampire, SplitSync, Challenges)
cd backend\services\gamification-service
npm install
cd ..\..\..

# Score Engine (VitalScore formula)
cd backend\services\score-engine
npm install
cd ..\..\..

# Transaction Ingestion (Bank transactions)
cd backend\services\transaction-ingestion
npm install
cd ..\..\..

# User Profile Service
cd backend\services\user-profile
npm install
cd ..\..\..
```

> 💡 **Each `npm install` might take 1-2 minutes.** That's normal.

**Or do it all at once with this PowerShell script:**

```powershell
$root = "c:\Users\ASUS\OneDrive\Desktop\COLLEGE EVERYTHING\hackathon\dssa vit\Vitalscore finance"
$services = @("ai-categorization","auth-service","gamification-service","score-engine","transaction-ingestion","user-profile")

foreach ($svc in $services) {
    Write-Host "Installing $svc..." -ForegroundColor Cyan
    Set-Location "$root\backend\services\$svc"
    npm install
}
Set-Location $root
Write-Host "All services installed!" -ForegroundColor Green
```

**Verify it worked:** Check that `node_modules` folder exists inside each service:
```powershell
Get-ChildItem backend\services -Directory | ForEach-Object { Write-Host "$($_.Name): $(Test-Path (Join-Path $_.FullName 'node_modules'))" }
```
All should say `True`.

---

## Step 9: Install Python Dependencies (Blockchain)

The blockchain service runs on Python (Flask). Install its dependencies:

```powershell
cd "c:\Users\ASUS\OneDrive\Desktop\COLLEGE EVERYTHING\hackathon\dssa vit\Vitalscore finance"
cd backend\services\blockchain-service-python
pip install -r requirements.txt
cd ..\..\..
```

Also install smart contract dependencies:

```powershell
cd blockchain\contracts
pip install -r requirements.txt
cd ..\..
```

> ⚠️ If `pip` doesn't work, try `python -m pip install -r requirements.txt`

---

## Step 10: Install Frontend Dependencies

```powershell
cd "c:\Users\ASUS\OneDrive\Desktop\COLLEGE EVERYTHING\hackathon\dssa vit\Vitalscore finance"
cd frontend\web
npm install
cd ..\..
```

This installs React, Vite, Recharts, Lucide icons, and other frontend packages.

**Verify:** Check that `frontend\web\node_modules` exists:
```powershell
Test-Path frontend\web\node_modules
```
Should say `True`.

---

## Step 11: Set Up Algorand Blockchain (TestNet)

Algorand TestNet is free to use. No credit card needed.

### 11.1 Generate a Server Wallet

Run this Python command:

```powershell
python -c "from algosdk import account, mnemonic; private_key, address = account.generate_account(); mn = mnemonic.from_private_key(private_key); print(f'Address: {address}'); print(f'Mnemonic: {mn}')"
```

> 💡 If `algosdk` is not installed, first run: `pip install py-algorand-sdk`

This will print something like:
```
Address: ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEFG
Mnemonic: word1 word2 word3 word4 ... word25
```

**Save both values!**

### 11.2 Fund the Wallet with Test ALGO

1. Go to **https://bank.testnet.algorand.network/**
2. Paste your **Address** from the previous step
3. Click **Dispense**
4. You'll receive **10 test ALGO** (free, not real money)

### 11.3 Update .env

Open your `.env` file and update:
```
ALGORAND_NETWORK=testnet
ALGORAND_SYSTEM_WALLET_MNEMONIC=word1 word2 word3 word4 ... word25
```

Replace with your actual 25-word mnemonic.

---

## Step 12: Compile Smart Contracts

Smart contracts are written in PyTeal (Python) and need to be compiled to TEAL.

```powershell
cd "c:\Users\ASUS\OneDrive\Desktop\COLLEGE EVERYTHING\hackathon\dssa vit\Vitalscore finance"
cd blockchain\contracts
python compile_contracts.py
cd ..\..
```

This compiles 4 contracts:
- **SoulBoundNFT** — your financial identity NFT
- **ChallengeEscrow** — holds challenge stakes
- **SquadTreasury** — squad savings pools
- **VitalToken** — reward token

After compilation, check the `build/` folder for `.teal` files:
```powershell
dir blockchain\contracts\build
```

---

## Step 13: Start the Backend Services

Each service runs in its own terminal window. You need to open **multiple terminals** (PowerShell windows).

### Service 1: User Profile Service (Port 3001)

Open a **new PowerShell window**:
```powershell
cd "c:\Users\ASUS\OneDrive\Desktop\COLLEGE EVERYTHING\hackathon\dssa vit\Vitalscore finance\backend\services\user-profile"
npm run dev
```
Wait until you see: `User Profile Service running on port 3001`

### Service 2: Auth Service (Port 3002)

Open a **new PowerShell window**:
```powershell
cd "c:\Users\ASUS\OneDrive\Desktop\COLLEGE EVERYTHING\hackathon\dssa vit\Vitalscore finance\backend\services\auth-service"
npm run dev
```

### Service 3: Transaction Ingestion (Port 3003)

Open a **new PowerShell window**:
```powershell
cd "c:\Users\ASUS\OneDrive\Desktop\COLLEGE EVERYTHING\hackathon\dssa vit\Vitalscore finance\backend\services\transaction-ingestion"
npm run dev
```

### Service 4: Score Engine (Port 3004)

Open a **new PowerShell window**:
```powershell
cd "c:\Users\ASUS\OneDrive\Desktop\COLLEGE EVERYTHING\hackathon\dssa vit\Vitalscore finance\backend\services\score-engine"
npm run dev
```

### Service 5: Gamification Service (Port 3005)

Open a **new PowerShell window**:
```powershell
cd "c:\Users\ASUS\OneDrive\Desktop\COLLEGE EVERYTHING\hackathon\dssa vit\Vitalscore finance\backend\services\gamification-service"
npm run dev
```

### Service 6: AI Categorization (Port 3007)

Open a **new PowerShell window**:
```powershell
cd "c:\Users\ASUS\OneDrive\Desktop\COLLEGE EVERYTHING\hackathon\dssa vit\Vitalscore finance\backend\services\ai-categorization"
npm run dev
```

### Service 7: Blockchain Service — Python (Port 5001)

Open a **new PowerShell window**:
```powershell
cd "c:\Users\ASUS\OneDrive\Desktop\COLLEGE EVERYTHING\hackathon\dssa vit\Vitalscore finance\backend\services\blockchain-service-python"
python app.py
```

---

## Step 14: Start the Frontend

Open a **new PowerShell window** (this is the last one):

```powershell
cd "c:\Users\ASUS\OneDrive\Desktop\COLLEGE EVERYTHING\hackathon\dssa vit\Vitalscore finance\frontend\web"
npm run dev
```

You should see:
```
  VITE v5.4.x  ready in 500ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

**Open your browser and go to: http://localhost:5173/**

You should see the VitalScore Finance dashboard with:
- 💓 Heartbeat visualizer at the top
- ⚡ Quick stats (Score, Streak, Savings, XP)
- ⚠️ Smart Nudge banner (pending categorizations)
- 🧛 SubVampire ghost subscription alerts
- 📈 Score history chart
- 📊 Spending breakdown

---

## Step 15: Run the Full Project Together

Here's a summary of what needs to be running at the same time:

| # | What | Terminal | Status |
|---|------|----------|--------|
| 0 | Docker Desktop | Background app | Must show green |
| 1 | Databases | `docker-compose up -d` | Runs in background |
| 2 | User Profile | `npm run dev` in user-profile | Terminal 1 |
| 3 | Auth Service | `npm run dev` in auth-service | Terminal 2 |
| 4 | Transaction Ingestion | `npm run dev` in transaction-ingestion | Terminal 3 |
| 5 | Score Engine | `npm run dev` in score-engine | Terminal 4 |
| 6 | Gamification | `npm run dev` in gamification-service | Terminal 5 |
| 7 | AI Categorization | `npm run dev` in ai-categorization | Terminal 6 |
| 8 | Blockchain | `python app.py` in blockchain-service-python | Terminal 7 |
| 9 | Frontend | `npm run dev` in frontend/web | Terminal 8 |

> 💡 **For the demo/hackathon, you only NEED terminals 1 (databases), 9 (frontend), and optionally 6 (AI) and 8 (blockchain).** The frontend works with mock data even without backends running.

---

## Step 16: Test That Everything Works

### Test 1: Frontend Loads
- Open **http://localhost:5173/** in Chrome
- You should see the Dashboard with the heartbeat animation

### Test 2: Backend Health Checks
Open a new PowerShell and run:
```powershell
# Test each service (only run for services you started)
Invoke-WebRequest -Uri http://localhost:3001/health -UseBasicParsing | Select-Object -ExpandProperty Content
Invoke-WebRequest -Uri http://localhost:3004/health -UseBasicParsing | Select-Object -ExpandProperty Content
Invoke-WebRequest -Uri http://localhost:3007/health -UseBasicParsing | Select-Object -ExpandProperty Content
Invoke-WebRequest -Uri http://localhost:5001/health -UseBasicParsing | Select-Object -ExpandProperty Content
```

Each should return: `{"status":"OK","service":"..."}`

### Test 3: Database Connection
```powershell
docker exec vitalscore-postgres psql -U postgres -d vitalscore -c "SELECT 1;"
```
Should return `1`.

---

## Step 17: Demo Walkthrough

When presenting VitalScore at the hackathon, show these features in this order:

1. **Dashboard** → Point out the heartbeat visualizer pulsing with the user's score
2. **Smart Nudge** → Show the pending categorization banner with Confirm/Change buttons
3. **SubVampire** → Show ghost subscription alerts with ghost% scores
4. **Transactions** → Show categorized transactions with confidence levels
5. **Challenges** → Show an active challenge with escrow stake
6. **Squads** → Show SplitSync active splits and squad pool
7. **NFT** → Show the Soul-Bound Vitality Token with monthly metadata
8. **League** → Show India-themed league tiers (Agni, Prithvi, etc.)

### Pre-Demo Checklist

- [ ] Docker containers running (`docker ps`)
- [ ] At least frontend running (`npm run dev` in frontend/web)
- [ ] Browser open at **http://localhost:5173/**
- [ ] Screen recording software ready as backup
- [ ] Practice answers to judge questions (see below)

### Key Judge Q&A Preparation

**Q: "How does VitalScore achieve 99% accuracy?"**
> "It's a 5-layer progressive system. Layer 1 is a curated merchant database with 100+ Indian merchants. Layer 2 parses UPI VPA handles and note text. Layer 3 uses Groq's llama-3.1-70b LLM for ambiguous cases. Layer 4 learns from the user's personal history. Layer 5 asks the user via a Smart Nudge — but only for ~1% of transactions by Month 3."

**Q: "Why Algorand?"**
> "We use blockchain ONLY where it genuinely adds trust: challenge escrow (can't tamper with stakes), squad treasury (non-custodial savings), and soul-bound NFTs (portable, tamper-proof financial reputation). Everything else uses a regular database."

---

## Step 18: Common Problems and Fixes

### "npm is not recognized"
→ Node.js wasn't added to PATH. Reinstall Node.js and make sure "Add to PATH" is checked. Restart PowerShell.

### "python is not recognized"  
→ Python wasn't added to PATH. Reinstall Python and check "Add to PATH" at the bottom of the installer. Restart PowerShell.

### "docker-compose: command not found" or "Cannot find path infrastructure/docker"
→ The `docker-compose.yml` is in the **project root folder**. Make sure you run `docker-compose up -d` from the root:
```powershell
cd "c:\Users\ASUS\OneDrive\Desktop\COLLEGE EVERYTHING\hackathon\dssa vit\Vitalscore finance"
docker-compose up -d
```

### Docker says "error during connect" or "pipe/dockerDesktopLinuxEngine"
→ Docker Desktop is **not running**. Open Docker Desktop from Start menu and wait for it to show green. Then retry.

### "Port 3001 already in use"
→ Another process is using that port. Kill it:
```powershell
npx kill-port 3001
```

### npm install gives errors about permissions
→ Try running PowerShell as **Administrator** (right-click → Run as administrator)

### Frontend is blank white page
→ Open browser DevTools (F12) → Console tab. Look for red errors. Usually means a syntax error — go to the file mentioned in the error.

### "Cannot find module" errors in backend services
→ You forgot to run `npm install` in that service's folder. Go to that folder and run `npm install`.

### Smart contracts won't compile
→ Make sure PyTeal is installed:
```powershell
pip install pyteal
```

### Algorand wallet has 0 balance
→ Go to **https://bank.testnet.algorand.network/** and dispense test ALGO to your address.

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

## 14. Razorpay Integration — Detailed Setup

> This section covers the full Razorpay setup for payments, SplitSync bill collection, and bank connections.

### A. Create a Razorpay Account

1. Go to **https://razorpay.com/** and click **Sign Up**
2. Use your email and phone number — no business documents needed for Test Mode
3. After verifying your email, you land on the **Razorpay Dashboard**

### B. Enable Test Mode

1. On the Dashboard, look at the **top-left corner**
2. You'll see a toggle that says **"Test Mode"** with an orange banner — make sure it's **ON**
3. In Test Mode, no real money is charged. You can use test card numbers and UPI IDs

### C. Generate API Keys

1. Go to **Settings** → **API Keys**
2. Click **"Generate Test Key"**
3. A popup shows:
   - **Key Id**: looks like `rzp_test_aBcDeFgH12345` — copy this
   - **Key Secret**: looks like `xYzAbCdEfGhIjK12345` — ⚠️ **copy immediately, it's shown only once!**
4. If you lose the secret, delete the key and generate a new pair

### D. Set Environment Variables

Open the `.env` file in the project root and set these three values:

```env
# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_aBcDeFgH12345
RAZORPAY_KEY_SECRET=xYzAbCdEfGhIjK12345
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

> The `RAZORPAY_WEBHOOK_SECRET` is optional for local development. It's only needed if you set up webhooks (see section G).

### E. Install Dependencies

Both the **transaction-ingestion** and **gamification-service** use the Razorpay Node SDK.

```powershell
# Transaction Ingestion Service
cd backend\services\transaction-ingestion
npm install

# Gamification Service (SplitSync uses Razorpay payment links)
cd ..\gamification-service
npm install
```

### F. Test That It Works

Start the transaction-ingestion service:

```powershell
cd backend\services\transaction-ingestion
npm run dev
```

Then in another terminal, test creating a connection:

```powershell
# This should return a Razorpay order ID
Invoke-RestMethod -Uri "http://localhost:3003/transactions/connections" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"userId": "test-user-123", "phone": "+919876543210"}'
```

Expected response (with Test Mode keys):
```json
{
  "success": true,
  "data": {
    "connectionId": "some-uuid",
    "razorpayOrderId": "order_...",
    "razorpayKeyId": "rzp_test_...",
    "amount": 100,
    "currency": "INR"
  }
}
```

If you see `razorpayOrderId: "order_mock_..."` it means the keys are not set — the app is running in mock mode (still works, just no real Razorpay calls).

### G. Webhooks (Optional — For Production)

Webhooks let Razorpay notify your server when a payment succeeds/fails.

1. In the Razorpay Dashboard, go to **Settings** → **Webhooks**
2. Click **"Add New Webhook"**
3. URL: `https://your-domain.com/api/payments/webhook` (use ngrok for local testing)
4. Secret: enter a strong random string, then put it in your `.env` as `RAZORPAY_WEBHOOK_SECRET`
5. Events to select:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`
   - `payment_link.paid`
6. Click **Create Webhook**

### H. Test Card Numbers (for Checkout testing)

| Card Number | Bank | Result |
|-------------|------|--------|
| `4111 1111 1111 1111` | Any | Success |
| `5267 3181 8797 5449` | Any | Success |
| `4000 0000 0000 0002` | Any | Failure |

- **Expiry**: any future date (e.g., `12/35`)
- **CVV**: any 3 digits (e.g., `123`)

### I. Test UPI IDs

| UPI ID | Result |
|--------|--------|
| `success@razorpay` | Payment succeeds |
| `failure@razorpay` | Payment fails |

### J. What Razorpay Replaces

| Before (Setu) | After (Razorpay) | What It Does |
|---------------|-----------------|--------------|
| `SetuIntegrationService.ts` | `RazorpayService.ts` | Bank connection + order creation |
| `SETU_CLIENT_ID` / `SETU_CLIENT_SECRET` | `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | API authentication |
| UPI deep links (`upi://pay?...`) | Razorpay Payment Links (`https://rzp.io/...`) | SplitSync payment collection |
| Setu consent flow | Razorpay Checkout / Payment Links | Payment initiation |

---

=======
>>>>>>> cf3aaf8 (local work before pull)
*VitalScore Finance v4.0 | Honest Blockchain Usage • India-First • Free-Tier Verified • 99% Accuracy Architecture*
