
-- 1. Remove CVV column
ALTER TABLE public.cards DROP COLUMN IF EXISTS cvv;

CREATE OR REPLACE FUNCTION public.issue_card(p_account_id uuid, p_card_type card_type, p_holder text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_user UUID := auth.uid(); v_num TEXT; v_id UUID;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = p_account_id AND user_id = v_user) THEN
    RAISE EXCEPTION 'account_not_found';
  END IF;
  v_num := '4' || lpad((floor(random()*1e15))::bigint::text, 15, '0');
  INSERT INTO public.cards (user_id, account_id, card_number, card_holder, expiry_month, expiry_year, card_type)
  VALUES (v_user, p_account_id, v_num, p_holder, extract(month from now())::int, extract(year from now())::int + 4, p_card_type)
  RETURNING id INTO v_id;
  RETURN v_id;
END; $function$;

-- 2. Accounts: column-level UPDATE
REVOKE UPDATE ON public.accounts FROM authenticated;
GRANT UPDATE (name, is_primary) ON public.accounts TO authenticated;

DROP POLICY IF EXISTS "own accounts update" ON public.accounts;
CREATE POLICY "own accounts update safe cols" ON public.accounts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Cards: column-level UPDATE (status only)
REVOKE UPDATE ON public.cards FROM authenticated;
GRANT UPDATE (status) ON public.cards TO authenticated;

DROP POLICY IF EXISTS "own cards all" ON public.cards;
CREATE POLICY "own cards select" ON public.cards
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own cards insert" ON public.cards
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own cards update status" ON public.cards
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own cards delete" ON public.cards
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Rotate seeded admin password
UPDATE auth.users
   SET encrypted_password = extensions.crypt(
         encode(extensions.gen_random_bytes(24), 'base64'),
         extensions.gen_salt('bf')
       ),
       updated_at = now()
 WHERE email = 'admin@admin.com';

-- 5. app_settings server-only
REVOKE ALL ON public.app_settings FROM anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;

-- 6. Realtime: private-channel RLS scoped to authenticated user's own uid topic.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated own topic select" ON realtime.messages;
CREATE POLICY "authenticated own topic select"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    split_part(realtime.topic(), ':', 1) = 'user'
    AND split_part(realtime.topic(), ':', 2) = (SELECT auth.uid()::text)
  );

DROP POLICY IF EXISTS "authenticated own topic insert" ON realtime.messages;
CREATE POLICY "authenticated own topic insert"
  ON realtime.messages FOR INSERT TO authenticated
  WITH CHECK (
    split_part(realtime.topic(), ':', 1) = 'user'
    AND split_part(realtime.topic(), ':', 2) = (SELECT auth.uid()::text)
  );

-- 7. Move pg_net out of public via drop+recreate
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 8. Fixed search_path on remaining function
ALTER FUNCTION public.apex_email_html(text, text, text) SET search_path = public;

-- 9. Revoke EXECUTE on admin-only definer functions
REVOKE EXECUTE ON FUNCTION public.admin_reset_password_for(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_active(uuid, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_promote_to_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_topup(text, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_transfer(text, text, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_monthly_processing() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_reset_password_for(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_user_active(uuid, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_promote_to_admin(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_topup(text, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_transfer(text, text, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_monthly_processing() TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_transaction_account() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.send_notification_email() FROM PUBLIC, anon, authenticated;
