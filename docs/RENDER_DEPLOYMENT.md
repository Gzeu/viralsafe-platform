# 🚀 ViralSafe Render Deployment Guide

## Quick Deploy pe Render

### 1. Setup Rapid

**Opțiunea A: Blueprint Deployment (Recomandat)**
1. Fork/Clone repository-ul `viralsafe-platform`
2. Mergi la [Render Dashboard](https://dashboard.render.com)
3. New → Blueprint
4. Connect repository și selectează `render.yaml`
5. Render va detecta automat configurația

**Opțiunea B: Manual Setup**
1. New → Web Service
2. Connect repository: `https://github.com/Gzeu/viralsafe-platform`
3. Root Directory: `backend`
4. Build Command: `pip install -r requirements-render.txt`
5. Start Command: `gunicorn main:app -w 1 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120`

### 2. Environment Variables (Critical!)

**În Render Dashboard → Environment:**
```bash
# Database (OBLIGATORIU)
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/viralsafe

# Cache (OBLIGATORIU pentru performance)
REDIS_URL=redis://red-xxxxx:6379  # Upstash Redis URL

# Security (OBLIGATORIU)
JWT_SECRET_KEY=your-super-secret-key-minimum-32-characters

# Environment
ENVIRONMENT=production
PYTHON_VERSION=3.11.5

# CORS (Actualizează cu domain-ul tău)
CORS_ORIGINS=https://viralsafe-frontend.vercel.app,https://viralsafe.io

# Optional: External Services
PINATA_JWT_TOKEN=your-pinata-token  # Pentru IPFS
ALCHEMY_API_KEY=your-alchemy-key    # Pentru Blockchain
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
```

### 3. Database Setup

**MongoDB Atlas (Gratis)**
1. Signup la [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create Free M0 Cluster (512MB)
3. Setup Database User
4. Get Connection String
5. Add la `MONGODB_URL` în Render

**Redis Cache (Gratis)**
1. Signup la [Upstash](https://upstash.com/)
2. Create Redis Database (10k commands/month gratis)
3. Copy Redis URL
4. Add la `REDIS_URL` în Render

### 4. Deploy & Verify

**Auto-deployment:**
- Push la `main` branch → Trigger automat deployment
- Build time: ~3-5 minute
- Cold start: ~30-60 secunde

**Health Check:**
```bash
# După deployment, verifică:
curl https://your-service-name.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "version": "0.3.0",
  "database": "healthy",
  "cache": "healthy",
  "environment": "production"
}
```

## 📊 Monitoring & Limits

### Free Tier Limits
```yaml
Compute: 750 ore/lună (pentru toate serviciile)
Bandwidth: 100GB outbound/lună
Build: Minutes illimited
Sleep: După 15 min inactivitate
Cold Start: 30-60 secunde
```

### Usage Optimization

**1. Keep-Alive Requests**
```javascript
// În frontend, ping periodic pentru a evita sleep
setInterval(() => {
  fetch('https://your-api.onrender.com/health')
    .catch(() => {}); // Silent fail
}, 14 * 60 * 1000); // La 14 minute
```

**2. Batch Operations**
```python
# Grupează request-urile pentru eficiență
await asyncio.gather(
    create_post(post1),
    create_post(post2),
    create_post(post3)
)
```

### 3. Monitor Usage

**Render Dashboard:**
- Billing → Usage pentru tracking ore
- Logs pentru debugging
- Metrics pentru performance

**Custom Monitoring:**
```bash
# Health check script
#!/bin/bash
SERVICE_URL="https://your-service.onrender.com"

while true; do
  STATUS=$(curl -s "$SERVICE_URL/health/detailed" | jq -r '.status')
  echo "$(date): Status = $STATUS"
  
  if [ "$STATUS" != "healthy" ]; then
    echo "⚠️  Service unhealthy! Check logs."
  fi
  
  sleep 300  # Check every 5 minutes
done
```

## 🔧 Troubleshooting

### Common Issues

**1. Build Failures**
```bash
# Check Python version
PYTHON_VERSION=3.11.5

# Update requirements-render.txt pentru compatibility
pip install --upgrade pip
pip install -r requirements-render.txt
```

**2. Database Connection Issues**
```python
# Test connection local
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_db():
    client = AsyncIOMotorClient("your-mongodb-url")
    await client.admin.command('ping')
    print("✅ Database connection OK")

asyncio.run(test_db())
```

**3. Cold Start Optimization**
```python
# În main.py, adaugă warm-up
@app.on_event("startup")
async def warmup():
    # Pre-load heavy resources
    await database.command('ping')
    await cache.ping()
    logger.info("🔥 Service warmed up")
```

**4. Memory Issues**
```yaml
# Reduce worker processes în render.yaml
startCommand: gunicorn main:app -w 1 --max-requests 1000

# Monitor memory usage
ps aux | grep gunicorn
```

### Debug Commands

```bash
# Local testing pentru Render
export PORT=10000
export ENVIRONMENT=production
cd backend && python main.py

# Test cu gunicorn (same as Render)
cd backend && gunicorn main:app -w 1 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Health check local
curl http://localhost:8000/health
curl http://localhost:8000/health/detailed
```

## 📈 Scaling Strategy

### Phase 1: Free Tier (Current)
```yaml
Users: <1,000
Requests: <10k/month
Cost: €0/month
Uptime: ~98% (cu sleep)
Response Time: 200-500ms (după warm-up)
```

### Phase 2: Paid Plan (€7/month)
```yaml
Users: 1,000-10,000
Requests: 100k/month
Cost: €7/month
Uptime: 99.9%
Response Time: <200ms (no sleep)
Features: Persistent disk, custom domains
```

### Phase 3: Pro Plan (€25/month)
```yaml
Users: 10,000+
Requests: 1M+/month
Cost: €25/month
Uptime: 99.95%
Response Time: <100ms
Features: Auto-scaling, load balancing
```

## 🔐 Security Checklist

**Production Deployment:**
- [ ] JWT_SECRET_KEY generat random (32+ chars)
- [ ] MongoDB Atlas cu IP whitelist
- [ ] Redis cu password authentication
- [ ] CORS configurat pentru doar domain-urile tale
- [ ] Environment variables pentru toate secrets
- [ ] HTTPS enforced (Render default)
- [ ] Rate limiting activat
- [ ] Error messages fără sensitive data

## 📞 Support

**Documentație:**
- [Render Docs](https://render.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [ViralSafe GitHub](https://github.com/Gzeu/viralsafe-platform)

**Community:**
- [Render Community](https://community.render.com/)
- [ViralSafe Discord](https://discord.gg/viralsafe) (coming soon)

---

**🎯 După deployment, API-ul va fi disponibil la:**
```
https://your-service-name.onrender.com
```

**📊 Dashboard URLs:**
- Health: `/health`
- Detailed Health: `/health/detailed`  
- API Docs: `/docs`
- API Status: `/api/v1/status`

**✅ Success Indicator:**
Dacă vezi `{"status": "healthy"}` la `/health`, deployment-ul a reușit! 🎉