#!/bin/bash
# Create WringoAI Stripe Products

echo "Creating WringoAI products in Stripe..."

# WringoAI Starter - $9/month
stripe products create \
  --name "WringoAI Starter" \
  --description "Basic AI voice agent with 50 calls/month, 5 min per call, email support" \
  --metadata[app]=wringoai \
  --metadata[type]=saas

STARTER_PRODUCT_ID=$(stripe products list --limit 1 -o json | jq -r '.data[0].id')

stripe prices create \
  --product "$STARTER_PRODUCT_ID" \
  --unit-amount 900 \
  --currency usd \
  --recurring[interval]=month

echo "✅ Created WringoAI Starter ($9/mo)"

# WringoAI Creator - $19/month
stripe products create \
  --name "WringoAI Creator" \
  --description "100 calls/month, 10 min per call, calendar integration, call recording" \
  --metadata[app]=wringoai \
  --metadata[type]=saas

CREATOR_PRODUCT_ID=$(stripe products list --limit 1 -o json | jq -r '.data[0].id')

stripe prices create \
  --product "$CREATOR_PRODUCT_ID" \
  --unit-amount 1900 \
  --currency usd \
  --recurring[interval]=month

echo "✅ Created WringoAI Creator ($19/mo)"

# WringoAI Pro - $49/month
stripe products create \
  --name "WringoAI Pro" \
  --description "500 calls/month, 30 min per call, CRM integration, custom knowledge base, priority support" \
  --metadata[app]=wringoai \
  --metadata[type]=saas

PRO_PRODUCT_ID=$(stripe products list --limit 1 -o json | jq -r '.data[0].id')

stripe prices create \
  --product "$PRO_PRODUCT_ID" \
  --unit-amount 4900 \
  --currency usd \
  --recurring[interval]=month

echo "✅ Created WringoAI Pro ($49/mo)"

# Daily Reload - Prompt Pack - $3
stripe products create \
  --name "Prompt Pack" \
  --description "50 AI prompts for today's projects" \
  --metadata[app]=wringoai \
  --metadata[type]=reload \
  --metadata[category]=consumable

PROMPT_PRODUCT_ID=$(stripe products list --limit 1 -o json | jq -r '.data[0].id')

stripe prices create \
  --product "$PROMPT_PRODUCT_ID" \
  --unit-amount 300 \
  --currency usd

echo "✅ Created Prompt Pack ($3)"

# Daily Reload - Voice Minutes - $5
stripe products create \
  --name "AI Voice Minutes" \
  --description "100 minutes of AI voice generation" \
  --metadata[app]=wringoai \
  --metadata[type]=reload \
  --metadata[category]=consumable

VOICE_PRODUCT_ID=$(stripe products list --limit 1 -o json | jq -r '.data[0].id')

stripe prices create \
  --product "$VOICE_PRODUCT_ID" \
  --unit-amount 500 \
  --currency usd

echo "✅ Created AI Voice Minutes ($5)"

echo ""
echo "🎉 All WringoAI products created!"
echo "Check your pricing page: https://wringoai.com/pricing"
