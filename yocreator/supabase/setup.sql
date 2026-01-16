-- YOcreator Database Setup Script
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create render_jobs table
CREATE TABLE IF NOT EXISTS render_jobs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid,
  type text NOT NULL,
  payload jsonb NOT NULL,
  status text DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'error')),
  result_url text,
  error text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_render_jobs_status ON render_jobs(status);
CREATE INDEX IF NOT EXISTS idx_render_jobs_user_id ON render_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_created_at ON render_jobs(created_at DESC);

-- Create function to add render job
CREATE OR REPLACE FUNCTION add_render_job(
  p_user_id uuid,
  p_type text,
  p_payload jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE new_id uuid;
BEGIN
  INSERT INTO render_jobs (user_id, type, payload)
  VALUES (p_user_id, p_type, p_payload)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Create function to update job status
CREATE OR REPLACE FUNCTION update_job_status(
  p_job_id uuid,
  p_status text,
  p_result_url text DEFAULT NULL,
  p_error text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE render_jobs
  SET 
    status = p_status,
    result_url = COALESCE(p_result_url, result_url),
    error = COALESCE(p_error, error),
    updated_at = now()
  WHERE id = p_job_id;
END;
$$;

-- Create function to get user jobs
CREATE OR REPLACE FUNCTION get_user_jobs(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  type text,
  status text,
  result_url text,
  error text,
  created_at timestamp,
  updated_at timestamp
)
LANGUAGE sql
AS $$
  SELECT id, type, status, result_url, error, created_at, updated_at
  FROM render_jobs
  WHERE user_id = p_user_id
  ORDER BY created_at DESC;
$$;

-- Enable Row Level Security (optional but recommended)
ALTER TABLE render_jobs ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to see their own jobs
CREATE POLICY "Users can view own jobs"
  ON render_jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for service role to do anything (for backend)
CREATE POLICY "Service role has full access"
  ON render_jobs FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON render_jobs TO service_role;
GRANT SELECT ON render_jobs TO authenticated;
GRANT EXECUTE ON FUNCTION add_render_job TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION update_job_status TO service_role;
GRANT EXECUTE ON FUNCTION get_user_jobs TO authenticated;

-- Verification query
SELECT 'Database setup complete!' as message,
       COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'render_jobs';
