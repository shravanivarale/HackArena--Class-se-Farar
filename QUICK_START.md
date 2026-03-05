# VitalScore Finance - Quick Start Guide

## 🚀 Getting Started

### Prerequisites

- **Docker & Docker Compose** (recommended)
- **Node.js 18+** (for local development)
- **PostgreSQL 15+** (if not using Docker)
- **Git**

### Option 1: Docker Setup (Recommended)

1. **Clone and Setup**
   ```bash
   # Navigate to project directory
   cd "Vitalscore finance"
   
   # Make setup script executable (Git Bash or WSL on Windows)
   chmod +x setup.sh
   
   # Run setup
   ./setup.sh
   ```

2. **Verify Services**
   ```bash
   docker-compose ps
   ```
   
   You should see:
   - PostgreSQL (port 5432)
   - Redis (port 6379)
   - InfluxDB (port 8086)
   - LocalStack (port 4566)
   - PgAdmin (port 5050)
   - Redis Commander (port 8081)

3. **Access Management Tools**
   - **PgAdmin**: http://localhost:5050
     - Email: admin@vitalscore.local
     - Password: admin
   - **Redis Commander**: http://localhost:8081
   - **InfluxDB**: http://localhost:8086

### Option 2: Manual Setup

1. **Install Dependencies**
   ```bash
   # User Profile Service
   cd backend/services/user-profile
   npm install
   cd ../../..
   
   # Shared utilities
   cd backend/shared
   npm install
   cd ../..
   ```

2. **Setup Database**
   ```bash
   # Start PostgreSQL (if not using Docker)
   # Then run migrations
   cd backend/database/migrations
   chmod +x run_migrations.sh
   ./run_migrations.sh
   ```

3. **Configure Environment**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your configuration
   # Update database credentials, API keys, etc.
   ```

## 🏃 Running Services

### User Profile Service

```bash
cd backend/services/user-profile

# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

The service will be available at: http://localhost:3001

### Test the API

```bash
# Health check
curl http://localhost:3001/health

# Create a user profile
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{
    "declaredMonthlyIncome": 50000,
    "incomeType": "SALARIED",
    "locationType": "URBAN",
    "locationState": "Maharashtra",
    "locationCity": "Mumbai",
    "algorandAddress": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
  }'
```

## 📁 Project Structure

```
vitalscore-finance/
├── backend/
│   ├── services/
│   │   └── user-profile/          ✅ IMPLEMENTED
│   │       ├── src/
│   │       │   ├── config/        # Database, logger
│   │       │   ├── models/        # TypeScript types
│   │       │   ├── repositories/  # Database operations
│   │       │   ├── services/      # Business logic
│   │       │   ├── controllers/   # Request handlers
│   │       │   ├── routes/        # API routes
│   │       │   └── index.ts       # Entry point
│   │       ├── package.json
│   │       ├── tsconfig.json
│   │       ├── Dockerfile
│   │       └── README.md
│   ├── shared/                    ✅ IMPLEMENTED
│   │   └── src/types/             # Shared TypeScript types
│   └── database/                  ✅ IMPLEMENTED
│       ├── schemas/               # SQL schemas
│       └── migrations/            # Migration scripts
├── docker-compose.yml             ✅ IMPLEMENTED
├── .env.example                   ✅ IMPLEMENTED
├── setup.sh                       ✅ IMPLEMENTED
└── README.md                      ✅ IMPLEMENTED
```

## 🧪 Testing

```bash
cd backend/services/user-profile

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm run test:watch
```

## 🐛 Troubleshooting

### Docker Issues

**Problem**: Containers won't start
```bash
# Check Docker is running
docker --version

# Check logs
docker-compose logs

# Restart services
docker-compose restart
```

**Problem**: Port already in use
```bash
# Find process using port (Windows PowerShell)
netstat -ano | findstr :5432

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Database Issues

**Problem**: Cannot connect to database
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

**Problem**: Migrations failed
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
sleep 10
./backend/database/migrations/run_migrations.sh
```

### Windows-Specific Issues

**Problem**: Shell scripts won't run
- Use **Git Bash** or **WSL** to run .sh scripts
- Or convert to PowerShell scripts

**Problem**: Line ending issues
```bash
# Convert line endings (in Git Bash)
dos2unix setup.sh
dos2unix backend/database/migrations/run_migrations.sh
```

## 📊 Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f redis

# User Profile Service (if running locally)
cd backend/services/user-profile
tail -f logs/combined.log
```

### Database Queries

```bash
# Connect to PostgreSQL
docker exec -it vitalscore-postgres psql -U postgres -d vitalscore

# List tables
\dt

# Query users
SELECT * FROM user_profiles LIMIT 5;

# Exit
\q
```

## 🔐 Security Notes

- **Never commit .env files** - they contain secrets
- **Change default passwords** in production
- **Use strong JWT secrets** in production
- **Enable SSL/TLS** for production databases
- **Rotate API keys** regularly

## 📚 Next Steps

1. ✅ Infrastructure setup complete
2. ✅ User Profile Service implemented
3. 🔄 Next: Authentication Service (Web3Auth, JWT)
4. 🔄 Next: Transaction Ingestion Service (Razorpay)
5. 🔄 Next: Score Engine Service (VitalScore calculation)

## 🆘 Getting Help

- Check [IMPLEMENTATION_PROGRESS.md](./IMPLEMENTATION_PROGRESS.md) for current status
- Review service-specific READMEs in `backend/services/*/README.md`
- Check [Requirements.md](./Requirements.md) for feature specifications
- Check [design.md](./design.md) for architecture details

## 🎯 Current Status

**Phase**: Foundation & Core Services  
**Progress**: ~25% complete  
**Working**: User Profile Service with full CRUD operations  
**Next**: Authentication & Transaction Ingestion

---

*Last Updated: User Profile Service Implementation Complete*
