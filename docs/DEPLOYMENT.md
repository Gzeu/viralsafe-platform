# ViralSafe Platform - Deployment Guide 🚀

## Overview

This guide covers the complete deployment process for the ViralSafe platform across all three phases: MVP, Core Features, and DAO Governance.

## Prerequisites

### Required Software
- Node.js 18+
- Python 3.11+
- MongoDB 6.0+
- Redis 7.0+
- Git
- Docker (optional)

### Required Accounts
- Vercel account for frontend deployment
- Railway account for backend deployment
- Alchemy account for RPC endpoints
- Pinata account for IPFS storage
- BSCScan account for contract verification
- WalletConnect project

## Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/Gzeu/viralsafe-platform.git
cd viralsafe-platform
```

### 2. Install Dependencies
```bash
# Install all packages
npm run install:all

# Or install individually
cd frontend && npm install
cd ../backend && pip install -r requirements.txt
cd ../contracts && npm install
```

### 3. Environment Configuration

#### Frontend (.env.local)
```bash
# Web3 Configuration
NEXT_PUBLIC_CHAIN_ID=97
NEXT_PUBLIC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Contract Addresses (updated after deployment)
NEXT_PUBLIC_SAFE_TOKEN_ADDRESS=
NEXT_PUBLIC_VIRAL_NFT_ADDRESS=
NEXT_PUBLIC_MARKETPLACE_ADDRESS=

# IPFS Configuration
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt
NEXT_PUBLIC_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8000/ws

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_id
```

#### Backend (.env)
```bash
# Database
DATABASE_URL=mongodb://localhost:27017/viralsafe
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET_KEY=your_super_secret_jwt_key
BCRYPT_ROUNDS=12

# IPFS
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Web3
WEB3_PROVIDER_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
CONTRACT_ADDRESSES_FILE=../contracts/deployments/bscTestnet/deployments.json

# External APIs
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# CORS
CORS_ORIGINS=["http://localhost:3000", "https://viralsafe.vercel.app"]

# Development
DEBUG=true
LOG_LEVEL=info
```

#### Contracts (.env)
```bash
# Deployment
PRIVATE_KEY=your_deployer_private_key

# Networks
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
BSC_RPC_URL=https://bsc-dataseed.binance.org/
ALCHEMY_API_KEY=your_alchemy_api_key

# Verification
BSCSCAN_API_KEY=your_bscscan_api_key

# Gas Reporting
REPORT_GAS=true
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
```

## Phase 1: MVP Deployment (Testnet)

### Step 1: Smart Contracts Deployment

```bash
cd contracts

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to BSC Testnet
npm run deploy:testnet

# Verify contracts
npm run verify:testnet
```

### Step 2: Backend Deployment

```bash
cd backend

# Test locally first
python -m pytest tests/ -v

# Deploy to Railway
railway login
railway link viralsafe-api-staging
railway up
```

### Step 3: Frontend Deployment

```bash
cd frontend

# Update contract addresses
npm run update:contracts

# Test build
npm run build

# Deploy to Vercel
vercel login
vercel link
vercel --prod
```

## Phase 2: Core Features (Mainnet Preparation)

### Enhanced Smart Contracts

1. **NFT Auto-Minting System**
```solidity
// Enhanced ViralNFT with auto-minting
function autoMint(address creator, uint256 viralScore) external {
    require(viralScore >= VIRAL_THRESHOLD, "Insufficient viral score");
    // Auto-mint logic
}
```

2. **Staking Mechanism**
```solidity
// SAFE token staking
function stake(uint256 amount) external {
    // Staking logic with rewards
}
```

3. **TikTok Integration**
```python
# Backend TikTok API integration
async def get_trending_hashtags():
    # TikTok API calls
    pass
```

### Deployment Steps

```bash
# Deploy enhanced contracts
cd contracts
npm run deploy:testnet

# Update backend with new features
cd ../backend
railway deploy

# Update frontend
cd ../frontend
vercel --prod
```

## Phase 3: Production Deployment (Mainnet)

### Pre-Production Checklist

- [ ] All tests passing
- [ ] Smart contracts audited
- [ ] Security review completed
- [ ] Load testing performed
- [ ] Monitoring setup
- [ ] Backup strategy implemented

### Mainnet Deployment

```bash
# 1. Deploy to BSC Mainnet
cd contracts
npm run deploy:mainnet
npm run verify:mainnet

# 2. Production backend
railway create viralsafe-api-prod
railway variables:set NODE_ENV=production
railway deploy

# 3. Production frontend
cd ../frontend
vercel --prod --env-file .env.production
```

## CI/CD Pipeline

### GitHub Actions Setup

1. **Frontend Workflow** (`.github/workflows/frontend-deploy.yml`)
   - Automated testing
   - Build verification
   - Vercel deployment
   - Lighthouse audits

2. **Smart Contracts Workflow** (`.github/workflows/smart-contracts.yml`)
   - Solidity linting
   - Contract testing
   - Gas reporting
   - Automated deployment
   - Contract verification

3. **Backend Workflow** (`.github/workflows/backend-deploy.yml`)
   - Python testing
   - Code quality checks
   - Railway deployment

### Required GitHub Secrets

```bash
# Vercel
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=

# Smart Contracts
DEPLOYER_PRIVATE_KEY=
BSC_RPC_URL=
BSC_TESTNET_RPC_URL=
BSCSCAN_API_KEY=

# Backend
RAILWAY_TOKEN=
MONGODB_URL=
REDIS_URL=

# External Services
ALCHEMY_API_KEY=
WALLETCONNECT_PROJECT_ID=
PINATA_JWT=
TIKTOK_CLIENT_KEY=
```

## Monitoring & Maintenance

### Health Checks

```bash
# Frontend health
curl https://viralsafe.vercel.app/api/health

# Backend health
curl https://api.viralsafe.io/health

# Contract verification
npx hardhat verify --network bsc <CONTRACT_ADDRESS>
```

### Monitoring Setup

1. **Application Monitoring**
   - Vercel Analytics for frontend
   - Railway metrics for backend
   - Custom metrics dashboard

2. **Blockchain Monitoring**
   - Contract event monitoring
   - Gas price tracking
   - Transaction monitoring

3. **Error Tracking**
   - Sentry integration
   - Error alerts
   - Performance monitoring

### Backup Strategy

```bash
# Database backup
mongodump --uri="$MONGODB_URL" --out backup/

# Code backup
git push --all origin

# Contract verification backup
npx hardhat flatten > flattened-contracts.sol
```

## Security Considerations

### Smart Contract Security
- Multi-sig wallet for admin functions
- Timelock for critical updates
- Regular security audits
- Bug bounty program

### Infrastructure Security
- Environment variable encryption
- Rate limiting
- DDoS protection
- SSL/TLS certificates

### API Security
- JWT token validation
- CORS configuration
- Input validation
- Rate limiting

## Troubleshooting

### Common Issues

1. **Contract Deployment Fails**
   ```bash
   # Check gas limits
   npx hardhat test --gas-report
   
   # Verify network configuration
   npx hardhat run scripts/check-network.js
   ```

2. **Frontend Build Issues**
   ```bash
   # Clear cache
   rm -rf .next
   npm run build
   ```

3. **Backend Connection Issues**
   ```bash
   # Check database connection
   python -c "from app.core.database import database; print(database.client.admin.command('ping'))"
   ```

### Support Channels

- **Technical Issues**: Create GitHub issue
- **Deployment Questions**: Check documentation
- **Emergency**: Contact team@viralsafe.io

## Cost Optimization

### Infrastructure Costs
- Vercel Pro: $20/month
- Railway Pro: $20/month
- MongoDB Atlas M10: $57/month
- Total: ~$100/month

### Gas Optimization
- Contract optimization
- Batch transactions
- Gas price monitoring
- Layer 2 consideration

---

**Last Updated**: October 2024  
**Version**: 1.0

For the latest updates, visit: [GitHub Repository](https://github.com/Gzeu/viralsafe-platform)