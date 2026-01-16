/**
 * Leads Router - Direct lead capture API
 * 
 * This provides REST endpoints for:
 * - Web forms
 * - External integrations
 * - Manual lead entry
 * 
 * All leads flow to Level 10 CRM as the master record
 */

import { Router } from "express";

const router = Router();

// In-memory leads store (for demo - use DB in production)
const leadsStore = [];

/**
 * POST /api/leads
 * Create a new lead from any source
 */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      firstName,
      lastName,
      email,
      phone,
      company,
      interest,
      source,
      notes,
      tags,
      customFields
    } = req.body;
    
    // Validate required fields
    if (!email && !phone) {
      return res.status(400).json({
        error: "Either email or phone is required"
      });
    }
    
    // Build lead object
    const lead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      firstName: firstName || name?.split(" ")[0] || "",
      lastName: lastName || name?.split(" ").slice(1).join(" ") || "",
      email: email?.toLowerCase(),
      phone: normalizePhone(phone),
      company,
      interest,
      source: source || "api",
      notes,
      tags: tags || [],
      customFields: customFields || {},
      status: "new",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store locally
    leadsStore.push(lead);
    
    // Sync to Level 10 CRM
    const crmResult = await syncLeadToModCRM(lead);
    
    console.log(`[Lead Created] ${lead.id} - ${lead.email || lead.phone}`);
    
    res.status(201).json({
      success: true,
      lead: {
        id: lead.id,
        email: lead.email,
        phone: lead.phone,
        status: lead.status
      },
      level10crm: crmResult
    });
  } catch (err) {
    console.error("[Lead Create Error]", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/leads
 * List all leads (with optional filters)
 */
router.get("/", (req, res) => {
  const { status, source, limit = 50, offset = 0 } = req.query;
  
  let filtered = [...leadsStore];
  
  if (status) {
    filtered = filtered.filter(l => l.status === status);
  }
  if (source) {
    filtered = filtered.filter(l => l.source === source);
  }
  
  // Sort by most recent
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const paginated = filtered.slice(Number(offset), Number(offset) + Number(limit));
  
  res.json({
    total: filtered.length,
    limit: Number(limit),
    offset: Number(offset),
    leads: paginated
  });
});

/**
 * GET /api/leads/:id
 * Get a single lead by ID
 */
router.get("/:id", (req, res) => {
  const lead = leadsStore.find(l => l.id === req.params.id);
  
  if (!lead) {
    return res.status(404).json({ error: "Lead not found" });
  }
  
  res.json({ lead });
});

/**
 * PATCH /api/leads/:id
 * Update a lead
 */
router.patch("/:id", async (req, res) => {
  const lead = leadsStore.find(l => l.id === req.params.id);
  
  if (!lead) {
    return res.status(404).json({ error: "Lead not found" });
  }
  
  const updates = req.body;
  const allowedFields = [
    "firstName", "lastName", "email", "phone", "company",
    "interest", "notes", "tags", "status", "customFields"
  ];
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      lead[field] = updates[field];
    }
  }
  
  lead.updatedAt = new Date().toISOString();
  
  // Sync update to Level 10 CRM
  await syncLeadToModCRM(lead, true);
  
  res.json({ success: true, lead });
});

/**
 * POST /api/leads/:id/convert
 * Convert lead to opportunity/customer
 */
router.post("/:id/convert", async (req, res) => {
  const lead = leadsStore.find(l => l.id === req.params.id);
  
  if (!lead) {
    return res.status(404).json({ error: "Lead not found" });
  }
  
  const { opportunityName, value, stage } = req.body;
  
  lead.status = "converted";
  lead.convertedAt = new Date().toISOString();
  lead.opportunity = {
    name: opportunityName || `${lead.firstName} ${lead.lastName} - ${lead.interest}`,
    value,
    stage: stage || "qualified"
  };
  lead.updatedAt = new Date().toISOString();
  
  // Create opportunity in Level 10 CRM
  await createOpportunityInModCRM(lead);
  
  res.json({ success: true, lead });
});

/**
 * POST /api/leads/webhook
 * Webhook endpoint for external form submissions
 */
router.post("/webhook", async (req, res) => {
  // Support various form payload formats
  const data = req.body;
  
  const lead = {
    name: data.name || data.full_name || `${data.first_name || ""} ${data.last_name || ""}`.trim(),
    email: data.email || data.email_address,
    phone: data.phone || data.phone_number || data.mobile,
    company: data.company || data.organization || data.business_name,
    interest: data.interest || data.service || data.inquiry_type,
    source: data.source || data.utm_source || "webhook",
    notes: data.message || data.notes || data.comments,
    customFields: {
      formId: data.form_id,
      pageUrl: data.page_url || data.referrer,
      utmMedium: data.utm_medium,
      utmCampaign: data.utm_campaign
    }
  };
  
  // Create the lead
  const id = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const fullLead = {
    id,
    ...lead,
    firstName: lead.name?.split(" ")[0] || "",
    lastName: lead.name?.split(" ").slice(1).join(" ") || "",
    status: "new",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  leadsStore.push(fullLead);
  await syncLeadToModCRM(fullLead);
  
  console.log(`[Webhook Lead] ${id} - ${fullLead.email || fullLead.phone}`);
  
  // Return success (some forms expect specific format)
  res.json({ success: true, id });
});

/**
 * Normalize phone number format
 */
function normalizePhone(phone) {
  if (!phone) return null;
  // Strip everything except digits
  const digits = phone.replace(/\D/g, "");
  // Add US country code if missing
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

/**
 * Sync lead to Level 10 CRM
 */
async function syncLeadToModCRM(lead, isUpdate = false) {
  const LEVEL10_CRM_API_URL = process.env.LEVEL10_CRM_API_URL;
  const LEVEL10_CRM_API_KEY = process.env.LEVEL10_CRM_API_KEY;

  if (!LEVEL10_CRM_API_URL || !LEVEL10_CRM_API_KEY) {
    console.log("[Level 10 CRM] Not configured - lead stored locally only");
    return { synced: false, reason: "not_configured" };
  }
  
  try {
    const endpoint = isUpdate && lead.modcrmId 
      ? `${LEVEL10_CRM_API_URL}/api/contacts/${lead.modcrmId}`
      : `${LEVEL10_CRM_API_URL}/api/contacts`;
    
    const response = await fetch(endpoint, {
      method: isUpdate && lead.modcrmId ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LEVEL10_CRM_API_KEY}`,
        "X-Source": "wringo-leads-api"
      },
      body: JSON.stringify({
        contact: {
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          source: lead.source,
          tags: ["wringo", lead.interest, ...( lead.tags || [])].filter(Boolean),
          customFields: {
            wringoLeadId: lead.id,
            interest: lead.interest,
            notes: lead.notes,
            ...lead.customFields
          }
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Level 10 CRM API: ${response.status}`);
    }
    
    const result = await response.json();
    lead.modcrmId = result.contact?.id || result.id;
    
    return { synced: true, modcrmId: lead.modcrmId };
  } catch (err) {
    console.error("[Level 10 CRM Sync]", err.message);
    return { synced: false, error: err.message };
  }
}

/**
 * Create opportunity in Level 10 CRM
 */
async function createOpportunityInModCRM(lead) {
  const LEVEL10_CRM_API_URL = process.env.LEVEL10_CRM_API_URL;
  const LEVEL10_CRM_API_KEY = process.env.LEVEL10_CRM_API_KEY;

  if (!LEVEL10_CRM_API_URL || !LEVEL10_CRM_API_KEY || !lead.modcrmId) {
    return { created: false };
  }
  
  try {
    const response = await fetch(`${LEVEL10_CRM_API_URL}/api/opportunities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LEVEL10_CRM_API_KEY}`
      },
      body: JSON.stringify({
        opportunity: {
          name: lead.opportunity.name,
          value: lead.opportunity.value,
          stage: lead.opportunity.stage,
          contactId: lead.modcrmId,
          source: "wringo_converted"
        }
      })
    });
    
    const result = await response.json();
    return { created: true, opportunityId: result.opportunity?.id };
  } catch (err) {
    console.error("[Level 10 CRM Opportunity]", err.message);
    return { created: false, error: err.message };
  }
}

export default router;
