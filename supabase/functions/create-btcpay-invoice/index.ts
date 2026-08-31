import { createClient } from "npm:@supabase/supabase-js@2";
import { loadBtcPayConfig } from "../_shared/btcpay-settings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

type CheckoutItem = {
  product_id: string;
  quantity: number;
  variation_id?: string | null;
};

type Customer = {
  email: string;
  phone?: string | null;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

type CheckoutRequest = {
  customer: Customer;
  items: CheckoutItem[];
};

type Product = {
  id: string;
  uuid_id: string | null;
  name: string;
  price: number | string;
  stock: number | null;
};

type ProductVariation = {
  id: string;
  product_id: string;
  specification: string | null;
  price: number | string;
  stock: number | null;
  quantity: number | null;
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toPositiveInteger(value: unknown): number {
  const number = Number(value);

  if (!Number.isInteger(number) || number <= 0) {
    return 0;
  }

  return number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        error: "Method not allowed.",
      },
      405,
    );
  }

  try {
    // ============================================================
    // ENVIRONMENT
    // ============================================================

    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const siteUrl =
      Deno.env.get("SITE_URL");

    if (
      !supabaseUrl ||
      !serviceRoleKey ||
      !siteUrl
    ) {
      console.error("Missing required Edge Function secrets.");

      return jsonResponse(
        {
          error: "Server configuration is incomplete.",
        },
        500,
      );
    }

    // ============================================================
    // SUPABASE ADMIN CLIENT
    // ============================================================

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // ============================================================
    // BTCPAY CONFIGURATION (admin-managed, stored encrypted in DB)
    // ============================================================

    let btcpayConfig;

    try {
      btcpayConfig = await loadBtcPayConfig(supabaseAdmin);
    } catch (error) {
      console.error("Failed to load BTCPay configuration:", error);

      return jsonResponse(
        {
          error: "Bitcoin payments are temporarily unavailable.",
        },
        500,
      );
    }

    if (!btcpayConfig || !btcpayConfig.enabled) {
      return jsonResponse(
        {
          error: "Bitcoin payments are not currently available. Please contact support.",
        },
        503,
      );
    }

    const btcpayUrl = btcpayConfig.serverUrl;
    const btcpayApiKey = btcpayConfig.apiKey;
    const btcpayStoreId = btcpayConfig.storeId;

    // ============================================================
    // READ REQUEST
    // ============================================================

    let body: CheckoutRequest;

    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        {
          error: "Invalid JSON request.",
        },
        400,
      );
    }

    const customer = body?.customer;

    const items = body?.items;

    // ============================================================
    // VALIDATE CUSTOMER
    // ============================================================

    if (!customer || typeof customer !== "object") {
      return jsonResponse(
        {
          error: "Customer information is required.",
        },
        400,
      );
    }

    const email = cleanString(customer.email);

    const fullName = cleanString(customer.name);

    const address = cleanString(customer.address);

    const city = cleanString(customer.city);

    const state = cleanString(customer.state);

    const zip = cleanString(customer.zip);

    const country = cleanString(customer.country);

    const phone = cleanString(customer.phone);

    if (!email || !isValidEmail(email)) {
      return jsonResponse(
        {
          error: "A valid email address is required.",
        },
        400,
      );
    }

    if (!fullName) {
      return jsonResponse(
        {
          error: "Full name is required.",
        },
        400,
      );
    }

    if (!address || !city || !state || !zip || !country) {
      return jsonResponse(
        {
          error: "Complete shipping information is required.",
        },
        400,
      );
    }

    // ============================================================
    // VALIDATE ITEMS
    // ============================================================

    if (!Array.isArray(items) || items.length === 0) {
      return jsonResponse(
        {
          error: "Your cart is empty.",
        },
        400,
      );
    }

    if (items.length > 100) {
      return jsonResponse(
        {
          error: "Too many items in checkout.",
        },
        400,
      );
    }

    const normalizedItems: CheckoutItem[] = [];

    for (const item of items) {
      if (!item || typeof item !== "object") {
        return jsonResponse(
          {
            error: "Invalid cart item.",
          },
          400,
        );
      }

      const productId = cleanString(item.product_id);

      const quantity = toPositiveInteger(item.quantity);

      const variationId = item.variation_id
        ? cleanString(item.variation_id)
        : null;

      if (!productId) {
        return jsonResponse(
          {
            error: "Invalid product ID.",
          },
          400,
        );
      }

      if (!quantity || quantity > 1000) {
        return jsonResponse(
          {
            error: `Invalid quantity for product ${productId}.`,
          },
          400,
        );
      }

      normalizedItems.push({
        product_id: productId,
        quantity,
        variation_id: variationId,
      });
    }
    // ============================================================
    // LOAD PRODUCTS FROM DATABASE
    // ============================================================

    const productIds = [
      ...new Set(
        normalizedItems.map(
          (item) => item.product_id,
        ),
      ),
    ];

    const {
      data: products,
      error: productsError,
    } = await supabaseAdmin
      .from("products")
      .select(
        "id, uuid_id, name, price, stock",
      )
      .in("id", productIds);

    if (productsError) {
      console.error(
        "Product lookup failed:",
        productsError,
      );

      return jsonResponse(
        {
          error: "Unable to validate products.",
        },
        500,
      );
    }

    if (!products || products.length !== productIds.length) {
      return jsonResponse(
        {
          error:
            "One or more products are no longer available.",
        },
        400,
      );
    }

    const productMap = new Map<string, Product>();

    for (const product of products) {
      productMap.set(product.id, product);
    }

    // ============================================================
    // LOAD VARIATIONS
    // ============================================================

    const variationIds = [
      ...new Set(
        normalizedItems
          .map((item) => item.variation_id)
          .filter(
            (id): id is string => Boolean(id),
          ),
      ),
    ];

    const variationMap =
      new Map<string, ProductVariation>();

    if (variationIds.length > 0) {
      const {
        data: variations,
        error: variationsError,
      } = await supabaseAdmin
        .from("product_variations")
        .select(
          "id, product_id, specification, price, stock, quantity",
        )
        .in("id", variationIds);

      if (variationsError) {
        console.error(
          "Variation lookup failed:",
          variationsError,
        );

        return jsonResponse(
          {
            error:
              "Unable to validate product variations.",
          },
          500,
        );
      }

      for (const variation of variations ?? []) {
        variationMap.set(
          variation.id,
          variation as ProductVariation,
        );
      }
    }

    // ============================================================
    // VALIDATE + CALCULATE
    // ============================================================

    let subtotal = 0;

    const orderItems: Array<{
      order_id: string;
      product_id: string;
      product_name: string;
      price: number;
      quantity: number;
      variation_id: string | null;
      variation_name: string | null;
    }> = [];

    for (const item of normalizedItems) {
      const product = productMap.get(
        item.product_id,
      );

      if (!product) {
        return jsonResponse(
          {
            error:
              "One or more products are unavailable.",
          },
          400,
        );
      }

      let unitPrice = Number(product.price);

      let availableStock =
        product.stock ?? 0;

      let variationName: string | null = null;

      // ----------------------------------------------------------
      // Variation
      // ----------------------------------------------------------

      if (item.variation_id) {
        const variation = variationMap.get(
          item.variation_id,
        );

        if (!variation) {
          return jsonResponse(
            {
              error: `Variation ${item.variation_id} was not found.`,
            },
            400,
          );
        }

        // The variation points to products.uuid_id,
        // not products.id.
       if (!product.uuid_id) {
      return jsonResponse(
        {
          error:
            `Product ${product.id} is missing its UUID.`,
        },
        500,
      );
    }

        if (
          variation.product_id !==
          product.uuid_id
        ) {
          return jsonResponse(
            {
              error:
                "Product variation does not belong to the selected product.",
            },
            400,
          );
        }

        unitPrice = Number(variation.price);

        availableStock =
          variation.stock ??
          variation.quantity ??
          0;

        variationName =
          variation.specification;
      }

      // ----------------------------------------------------------
      // Price validation
      // ----------------------------------------------------------

      if (
        !Number.isFinite(unitPrice) ||
        unitPrice < 0
      ) {
        return jsonResponse(
          {
            error:
              `Invalid price for ${product.name}.`,
          },
          500,
        );
      }

      // ----------------------------------------------------------
      // Stock validation
      // ----------------------------------------------------------

      if (
        !Number.isFinite(availableStock) ||
        availableStock < item.quantity
      ) {
        return jsonResponse(
          {
            error:
              `${product.name} does not have enough stock.`,
          },
          409,
        );
      }

      const lineTotal =
        toMoney(
          unitPrice * item.quantity,
        );

      subtotal =
        toMoney(
          subtotal + lineTotal,
        );

      orderItems.push({
        order_id: "",
        product_id: product.id,
        product_name: product.name,
        price: unitPrice,
        quantity: item.quantity,
        variation_id:
          item.variation_id ?? null,
        variation_name:
          variationName,
      });
    }

    // ============================================================
    // SHIPPING
    //
    // Current store rule:
    // $75+ = free shipping
    // below $75 = $7
    //
    // Change these values if your checkout uses different rules.
    // ============================================================

    const shipping =
      subtotal > 150 ? 0 : subtotal > 0 ? 12 : 0;

    const tax = toMoney(subtotal * 0.07);
    // ============================================================
    // TAX
    //
    // Currently zero because your existing checkout tax rules
    // were not provided in the Phase 2 schema.
    //
    // We can add the exact tax calculation once confirmed.
    // ============================================================


    // ============================================================
    // TOTAL
    // ============================================================

    const total =
      toMoney(
        subtotal +
        shipping +
        tax,
      );

    if (total <= 0) {
      return jsonResponse(
        {
          error:
            "Order total must be greater than zero.",
        },
        400,
      );
    }

    // ============================================================
    // CREATE INTERNAL ORDER ID
    //
    // Your orders.id is TEXT, so we intentionally generate a
    // string ID instead of UUID.
    // ============================================================

    const orderId =
      `ORD-${crypto.randomUUID()}`;

    // ============================================================
    // CREATE ORDER
    // ============================================================

    const {
      data: createdOrder,
      error: orderError,
    } = await supabaseAdmin
      .from("orders")
      .insert({
        id: orderId,

        customer_email: email,

        full_name: fullName,

        address,

        city,

        state,

        zip,

        country,

        subtotal,

        shipping,

        tax,

        total,

        status: "pending",

        payment_method: "btcpay",

        payment_status: "pending",

        email,

        phone: phone || null,

        name: fullName,

        order_status: "pending",
      })
      .select(
        "id, customer_email, total",
      )
      .single();

    if (orderError || !createdOrder) {
      console.error(
        "Order creation failed:",
        orderError,
      );

      return jsonResponse(
        {
          error:
            "Unable to create your order.",
        },
        500,
      );
    }

    // ============================================================
    // ADD ORDER ID TO ITEMS
    // ============================================================

    const orderItemRows =
      orderItems.map(
        (item) => ({
          ...item,
          order_id: orderId,
        }),
      );

    // ============================================================
    // CREATE ORDER ITEMS
    // ============================================================

    const {
      error: orderItemsError,
    } = await supabaseAdmin
      .from("order_items")
      .insert(orderItemRows);

    if (orderItemsError) {
      console.error(
        "Order item creation failed:",
        orderItemsError,
      );

      // Remove incomplete order
      await supabaseAdmin
        .from("orders")
        .delete()
        .eq("id", orderId);

      return jsonResponse(
        {
          error:
            "Unable to create order items.",
        },
        500,
      );
    }

    // ============================================================
    // BTCPAY API
    // ============================================================

    const normalizedBtcPayUrl =
      btcpayUrl.replace(/\/+$/, "");

    const btcpayEndpoint =
      `${normalizedBtcPayUrl}/api/v1/stores/${encodeURIComponent(
        btcpayStoreId,
      )}/invoices`;

    // ============================================================
    // CREATE BTCPAY INVOICE
    // ============================================================

    const btcpayResponse =
      await fetch(
        btcpayEndpoint,
        {
          method: "POST",

          headers: {
            "Authorization":
              `token ${btcpayApiKey}`,

            "Content-Type":
              "application/json",

            "Accept":
              "application/json",
          },

          body: JSON.stringify({
            amount: total.toFixed(2),

            currency: "USD",

            checkout: {
              redirectURL:
                `${siteUrl}/order-confirmation?orderId=${encodeURIComponent(
                  orderId,
                )}`,

              redirectAutomatically: true,
            },

            metadata: {
              orderId,

              order_id: orderId,

              customerEmail: email,

              buyerEmail: email,

              buyerName: fullName,
            },

            receipt: {
              enabled: true,
            },
          }),
        },
      );

    // ============================================================
    // BTCPAY ERROR
    // ============================================================

    if (!btcpayResponse.ok) {
      const errorText =
        await btcpayResponse.text();

      console.error(
        "BTCPay invoice creation failed:",
        btcpayResponse.status,
        errorText,
      );

      // Delete incomplete checkout order
      await supabaseAdmin
        .from("orders")
        .delete()
        .eq("id", orderId);

      return jsonResponse(
        {
          error:
            "Unable to create the Bitcoin payment invoice.",
        },
        502,
      );
    }

    const invoice =
      await btcpayResponse.json();

    // ============================================================
    // VALIDATE BTCPAY RESPONSE
    // ============================================================

    const invoiceId =
      typeof invoice.id === "string"
        ? invoice.id
        : null;

    const checkoutUrl =
      typeof invoice.checkoutLink === "string"
        ? invoice.checkoutLink
        : null;

    if (!invoiceId || !checkoutUrl) {
      console.error(
        "Invalid BTCPay response:",
        invoice,
      );

      await supabaseAdmin
        .from("orders")
        .delete()
        .eq("id", orderId);

      return jsonResponse(
        {
          error:
            "BTCPay returned an invalid invoice.",
        },
        502,
      );
    }

    // ============================================================
    // SAVE BTCPAY DATA
    // ============================================================

    const {
      error: updateOrderError,
    } = await supabaseAdmin
      .from("orders")
      .update({
        btcpay_invoice_id:
          invoiceId,

        btcpay_checkout_url:
          checkoutUrl,

        payment_status:
          "pending",

        payment_method:
          "btcpay",
      })
      .eq("id", orderId);

    if (updateOrderError) {
      console.error(
        "Unable to save BTCPay invoice:",
        updateOrderError,
      );

      // We intentionally do not delete the order here.
      // BTCPay invoice already exists and must remain traceable.

      return jsonResponse(
        {
          error:
            "Payment invoice was created, but the order could not be finalized.",
        },
        500,
      );
    }

    // ============================================================
    // SUCCESS
    // ============================================================

    return jsonResponse(
      {
        success: true,

        orderId,

        invoiceId,

        checkoutUrl,

        subtotal,

        shipping,

        tax,

        total,
      },
      200,
    );
  } catch (error) {
    console.error(
      "Unexpected create-btcpay-invoice error:",
      error,
    );

    return jsonResponse(
      {
        error:
          "An unexpected server error occurred.",
      },
      500,
    );
  }
});