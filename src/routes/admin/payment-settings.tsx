import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/payment-settings")({
  component: AdminPaymentSettings,
});

type SettingsResponse = {
  provider: string;
  enabled: boolean;
  serverUrl: string;
  storeId: string;
  apiKeyConfigured: boolean;
  webhookConfigured: boolean;
  updatedAt: string | null;
};

type TestResult = {
  success: boolean;
  message: string;
  serverOnline?: boolean;
  storeConnected?: boolean;
  apiKeyValid?: boolean;
};

function AdminPaymentSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [serverUrl, setServerUrl] = useState("");
  const [storeId, setStoreId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const [showApiKey, setShowApiKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin-btcpay-settings", {
        method: "GET",
      });

      if (error) throw error;

      const settings = data as SettingsResponse;
      setEnabled(settings.enabled);
      setServerUrl(settings.serverUrl);
      setStoreId(settings.storeId);
      setApiKeyConfigured(settings.apiKeyConfigured);
      setWebhookConfigured(settings.webhookConfigured);
      setUpdatedAt(settings.updatedAt);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.message || "Unable to load BTCPay settings." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("admin-btcpay-settings", {
        body: {
          enabled,
          serverUrl,
          storeId,
          // Only send secrets if the admin typed a new value —
          // an empty field means "keep the existing one".
          apiKey: apiKey || undefined,
          webhookSecret: webhookSecret || undefined,
        },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || "Unable to save settings.");
      }

      setApiKeyConfigured(data.apiKeyConfigured);
      setWebhookConfigured(data.webhookConfigured);
      setApiKey("");
      setWebhookSecret("");
      setStatusMessage({ type: "success", text: "BTCPay settings saved." });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.message || "Unable to save BTCPay settings." });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setStatusMessage(null);

    try {
      // If the admin has unsaved draft values in the form, test those
      // directly. Otherwise the function falls back to the saved,
      // server-side decrypted credentials.
      const body: Record<string, string> = {};
      if (serverUrl) body.serverUrl = serverUrl;
      if (storeId) body.storeId = storeId;
      if (apiKey) body.apiKey = apiKey;

      const { data, error } = await supabase.functions.invoke("admin-btcpay-test-connection", {
        body,
      });

      if (error) throw error;

      setTestResult(data as TestResult);
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || "Connection test failed." });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <span className="font-sans text-xs font-bold uppercase tracking-widest text-[rgb(43_90_143)]">
          Payment Gateway
        </span>
        <h1 className="mt-1 font-sans text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
          BTCPay Server
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Configure Bitcoin payment processing. Credentials are encrypted and never leave the
          server.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-xs font-bold uppercase tracking-wider text-slate-400 shadow-sm">
          Loading settings...
        </div>
      ) : (
        <>
          {statusMessage && (
            <div
              className={`rounded-lg border p-3 text-xs font-semibold ${statusMessage.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                  : "border-red-200 bg-red-50 text-red-600"
                }`}
            >
              {statusMessage.text}
            </div>
          )}

          <form
            onSubmit={handleSave}
            className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm md:p-8"
          >
            {/* Enable toggle */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
              <div>
                <h2 className="font-sans text-lg font-bold text-slate-900">Enable BTCPay Server</h2>
                <p className="mt-1 text-xs text-slate-500">
                  When off, Bitcoin checkout is unavailable to customers.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => setEnabled((v) => !v)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${enabled ? "bg-[rgb(43_90_143)]" : "bg-slate-200"
                  }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  BTCPay Server URL
                </label>
                <input
                  type="url"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="https://your-btcpay-server.com"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors focus:border-[rgb(43_90_143)] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Store ID
                </label>
                <input
                  type="text"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors focus:border-[rgb(43_90_143)] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  API Key / Bearer Token
                </label>
                {apiKeyConfigured && !apiKey && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Configured
                  </div>
                )}
                <div className="relative mt-1.5">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={
                      apiKeyConfigured
                        ? "Enter a new key to replace the saved one"
                        : "Paste your BTCPay API key"
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-11 text-sm font-medium text-slate-900 transition-colors focus:border-[rgb(43_90_143)] focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Webhook Secret
                </label>
                {webhookConfigured && !webhookSecret && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Configured
                  </div>
                )}
                <div className="relative mt-1.5">
                  <input
                    type={showWebhookSecret ? "text" : "password"}
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder={
                      webhookConfigured
                        ? "Enter a new secret to replace the saved one"
                        : "Paste your BTCPay webhook secret"
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-11 text-sm font-medium text-slate-900 transition-colors focus:border-[rgb(43_90_143)] focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowWebhookSecret((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showWebhookSecret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {testResult && (
              <div
                className={`mt-6 rounded-lg border p-4 text-xs ${testResult.success
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                  }`}
              >
                <div className="flex items-center gap-1.5 font-extrabold uppercase tracking-wider">
                  {testResult.success ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5" />
                  )}
                  {testResult.success ? "BTCPay connection successful" : "BTCPay connection failed"}
                </div>
                <div className="mt-2 space-y-0.5 font-medium">
                  <p>{testResult.message}</p>
                  {testResult.serverOnline !== undefined && (
                    <p className="text-[11px] opacity-80">
                      Server: {testResult.serverOnline ? "Online" : "Unreachable"} · Store:{" "}
                      {testResult.storeConnected ? "Connected" : "Not connected"} · API
                      authentication: {testResult.apiKeyValid ? "Valid" : "Invalid"}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || saving}
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                <span className="inline-flex items-center gap-2">
                  {testing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {testing ? "Testing..." : "Test BTCPay Connection"}
                </span>
              </button>
              <button
                type="submit"
                disabled={saving || testing}
                className="rounded-xl bg-[rgb(43_90_143)] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-95 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>

            {updatedAt && (
              <p className="mt-4 text-[11px] text-slate-400">
                Last updated {new Date(updatedAt).toLocaleString()}
              </p>
            )}
          </form>
        </>
      )}
    </div>
  );
}
