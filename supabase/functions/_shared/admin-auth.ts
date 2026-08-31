import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

/**
 * Verifies the request carries a valid Supabase session (Authorization:
 * Bearer <access_token>) belonging to an authenticated user.
 *
 * This matches the existing app convention (src/routes/admin/route.tsx):
 * any authenticated Supabase Auth user is treated as an admin — there is
 * no separate roles table in this project. Payment settings must never be
 * reachable without a valid session, so every admin-only function calls
 * this before touching payment_gateways.
 */
export async function requireAdmin(
  req: Request,
  supabaseAdmin: SupabaseClient,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return { ok: false, status: 401, error: "Authentication required." };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    return { ok: false, status: 401, error: "Invalid or expired session." };
  }

  return { ok: true };
}

export function createAdminClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY secrets.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
