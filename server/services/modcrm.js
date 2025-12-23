/**
 * modCRM Integration Service
 * 
 * This module provides a comprehensive interface to your modCRM system.
 * It handles:
 * - Contact management (create, update, search)
 * - Opportunity/deal management
 * - Activity logging
 * - Pipeline management
 * - Webhook subscriptions
 * 
 * Configure via environment variables:
 * - MODCRM_API_URL: Base URL of your modCRM instance
 * - MODCRM_API_KEY: API key for authentication
 */

const MODCRM_API_URL = process.env.MODCRM_API_URL;
const MODCRM_API_KEY = process.env.MODCRM_API_KEY;

/**
 * Base request helper
 */
async function modcrmRequest(endpoint, options = {}) {
  if (!MODCRM_API_URL || !MODCRM_API_KEY) {
    return { 
      success: false, 
      error: "modCRM not configured",
      configured: false 
    };
  }
  
  const url = `${MODCRM_API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MODCRM_API_KEY}`,
        "X-Client": "wringo-voice-agent",
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `HTTP ${response.status}`,
        status: response.status
      };
    }
    
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * ==========================================
 * CONTACTS
 * ==========================================
 */

/**
 * Create a new contact
 */
export async function createContact(contact) {
  return modcrmRequest("/api/contacts", {
    method: "POST",
    body: JSON.stringify({ contact })
  });
}

/**
 * Update an existing contact
 */
export async function updateContact(contactId, updates) {
  return modcrmRequest(`/api/contacts/${contactId}`, {
    method: "PATCH",
    body: JSON.stringify({ contact: updates })
  });
}

/**
 * Get contact by ID
 */
export async function getContact(contactId) {
  return modcrmRequest(`/api/contacts/${contactId}`);
}

/**
 * Search contacts by email, phone, or name
 */
export async function searchContacts(query) {
  const params = new URLSearchParams();
  if (query.email) params.set("email", query.email);
  if (query.phone) params.set("phone", query.phone);
  if (query.name) params.set("name", query.name);
  if (query.tag) params.set("tag", query.tag);
  
  return modcrmRequest(`/api/contacts/search?${params}`);
}

/**
 * Find or create contact (upsert)
 */
export async function findOrCreateContact(contact) {
  // First try to find by email or phone
  if (contact.email) {
    const existing = await searchContacts({ email: contact.email });
    if (existing.success && existing.data?.contacts?.length > 0) {
      const existingContact = existing.data.contacts[0];
      // Update with new data
      await updateContact(existingContact.id, contact);
      return { success: true, data: existingContact, existing: true };
    }
  }
  
  if (contact.phone) {
    const existing = await searchContacts({ phone: contact.phone });
    if (existing.success && existing.data?.contacts?.length > 0) {
      const existingContact = existing.data.contacts[0];
      await updateContact(existingContact.id, contact);
      return { success: true, data: existingContact, existing: true };
    }
  }
  
  // Create new contact
  const result = await createContact(contact);
  return { ...result, existing: false };
}

/**
 * Add tags to contact
 */
export async function addContactTags(contactId, tags) {
  return modcrmRequest(`/api/contacts/${contactId}/tags`, {
    method: "POST",
    body: JSON.stringify({ tags })
  });
}

/**
 * ==========================================
 * OPPORTUNITIES / DEALS
 * ==========================================
 */

/**
 * Create opportunity
 */
export async function createOpportunity(opportunity) {
  return modcrmRequest("/api/opportunities", {
    method: "POST",
    body: JSON.stringify({ opportunity })
  });
}

/**
 * Update opportunity
 */
export async function updateOpportunity(opportunityId, updates) {
  return modcrmRequest(`/api/opportunities/${opportunityId}`, {
    method: "PATCH",
    body: JSON.stringify({ opportunity: updates })
  });
}

/**
 * Move opportunity to stage
 */
export async function moveOpportunityStage(opportunityId, stage) {
  return updateOpportunity(opportunityId, { stage });
}

/**
 * ==========================================
 * ACTIVITIES
 * ==========================================
 */

/**
 * Log an activity for a contact
 */
export async function logActivity(contactId, activity) {
  return modcrmRequest(`/api/contacts/${contactId}/activities`, {
    method: "POST",
    body: JSON.stringify({
      activity: {
        type: activity.type || "note",
        subject: activity.subject,
        description: activity.description,
        metadata: activity.metadata,
        timestamp: activity.timestamp || new Date().toISOString()
      }
    })
  });
}

/**
 * Log a voice conversation
 */
export async function logVoiceConversation(contactId, conversation) {
  return logActivity(contactId, {
    type: "voice_call",
    subject: `Voice Conversation - ${conversation.agentName || "Wringo"}`,
    description: conversation.summary || "Voice conversation via Wringo AI",
    metadata: {
      conversationId: conversation.id,
      duration: conversation.duration,
      transcript: conversation.transcript,
      sentiment: conversation.sentiment,
      topics: conversation.topics,
      source: "wringo_voice_agent"
    }
  });
}

/**
 * ==========================================
 * TASKS
 * ==========================================
 */

/**
 * Create a task
 */
export async function createTask(task) {
  return modcrmRequest("/api/tasks", {
    method: "POST",
    body: JSON.stringify({
      task: {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        priority: task.priority || "normal",
        assignedTo: task.assignedTo,
        contactId: task.contactId,
        opportunityId: task.opportunityId,
        type: task.type || "follow_up"
      }
    })
  });
}

/**
 * Create follow-up task from voice conversation
 */
export async function createFollowUpTask(contactId, details) {
  return createTask({
    title: `Follow up: ${details.topic || "Voice conversation"}`,
    description: details.notes || "Follow up from Wringo voice conversation",
    dueDate: details.dueDate || getNextBusinessDay(),
    priority: details.priority || "normal",
    contactId,
    type: "follow_up"
  });
}

/**
 * ==========================================
 * PIPELINES
 * ==========================================
 */

/**
 * Get available pipelines
 */
export async function getPipelines() {
  return modcrmRequest("/api/pipelines");
}

/**
 * Get pipeline stages
 */
export async function getPipelineStages(pipelineId) {
  return modcrmRequest(`/api/pipelines/${pipelineId}/stages`);
}

/**
 * ==========================================
 * AUTOMATIONS / WORKFLOWS
 * ==========================================
 */

/**
 * Trigger a workflow/automation
 */
export async function triggerWorkflow(workflowId, data) {
  return modcrmRequest(`/api/workflows/${workflowId}/trigger`, {
    method: "POST",
    body: JSON.stringify(data)
  });
}

/**
 * Trigger workflow by name
 */
export async function triggerWorkflowByName(workflowName, data) {
  return modcrmRequest("/api/workflows/trigger", {
    method: "POST",
    body: JSON.stringify({
      workflowName,
      data
    })
  });
}

/**
 * ==========================================
 * CONVENIENCE FUNCTIONS
 * ==========================================
 */

/**
 * Full lead capture flow - creates contact, logs activity, creates opportunity if needed
 */
export async function captureLeadFull(leadData) {
  // 1. Find or create contact
  const contactResult = await findOrCreateContact({
    firstName: leadData.firstName || leadData.name?.split(" ")[0],
    lastName: leadData.lastName || leadData.name?.split(" ").slice(1).join(" "),
    email: leadData.email,
    phone: leadData.phone,
    company: leadData.company,
    source: leadData.source || "wringo_voice_agent",
    tags: ["wringo", leadData.interest].filter(Boolean),
    customFields: leadData.customFields
  });
  
  if (!contactResult.success) {
    return contactResult;
  }
  
  const contactId = contactResult.data?.id || contactResult.data?.contact?.id;
  const results = { contact: contactResult };
  
  // 2. Log the conversation as activity
  if (leadData.conversationId || leadData.transcript) {
    results.activity = await logVoiceConversation(contactId, {
      id: leadData.conversationId,
      duration: leadData.duration,
      transcript: leadData.transcript,
      summary: leadData.summary
    });
  }
  
  // 3. Create opportunity if there's interest
  if (leadData.interest && leadData.createOpportunity !== false) {
    results.opportunity = await createOpportunity({
      name: `${leadData.name || leadData.email} - ${leadData.interest}`,
      contactId,
      stage: "new_lead",
      source: "wringo_voice_agent",
      value: leadData.estimatedValue,
      notes: leadData.notes
    });
  }
  
  // 4. Create follow-up task if requested
  if (leadData.createFollowUp) {
    results.task = await createFollowUpTask(contactId, {
      topic: leadData.interest,
      notes: leadData.followUpNotes,
      priority: leadData.followUpPriority
    });
  }
  
  return {
    success: true,
    contactId,
    isNewContact: !contactResult.existing,
    results
  };
}

/**
 * Get next business day (skip weekends)
 */
function getNextBusinessDay() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  
  // Skip Saturday (6) and Sunday (0)
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  
  return date.toISOString().split("T")[0];
}

/**
 * Check if modCRM is configured
 */
export function isConfigured() {
  return Boolean(MODCRM_API_URL && MODCRM_API_KEY);
}

/**
 * Get configuration status
 */
export function getStatus() {
  return {
    configured: isConfigured(),
    apiUrl: MODCRM_API_URL ? MODCRM_API_URL.replace(/\/+$/, "") : null
  };
}

export default {
  // Contacts
  createContact,
  updateContact,
  getContact,
  searchContacts,
  findOrCreateContact,
  addContactTags,
  
  // Opportunities
  createOpportunity,
  updateOpportunity,
  moveOpportunityStage,
  
  // Activities
  logActivity,
  logVoiceConversation,
  
  // Tasks
  createTask,
  createFollowUpTask,
  
  // Pipelines
  getPipelines,
  getPipelineStages,
  
  // Automations
  triggerWorkflow,
  triggerWorkflowByName,
  
  // Convenience
  captureLeadFull,
  
  // Status
  isConfigured,
  getStatus
};
