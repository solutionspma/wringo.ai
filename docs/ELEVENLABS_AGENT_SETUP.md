# ElevenLabs Agent Configuration

This document explains how to configure your ElevenLabs Conversational AI agent (Jason) 
to take real actions via webhook tools that connect to Pitch Marketing and Level 10 CRM.

## Overview

```
User talks to Jason → Jason captures info → Triggers webhook tool → 
→ Wringo Backend → Routes to Pitch Marketing + Level 10 CRM
```

## Setting Up Agent Tools in ElevenLabs

Go to: https://elevenlabs.io/app/conversational-ai/agents

1. Select your agent (Jason)
2. Go to **Tools** tab
3. Add the following **Client Tools** (webhook-based tools)

---

## Tool Configurations

### 1. capture_lead

**Purpose:** Capture visitor information during conversation

```json
{
  "name": "capture_lead",
  "description": "Capture contact information from the caller. Use this when someone provides their name, email, phone number, or expresses interest in services.",
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
        "description": "What they're interested in (e.g., 'voice AI', 'website development', 'pricing')"
      },
      "notes": {
        "type": "string",
        "description": "Any additional notes about the conversation"
      }
    },
    "required": ["name"]
  }
}
```

**Webhook URL:** `https://wringo-backend.onrender.com/api/webhooks/elevenlabs`

---

### 2. book_consultation

**Purpose:** Schedule a call with Pitch Marketing team

```json
{
  "name": "book_consultation",
  "description": "Book a consultation call with the Pitch Marketing team. Use when someone wants to schedule a meeting or discuss a project.",
  "parameters": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "The person's name"
      },
      "email": {
        "type": "string",
        "description": "Email for confirmation"
      },
      "phone": {
        "type": "string",
        "description": "Phone number"
      },
      "preferredDate": {
        "type": "string",
        "description": "Preferred date (e.g., 'next Tuesday', 'January 5th')"
      },
      "preferredTime": {
        "type": "string",
        "description": "Preferred time (e.g., 'morning', '2pm', 'afternoon')"
      },
      "topic": {
        "type": "string",
        "description": "What they want to discuss"
      }
    },
    "required": ["name", "email", "topic"]
  }
}
```

---

### 3. send_pricing

**Purpose:** Send pricing information via email

```json
{
  "name": "send_pricing",
  "description": "Send pricing information to the caller via email. Use when someone asks about pricing or costs.",
  "parameters": {
    "type": "object",
    "properties": {
      "email": {
        "type": "string",
        "description": "Email to send pricing to"
      },
      "name": {
        "type": "string",
        "description": "Person's name"
      },
      "plan": {
        "type": "string",
        "enum": ["starter", "pro", "enterprise", "all"],
        "description": "Which pricing plan they're interested in"
      },
      "interest": {
        "type": "string",
        "description": "Specific service interest (voice AI, websites, etc.)"
      }
    },
    "required": ["email"]
  }
}
```

---

### 4. create_support_ticket

**Purpose:** Create a support ticket for issues

```json
{
  "name": "create_support_ticket",
  "description": "Create a support ticket for technical issues or help requests. Use when someone has a problem or needs assistance.",
  "parameters": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "Person's name"
      },
      "email": {
        "type": "string",
        "description": "Contact email"
      },
      "phone": {
        "type": "string",
        "description": "Contact phone"
      },
      "issue": {
        "type": "string",
        "description": "Description of the issue or problem"
      },
      "priority": {
        "type": "string",
        "enum": ["low", "normal", "high", "urgent"],
        "description": "How urgent is the issue"
      },
      "product": {
        "type": "string",
        "description": "Which product or service (Wringo, website, Level 10 CRM, etc.)"
      }
    },
    "required": ["issue"]
  }
}
```

---

### 5. transfer_to_human

**Purpose:** Request transfer to a human agent

```json
{
  "name": "transfer_to_human",
  "description": "Transfer the caller to a human team member. Use when explicitly requested or when you cannot help with something.",
  "parameters": {
    "type": "object",
    "properties": {
      "reason": {
        "type": "string",
        "description": "Why they want to speak to a human"
      },
      "name": {
        "type": "string",
        "description": "Caller's name"
      },
      "phone": {
        "type": "string",
        "description": "Callback number"
      },
      "urgency": {
        "type": "string",
        "enum": ["low", "normal", "high"],
        "description": "How urgent is the request"
      }
    },
    "required": ["reason"]
  }
}
```

---

### 6. check_availability

**Purpose:** Check available time slots

```json
{
  "name": "check_availability",
  "description": "Check available appointment times for a specific date. Use before booking to see what's open.",
  "parameters": {
    "type": "object",
    "properties": {
      "date": {
        "type": "string",
        "description": "The date to check (e.g., 'tomorrow', 'January 5th')"
      },
      "service": {
        "type": "string",
        "description": "Type of appointment (consultation, demo, support call)"
      }
    },
    "required": ["date"]
  }
}
```

---

## Agent System Prompt Update

Add this to Jason's system prompt so he knows how to use the tools:

```
## Actions You Can Take

You have access to several tools to help callers:

1. **capture_lead** - Collect their contact information when they share it
2. **book_consultation** - Schedule a call with our team
3. **send_pricing** - Email them pricing information
4. **create_support_ticket** - Log issues that need resolution
5. **transfer_to_human** - Connect them with a human team member
6. **check_availability** - Check open appointment times

When someone shares their information or makes a request:
- Use the appropriate tool immediately
- Confirm the action was taken
- Continue the conversation naturally

Always capture lead information when someone:
- Shares their name and email/phone
- Expresses interest in a service
- Asks about pricing
- Wants to schedule something

Route to Pitch Marketing when someone wants:
- Custom development work
- Enterprise solutions  
- Strategic consulting
- Agency partnership discussions
```

---

## Environment Variables for Backend

Add these to your Render service:

```
# Level 10 CRM Integration (level10crm.com)
LEVEL10_CRM_API_URL=https://level10crm.com/api
LEVEL10_CRM_API_KEY=your-level10-api-key

# Pitch Marketing Notifications
PM_WEBHOOK_URL=https://pitchmarketing.agency/api/webhooks/wringo
```

---

## Testing the Integration

1. **Test webhook endpoint:**
```bash
curl -X POST https://wringo-backend.onrender.com/api/webhooks/elevenlabs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "tool.called",
    "tool_name": "capture_lead",
    "tool_input": {
      "name": "Test User",
      "email": "test@example.com",
      "interest": "voice AI demo"
    },
    "conversation_id": "test-123"
  }'
```

2. **Test leads API:**
```bash
curl -X POST https://wringo-backend.onrender.com/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lead",
    "email": "lead@example.com",
    "phone": "+15551234567",
    "interest": "voice AI",
    "source": "test"
  }'
```

3. **Check pending items:**
```bash
curl https://wringo-backend.onrender.com/api/webhooks/pending
```

---

## The Complete Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                             │
├─────────────────────────────────────────────────────────────────────┤
│  1. User visits wringoai.netlify.app or calls +1-866-337-1905       │
│  2. Connects to Jason (ElevenLabs Voice Agent)                       │
│  3. Conversation happens...                                          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      JASON CAPTURES INFO                             │
├─────────────────────────────────────────────────────────────────────┤
│  Jason: "I'd be happy to send you our pricing. What's the best      │
│          email to reach you?"                                        │
│  User:  "Sure, it's john@company.com"                               │
│  Jason: [Triggers send_pricing tool with email]                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      WEBHOOK FIRES                                   │
├─────────────────────────────────────────────────────────────────────┤
│  POST https://wringo-backend.onrender.com/api/webhooks/elevenlabs   │
│  {                                                                   │
│    "type": "tool.called",                                           │
│    "tool_name": "send_pricing",                                     │
│    "tool_input": { "email": "john@company.com", "plan": "pro" }     │
│  }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    WRINGO BACKEND PROCESSES                          │
├─────────────────────────────────────────────────────────────────────┤
│  1. Log the action                                                   │
│  2. Sync to Level 10 CRM (create/update contact)                    │
│  3. Trigger email send (SendGrid/Mailgun)                           │
│  4. Notify Pitch Marketing team if needed                           │
│  5. Return success to ElevenLabs                                    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      LEVEL 10 CRM (MASTER)                           │
├─────────────────────────────────────────────────────────────────────┤
│  - Contact created/updated                                           │
│  - Tags: [wringo, pricing_requested]                                │
│  - Activity logged: "Requested Pro pricing via Wringo"              │
│  - Opportunity created if high intent                               │
│  - Follow-up task created for sales team                            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PITCH MARKETING TEAM                             │
├─────────────────────────────────────────────────────────────────────┤
│  - Receives notification of new lead                                 │
│  - Sees full context in Level 10 CRM                                │
│  - Can follow up with personalized outreach                         │
│  - Track ROI from Wringo voice agent                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Configure Level 10 CRM API** - You'll need to provide your Level 10 CRM API URL and key
2. **Set up ElevenLabs tools** - Add the tools in the ElevenLabs dashboard
3. **Connect email service** - Add SendGrid/Mailgun for automated emails
4. **Set up Pitch Marketing webhook** - Create endpoint to receive notifications
