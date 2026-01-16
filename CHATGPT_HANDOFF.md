# 🔒 WRINGOAI STRIPE BILLING — CHATGPT HANDOFF DOCUMENT

**Status:** Code complete, deployment blocked  
**Issue:** Render backend not showing latest code  
**Created:** January 16, 2026  
**Repo:** https://github.com/solutionspma/wringo.ai

---

## THE PROBLEM

Pricing page at https://wringoai.com/pricing stuck on "Loading..." because backend API returns empty array `[]` instead of 3 WringoAI products.

**Root cause:** Render deployment stale. Latest commit `553553c` not deployed.

---

## WHAT WAS BUILT

### 1. Backend API Endpoints

**File:** `server/routes/stripe-checkout.js`

**GET /api/stripe/pricing**
- Returns products filtered by `metadata.app = "wringoai"`
- Currently returns `[]` due to stale deployment
- Should return 3 products (Starter, Creator, Pro)

**POST /api/stripe/checkout**
- Creates Stripe subscription checkout session
- Payload: `{ priceId, userId }`
- Returns: `{ url: "https://checkout.stripe.com/..." }`

**POST /api/stripe/reload**
- Creates one-time purchase checkout (daily reloads)
- Same payload/response as checkout
- Used for $3-$9 impulse buys

---

### 2. Webhook Handler

**File:** `server/routes/stripe-webhook.js`

**POST /api/stripe/webhook**
- Handles `checkout.session.completed` event
- Subscription mode → `grantEntitlement(userId, subscriptionId)`
- Payment mode → `addUsage(userId, cents)` converts to credits
- Webhook secret: `whsec_AVzORGr5EaFnCgyHf5fBv1utPyGVUeCG`

---

### 3. Entitlements System

**File:** `server/services/entitlements.js`

```javascript
// Grant subscription access
export async function grantEntitlement(userId, subscriptionId) {
  await supabase.from("subscriptions").upsert({
    user_id: userId,
    stripe_subscription_id: subscriptionId,
    status: "active"
  });
}

// Add credits from reload purchase (100 cents = 1 credit)
export async function addUsage(userId, cents) {
  const credits = Math.floor(cents / 100);
  await supabase.from("credits").upsert({
    user_id: userId,
    balance: existing.balance + credits
  });
}
```

---

### 4. Frontend Pages

**File:** `client/pricing.html`
- Fetches from `GET /api/stripe/pricing`
- Groups products: subscriptions vs one-time
- Checkout button calls `checkout(priceId, mode)`
- **Current state:** Stuck on loading spinner

**File:** `client/store.html` (NEW)
- Daily reload store for impulse purchases
- Shows products with `type=reload`

---

## STRIPE PRODUCTS CREATED

### Products in Stripe Dashboard

| Product | Price | Product ID | Metadata |
|---------|-------|------------|----------|
| WringoAI Starter | $9/mo | `prod_Tnu5BMbJd3Gpeo` | app=wringoai, type=saas |
| WringoAI Creator | $19/mo | `prod_Tnu52zUp9iulUV` | app=wringoai, type=saas |
| WringoAI Pro | $49/mo | `prod_Tnu6nJL29mbNZ0` | app=wringoai, type=saas |

**Verification:**
```bash
stripe products list --limit 3 | grep wringoai
# Confirms products exist with correct metadata
```

---

## DEPLOYMENT STATUS

### Backend Version
```bash
curl https://wringo-backend.onrender.com/health
# Returns: {"version":"7.0-stripe-billing"}
```

### API Response (THE PROBLEM)
```bash
curl https://wringo-backend.onrender.com/api/stripe/pricing
# Returns: []
# Should return: 3 products
```

**Why it's empty:**
- Code filters by `metadata.app=wringoai`
- Render hasn't deployed latest commit with filter
- Git commit `553553c` pushed but not live

---

## GIT COMMITS (CHRONOLOGICAL)

1. `6912fa7` - feat: add Stripe pricing API endpoint
2. `e0400da` - fix: remove unused micro import
3. `c8a07c6` - chore: bump version to force clean deploy
4. `b3ef70f` - feat: add render.yaml config
5. `140ec38` - fix: remove TypeScript syntax from JavaScript file
6. `d9f4865` - feat: full Stripe billing system with subscriptions + daily reload mechanics
7. `2b30420` - fix: remove app filter to show all Stripe products
8. `c4af538` - fix: display all Stripe products without metadata filtering
9. `553553c` - **fix: filter for wringoai products only, show empty state** ← NOT DEPLOYED

---

## HOW TO FIX (3 OPTIONS)

### Option 1: Force Render Deploy (FASTEST)
1. Go to https://dashboard.render.com/web/wringo-backend
2. Click "Manual Deploy" → "Deploy latest commit"
3. Wait 2-3 minutes
4. Refresh https://wringoai.com/pricing
5. 3 products should appear

---

### Option 2: Remove Filter (TEMP FIX)

**File:** `server/routes/stripe-checkout.js`

**Change line 18-22 from:**
```javascript
const scoped = prices.data.filter(p => {
  const prod = p.product;
  return prod?.metadata?.app === "wringoai";
});
res.json(scoped.map(p => ({
```

**To:**
```javascript
res.json(prices.data.map(p => ({
```

This shows ALL 100+ Stripe products (including WringoAI ones). Not ideal but unblocks testing.

**Then:**
```bash
git add -A
git commit -m "temp: remove filter to show all products"
git push
```

---

### Option 3: Debug Render Deployment

**Check what's actually deployed:**
```bash
# Via Render Shell (if available)
cat /opt/render/project/src/server/routes/stripe-checkout.js | grep "metadata.app"
```

**Check deployment logs:**
- Go to Render dashboard
- Click "Events" tab
- Look for failed deployments
- Check build logs for errors

---

## CODE LOCATIONS

### Backend
```
/server
  ├─ stripe.js                    # Stripe SDK init
  ├─ routes/
  │   ├─ stripe-checkout.js       # 3 endpoints (pricing, checkout, reload)
  │   └─ stripe-webhook.js        # Event handling
  └─ services/
      └─ entitlements.js          # Grant subscriptions & credits
```

### Frontend
```
/client
  ├─ pricing.html                 # Dynamic pricing (STUCK ON LOADING)
  └─ store.html                   # Daily reload store
```

---

## ENVIRONMENT VARIABLES (RENDER)

Required in Render dashboard:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_AVzORGr5EaFnCgyHf5fBv1utPyGVUeCG
WRINGO_SUPABASE_URL=https://wncmxysw...
WRINGO_SUPABASE_SERVICE_KEY=eyJhbGc...
FRONTEND_URL=https://wringoai.com
```

---

## TESTING CHECKLIST

Once deployment works:

1. **Verify API returns products:**
   ```bash
   curl https://wringo-backend.onrender.com/api/stripe/pricing
   # Should return 3 products
   ```

2. **Test pricing page:**
   - Visit https://wringoai.com/pricing
   - Should show 3 subscription cards
   - No loading spinner

3. **Test checkout flow:**
   - Click "Subscribe Now" button
   - Should redirect to Stripe Checkout
   - Use test card: `4242 4242 4242 4242`

4. **Test webhook:**
   - Complete test checkout
   - Check Render logs for webhook receipt
   - Verify entitlement granted in Supabase

---

## TECHNICAL DEBT

1. **User auth** - Currently uses demo userId `'demo-user-' + Date.now()`
2. **Database migration** - `002_billing_system.sql` not run in Supabase
3. **Error handling** - Basic, needs production hardening
4. **Webhook testing** - Not fully tested end-to-end
5. **No reload products** - Only subscriptions created, need $3-$9 impulse buys

---

## DAILY RELOAD STRATEGY (NOT YET IMPLEMENTED)

**Goal:** Users come back DAILY for micro-purchases

**Products to create:**
- Prompt Pack - $3
- Voice Minutes - $5  
- Scene Credits - $7
- Publish Tokens - $2

**Command to create:**
```bash
stripe products create -d name="Prompt Pack" \
  -d description="50 AI prompts" \
  -d "metadata[app]=wringoai" \
  -d "metadata[type]=reload" \
  -d "metadata[category]=consumable"

stripe prices create -d product=prod_xxx \
  -d unit_amount=300 -d currency=usd
```

---

## IMMEDIATE ACTION REQUIRED

**PRIMARY BLOCKER:** Render backend deployment stale

**FIX:** Manually deploy at dashboard.render.com → wringo-backend → Manual Deploy

**VERIFICATION:**
```bash
curl https://wringo-backend.onrender.com/api/stripe/pricing | jq length
# Should return: 3 (not 0)
```

**EXPECTED RESULT:** Pricing page shows 3 cards (Starter $9, Creator $19, Pro $49)

---

**END OF HANDOFF DOCUMENT**
