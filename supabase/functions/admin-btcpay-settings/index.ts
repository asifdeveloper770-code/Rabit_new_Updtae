// ============================================================
// GET  -> returns the current BTCPay settings, with secrets replaced
//         by "configured: true/false" flags. Never returns plaintext
//         or ciphertext of the API key / webhook secret.
// POST -> saves settings. To keep an existing secret unchanged, the
//         admin simply omits that field (or sends an empty string).
//         Sending a non-empty value replaces the stored secret.
//
// Both require a valid Supabase session (Authorization: Bearer <jwt>).
// ============================================================

import { encryptSecret } from "../_shared/encryption.ts";
import { createAdminClient, requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

type SaveRequest = {
  enabled?: boolean;
  serverUrl?: string;
  storeId?: string;
  apiKey?: string; // omit or "" to keep existing
  webhookSecret?: string; // omit or "" to keep existing
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
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

  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin
      .from("payment_gateways")
      .select("enabled, server_url, store_id, api_key_encrypted, webhook_secret_encrypted, updated_at")
      .eq("provider", "btcpay")
      .maybeSingle();

    if (error) {
      console.error("Failed to load BTCPay settings:", error);
      return jsonResponse({ error: "Unable to load BTCPay settings." }, 500);
    }

    return jsonResponse({
      provider: "btcpay",
      enabled: Boolean(data?.enabled),
      serverUrl: data?.server_url ?? "",
      storeId: data?.store_id ?? "",
      apiKeyConfigured: Boolean(data?.api_key_encrypted),
      webhookConfigured: Boolean(data?.webhook_secret_encrypted),
      updatedAt: data?.updated_at ?? null,
    });
  }

  if (req.method === "POST") {
    let body: SaveRequest;

    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON request." }, 400);
    }

    const enabled = Boolean(body.enabled);
    const serverUrl = typeof body.serverUrl === "string" ? body.serverUrl.trim() : "";
    const storeId = typeof body.storeId === "string" ? body.storeId.trim() : "";
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    const webhookSecret = typeof body.webhookSecret === "string" ? body.webhookSecret.trim() : "";

    if (enabled && (!serverUrl || !storeId)) {
      return jsonResponse(
        { error: "Server URL and Store ID are required to enable BTCPay." },
        400,
      );
    }

    if (serverUrl && !/^https?:\/\//i.test(serverUrl)) {
      return jsonResponse({ error: "Server URL must start with http:// or https://." }, 400);
    }

    // Load the existing row so we know whether secrets already exist
    // (required if the admin enables BTCPay without re-entering a key
    // that was already saved).
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("payment_gateways")
      .select("id, api_key_encrypted, webhook_secret_encrypted")
      .eq("provider", "btcpay")
      .maybeSingle();

    if (existingError) {
      console.error("Failed to load existing BTCPay settings:", existingError);
      return jsonResponse({ error: "Unable to load existing settings." }, 500);
    }

    if (enabled && !apiKey && !existing?.api_key_encrypted) {
      return jsonResponse(
        { error: "An API key is required to enable BTCPay." },
        400,
      );
    }

    let apiKeyEncrypted = existing?.api_key_encrypted ?? null;
    let webhookSecretEncrypted = existing?.webhook_secret_encrypted ?? null;

    try {
      if (apiKey) {
        apiKeyEncrypted = await encryptSecret(apiKey);
      }
      if (webhookSecret) {
        webhookSecretEncrypted = await encryptSecret(webhookSecret);
      }
    } catch (error) {
      console.error("Encryption failure:", error);
      return jsonResponse(
        { error: "Server is not configured to store credentials securely." },
        500,
      );
    }

    const row = {
      provider: "btcpay",
      enabled,
      server_url: serverUrl || null,
      store_id: storeId || null,
      api_key_encrypted: apiKeyEncrypted,
      webhook_secret_encrypted: webhookSecretEncrypted,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabaseAdmin
      .from("payment_gateways")
      .upsert(row, { onConflict: "provider" });

    if (upsertError) {
      console.error("Failed to save BTCPay settings:", upsertError);
      return jsonResponse({ error: "Unable to save BTCPay settings." }, 500);
    }

    return jsonResponse({
      success: true,
      provider: "btcpay",
      enabled,
      serverUrl,
      storeId,
      apiKeyConfigured: Boolean(apiKeyEncrypted),
      webhookConfigured: Boolean(webhookSecretEncrypted),
    });
  }

  return jsonResponse({ error: "Method not allowed." }, 405);
});
