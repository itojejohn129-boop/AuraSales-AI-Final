-- Reset current usage for all existing users.
-- This keeps plan/subscription state intact and only resets consumed credits.
update public.user_credits
set credits_used = 0,
    updated_at = now();

