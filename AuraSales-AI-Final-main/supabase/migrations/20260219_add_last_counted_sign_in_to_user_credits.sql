alter table if exists public.user_credits
  add column if not exists last_counted_sign_in_at timestamptz;

