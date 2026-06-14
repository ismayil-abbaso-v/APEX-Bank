
-- Ensure central app_settings rows for runtime secrets exist
INSERT INTO public.app_settings (key, value) VALUES
  ('RESEND_API_KEY', ''),
  ('LOVABLE_API_KEY', ''),
  ('resend_from', 'APEX BANK <onboarding@resend.dev>')
ON CONFLICT (key) DO NOTHING;

-- Update notification email trigger to read RESEND_API_KEY from either casing
CREATE OR REPLACE FUNCTION public.send_notification_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_email      TEXT;
  v_name       TEXT;
  v_api_key    TEXT;
  v_from       TEXT;
  v_html       TEXT;
BEGIN
  SELECT email, full_name INTO v_email, v_name
    FROM public.profiles WHERE id = NEW.user_id;
  IF v_email IS NULL OR v_email = '' THEN RETURN NEW; END IF;

  SELECT value INTO v_api_key FROM public.app_settings
    WHERE key IN ('RESEND_API_KEY','resend_api_key') AND value IS NOT NULL AND value <> ''
    ORDER BY (key = 'RESEND_API_KEY') DESC LIMIT 1;
  SELECT value INTO v_from FROM public.app_settings WHERE key = 'resend_from';
  IF v_from IS NULL OR v_from = '' THEN v_from := 'APEX BANK <onboarding@resend.dev>'; END IF;

  IF v_api_key IS NULL OR v_api_key = '' OR v_api_key = 'YOUR_RESEND_API_KEY_HERE' THEN
    RETURN NEW;
  END IF;

  v_html := public.apex_email_html(NEW.title, COALESCE(NEW.body,''), v_name);

  PERFORM net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_api_key,
      'Content-Type',  'application/json'
    ),
    body    := jsonb_build_object(
      'from',    v_from,
      'to',      jsonb_build_array(v_email),
      'subject', 'APEX BANK · ' || NEW.title,
      'html',    v_html
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END; $function$;

-- Re-attach notification email trigger
DROP TRIGGER IF EXISTS trg_notification_email ON public.notifications;
CREATE TRIGGER trg_notification_email
AFTER INSERT ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.send_notification_email();

-- Ensure other essential triggers exist
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
