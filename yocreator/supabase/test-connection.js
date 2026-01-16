// YOcreator Supabase Connection Test
// Run with: node supabase/test-connection.js
// Requires .env file with SUPABASE_URL and SUPABASE_SERVICE_ROLE

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceRole) {
  console.error('❌ Missing environment variables!');
  console.error('   Please ensure .env file exists with:');
  console.error('   - SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function testConnection() {
  console.log('🔧 Testing Supabase Connection...\n');

  try {
    // Test 1: Check table exists
    console.log('1️⃣ Checking if render_jobs table exists...');
    const { data: tables, error: tablesError } = await supabase
      .from('render_jobs')
      .select('count')
      .limit(0);

    if (tablesError) {
      console.error('❌ Table check failed:', tablesError.message);
      console.log('\n⚠️  Please run the SQL setup first:');
      console.log('   1. Open: https://supabase.com/dashboard/project/uksjnwnvarhldlxyymef/sql');
      console.log('   2. Copy and run: supabase/setup.sql\n');
      return;
    }

    console.log('✅ render_jobs table exists\n');

    // Test 2: Create a test job
    console.log('2️⃣ Creating test job...');
    const { data: jobId, error: createError } = await supabase
      .rpc('add_render_job', {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_type: 'voice',
        p_payload: { text: 'test connection', test: true }
      });

    if (createError) {
      console.error('❌ Job creation failed:', createError.message);
      return;
    }

    console.log('✅ Test job created:', jobId, '\n');

    // Test 3: Retrieve the job
    console.log('3️⃣ Retrieving test job...');
    const { data: job, error: fetchError } = await supabase
      .from('render_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError) {
      console.error('❌ Job retrieval failed:', fetchError.message);
      return;
    }

    console.log('✅ Job retrieved successfully:');
    console.log(JSON.stringify(job, null, 2));
    console.log('');

    // Test 4: Update job status
    console.log('4️⃣ Updating job status...');
    const { error: updateError } = await supabase
      .from('render_jobs')
      .update({ 
        status: 'completed',
        result_url: 'https://test.com/result.mp4',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('❌ Job update failed:', updateError.message);
      return;
    }

    console.log('✅ Job status updated\n');

    // Test 5: Clean up test job
    console.log('5️⃣ Cleaning up test job...');
    const { error: deleteError } = await supabase
      .from('render_jobs')
      .delete()
      .eq('id', jobId);

    if (deleteError) {
      console.error('❌ Cleanup failed:', deleteError.message);
      return;
    }

    console.log('✅ Test job deleted\n');

    console.log('🎉 All tests passed! Supabase is ready for YOcreator.\n');
    console.log('Next steps:');
    console.log('  • Start backend: cd server/node && pnpm install && node src/index.js');
    console.log('  • Start web app: cd apps/web && pnpm install && pnpm dev');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testConnection();
