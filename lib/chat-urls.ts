// lib/chat-urls.ts
// Pure URL builders for Zalo + Messenger deep links. No DB, no React —
// testable in isolation. Both helpers return null for unusable input so
// callers can conditionally render the corresponding button.

const ZALO_MIN_DIGITS = 8;
const MESSENGER_MIN_DIGITS = 6;
const MESSENGER_MAX_DIGITS = 30;

/**
 * Build a Zalo HTTPS Universal Link from a raw phone string. Strips
 * non-digits (handles "+84", spaces, dashes, parens). Returns null when
 * the input has fewer than 8 digits (a phone with fewer digits cannot
 * be a valid Zalo ID).
 *
 * Mobile: OS Universal Link → opens Zalo app to that contact.
 * Desktop: opens https://zalo.me/<digits> in the browser.
 */
export function buildZaloUrl(rawPhone: string | null | undefined): string | null {
  if (!rawPhone) return null;
  const digits = rawPhone.replace(/\D/g, '');
  return digits.length >= ZALO_MIN_DIGITS ? `https://zalo.me/${digits}` : null;
}

/**
 * Build a Messenger HTTPS Universal Link from a Page ID. Accepts only
 * pure-digit Page IDs (6–30 digits, matching Facebook Page ID length).
 * Returns null for any non-numeric input or out-of-range length so the
 * button is hidden rather than rendering a broken link.
 *
 * Mobile: OS Universal Link → opens Messenger to that Page.
 * Desktop: opens https://m.me/<id> in the browser.
 */
export function buildMessengerUrl(
  rawPageId: string | null | undefined
): string | null {
  if (!rawPageId) return null;
  const trimmed = rawPageId.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  if (
    trimmed.length < MESSENGER_MIN_DIGITS ||
    trimmed.length > MESSENGER_MAX_DIGITS
  ) {
    return null;
  }
  return `https://m.me/${trimmed}`;
}
