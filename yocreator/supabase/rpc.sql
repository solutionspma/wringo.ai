create or replace function add_render_job(
  p_user_id uuid,
  p_type text,
  p_payload jsonb
)
returns uuid
language plpgsql
as $$
declare new_id uuid;
begin
  insert into render_jobs (user_id, type, payload)
  values (p_user_id, p_type, p_payload)
  returning id into new_id;

  return new_id;
end;
$$;
