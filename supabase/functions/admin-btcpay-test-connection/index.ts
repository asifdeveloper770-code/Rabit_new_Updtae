// ============================================================
// POST -> tests a BTCPay connection server-side.
//
// If serverUrl/storeId/apiKey are provided in the request body, those
// draft values are tested directly (so an admin can verify credentials
// before saving them). If apiKey is omitted, the currently saved
// (decrypted server-side only) credentials are used instead — this
// lets "Test Connection" work after credentials were already saved
// without ever sending the key back to the browser.
//
// Requires a valid Supabase session (Authorization: Bearer <jwt>).
// ============================================================

import { createAdminClient, requireAdmin } from "../_shared/admin-auth.ts";
import { loadBtcPayConfig, testBtcPayConnection } from "../_shared/btcpay-settings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

type TestRequest = {
  serverUrl?: string;
  storeId?: string;
  apiKey?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = createAdminClient();
  } catch (error) {
    console.error("Missing server configuration:", error);
    return jsonResponse({ error: "Server configuration is incomplete." }, 500);
  }

  const auth = await requireAdmin(req, supabaseAdmin);
  if (!auth.ok) {
    return jsonResponse({ error: auth.error }, auth.status);
  }

  let body: TestRequest = {};
  try {
    body = await req.json();
  } catch {
    // Empty body is fine — falls back to saved settings below.
  }

  let serverUrl = typeof body.serverUrl === "string" ? body.serverUrl.trim() : "";
  let storeId = typeof body.storeId === "string" ? body.storeId.trim() : "";
  let apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";

  if (!apiKey) {
    // Fall back to saved, decrypted credentials so "Test Connection"
    // works after a previous save without resending the key.
    try {
      const saved = await loadBtcPayConfig(supabaseAdmin);
      if (!saved) {
        return jsonResponse(
          { success: false, message: "No saved BTCPay configuration found. Enter credentials first." },
          400,
        );
      }
      serverUrl = serverUrl || saved.serverUrl;
      storeId = storeId || saved.storeId;
      apiKey = saved.apiKey;
    } catch (error) {
      console.error("Failed to load saved BTCPay config for test:", error);
      return jsonResponse(
        { success: false, message: "Unable to load saved configuration for testing." },
        500,
      );
    }
  }

  if (!serverUrl || !storeId || !apiKey) {
    return jsonResponse(
      { success: false, message: "Server URL, Store ID, and API key are all required to test the connection." },
      400,
    );
  }

  if (!/^https?:\/\//i.test(serverUrl)) {
    return jsonResponse({ success: false, message: "Server URL must start with http:// or https://." }, 400);
  }

  const result = await testBtcPayConnection(serverUrl, storeId, apiKey);

  return jsonResponse(result, result.success ? 200 : 200);
});
