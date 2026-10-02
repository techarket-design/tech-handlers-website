-- TH Blog Publisher. Apply in staging before production. No existing posts change.
CREATE TABLE public.blog_mcp_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  resource text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days',
  revoked_at timestamptz
);
CREATE TABLE public.blog_mcp_codes (
  code_hash text PRIMARY KEY,
  grant_id uuid NOT NULL REFERENCES public.blog_mcp_grants(id) ON DELETE CASCADE,
  redirect_uri text NOT NULL,
  challenge text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '5 minutes'
);
CREATE TABLE public.blog_mcp_tokens (
  token_hash text PRIMARY KEY,
  grant_id uuid NOT NULL REFERENCES public.blog_mcp_grants(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('access','refresh')),
  expires_at timestamptz NOT NULL
);
CREATE TABLE public.blog_mcp_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  grant_id uuid NOT NULL REFERENCES public.blog_mcp_grants(id),
  request_id uuid NOT NULL,
  action text NOT NULL,
  request_hash text NOT NULL,
  post_id uuid NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (grant_id, request_id)
);
ALTER TABLE public.blog_mcp_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_mcp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_mcp_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_mcp_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.blog_mcp_grants, public.blog_mcp_codes, public.blog_mcp_tokens, public.blog_mcp_audit FROM anon, authenticated;
GRANT ALL ON public.blog_mcp_grants, public.blog_mcp_codes, public.blog_mcp_tokens, public.blog_mcp_audit TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.blog_mcp_audit_id_seq TO service_role;

-- Atomic one-use authorization-code exchange and refresh-token rotation.
CREATE FUNCTION public.blog_mcp_exchange(p_kind text, p_hash text, p_client text,
  p_resource text, p_redirect text, p_challenge text, p_access text, p_refresh text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g public.blog_mcp_grants; c public.blog_mcp_codes; t public.blog_mcp_tokens;
BEGIN
  IF p_kind = 'authorization_code' THEN
    SELECT * INTO c FROM public.blog_mcp_codes WHERE code_hash=p_hash FOR UPDATE;
    IF NOT FOUND OR c.expires_at <= now() OR c.redirect_uri <> p_redirect OR c.challenge <> p_challenge THEN
      RAISE EXCEPTION 'invalid_grant';
    END IF;
    SELECT * INTO g FROM public.blog_mcp_grants WHERE id=c.grant_id FOR UPDATE;
  ELSIF p_kind = 'refresh_token' THEN
    SELECT * INTO t FROM public.blog_mcp_tokens WHERE token_hash=p_hash AND kind='refresh' FOR UPDATE;
    IF NOT FOUND OR t.expires_at <= now() THEN RAISE EXCEPTION 'invalid_grant'; END IF;
    SELECT * INTO g FROM public.blog_mcp_grants WHERE id=t.grant_id FOR UPDATE;
  ELSE RAISE EXCEPTION 'invalid_grant'; END IF;
  IF g.id IS NULL OR g.client_id <> p_client OR g.resource <> p_resource OR g.revoked_at IS NOT NULL
    OR g.expires_at <= now() OR NOT public.has_role(g.user_id,'admin') THEN RAISE EXCEPTION 'invalid_grant'; END IF;
  IF p_kind='authorization_code' THEN DELETE FROM public.blog_mcp_codes WHERE code_hash=p_hash;
  ELSE DELETE FROM public.blog_mcp_tokens WHERE token_hash=p_hash; END IF;
  DELETE FROM public.blog_mcp_tokens WHERE expires_at < now();
  DELETE FROM public.blog_mcp_codes WHERE expires_at < now();
  INSERT INTO public.blog_mcp_tokens VALUES (p_access,g.id,'access',least(now()+interval '1 hour',g.expires_at)),
    (p_refresh,g.id,'refresh',g.expires_at);
  RETURN jsonb_build_object('expires_in',least(3600,floor(extract(epoch FROM g.expires_at-now()))));
END $$;

-- Every read/write checks token, grant, audience and current admin status.
-- Locking grants also serializes retries; mutation and audit entry commit together.
CREATE FUNCTION public.blog_mcp_action(p_hash text, p_resource text, p_action text, p_args jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE g public.blog_mcp_grants; b public.blog_posts; old public.blog_mcp_audit;
  r jsonb; rid uuid; fields jsonb;
BEGIN
  SELECT gr.* INTO g FROM public.blog_mcp_grants gr JOIN public.blog_mcp_tokens t ON t.grant_id=gr.id
    WHERE t.token_hash=p_hash AND t.kind='access' AND t.expires_at>now() FOR UPDATE OF gr;
  IF g.id IS NULL OR g.resource <> p_resource OR g.revoked_at IS NOT NULL OR g.expires_at<=now()
    OR NOT public.has_role(g.user_id,'admin') THEN RAISE EXCEPTION 'invalid_token'; END IF;
  IF p_action='verify' THEN RETURN jsonb_build_object('user_id',g.user_id); END IF;
  IF p_action='list' THEN
    SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]'::jsonb) INTO r FROM
      (SELECT id,title,slug,is_published,updated_at FROM public.blog_posts ORDER BY created_at DESC
       LIMIT least(coalesce((p_args->>'limit')::int,20),50) OFFSET coalesce((p_args->>'offset')::int,0)) q;
    RETURN jsonb_build_object('posts',r);
  END IF;
  IF p_action='get' THEN
    SELECT * INTO b FROM public.blog_posts WHERE id=(p_args->>'id')::uuid;
    IF NOT FOUND THEN RAISE EXCEPTION 'post_not_found'; END IF;
    RETURN to_jsonb(b);
  END IF;
  IF p_action NOT IN ('create','update','publish') THEN RAISE EXCEPTION 'invalid_action'; END IF;
  rid := (p_args->>'request_id')::uuid;
  IF rid IS NULL THEN RAISE EXCEPTION 'request_id_required'; END IF;
  SELECT * INTO old FROM public.blog_mcp_audit WHERE grant_id=g.id AND request_id=rid;
  IF FOUND THEN
    IF old.action<>p_action OR old.request_hash<>md5(p_args::text) THEN RAISE EXCEPTION 'request_id_reused'; END IF;
    RETURN old.result;
  END IF;
  IF p_action='create' THEN
    fields := p_args->'post';
    INSERT INTO public.blog_posts(title,slug,content,excerpt,author_name,category,tags,
      featured_image_url,image_alt,meta_title,meta_description,focus_keyword,secondary_keywords,
      reading_time_minutes,is_published)
    VALUES(fields->>'title',fields->>'slug',fields->>'content',fields->>'excerpt',fields->>'author_name',
      fields->>'category',ARRAY(SELECT jsonb_array_elements_text(fields->'tags')),
      fields->>'featured_image_url',fields->>'image_alt',fields->>'meta_title',fields->>'meta_description',
      fields->>'focus_keyword',ARRAY(SELECT jsonb_array_elements_text(fields->'secondary_keywords')),
      (fields->>'reading_time_minutes')::int,false) RETURNING * INTO b;
  ELSE
    SELECT * INTO b FROM public.blog_posts WHERE id=(p_args->>'id')::uuid FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'post_not_found'; END IF;
    IF b.updated_at IS DISTINCT FROM (p_args->>'expected_updated_at')::timestamptz THEN RAISE EXCEPTION 'post_changed'; END IF;
    IF p_action='update' THEN
      IF b.is_published THEN RAISE EXCEPTION 'edit_drafts_only'; END IF;
      -- Server validates a complete merged post; only this explicit field list is writable.
      fields := p_args->'post';
      UPDATE public.blog_posts SET title=fields->>'title',slug=fields->>'slug',content=fields->>'content',
        excerpt=fields->>'excerpt',author_name=fields->>'author_name',category=fields->>'category',
        tags=ARRAY(SELECT jsonb_array_elements_text(fields->'tags')),featured_image_url=fields->>'featured_image_url',
        image_alt=fields->>'image_alt',meta_title=fields->>'meta_title',meta_description=fields->>'meta_description',
        focus_keyword=fields->>'focus_keyword',secondary_keywords=ARRAY(SELECT jsonb_array_elements_text(fields->'secondary_keywords')),
        reading_time_minutes=(fields->>'reading_time_minutes')::int,updated_at=clock_timestamp()
      WHERE id=b.id RETURNING * INTO b;
    ELSE
      IF NOT coalesce((p_args->>'confirmed')::boolean,false) THEN RAISE EXCEPTION 'confirmation_required'; END IF;
      IF coalesce(trim(b.title),'')='' OR coalesce(trim(b.excerpt),'')='' OR coalesce(trim(b.content),'')='' THEN
        RAISE EXCEPTION 'incomplete_post'; END IF;
      UPDATE public.blog_posts SET is_published=true,published_at=coalesce(published_at,now()),updated_at=clock_timestamp()
      WHERE id=b.id RETURNING * INTO b;
    END IF;
  END IF;
  r:=to_jsonb(b);
  INSERT INTO public.blog_mcp_audit(grant_id,request_id,action,request_hash,post_id,result) VALUES(g.id,rid,p_action,md5(p_args::text),b.id,r);
  RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.blog_mcp_exchange(text,text,text,text,text,text,text,text),
  public.blog_mcp_action(text,text,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.blog_mcp_exchange(text,text,text,text,text,text,text,text),
  public.blog_mcp_action(text,text,text,jsonb) TO service_role;
