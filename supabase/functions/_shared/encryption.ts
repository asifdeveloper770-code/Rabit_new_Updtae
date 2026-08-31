// ============================================================
// Shared encryption helper for payment gateway credentials.
//
// Credentials (BTCPay API key, webhook secret) are stored in the
// database encrypted at rest with AES-256-GCM. The encryption key
// itself lives ONLY as an Edge Function secret (PAYMENT_ENCRYPTION_KEY)
// and is never stored in the database or sent to the browser.
//
// Generate a key once with:
//   openssl rand -base64 32
// and set it with:
//   supabase secrets set PAYMENT_ENCRYPTION_KEY=<generated value>
// ============================================================

const IV_LENGTH_BYTES = 12; // 96-bit IV, standard for AES-GCM

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function getKey(): Promise<CryptoKey> {
  const rawKey = Deno.env.get("PAYMENT_ENCRYPTION_KEY");

  if (!rawKey) {
    throw new Error("PAYMENT_ENCRYPTION_KEY secret is not configured.");
  }

  let keyBytes: Uint8Array;

  try {
    keyBytes = base64ToBytes(rawKey);
  } catch {
    throw new Error("PAYMENT_ENCRYPTION_KEY is not valid base64.");
  }

  if (keyBytes.length !== 32) {
    throw new Error(
      "PAYMENT_ENCRYPTION_KEY must decode to exactly 32 bytes (AES-256). Generate one with: openssl rand -base64 32",
    );
  }

  return crypto.subtle.importKey(
    "raw",
    keyBytes.buffer as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypts a plaintext string. Returns "<iv-base64>:<ciphertext-base64>",
 * safe to store in a database column.
 */
export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );

  return `${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(ciphertext))}`;
}

/**
 * Decrypts a value produced by encryptSecret.
 */
export async function decryptSecret(stored: string): Promise<string> {
  const key = await getKey();
  const [ivPart, ciphertextPart] = stored.split(":");

  if (!ivPart || !ciphertextPart) {
    throw new Error("Stored secret is not in the expected iv:ciphertext format.");
  }

  const iv = base64ToBytes(ivPart);
  const ciphertext = base64ToBytes(ciphertextPart);

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer,
  );

  return new TextDecoder().decode(plaintextBuffer);
}
