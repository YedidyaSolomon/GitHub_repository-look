/**
 * Demo / QA mode: in-memory data + mock auth. No real Supabase or Chapa calls from the browser.
 * Set in `.env.local`: NEXT_PUBLIC_USE_MOCK=true
 * Omit or set false to use real NEXT_PUBLIC_SUPABASE_* and APIs.
 */
export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK === "true";
}
