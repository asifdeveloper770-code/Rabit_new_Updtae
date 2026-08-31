import { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { decryptSecret } from "./encryption.ts";

export type PaymentGatewayRow = {
  id: string;
  provider: string;
  enabled: boolean;
  server_url: string | null;
  store_id: string | null;
  api_key_encrypted: string | null;
  webhook_secret_encrypted: string | null;
  updated_at: string;
};

export type BtcPayConfig = {
  enabled: boolean;
  serverUrl: string;
  storeId: string;
  apiKey: string;
  webhookSecret: string;
};

/**
 * Loads and decrypts the BTCPay configuration from the database.
 * Returns null if no configuration row exists yet.
 */
export async function loadBtcPayConfig(
  supabaseAdmin: SupabaseClient,
): Promise<BtcPayConfig | null> {
  const { data, error } = await supabaseAdmin
    .from("payment_gateways")
    .select("enabled, server_url, store_id, api_key_encrypted, webhook_secret_encrypted")
    .eq("provider", "btcpay")
    .maybeSingle();

  if (error) {
    console.error("Failed to load payment_gateways row:", error);
    throw new Error("Unable to load payment gateway configuration.");
  }

  if (!data || !data.server_url || !data.store_id || !data.api_key_encrypted) {
    return null;
  }

  const apiKey = await decryptSecret(data.api_key_encrypted);
  const webhookSecret = data.webhook_secret_encrypted
    ? await decryptSecret(data.webhook_secret_encrypted)
    : "";

  return {
    enabled: Boolean(data.enabled),
    serverUrl: data.server_url.replace(/\/+$/, ""),
    storeId: data.store_id,
    apiKey,
    webhookSecret,
  };
}

export type ConnectionTestResult = {
  success: boolean;
  serverOnline: boolean;
  storeConnected: boolean;
  apiKeyValid: boolean;
  message: string;
};

/**
 * Runs a server-side connection test against a BTCPay Server instance.
 * Never throws — always resolves to a result describing what failed.
 */
export async function testBtcPayConnection(
  serverUrl: string,
  storeId: string,
  apiKey: string,
): Promise<ConnectionTestResult> {
  const normalizedUrl = serverUrl.replace(/\/+$/, "");

  // 1. Server reachability / health
  try {
    const healthResponse = await fetch(`${normalizedUrl}/api/v1/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!healthResponse.ok) {
      return {
        success: false,
        serverOnline: false,
        storeConnected: false,
        apiKeyValid: false,
        message: `BTCPay server responded with status ${healthResponse.status}.`,
      };
    }
  } catch {
    return {
      success: false,
      serverOnline: false,
      storeConnected: false,
      apiKeyValid: false,
      message: "Could not reach the BTCPay server URL.",
    };
  }

  // 2. Store + API key validity — fetching the store with the API key
  // exercises both the store ID and the token's permissions in one call.
  try {
    const storeResponse = await fetch(
      `${normalizedUrl}/api/v1/stores/${encodeURIComponent(storeId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `token ${apiKey}`,
          Accept: "application/json",
        },
      },
    );

    if (storeResponse.status === 401 || storeResponse.status === 403) {
      return {
        success: false,
        serverOnline: true,
        storeConnected: false,
        apiKeyValid: false,
        message: "API key authentication failed. Verify the API key and its store permissions.",
      };
    }

    if (storeResponse.status === 404) {
      return {
        success: false,
        serverOnline: true,
        storeConnected: false,
        apiKeyValid: true,
        message: "Store ID was not found on this BTCPay server.",
      };
    }

    if (!storeResponse.ok) {
      return {
        success: false,
        serverOnline: true,
        storeConnected: false,
        apiKeyValid: false,
        message: `BTCPay server responded with status ${storeResponse.status} while checking the store.`,
      };
    }

    return {
      success: true,
      serverOnline: true,
      storeConnected: true,
      apiKeyValid: true,
      message: "BTCPay connection successful.",
    };
  } catch {
    return {
      success: false,
      serverOnline: true,
      storeConnected: false,
      apiKeyValid: false,
      message: "Could not verify the store and API key.",
    };
  }
}
