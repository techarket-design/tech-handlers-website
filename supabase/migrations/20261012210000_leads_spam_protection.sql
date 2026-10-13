-- Anti-Spam Trigger & Rate Limiting on public.leads
-- Protects against direct automated spam inserts bypassing the frontend

-- 1. Optional honeypot columns (if a crawler blindly inserts into all table columns)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS hp_company_website TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS hp_secondary_phone TEXT;

CREATE OR REPLACE FUNCTION public.filter_spam_leads()
RETURNS TRIGGER AS $$
DECLARE
  v_domain text;
  v_disposable_domains text[] := ARRAY[
    'mailinator.com', 'guerrillamail.com', 'guerrillamailblock.com', 'tempmail.com', '10minutemail.com',
    'yopmail.com', 'trashmail.com', 'trashmail.net', 'trashmail.me', 'throwawaymail.com',
    'sharklasers.com', 'getairmail.com', 'dispostable.com', 'dropmail.me', 'mohmal.im',
    'temp-mail.org', 'fakeinbox.com', 'generator.email', 'crazymailing.com', 'burnermail.io',
    'maildrop.cc', 'inboxkitten.com', 'nada.ltd', 'tempail.com', 'fakemailgenerator.com',
    'emailondeck.com', 'mytemp.email', 'tempmailo.com', 'inboxbear.com', 'discard.email',
    'mailnull.com', 'mytempmail.com', 'spambog.com', 'tempinbox.com', 'crazymail.com',
    'spamfree24.org', 'trash-mail.com', 'throwaway.email', 'armyspy.com', 'cuvox.de',
    'dayrep.com', 'einrot.com', 'fleckens.hu', 'gustr.com', 'jourrapide.com',
    'rhyta.com', 'superrito.com', 'teleworm.us', 'tinypm.com', 'mailnesia.com'
  ];
BEGIN
  -- 1. Honeypot check: reject if any honeypot column has data
  IF (NEW.hp_company_website IS NOT NULL AND NEW.hp_company_website != '') OR
     (NEW.hp_secondary_phone IS NOT NULL AND NEW.hp_secondary_phone != '') THEN
    RAISE EXCEPTION 'Bot submission detected: honeypot field populated';
  END IF;

  -- 2. Check if name contains promotional URLs or script injection
  IF NEW.name ~* '(https?://|www\.|\.ru/|\.xyz/|\.top/|<script|<a\s)' THEN
    RAISE EXCEPTION 'Invalid lead submission: URL or HTML in name field';
  END IF;

  -- 3. Check if phone contains promotional URLs
  IF NEW.phone IS NOT NULL AND NEW.phone ~* '(https?://|www\.)' THEN
    RAISE EXCEPTION 'Invalid lead submission: URL in phone field';
  END IF;

  -- 4. Check email format & reject disposable/burner bot domains
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    IF NOT (NEW.email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$') THEN
      RAISE EXCEPTION 'Invalid lead submission: invalid email format';
    END IF;

    v_domain := lower(split_part(NEW.email, '@', 2));
    IF v_domain = ANY(v_disposable_domains) THEN
      RAISE EXCEPTION 'Invalid lead submission: disposable email domain rejected';
    END IF;
  END IF;

  -- 5. Check if message contains script tags or BBCode injection
  IF NEW.message IS NOT NULL AND NEW.message ~* '(<script|\[url=|<iframe|<style)' THEN
    RAISE EXCEPTION 'Invalid lead submission: forbidden tags in message';
  END IF;

  -- 6. Rate limit: block rapid duplicate spamming (max 2 submissions per email per 5 minutes)
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    IF (SELECT count(*) FROM public.leads WHERE email = NEW.email AND created_at > now() - interval '5 minutes') >= 2 THEN
      RAISE EXCEPTION 'Rate limit exceeded: too many submissions from this email within 5 minutes';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_filter_spam_leads ON public.leads;
CREATE TRIGGER trg_filter_spam_leads
BEFORE INSERT ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.filter_spam_leads();
