# YOcreator Deployment Guide

## 🌐 Web App Deployment (Netlify)

### Prerequisites
- Netlify account
- GitHub/GitLab repo (optional)
- Supabase project

### Steps

1. **Install dependencies**
   ```bash
   cd apps/web
   pnpm install
   ```

2. **Configure environment**
   Create `apps/web/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
   ```

3. **Build**
   ```bash
   pnpm build
   ```

4. **Deploy**
   ```bash
   netlify deploy --prod --dir=out
   ```

   Or connect your repo to Netlify for auto-deployment.

---

## 🐳 Backend Deployment (Docker)

### Local Docker

```bash
# Build
docker build -t yocreator-backend -f deploy/Dockerfile.backend .

# Run
docker run -p 5001:5001 \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_SERVICE_ROLE=your_key \
  yocreator-backend
```

### Docker Compose (Full Stack)

```bash
cd deploy
cp ../.env.example .env
# Edit .env with your credentials
docker-compose up -d
```

### Cloud Deployment

**Railway:**
```bash
railway login
railway init
railway up
```

**Render:**
1. Connect GitHub repo
2. Select `deploy/Dockerfile.backend`
3. Set environment variables
4. Deploy

**Fly.io:**
```bash
fly launch --dockerfile deploy/Dockerfile.backend
fly secrets set SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE=xxx
fly deploy
```

---

## 🎮 GPU Worker Deployment (RunPod)

### Build Worker Image

```bash
docker build -t yocreator-worker -f workers/runpod/Dockerfile .
docker tag yocreator-worker:latest your-dockerhub-username/yocreator-worker:latest
docker push your-dockerhub-username/yocreator-worker:latest
```

### Deploy to RunPod

1. Go to [RunPod.io](https://runpod.io)
2. Navigate to **Serverless** → **Templates**
3. Create new template:
   - Docker Image: `your-dockerhub-username/yocreator-worker:latest`
   - Container Disk: 20GB
   - Volume Path: `/app/models`
4. Add environment variables:
   ```
   SUPABASE_URL=your_url
   SUPABASE_SERVICE_ROLE=your_key
   ```
5. Create endpoint from template
6. Copy endpoint URL to backend config

### Alternative: Vast.ai

```bash
# SSH into instance
ssh root@your-vast-instance

# Pull and run
docker pull your-username/yocreator-worker
docker run -d \
  -e SUPABASE_URL=xxx \
  -e SUPABASE_SERVICE_ROLE=xxx \
  --gpus all \
  your-username/yocreator-worker
```

---

## 📊 Supabase Setup

### 1. Create Project
- Go to [supabase.com](https://supabase.com)
- Create new project
- Save URL and anon/service keys

### 2. Run Migrations

```sql
-- Execute in Supabase SQL Editor

-- schema.sql
create table render_jobs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid,
  type text,
  payload jsonb,
  status text default 'queued',
  result_url text,
  error text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- rpc.sql
create or replace function add_render_job(
  p_user_id uuid,
  p_type text,
  p_payload jsonb
)
returns uuid
language plpgsql
as $$
declare new_id uuid;
begin
  insert into render_jobs (user_id, type, payload)
  values (p_user_id, p_type, p_payload)
  returning id into new_id;
  return new_id;
end;
$$;
```

### 3. Enable Realtime (optional)
- Go to Database → Replication
- Enable for `render_jobs` table

---

## 🔧 Environment Variables

### Web App (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_KEY=
```

### Backend (.env)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE=
NODE_ENV=production
PORT=5001
```

### Worker (.env)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE=
CUDA_VISIBLE_DEVICES=0
```

---

## 🚀 Quick Deploy (All Services)

```bash
# 1. Setup Supabase
# - Create project
# - Run SQL migrations
# - Copy credentials

# 2. Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# 3. Deploy web app
cd apps/web
pnpm install
pnpm build
netlify deploy --prod

# 4. Deploy backend
cd ../..
docker-compose -f deploy/docker-compose.yml up -d

# 5. Deploy GPU worker
docker build -t yocreator-worker -f workers/runpod/Dockerfile .
docker push your-username/yocreator-worker
# Create RunPod template and endpoint

# 6. Update web app API URLs
# Edit apps/web/lib/api.ts with production backend URL
```

---

## 📱 Mobile Deployment

### iOS

```bash
cd apps/mobile
pnpm install
npx cap add ios
npx cap sync
npx cap open ios
# Build in Xcode and deploy to App Store
```

### Android

```bash
cd apps/mobile
pnpm install
npx cap add android
npx cap sync
npx cap open android
# Build in Android Studio and deploy to Play Store
```

---

## 🖥️ Desktop Deployment

### Build for All Platforms

```bash
cd apps/desktop
pnpm install
pnpm add electron-builder -D

# Add to package.json:
# "build": "electron-builder --mac --win --linux"

pnpm build
```

---

## 🔍 Monitoring

### Health Checks

Add to `server/node/src/index.js`:
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});
```

### Logging

**Backend:**
```bash
docker logs -f yocreator-backend
```

**Worker:**
Check RunPod logs in dashboard

---

## 🛠️ Troubleshooting

**Web app build fails:**
- Check Node version (18+)
- Clear `.next` folder
- Verify env variables

**Backend can't connect to Supabase:**
- Verify service role key
- Check network/firewall
- Enable Supabase API access

**GPU worker not processing jobs:**
- Check Supabase credentials
- Verify job queue polling
- Check CUDA drivers on RunPod

---

## 📈 Scaling

**Horizontal:**
- Deploy multiple backend instances behind load balancer
- Run multiple GPU workers
- Use Supabase connection pooling

**Vertical:**
- Upgrade RunPod GPU tier
- Increase backend RAM/CPU
- Use Redis for job queue (future)

---

## 💰 Cost Optimization

- Use RunPod Spot instances for workers
- Enable Netlify edge caching
- Implement job batching
- Auto-scale workers based on queue depth
