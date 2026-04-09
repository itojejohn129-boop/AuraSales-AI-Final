-- Multi-tenant RLS setup for AuraSales
-- 1) Ensure companies table exists
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2) Ensure tenant key exists on core tables
ALTER TABLE IF EXISTS public.sales ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE IF EXISTS public.csv_uploads ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 3) Enable RLS on those tables
ALTER TABLE IF EXISTS public.sales FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.csv_uploads FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers FORCE ROW LEVEL SECURITY;

-- 4) Create a reusable policy for restricting access to the user's company
-- This policy references the JWT claims available via auth.jwt()
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'users_only_company_sales' AND polrelid = 'public.sales'::regclass
  ) THEN
    CREATE POLICY users_only_company_sales ON public.sales
      FOR ALL
      USING ((auth.jwt() ->> 'company_id') = company_id)
      WITH CHECK ((auth.jwt() ->> 'company_id') = company_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'users_only_company_csv_uploads' AND polrelid = 'public.csv_uploads'::regclass
  ) THEN
    CREATE POLICY users_only_company_csv_uploads ON public.csv_uploads
      FOR ALL
      USING ((auth.jwt() ->> 'company_id') = company_id)
      WITH CHECK ((auth.jwt() ->> 'company_id') = company_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy WHERE polname = 'users_only_company_customers' AND polrelid = 'public.customers'::regclass
  ) THEN
    CREATE POLICY users_only_company_customers ON public.customers
      FOR ALL
      USING ((auth.jwt() ->> 'company_id') = company_id)
      WITH CHECK ((auth.jwt() ->> 'company_id') = company_id);
  END IF;
END$$;

-- 5) Create helper function to set jwt.claims from auth.users.user_metadata.company_id
-- This will populate jwt.claims for the session when the user signs in or their metadata is updated.
CREATE OR REPLACE FUNCTION public.set_jwt_claims()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set a session config value 'jwt.claims' that Supabase will include in the JWT for the session
  PERFORM set_config('jwt.claims', json_build_object('company_id', NEW.user_metadata->> 'company_id')::text, true);
  RETURN NEW;
END;
$$;

-- Attach trigger to auth.users to run after insert or update of user_metadata
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_jwt_claims_trigger'
  ) THEN
    CREATE TRIGGER set_jwt_claims_trigger
      AFTER INSERT OR UPDATE OF user_metadata ON auth.users
      FOR EACH ROW
      EXECUTE PROCEDURE public.set_jwt_claims();
  END IF;
END$$;

-- Notes:
-- - Ensure you populate `auth.users.user_metadata.company_id` when creating or updating users.
-- - The function sets a session config `jwt.claims` which Supabase uses to sign JWTs for that session.
-- - Confirm Supabase instance has the pgcrypto extension for gen_random_uuid() or adjust accordingly.
