# Owner Manual — Wringo.ai

> **Platform:** Wringo.ai  
> **Category:** Communications & Logistics  
> **Status:** 🔧 In Development

---

## Platform Purpose

Wringo.ai is an AI voice agent platform that enables businesses to create and deploy automated phone agents for customer communications.

---

## Who This Platform Serves

- **Primary users:** Businesses needing automated phone support
- **Business owners:** Companies wanting AI-powered call handling
- **End users:** Callers interacting with AI agents

---

## What This Platform Does NOT Control

| Concern | Handled By |
|---------|------------|
| Billing | Self (per-call metering) |
| Enforcement | Usage-based limits |
| Authentication | Supabase Auth |
| Device Runtime | N/A — telephony based |
| Voice Synthesis | ElevenLabs integration |
| Telephony | Telnyx integration |

---

## Billing & Enforcement Source

**Billing Model:** Per-call (metered minutes)

**Billing Authority:** Self-managed usage tracking

**Enforcement Model:** Usage quotas and rate limits

**Enforcement Authority:** Platform-level enforcement

---

## Key Integrations

- Telnyx (telephony)
- ElevenLabs (voice synthesis)
- Supabase (data/auth)

---

*Last updated: January 1, 2026*
