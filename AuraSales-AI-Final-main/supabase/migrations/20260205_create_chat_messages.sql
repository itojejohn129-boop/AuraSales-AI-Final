-- Create chat_messages table with RLS for multi-tenant access
create table if not exists chat_messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  user_id uuid not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  company_id uuid null
);

-- Enable RLS
alter table chat_messages enable row level security;

-- Policy: allow authenticated users to insert/select rows for their company
create policy "chat_messages_company_access" on chat_messages
  for all using (company_id::text = current_setting('jwt.claims.company_id', true))
  with check (company_id::text = current_setting('jwt.claims.company_id', true));

-- Index for faster lookup by company and created_at
create index if not exists idx_chat_messages_company_created_at on chat_messages (company_id, created_at desc);
