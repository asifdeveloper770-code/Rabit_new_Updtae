import { createClient } from "npm:@supabase/supabase-js@2";
import { loadBtcPayConfig } from "../_shared/btcpay-settings.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!  
);

function timingSafeEqual(
  a: Uint8Array,
  b: Uint8Array
) {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;

  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}

async function verifySignature(
  body: string,
  signature: string,
  webhookSecret: string
) {
  const expectedPrefix = "sha256=";

  if (!signature.startsWith(expectedPrefix)) {
    return false;
  }

  const providedHex =
    signature.slice(expectedPrefix.length);

  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(body)
  );

  const expected = new Uint8Array(signed);

  const provided = new Uint8Array(
    providedHex.match(/.{1,2}/g)!.map(
      (byte) => parseInt(byte, 16)
    )
  );

  return timingSafeEqual(
    expected,
    provided
  );
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
      });
    }

    const body = await req.text();

    const signature =
      req.headers.get("BTCPay-Sig") ||
      req.headers.get("btcpay-sig");

    if (!signature) {
      return new Response(
        "Missing signature",
        { status: 401 }
      );
    }

    const btcpayConfig = await loadBtcPayConfig(supabase);

    if (!btcpayConfig || !btcpayConfig.webhookSecret) {
      console.error("BTCPay webhook received but no webhook secret is configured.");
      return new Response(
        "Webhook not configured",
        { status: 503 }
      );
    }

    const valid =
      await verifySignature(
        body,
        signature,
        btcpayConfig.webhookSecret
      );

    if (!valid) {
      return new Response(
        "Invalid signature",
        { status: 401 }
      );
    }

    const event = JSON.parse(body);

    const invoiceId =
      event.invoiceId;

    const type =
      event.type;

    if (!invoiceId) {
      return new Response(
        "Missing invoice ID",
        { status: 400 }
      );
    }

    /*
     * Payment received / settled.
     *
     * Depending on your BTCPay configuration,
     * you can handle InvoicePaymentSettled
     * as the final payment event.
     */
    if (
      type === "InvoicePaymentSettled" ||
      type === "InvoiceProcessing"
    ) {
      const { data: order } =
        await supabase
          .from("orders")
          .select("id")
          .eq(
            "btcpay_invoice_id",
            invoiceId
          )
          .single();

      if (!order) {
        return new Response(
          "Order not found",
          { status: 404 }
        );
      }

      await supabase
        .from("orders")
        .update({
          status:
            type ===
            "InvoicePaymentSettled"
              ? "paid"
              : "processing",

          payment_status:
            type ===
            "InvoicePaymentSettled"
              ? "paid"
              : "processing",

          paid_at:
            type ===
            "InvoicePaymentSettled"
              ? new Date().toISOString()
              : null,
        })
        .eq("id", order.id);
    }

    if (
      type === "InvoiceExpired"
    ) {
      await supabase
        .from("orders")
        .update({
          status: "expired",
          payment_status: "expired",
        })
        .eq(
          "btcpay_invoice_id",
          invoiceId
        );
    }

    return new Response(
      JSON.stringify({
        received: true,
      }),
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/json",
        },
      }
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Webhook error",
      }),
      {
        status: 500,
      }
    );
  }
});