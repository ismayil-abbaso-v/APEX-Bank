
-- Re-create triggers that were missing in the database

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS trg_validate_transaction ON public.transactions;
CREATE TRIGGER trg_validate_transaction
  BEFORE INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.validate_transaction_account();

DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_accounts_updated ON public.accounts;
CREATE TRIGGER trg_accounts_updated
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Email notification trigger (fires for ALL notification inserts, so both
-- outgoing AND incoming transfer notifications email the affected user)
DROP TRIGGER IF EXISTS trg_notification_email ON public.notifications;
CREATE TRIGGER trg_notification_email
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.send_notification_email();
