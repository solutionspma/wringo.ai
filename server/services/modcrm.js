/**
 * modCRM Integration Service
 * 
 * Connects directly to modCRM's Supabase backend for:
 * - Contact/lead management
 * - Activity logging
 * - Opportunity tracking
 * 
 * Environment variables:
 * - MODCRM_SUPABASE_URL: Supabase project URL
 * - MODCRM_SUPABASE_SERVICE_KEY: Service role key
 * - MODCRM_CONTAINER_ID: Container ID for Wringo leads
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.MODCRM_SUPABASE_URL || 'https://jchwuzfsztaxeautzprz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.MODCRM_SUPABASE_SERVICE_KEY;
const CONTAINER_ID = process.env.MODCRM_CONTAINER_ID || 'wringo-voice-agent';

let supabase = null;

function getClient() {
  if (!supabase && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false }
    });
  }
  return supabase;
}

/**
 * Check if modCRM is configured
 */
export function isConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}

/**
 * Get configuration status
 */
export function getStatus() {
  return {
    configured: isConfigured(),
    supabaseUrl: SUPABASE_URL,
    containerId: CONTAINER_ID
  };
}

/**
 * Normalize phone number
 */
function normalizePhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

// ==========================================
// CONTACTS
// ==========================================

/**
 * Create a new contact/lead
 */
export async function createContact(contact) {
  const client = getClient();
  if (!client) return { success: false, error: 'modCRM not configured' };
  
  try {
    const { data, error } = await client
      .from('crm_records')
      .insert({
        container_id: CONTAINER_ID,
        record_type: contact.recordType || 'lead',
        first_name: contact.firstName,
        last_name: contact.lastName,
        email: contact.email?.toLowerCase(),
        phone: normalizePhone(contact.phone),
        source: contact.source || 'wringo_voice_agent',
        stage: contact.stage || 'new',
        data: {
          company: contact.company,
          interest: contact.interest,
          notes: contact.notes,
          tags: contact.tags || ['wringo'],
          ...contact.customFields,
          createdBy: 'wringo',
          createdAt: new Date().toISOString()
        }
      })
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data: { contact: data } };
  } catch (err) {
    console.error('[modCRM] createContact error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Update an existing contact
 */
export async function updateContact(contactId, updates) {
  const client = getClient();
  if (!client) return { success: false, error: 'modCRM not configured' };
  
  try {
    const updateData = { updated_at: new Date().toISOString() };
    
    if (updates.firstName) updateData.first_name = updates.firstName;
    if (updates.lastName) updateData.last_name = updates.lastName;
    if (updates.email) updateData.email = updates.email.toLowerCase();
    if (updates.phone) updateData.phone = normalizePhone(updates.phone);
    if (updates.stage) updateData.stage = updates.stage;
    if (updates.source) updateData.source = updates.source;
    
    const { data, error } = await client
      .from('crm_records')
      .update(updateData)
      .eq('id', contactId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data: { contact: data } };
  } catch (err) {
    console.error('[modCRM] updateContact error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Get contact by ID
 */
export async function getContact(contactId) {
  const client = getClient();
  if (!client) return { success: false, error: 'modCRM not configured' };
  
  try {
    const { data, error } = await client
      .from('crm_records')
      .select('*')
      .eq('id', contactId)
      .single();
    
    if (error) throw error;
    return { success: true, data: { contact: data } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Search contacts by email, phone, or name
 */
export async function searchContacts(query) {
  const client = getClient();
  if (!client) return { success: false, error: 'modCRM not configured' };
  
  try {
    let dbQuery = client.from('crm_records').select('*');
    
    if (query.email) {
      dbQuery = dbQuery.eq('email', query.email.toLowerCase());
    } else if (query.phone) {
      dbQuery = dbQuery.eq('phone', normalizePhone(query.phone));
    } else if (query.name) {
      dbQuery = dbQuery.or(`first_name.ilike.%${query.name}%,last_name.ilike.%${query.name}%`);
    }
    
    const { data, error } = await dbQuery.limit(query.limit || 20);
    
    if (error) throw error;
    return { success: true, data: { contacts: data || [] } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Find or create contact (upsert by email/phone)
 */
export async function findOrCreateContact(contact) {
  const client = getClient();
  if (!client) return { success: false, error: 'modCRM not configured' };
  
  try {
    // Try to find by email first
    if (contact.email) {
      const { data: existing } = await client
        .from('crm_records')
        .select('*')
        .eq('email', contact.email.toLowerCase())
        .single();
      
      if (existing) {
        // Update existing
        const result = await updateContact(existing.id, contact);
        return { ...result, existing: true };
      }
    }
    
    // Try phone
    if (contact.phone) {
      const { data: existing } = await client
        .from('crm_records')
        .select('*')
        .eq('phone', normalizePhone(contact.phone))
        .single();
      
      if (existing) {
        const result = await updateContact(existing.id, contact);
        return { ...result, existing: true };
      }
    }
    
    // Create new
    const result = await createContact(contact);
    return { ...result, existing: false };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Add tags to contact
 */
export async function addContactTags(contactId, tags) {
  const client = getClient();
  if (!client) return { success: false, error: 'modCRM not configured' };
  
  try {
    // Get current data
    const { data: contact } = await client
      .from('crm_records')
      .select('data')
      .eq('id', contactId)
      .single();
    
    const currentTags = contact?.data?.tags || [];
    const newTags = [...new Set([...currentTags, ...tags])];
    
    const { data, error } = await client
      .from('crm_records')
      .update({ 
        data: { ...contact?.data, tags: newTags },
        updated_at: new Date().toISOString()
      })
      .eq('id', contactId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data: { contact: data } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ==========================================
// ACTIVITIES
// ==========================================

/**
 * Log an activity for a contact
 */
export async function logActivity(contactId, activity) {
  const client = getClient();
  if (!client) return { success: false, error: 'modCRM not configured' };
  
  try {
    // Get container_id from contact
    const { data: contact } = await client
      .from('crm_records')
      .select('container_id')
      .eq('id', contactId)
      .single();
    
    const { data, error } = await client
      .from('activities')
      .insert({
        container_id: contact?.container_id || CONTAINER_ID,
        record_id: contactId,
        activity_type: activity.type || 'note',
        subject: activity.subject || 'Activity',
        details: activity.description || JSON.stringify(activity.metadata || {}),
        created_at: activity.timestamp || new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data: { activity: data } };
  } catch (err) {
    console.error('[modCRM] logActivity error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Log a voice conversation
 */
export async function logVoiceConversation(contactId, conversation) {
  return logActivity(contactId, {
    type: 'call',
    subject: `Voice Conversation - ${conversation.agentName || 'Wringo'}`,
    description: conversation.summary || 'Voice conversation via Wringo AI',
    metadata: {
      conversationId: conversation.id,
      duration: conversation.duration,
      transcript: conversation.transcript,
      source: 'wringo_voice_agent'
    }
  });
}

// ==========================================
// COMMUNICATION LOGS
// ==========================================

/**
 * Log communication (for voice conversations without a contact yet)
 */
export async function logCommunication(data) {
  const client = getClient();
  if (!client) return { success: false, error: 'modCRM not configured' };
  
  try {
    const { data: log, error } = await client
      .from('communication_logs')
      .insert({
        container_id: CONTAINER_ID,
        record_id: data.contactId,
        type: data.type || 'voicemail',
        direction: data.direction || 'inbound',
        to_address: data.to || 'wringo-voice-agent',
        from_address: data.from || 'unknown',
        subject: data.subject,
        body: data.body,
        provider: 'wringo',
        status: data.status || 'completed'
      })
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data: { log } };
  } catch (err) {
    console.error('[modCRM] logCommunication error:', err.message);
    return { success: false, error: err.message };
  }
}

// ==========================================
// OPPORTUNITIES
// ==========================================

/**
 * Create opportunity
 */
export async function createOpportunity(opportunity) {
  const client = getClient();
  if (!client) return { success: false, error: 'modCRM not configured' };
  
  try {
    // Check if opportunities table exists (might not in all setups)
    const { data, error } = await client
      .from('opportunities')
      .insert({
        container_id: CONTAINER_ID,
        contact_id: opportunity.contactId,
        name: opportunity.name,
        stage: opportunity.stage || 'new_lead',
        source: opportunity.source || 'wringo_voice_agent',
        value: opportunity.value,
        notes: opportunity.notes
      })
      .select()
      .single();
    
    if (error) {
      // Table might not exist, log in activities instead
      console.log('[modCRM] opportunities table not found, logging as activity');
      return { success: true, data: { opportunity: null, fallback: 'activity' } };
    }
    
    return { success: true, data: { opportunity: data } };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ==========================================
// CONVENIENCE FUNCTIONS
// ==========================================

/**
 * Full lead capture flow
 */
export async function captureLeadFull(leadData) {
  // 1. Find or create contact
  const contactResult = await findOrCreateContact({
    firstName: leadData.firstName || leadData.name?.split(' ')[0],
    lastName: leadData.lastName || leadData.name?.split(' ').slice(1).join(' '),
    email: leadData.email,
    phone: leadData.phone,
    company: leadData.company,
    source: leadData.source || 'wringo_voice_agent',
    interest: leadData.interest,
    notes: leadData.notes,
    tags: ['wringo', leadData.interest].filter(Boolean),
    customFields: leadData.customFields
  });
  
  if (!contactResult.success) {
    return contactResult;
  }
  
  const contactId = contactResult.data?.contact?.id;
  const results = { contact: contactResult };
  
  // 2. Log conversation as activity
  if (leadData.conversationId || leadData.transcript) {
    results.activity = await logVoiceConversation(contactId, {
      id: leadData.conversationId,
      duration: leadData.duration,
      transcript: leadData.transcript,
      summary: leadData.summary
    });
  }
  
  // 3. Create opportunity if high intent
  if (leadData.interest && leadData.createOpportunity !== false) {
    results.opportunity = await createOpportunity({
      contactId,
      name: `${leadData.name || leadData.email} - ${leadData.interest}`,
      stage: 'new_lead',
      source: 'wringo_voice_agent',
      value: leadData.estimatedValue,
      notes: leadData.notes
    });
  }
  
  return {
    success: true,
    contactId,
    isNewContact: !contactResult.existing,
    results
  };
}

export default {
  // Status
  isConfigured,
  getStatus,
  
  // Contacts
  createContact,
  updateContact,
  getContact,
  searchContacts,
  findOrCreateContact,
  addContactTags,
  
  // Activities
  logActivity,
  logVoiceConversation,
  logCommunication,
  
  // Opportunities
  createOpportunity,
  
  // Convenience
  captureLeadFull
};
