-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.account_type AS ENUM ('current', 'savings', 'deposit');
CREATE TYPE public.currency_code AS ENUM ('AZN', 'USD', 'EUR');
CREATE TYPE public.card_type AS ENUM ('debit', 'credit', 'virtual');
CREATE TYPE public.card_status AS ENUM ('active', 'blocked', 'frozen');
CREATE TYPE public.tx_type AS ENUM ('transfer_in', 'transfer_out', 'deposit', 'withdrawal', 'payment', 'fee');
CREATE TYPE public.tx_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  preferred_language TEXT NOT NULL DEFAULT 'az',
  preferred_theme TEXT NOT NULL DEFAULT 'light',
  avatar_url TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_email ON public.profiles(email);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL UNIQUE,
  iban TEXT NOT NULL UNIQUE,
  account_type account_type NOT NULL DEFAULT 'current',
  currency currency_code NOT NULL DEFAULT 'AZN',
  balance NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  name TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_accounts_user ON public.accounts(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own accounts select" ON public.accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own accounts update" ON public.accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "no direct accounts insert" ON public.accounts AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "no accounts delete" ON public.accounts AS RESTRICTIVE FOR DELETE TO authenticated USING (false);

CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  card_number TEXT NOT NULL UNIQUE,
  card_holder TEXT NOT NULL,
  expiry_month INT NOT NULL CHECK (expiry_month BETWEEN 1 AND 12),
  expiry_year INT NOT NULL,
  card_type card_type NOT NULL DEFAULT 'debit',
  status card_status NOT NULL DEFAULT 'active',
  daily_limit NUMERIC(18,2) NOT NULL DEFAULT 5000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cards_user ON public.cards(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cards TO authenticated;
GRANT ALL ON public.cards TO service_role;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cards all" ON public.cards FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  related_account_id UUID REFERENCES public.accounts(id),
  tx_type tx_type NOT NULL,
  status tx_status NOT NULL DEFAULT 'completed',
  amount NUMERIC(18,2) NOT NULL,
  currency currency_code NOT NULL,
  description TEXT,
  recipient_name TEXT,
  recipient_iban TEXT,
  reference TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tx_user ON public.transactions(user_id, created_at DESC);
CREATE INDEX idx_tx_account ON public.transactions(account_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tx select" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "no direct tx insert" ON public.transactions AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "no tx update" ON public.transactions AS RESTRICTIVE FOR UPDATE TO authenticated USING (false);
CREATE POLICY "no tx delete" ON public.transactions AS RESTRICTIVE FOR DELETE TO authenticated USING (false);

CREATE TABLE public.beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  iban TEXT NOT NULL,
  bank_name TEXT,
  nickname TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ben_user ON public.beneficiaries(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beneficiaries TO authenticated;
GRANT ALL ON public.beneficiaries TO service_role;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ben all" ON public.beneficiaries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  kind TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user ON public.notifications(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notif all" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_accounts_updated BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_acct_num TEXT; v_iban TEXT;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  v_acct_num := lpad((floor(random() * 1e10))::bigint::text, 10, '0');
  v_iban := 'AZ' || lpad((floor(random()*100))::int::text, 2, '0') || 'ATUB' || v_acct_num || lpad((floor(random()*1e10))::bigint::text, 10, '0');
  INSERT INTO public.accounts (user_id, account_number, iban, account_type, currency, balance, name, is_primary)
  VALUES (NEW.id, v_acct_num, v_iban, 'current', 'AZN', 0, 'Main Account', true);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.validate_transaction_account()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.accounts WHERE id = NEW.account_id AND user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'account_not_owned_by_user';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_validate_transaction BEFORE INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.validate_transaction_account();

CREATE OR REPLACE FUNCTION public.execute_transfer(
  p_from_account UUID, p_to_iban TEXT, p_amount NUMERIC, p_recipient_name TEXT, p_description TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_from RECORD; v_to RECORD; v_ref TEXT; v_currency currency_code;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  SELECT * INTO v_from FROM public.accounts WHERE id = p_from_account AND user_id = v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'account_not_found'; END IF;
  IF v_from.balance < p_amount THEN RAISE EXCEPTION 'insufficient_funds'; END IF;
  v_currency := v_from.currency;
  v_ref := 'TX' || to_char(now(),'YYYYMMDDHH24MISS') || lpad((floor(random()*10000))::int::text, 4, '0');
  UPDATE public.accounts SET balance = balance - p_amount WHERE id = v_from.id;
  SELECT * INTO v_to FROM public.accounts WHERE iban = p_to_iban FOR UPDATE;
  IF FOUND THEN
    UPDATE public.accounts SET balance = balance + p_amount WHERE id = v_to.id;
    INSERT INTO public.transactions (user_id, account_id, related_account_id, tx_type, amount, currency, description, recipient_name, recipient_iban, reference)
    VALUES (v_to.user_id, v_to.id, v_from.id, 'transfer_in', p_amount, v_currency, p_description, (SELECT full_name FROM public.profiles WHERE id = v_user), v_from.iban, v_ref || 'IN');
  END IF;
  INSERT INTO public.transactions (user_id, account_id, related_account_id, tx_type, amount, currency, description, recipient_name, recipient_iban, reference)
  VALUES (v_user, v_from.id, NULL, 'transfer_out', p_amount, v_currency, p_description, p_recipient_name, p_to_iban, v_ref);
  RETURN jsonb_build_object('reference', v_ref, 'amount', p_amount);
END; $$;

CREATE OR REPLACE FUNCTION public.open_account(p_type account_type, p_currency currency_code, p_name text)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user UUID := auth.uid();
  v_acct_num TEXT; v_iban TEXT; v_id UUID;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  v_acct_num := lpad((floor(random() * 1e10))::bigint::text, 10, '0');
  v_iban := 'AZ' || lpad((floor(random()*100))::int::text, 2, '0') || 'ATUB' || v_acct_num || lpad((floor(random()*1e10))::bigint::text, 10, '0');
  INSERT INTO public.accounts (user_id, account_number, iban, account_type, currency, name, is_primary)
  VALUES (v_user, v_acct_num, v_iban, p_type, p_currency, p_name, false) RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

CREATE OR REPLACE FUNCTION public.issue_card(p_account_id UUID, p_card_type card_type, p_holder TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
END; $$;

CREATE OR REPLACE FUNCTION public.execute_transfer_smart(
  p_from_account uuid, p_to_destination text, p_amount numeric, p_recipient_name text, p_description text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_from accounts%ROWTYPE; v_to accounts%ROWTYPE;
  v_to_account_id uuid; v_to_owner_name text; v_ref text;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  SELECT * INTO v_from FROM accounts WHERE id = p_from_account AND user_id = v_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'source_account_not_found'; END IF;
  IF v_from.balance < p_amount THEN RAISE EXCEPTION 'insufficient_funds'; END IF;
  SELECT id INTO v_to_account_id FROM accounts
    WHERE upper(replace(iban,' ','')) = upper(regexp_replace(p_to_destination,'\s+','','g')) LIMIT 1;
  IF v_to_account_id IS NULL THEN
    SELECT a.id INTO v_to_account_id FROM accounts a JOIN cards c ON c.account_id = a.id
      WHERE replace(c.card_number,' ','') = regexp_replace(p_to_destination,'\s+','','g') LIMIT 1;
  END IF;
  v_ref := 'APEX-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text),1,10));
  UPDATE accounts SET balance = balance - p_amount WHERE id = v_from.id;
  INSERT INTO transactions(user_id,account_id,related_account_id,tx_type,status,amount,currency,description,recipient_name,recipient_iban,reference)
    VALUES (v_user,v_from.id,v_to_account_id,'transfer_out','completed',p_amount,v_from.currency,p_description,p_recipient_name,p_to_destination,v_ref || '-OUT');
  IF v_to_account_id IS NOT NULL THEN
    SELECT * INTO v_to FROM accounts WHERE id = v_to_account_id FOR UPDATE;
    UPDATE accounts SET balance = balance + p_amount WHERE id = v_to.id;
    SELECT full_name INTO v_to_owner_name FROM profiles WHERE id = v_to.user_id;
    INSERT INTO transactions(user_id,account_id,related_account_id,tx_type,status,amount,currency,description,recipient_name,recipient_iban,reference)
      VALUES (v_to.user_id,v_to.id,v_from.id,'transfer_in','completed',p_amount,v_to.currency,p_description,coalesce((SELECT full_name FROM profiles WHERE id = v_user), 'APEX müştəri'),v_from.iban,v_ref || '-IN');
    INSERT INTO notifications(user_id,title,body,kind)
      VALUES (v_to.user_id, 'Hesabınıza köçürmə daxil oldu',
              format('Hesabınıza %s %s daxil oldu. Göndərən: %s', p_amount, v_to.currency,
                     coalesce((SELECT full_name FROM profiles WHERE id = v_user),'APEX müştəri')),
              'transfer_in');
  END IF;
  INSERT INTO notifications(user_id,title,body,kind)
    VALUES (v_user, 'Köçürmə tamamlandı',
            format('%s %s məbləğində köçürmə uğurla tamamlandı. Alıcı: %s', p_amount, v_from.currency,
                   coalesce(v_to_owner_name, p_recipient_name)),
            'transfer_out');
  RETURN jsonb_build_object('reference', v_ref, 'recipient_name', coalesce(v_to_owner_name, p_recipient_name));
END $$;

CREATE OR REPLACE FUNCTION public.lookup_recipient(p_destination text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_acct accounts%ROWTYPE; v_name text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  SELECT a.* INTO v_acct FROM accounts a
    WHERE upper(replace(a.iban,' ','')) = upper(regexp_replace(coalesce(p_destination,''),'\s+','','g')) LIMIT 1;
  IF NOT FOUND THEN
    SELECT a.* INTO v_acct FROM accounts a
      JOIN cards c ON c.account_id = a.id
      WHERE replace(c.card_number,' ','') = regexp_replace(coalesce(p_destination,''),'\s+','','g') LIMIT 1;
  END IF;
  IF NOT FOUND THEN RETURN jsonb_build_object('found', false); END IF;
  SELECT full_name INTO v_name FROM profiles WHERE id = v_acct.user_id;
  RETURN jsonb_build_object('found', true, 'recipient_name', v_name, 'currency', v_acct.currency);
END $$;

-- Admin-wide SELECT/UPDATE
CREATE POLICY "admin profiles select" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin profiles update" ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin roles select" ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin accounts select" ON public.accounts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin tx select" ON public.transactions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin cards select" ON public.cards FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin notif select" ON public.notifications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin ben select" ON public.beneficiaries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Lockdown user_roles writes
CREATE POLICY "no self role insert" ON public.user_roles AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "no self role update" ON public.user_roles AS RESTRICTIVE FOR UPDATE TO authenticated USING (false);
CREATE POLICY "no self role delete" ON public.user_roles AS RESTRICTIVE FOR DELETE TO authenticated USING (false);
REVOKE INSERT, UPDATE, DELETE ON public.user_roles FROM authenticated;

-- Admin RPCs
CREATE OR REPLACE FUNCTION public.admin_set_user_active(p_user_id uuid, p_active boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.profiles SET is_active = p_active WHERE id = p_user_id;
  UPDATE public.accounts SET is_active = p_active WHERE user_id = p_user_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin_count int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_user_id = auth.uid() THEN RAISE EXCEPTION 'self_delete_forbidden'; END IF;
  SELECT count(*) INTO v_admin_count FROM public.user_roles WHERE role = 'admin';
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user_id AND role = 'admin') AND v_admin_count <= 1 THEN
    RAISE EXCEPTION 'last_admin';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  UPDATE public.accounts SET is_active = false WHERE user_id = p_user_id;
  UPDATE public.profiles SET is_active = false WHERE id = p_user_id;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_promote_to_admin(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (p_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_topup(p_destination text, p_amount numeric, p_description text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_acct accounts%ROWTYPE; v_ref text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  SELECT * INTO v_acct FROM accounts WHERE upper(replace(iban,' ','')) = upper(regexp_replace(coalesce(p_destination,''),'\s+','','g')) LIMIT 1;
  IF NOT FOUND THEN
    SELECT * INTO v_acct FROM accounts WHERE account_number = regexp_replace(coalesce(p_destination,''),'\s+','','g') LIMIT 1;
  END IF;
  IF NOT FOUND THEN
    SELECT a.* INTO v_acct FROM accounts a JOIN cards c ON c.account_id = a.id
      WHERE replace(c.card_number,' ','') = regexp_replace(coalesce(p_destination,''),'\s+','','g') LIMIT 1;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'account_not_found'; END IF;
  v_ref := 'APEX-TOPUP-' || upper(substr(md5(random()::text || clock_timestamp()::text),1,10));
  UPDATE accounts SET balance = balance + p_amount WHERE id = v_acct.id;
  INSERT INTO transactions(user_id, account_id, tx_type, status, amount, currency, description, reference)
    VALUES (v_acct.user_id, v_acct.id, 'deposit', 'completed', p_amount, v_acct.currency,
            coalesce(nullif(p_description,''),'Admin terminalı vasitəsilə hesaba pul yükləməsi'), v_ref);
  INSERT INTO notifications(user_id, title, body, kind)
    VALUES (v_acct.user_id, 'Hesabınıza vəsait yükləndi',
            format('Hesabınıza %s %s əlavə olundu.', p_amount, v_acct.currency), 'deposit');
  RETURN jsonb_build_object('reference', v_ref, 'account_id', v_acct.id);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_transfer(p_from text, p_to text, p_amount numeric, p_description text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_from accounts%ROWTYPE; v_to accounts%ROWTYPE; v_ref text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;
  SELECT * INTO v_from FROM accounts WHERE upper(replace(iban,' ','')) = upper(regexp_replace(coalesce(p_from,''),'\s+','','g')) LIMIT 1;
  IF NOT FOUND THEN SELECT * INTO v_from FROM accounts WHERE account_number = regexp_replace(coalesce(p_from,''),'\s+','','g') LIMIT 1; END IF;
  IF NOT FOUND THEN
    SELECT a.* INTO v_from FROM accounts a JOIN cards c ON c.account_id = a.id
      WHERE replace(c.card_number,' ','') = regexp_replace(coalesce(p_from,''),'\s+','','g') LIMIT 1;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'source_account_not_found'; END IF;
  SELECT * INTO v_to FROM accounts WHERE upper(replace(iban,' ','')) = upper(regexp_replace(coalesce(p_to,''),'\s+','','g')) LIMIT 1;
  IF NOT FOUND THEN SELECT * INTO v_to FROM accounts WHERE account_number = regexp_replace(coalesce(p_to,''),'\s+','','g') LIMIT 1; END IF;
  IF NOT FOUND THEN
    SELECT a.* INTO v_to FROM accounts a JOIN cards c ON c.account_id = a.id
      WHERE replace(c.card_number,' ','') = regexp_replace(coalesce(p_to,''),'\s+','','g') LIMIT 1;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'destination_account_not_found'; END IF;
  IF v_from.balance < p_amount THEN RAISE EXCEPTION 'insufficient_funds'; END IF;
  v_ref := 'APEX-ADMIN-' || upper(substr(md5(random()::text || clock_timestamp()::text),1,10));
  UPDATE accounts SET balance = balance - p_amount WHERE id = v_from.id;
  UPDATE accounts SET balance = balance + p_amount WHERE id = v_to.id;
  INSERT INTO transactions(user_id, account_id, related_account_id, tx_type, status, amount, currency, description, recipient_iban, reference)
    VALUES (v_from.user_id, v_from.id, v_to.id, 'transfer_out', 'completed', p_amount, v_from.currency,
            coalesce(nullif(p_description,''),'Admin köçürməsi'), v_to.iban, v_ref || '-OUT');
  INSERT INTO transactions(user_id, account_id, related_account_id, tx_type, status, amount, currency, description, recipient_iban, reference)
    VALUES (v_to.user_id, v_to.id, v_from.id, 'transfer_in', 'completed', p_amount, v_to.currency,
            coalesce(nullif(p_description,''),'Admin köçürməsi'), v_from.iban, v_ref || '-IN');
  INSERT INTO notifications(user_id, title, body, kind) VALUES
    (v_from.user_id, 'Hesabınızdan köçürmə', format('%s %s hesabınızdan çıxarıldı.', p_amount, v_from.currency), 'transfer_out'),
    (v_to.user_id, 'Hesabınıza köçürmə daxil oldu', format('%s %s hesabınıza daxil oldu.', p_amount, v_to.currency), 'transfer_in');
  RETURN jsonb_build_object('reference', v_ref);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_monthly_processing()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_acct accounts%ROWTYPE; v_savings int := 0; v_current int := 0; v_int numeric; v_ref text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  FOR v_acct IN SELECT * FROM accounts WHERE is_active LOOP
    IF v_acct.account_type = 'savings' THEN
      v_int := round(v_acct.balance * 0.005, 2);
      IF v_int > 0 THEN
        UPDATE accounts SET balance = balance + v_int WHERE id = v_acct.id;
        v_ref := 'INT-' || upper(substr(md5(random()::text || clock_timestamp()::text),1,12));
        INSERT INTO transactions(user_id, account_id, tx_type, status, amount, currency, description, reference)
          VALUES (v_acct.user_id, v_acct.id, 'deposit', 'completed', v_int, v_acct.currency, 'Monthly interest credit', v_ref);
        v_savings := v_savings + 1;
      END IF;
    ELSIF v_acct.account_type = 'current' AND v_acct.balance >= 1 THEN
      UPDATE accounts SET balance = balance - 1 WHERE id = v_acct.id;
      v_ref := 'FEE-' || upper(substr(md5(random()::text || clock_timestamp()::text),1,12));
      INSERT INTO transactions(user_id, account_id, tx_type, status, amount, currency, description, reference)
        VALUES (v_acct.user_id, v_acct.id, 'fee', 'completed', 1, v_acct.currency, 'Monthly maintenance fee', v_ref);
      v_current := v_current + 1;
    END IF;
  END LOOP;
  RETURN jsonb_build_object('savings_credited', v_savings, 'current_charged', v_current);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_reset_password_for(p_user_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_email text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  IF v_email IS NULL THEN RAISE EXCEPTION 'user_email_not_found'; END IF;
  RETURN v_email;
END; $$;

-- Function execution permissions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_transaction_account() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.execute_transfer(uuid, text, numeric, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.execute_transfer_smart(uuid, text, numeric, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.open_account(account_type, currency_code, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.issue_card(uuid, card_type, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.lookup_recipient(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_user_active(uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_promote_to_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_topup(text, numeric, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_transfer(text, text, numeric, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_monthly_processing() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_reset_password_for(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_transfer(uuid, text, numeric, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_transfer_smart(uuid, text, numeric, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.open_account(account_type, currency_code, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.issue_card(uuid, card_type, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_recipient(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_active(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_promote_to_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_topup(text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_transfer(text, text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_monthly_processing() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_password_for(uuid) TO authenticated;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;

-- Seed admin user
DO $$
DECLARE v_uid uuid := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@admin.com') THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change, email_change_token_new, email_change_token_current
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated',
      'admin@admin.com', crypt('admin', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Administrator"}'::jsonb,
      now(), now(), '', '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', 'admin@admin.com', 'email_verified', true),
      'email', v_uid::text, now(), now(), now());
    INSERT INTO public.user_roles (user_id, role) VALUES (v_uid, 'admin') ON CONFLICT DO NOTHING;
  END IF;
END $$;