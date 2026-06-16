
-- Ensure all critical triggers exist (the DB shows none currently bound)

-- 1) Auto-create profile + role + primary account on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) Validate that a transaction's account belongs to the user
DROP TRIGGER IF EXISTS trg_validate_transaction ON public.transactions;
CREATE TRIGGER trg_validate_transaction
  BEFORE INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.validate_transaction_account();

-- 3) updated_at touches
DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_accounts_updated ON public.accounts;
CREATE TRIGGER trg_accounts_updated
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4) Send email on EVERY new notification (covers BOTH transfer_in and transfer_out)
DROP TRIGGER IF EXISTS trg_notification_email ON public.notifications;
CREATE TRIGGER trg_notification_email
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.send_notification_email();

-- 5) Make sure pg_net is available for the email trigger
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 6) Seed/refresh app_settings rows so the email trigger has a place to read from.
--    The actual RESEND_API_KEY value must be set by the user in app_settings
--    (Supabase Dashboard -> Table Editor -> app_settings) since the trigger
--    cannot read Supabase Secrets / env vars directly.
INSERT INTO public.app_settings(key, value) VALUES
  ('RESEND_API_KEY', ''),
  ('resend_from', 'APEX BANK <onboarding@resend.dev>')
ON CONFLICT (key) DO NOTHING;
