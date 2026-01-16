# 🎙️ WRINGO.AI FREE AI RECEPTIONIST — USAGE LIMITATIONS

**Date:** January 16, 2026  
**Platform:** https://wringoai.com  
**Target:** ChatGPT Integration Brief  

---

## EXECUTIVE SUMMARY

WringoAI provides a **FREE AI Receptionist** (Jason) that handles inbound calls with basic capabilities. This document defines the **strict limitations** of the free tier and the upgrade path to paid subscriptions for advanced features.

---

## FREE TIER CAPABILITIES (NO PAYMENT REQUIRED)

### ✅ What's Included FREE
- **24/7 AI Receptionist** answers calls on your dedicated phone number
- **Basic Call Handling:**
  - Greets callers professionally
  - Answers common business questions (hours, location, services)
  - Takes messages and captures caller information
  - Routes calls to appropriate departments
- **Voice Technology:** ElevenLabs conversational AI with natural speech
- **Call Duration:** Up to **5 minutes per call**
- **Monthly Limit:** **50 calls per month**
- **Features:**
  - Single voice (Jason - professional male voice)
  - Basic call transcription
  - Email notifications for messages
  - Simple dashboard with call logs

### ❌ What's NOT Included (Paid Only)
- **NO Appointment Scheduling** — Cannot book appointments to calendars
- **NO CRM Integration** — No Salesforce, HubSpot, Pipedrive, etc.
- **NO Custom Knowledge Base** — Cannot train on your specific business data
- **NO Custom Voice Cloning** — Stuck with default Jason voice
- **NO Advanced Call Routing** — No IVR trees, skill-based routing
- **NO Workflow Automation** — No Zapier, Make, or custom webhooks
- **NO Multi-Language Support** — English only
- **NO Call Recording Storage** — Recordings deleted after 7 days
- **NO Priority Support** — Community support only
- **NO White-Label** — WringoAI branding on all calls

---

## PAID TIER STRUCTURE (STRIPE PRICING)

### 1. **WringoAI Creator** — $19/month
**Target:** Freelancers & Solopreneurs

**Unlocks:**
- **100 calls/month** (up from 50)
- **10 minutes per call** (up from 5)
- **Basic Calendar Integration** (Google Calendar, Outlook)
- **Simple Appointment Booking** (1 calendar, 1 service type)
- **Call Recording Storage:** 30 days
- **Email Support:** 48-hour response

**Still Limited:**
- ❌ NO CRM integration
- ❌ NO custom knowledge base
- ❌ NO voice cloning
- ❌ NO advanced routing

---

### 2. **Pro Basic** — $49/month
**Target:** Small Businesses (1-10 employees)

**Unlocks:**
- **500 calls/month**
- **30 minutes per call**
- **Full CRM Integration** (Salesforce, HubSpot, Pipedrive, Zoho)
- **Custom Knowledge Base** (upload PDFs, website scraping, FAQs)
- **Multi-Calendar Booking** (up to 5 calendars)
- **Advanced Call Routing** (department-based, business hours)
- **Call Recording Storage:** 90 days
- **Zapier Integration** (basic workflows)
- **Priority Email Support:** 24-hour response

**Still Limited:**
- ❌ NO voice cloning
- ❌ NO multi-language
- ❌ NO white-label

---

### 3. **Pro Plus** — $99/month
**Target:** Growing Businesses (10-50 employees)

**Unlocks:**
- **2,000 calls/month**
- **60 minutes per call**
- **Custom Voice Cloning** (use your own voice for the AI)
- **Multi-Language Support** (20+ languages)
- **Advanced Workflow Automation** (webhooks, custom API access)
- **Unlimited Calendars & Service Types**
- **White-Label Option** (remove WringoAI branding)
- **Call Recording Storage:** 1 year
- **Live Chat Support:** Real-time assistance
- **Dedicated Account Manager**

---

## ONE-TIME PURCHASES (À LA CARTE)

For users who don't need monthly subscriptions, we offer **pay-per-use** options:

| Feature | Price | Description |
|---------|-------|-------------|
| **Custom Voice Clone** | $149 | One-time creation of a custom AI voice |
| **Knowledge Base Setup** | $99 | Professional setup of your business FAQ database |
| **CRM Integration Setup** | $199 | One-time connection to Salesforce, HubSpot, etc. |
| **Call Bundle (100 calls)** | $29 | Add 100 extra calls to any plan |
| **Call Bundle (500 calls)** | $99 | Add 500 extra calls to any plan |

---

## CREDIT BUNDLES (PREPAID)

Users can purchase **prepaid credits** that work across all WringoAI services:

| Bundle | Price | Credits | Best For |
|--------|-------|---------|----------|
| **Starter Pack** | $50 | 100 credits | Testing paid features |
| **Growth Pack** | $200 | 450 credits | Small businesses |
| **Business Pack** | $500 | 1,200 credits | High-volume users |

**Credit Usage:**
- 1 credit = 1 AI receptionist call minute
- 10 credits = 1 custom voice generation
- 5 credits = 1 knowledge base query

---

## ENFORCEMENT RULES (CRITICAL FOR CHATGPT)

### 🚨 When User Requests Paid Feature on Free Tier:

**Scenario 1: User asks to schedule appointment**
```
❌ BLOCK ACTION
✉️ Response: 
"I'd love to help you schedule that appointment, but appointment booking 
requires the WringoAI Creator plan ($19/month) or higher. 

Would you like me to send you a link to upgrade?"
```

**Scenario 2: User asks to integrate CRM**
```
❌ BLOCK ACTION
✉️ Response:
"CRM integration is available on the Pro Basic plan ($49/month) or higher. 
This includes Salesforce, HubSpot, Pipedrive, and more.

Would you like to upgrade to unlock this feature?"
```

**Scenario 3: User exceeds 50 calls/month**
```
❌ BLOCK NEW CALLS
✉️ Response:
"You've reached your monthly limit of 50 free calls. Your next call will 
be available on [next billing cycle date].

To continue receiving calls now, upgrade to WringoAI Creator for $19/month 
(100 calls) or purchase a Call Bundle."
```

---

## UPGRADE FLOW (HOW TO CONVERT USERS)

### Step 1: Detect Feature Request
- User asks for appointment booking → Flag as "paid feature"
- User asks for CRM sync → Flag as "paid feature"
- User asks for custom voice → Flag as "paid feature"

### Step 2: Present Options
```
"This feature requires [PLAN NAME] ($X/month).

Here's what you'll get:
✅ [Feature 1]
✅ [Feature 2]
✅ [Feature 3]

🔗 Upgrade now: https://wringoai.com/pricing
```

### Step 3: Log Conversion Attempt
- Track in Supabase: `entitlement_blocks` table
- Fields: `user_id`, `blocked_feature`, `suggested_plan`, `timestamp`
- Use for retargeting campaigns

---

## TECHNICAL IMPLEMENTATION (FOR CHATGPT)

### Check Entitlement Before Action
```javascript
const entitlement = await checkEntitlement(userId, 'calendar_booking');

if (!entitlement.allowed) {
  return {
    blocked: true,
    reason: entitlement.reason,
    upgrade_url: 'https://wringoai.com/pricing',
    required_plan: entitlement.required_plan
  };
}
```

### Entitlement Keys (Reference)
```json
{
  "calendar_booking": "Creator+",
  "crm_integration": "Pro Basic+",
  "voice_cloning": "Pro Plus",
  "knowledge_base": "Pro Basic+",
  "call_recording": "Creator+",
  "multi_language": "Pro Plus",
  "white_label": "Pro Plus",
  "workflow_automation": "Pro Plus"
}
```

---

## MESSAGING GUIDELINES (CHATGPT RESPONSES)

### ✅ DO:
- Be empathetic: "I understand you need that feature..."
- Show value: "With Pro Basic, you'll also get X, Y, Z..."
- Make it easy: "Click here to upgrade in 30 seconds"
- Offer alternatives: "You can also purchase a one-time setup for $X"

### ❌ DON'T:
- Sound robotic: "Feature not available on your plan."
- Be pushy: "You MUST upgrade NOW!"
- Hide pricing: Always show the cost upfront
- Overpromise: Only mention features they'll actually get

---

## EXAMPLE CONVERSATIONS

### Example 1: Appointment Booking Request
```
User: "Can you book me for a haircut tomorrow at 2pm?"

AI: "I'd be happy to help! Just so you know, appointment booking 
requires the WringoAI Creator plan ($19/month), which also includes:
✅ 100 calls per month
✅ 10-minute call limit
✅ Google Calendar sync
✅ 30-day call recordings

Would you like to upgrade now, or should I just take a message 
for your team to call you back?"
```

### Example 2: CRM Integration
```
User: "Add this lead to my Salesforce account."

AI: "CRM integration is available on the Pro Basic plan ($49/month). 
With that, I can automatically sync all calls to Salesforce, HubSpot, 
Pipedrive, and more.

For now, I've saved this lead to your WringoAI dashboard. Would you 
like me to send you the upgrade link?"
```

### Example 3: Monthly Limit Reached
```
User: [Calls on day 51]

AI: "Hi! You've reached your 50 free calls for this month. Your next 
batch of free calls will be available on February 1st.

To keep your receptionist active now, you can:
🔹 Upgrade to WringoAI Creator ($19/month) — 100 calls
🔹 Buy a Call Bundle ($29 for 100 calls)

Which would you prefer?"
```

---

## ANALYTICS TO TRACK

Track these metrics to optimize conversion:

1. **Feature Block Rate** — How often do free users hit limitations?
2. **Most Requested Paid Features** — Which upgrades are users asking for?
3. **Conversion Rate** — % of blocked users who upgrade
4. **Churn Reasons** — Why do free users abandon?
5. **Upgrade Path** — Free → Creator → Pro Basic → Pro Plus

---

## SUMMARY FOR CHATGPT

**Free Tier = 50 calls/month, 5 min/call, NO scheduling, NO CRM, NO custom voice**

When a free user requests a paid feature:
1. **Block the action** politely
2. **Explain which plan unlocks it**
3. **Show pricing & benefits**
4. **Offer upgrade link:** https://wringoai.com/pricing
5. **Log the block** for analytics

**Goal:** Convert 10% of blocked users to paid plans within 30 days.

---

## CONTACT & SUPPORT

- **Pricing Page:** https://wringoai.com/pricing
- **Dashboard:** https://wringoai.com/dashboard (if logged in)
- **Support:** support@wringoai.com (paid users only)
- **Community:** Discord (free tier support)

---

**End of Document**
