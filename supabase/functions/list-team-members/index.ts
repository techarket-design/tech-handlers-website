import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin or team
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await callerClient.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    const { data: isTeam } = await callerClient.rpc("has_role", { _user_id: caller.id, _role: "team" });
    if (!isAdmin && !isTeam) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all user roles
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roles, error: rolesError } = await adminClient
      .from("user_roles")
      .select("user_id, role")
      .order("created_at", { ascending: true });

    if (rolesError) throw rolesError;

    // Get user emails via admin API
    const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (usersError) throw usersError;

    const userMap = new Map(users.map(u => [u.id, { email: u.email, name: (u.user_metadata as any)?.name || (u.user_metadata as any)?.full_name || "" }]));

    const members = (roles || []).map(r => ({
      user_id: r.user_id,
      role: r.role,
      email: userMap.get(r.user_id)?.email || "unknown",
      name: userMap.get(r.user_id)?.name || "",
    }));

    return new Response(JSON.stringify(members), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
