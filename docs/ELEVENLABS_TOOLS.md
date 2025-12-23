# ElevenLabs Agent Tool Integration

> **Project:** wringo.ai  
> **Updated:** December 2024  
> **Status:** ✅ Live

This document explains how to configure your ElevenLabs Conversational AI agent (Jason) 
with webhook tools that capture leads and referrals.

---

## Overview

```
User talks to Jason → Jason captures info → Triggers webhook tool → 
→ Wringo Backend → Stores in Supabase → Syncs to modCRM
```

## Webhook Configuration (ElevenLabs Dashboard)

Go to: https://elevenlabs.io/app/conversational-ai/agents

1. Select your agent (Jason)
2. Go to **Tools** tab
3. Add the following Client Tools

---

## Tool 1: capture_lead

**Purpose:** Capture contact information during conversation

### Configuration

| Setting | Value |
|---------|-------|
| **Tool Name** | `capture_lead` |
| **Method** | POST |
| **Endpoint** | `https://wringo-backend.onrender.com/api/webhooks/elevenlabs` |
| **Execution Mode** | Immediate |

### Tool Description (paste this)

```
Capture contact information from the caller. Use this when someone provides their name, 
email, phone number, or expresses interest in services. Extract information naturally 
from conversation - do not interrogate.
```

### Parameters Schema

```json
{
  "name": "capture_lead",
  "description": "Capture contact information from the caller. Use when someone provides their name, email, phone, or expresses interest.",
  "parameters": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "The person's full name"
      },
      "email": {
        "type": "string",
        "description": "Email address"
      },
      "phone": {
        "type": "string",
        "description": "Phone number"
      },
      "company": {
        "type": "string",
        "description": "Company or business name"
      },
      "interest": {
        "type": "string",
        "description": "What they're interested in"
      },
      "notes": {
        "type": "string",
        "description": "Additional conversation notes"
      }
    },
    "required": ["name"]
  }
}
```

---

## Tool 2: capture_referral (AI Referral Engine™)

**Purpose:** Capture referral interest after providing value

### Configuration

| Setting | Value |
|---------|-------|
| **Tool Name** | `capture_referral` |
| **Method** | POST |
| **Endpoint** | `https://wringo-backend.onrender.com/api/referrals/capture` |
| **Execution Mode** | Immediate |

### Tool Description (paste this - IMPORTANT!)

```
Use this tool to capture referral interest only after the user has received value 
and explicitly agrees to share or refer someone.

Ask permission before collecting any referral information. If the user agrees, 
collect only what they are comfortable sharing, such as their own contact details, 
how they prefer to share (link or introduction), or optional referral contact information.

Do not pressure the user. If the user declines, acknowledge respectfully and do not 
revisit referrals during the session. After successful execution, thank the user 
and explain the next steps clearly.
```

### Parameters Schema

```json
{
  "name": "capture_referral",
  "description": "Capture referral interest. Only use after providing value and getting explicit agreement to share.",
  "parameters": {
    "type": "object",
    "properties": {
      "referrer_name": {
        "type": "string",
        "description": "Name of the person making the referral"
      },
      "referrer_contact": {
        "type": "string",
        "description": "Email or phone of the referrer"
      },
      "referral_method": {
        "type": "string",
        "enum": ["share_link", "direct_intro", "provide_contact", "not_sure_yet"],
        "description": "How they want to refer: share_link (want a link to share), direct_intro (will introduce us), provide_contact (giving us contact info), not_sure_yet (interested but uncommitted)"
      },
      "referred_name": {
        "type": "string",
        "description": "Name of the person being referred"
      },
      "referred_contact": {
        "type": "string",
        "description": "Email or phone of the person being referred"
      },
      "notes": {
        "type": "string",
        "description": "Additional context about the referral"
      }
    },
    "required": ["referral_method"]
  }
}
```

### Expected Responses

The tool returns different messages based on `referral_method`:

| Method | Response |
|--------|----------|
| `share_link` | Returns unique referral link (e.g., `https://wringoai.netlify.app/?ref=WRG-8F3A2`) |
| `direct_intro` | Acknowledges and mentions follow-up email |
| `provide_contact` | Thanks them for the connection |
| `not_sure_yet` | No pressure acknowledgment |

---

## Tool 3: book_consultation

**Purpose:** Schedule a call with Pitch Marketing team

### Configuration

| Setting | Value |
|---------|-------|
| **Tool Name** | `book_consultation` |
| **Method** | POST |
| **Endpoint** | `https://wringo-backend.onrender.com/api/webhooks/elevenlabs` |

### Parameters Schema

```json
{
  "name": "book_consultation",
  "description": "Book a consultation call with the Pitch Marketing team.",
  "parameters": {
    "type": "object",
    "properties": {
      "name": { "type": "string", "description": "Caller's name" },
      "email": { "type": "string", "description": "Email for confirmation" },
      "phone": { "type": "string", "description": "Phone number" },
      "preferredDate": { "type": "string", "description": "Preferred date" },
      "preferredTime": { "type": "string", "description": "Preferred time" },
      "topic": { "type": "string", "description": "What they want to discuss" }
    },
    "required": ["name", "topic"]
  }
}
```

---

## Tool 4: send_pricing

**Purpose:** Email pricing information

### Parameters Schema

```json
{
  "name": "send_pricing",
  "description": "Send pricing information via email.",
  "parameters": {
    "type": "object",
    "properties": {
      "name": { "type": "string", "description": "Recipient's name" },
      "email": { "type": "string", "description": "Email to send pricing to" },
      "plan": { "type": "string", "description": "Which plan they're interested in (starter, growth, authority)" },
      "interest": { "type": "string", "description": "Specific interest or use case" }
    },
    "required": ["email"]
  }
}
```

---

## Tool 5: create_support_ticket

**Purpose:** Log support issues

### Parameters Schema

```json
{
  "name": "create_support_ticket",
  "description": "Create a support ticket for issues that need resolution.",
  "parameters": {
    "type": "object",
    "properties": {
      "name": { "type": "string", "description": "Caller's name" },
      "email": { "type": "string", "description": "Contact email" },
      "phone": { "type": "string", "description": "Contact phone" },
      "issue": { "type": "string", "description": "Description of the issue" },
      "priority": { "type": "string", "enum": ["low", "normal", "high"] },
      "product": { "type": "string", "description": "Which product/service" }
    },
    "required": ["issue"]
  }
}
```

---

## Tool 6: transfer_to_human

**Purpose:** Connect to human team member

### Parameters Schema

```json
{
  "name": "transfer_to_human",
  "description": "Transfer the caller to a human team member.",
  "parameters": {
    "type": "object",
    "properties": {
      "reason": { "type": "string", "description": "Why they want to speak to a human" },
      "name": { "type": "string", "description": "Caller's name" },
      "phone": { "type": "string", "description": "Callback number" },
      "urgency": { "type": "string", "enum": ["low", "normal", "high"] }
    },
    "required": ["reason"]
  }
}
```

---

## Agent System Prompt Addition

Add this to Jason's system prompt:

```
## Available Tools

You have tools to help callers:

1. **capture_lead** - Collect contact information when shared
2. **capture_referral** - Capture referral interest (ask permission first!)
3. **book_consultation** - Schedule calls with the team
4. **send_pricing** - Email pricing information
5. **create_support_ticket** - Log issues for resolution
6. **transfer_to_human** - Connect with a human team member

## Referral Guidelines

Only mention referrals AFTER you've provided real value to the caller. Never push.
If they seem happy and engaged, you can gently ask:

"By the way, if you know anyone else who might benefit from AI voice solutions, 
I can give you a unique referral link to share. Would that be helpful?"

If they say yes, use the capture_referral tool with referral_method="share_link"
If they want to introduce someone directly, use referral_method="direct_intro"
If they want to give you a contact, use referral_method="provide_contact"
If they're not sure, use referral_method="not_sure_yet" and move on

Never pressure. Never repeat the ask if they decline.
```

---

## Backend Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/webhooks/elevenlabs` | POST | Main webhook for all tool calls |
| `/api/referrals/capture` | POST | Dedicated referral capture (also works via webhooks) |
| `/api/referrals/stats` | GET | Referral analytics |
| `/api/referrals/lookup/:code` | GET | Validate referral code |
| `/api/leads` | POST | Direct lead capture API |
| `/api/webhooks/pending` | GET | View pending sync items |
| `/health` | GET | Service health check |

---

## Test Commands

### Test Lead Capture

```bash
curl -X POST https://wringo-backend.onrender.com/api/webhooks/elevenlabs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "tool.called",
    "tool_name": "capture_lead",
    "tool_input": {
      "name": "Test User",
      "email": "test@example.com",
      "interest": "voice AI"
    },
    "conversation_id": "test-123"
  }'
```

### Test Referral Capture

```bash
curl -X POST https://wringo-backend.onrender.com/api/referrals/capture \
  -H "Content-Type: application/json" \
  -d '{
    "referrer_name": "Jason Test",
    "referrer_contact": "jason@test.com",
    "referral_method": "share_link",
    "referred_name": "Mike",
    "notes": "Friend who runs a trucking company"
  }'
```

### Check Referral Stats

```bash
curl https://wringo-backend.onrender.com/api/referrals/stats
```

---

## Environment Variables (Render)

```bash
# Wringo.ai Supabase (for leads + referrals tables)
WRINGO_SUPABASE_URL=https://wncmxyswxqmmzrhcrnnh.supabase.co
WRINGO_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduY214eXN3eHFtbXpyaGNybm5oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUxMzM2NSwiZXhwIjoyMDgyMDg5MzY1fQ.WI0OuW30lIbeLL5PXslBhrsarLBiK-YcOTbimzMfwJs

# Container ID for tracking
WRINGO_CONTAINER_ID=wringo-voice-agent

# ElevenLabs
ELEVENLABS_API_KEY=your-api-key

# Telnyx
TELNYX_API_KEY=your-api-key
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER CALLS JASON                          │
│  • Web chat at wringoai.netlify.app                         │
│  • Phone at +1-866-337-1905                                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 JASON PROVIDES VALUE                         │
│  • Answers questions about voice AI                          │
│  • Explains services and pricing                            │
│  • Captures lead info naturally                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              REFERRAL MOMENT (OPTIONAL)                      │
│  If caller is engaged and happy...                          │
│  Jason: "Know anyone else who'd benefit from this?"         │
│  User: "Yeah, my cousin Mike might be interested"           │
│  → capture_referral(method="share_link", referred="Mike")   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   WEBHOOK FIRES                              │
│  POST → wringo-backend.onrender.com                         │
│  • Validates payload                                        │
│  • Generates referral code (WRG-8F3A2)                     │
│  • Stores in Supabase (leads/referrals tables)             │
│  • Returns shareable link to Jason                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE STORAGE                          │
│  Tables:                                                     │
│  • leads - contact info, source tracking                    │
│  • referrals - referral method, codes, attribution          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      modCRM SYNC                             │
│  • Contact created/updated                                   │
│  • Activity logged                                          │
│  • Tags applied (wringo, referral-source)                   │
│  • Follow-up tasks created                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Current Status ✅

- [x] ElevenLabs tools configured
- [x] Webhook connected to Render backend
- [x] Supabase tables ready (run migration)
- [x] Referral code generation working
- [x] Netlify frontend live
- [x] Conversational extraction working
- [x] AI Referral Engine™ enabled

---

## Pricing Tiers (Pitch Marketing Offer)

| Tier | Features | Price |
|------|----------|-------|
| **Starter** | AI voice/chat agent, Lead capture, CRM integration | $149/mo |
| **Growth** | + Referral engine, Shareable links, Tracking dashboard | $299/mo |
| **Authority** | + Custom scripts, Branded experience, Priority tuning | $499/mo |
