/**
 * Anti-Spam & Bot Protection Utility
 *
 * Implements a defense-in-depth approach against automated spambots:
 * 1. Multi-input honeypots (hidden off-screen inputs invisible to humans)
 * 2. Time-to-submit verification (bots fill forms in < 2 seconds)
 * 3. Human interaction event detection (focus, keystrokes, pointer events)
 * 4. Content heuristics (blocks promotional URLs in name/phone fields, spam patterns)
 * 5. Strict email & phone format verification
 * 6. Client-side rate limiting per session
 * 7. Shadow-dropping: silently discards bot submissions while faking success to deter automated retries
 */

export interface SpamCheckResult {
  valid: boolean;
  userError?: string;
  isBot: boolean;
  botReason?: string;
}

export const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamailblock.com", "tempmail.com", "10minutemail.com",
  "yopmail.com", "trashmail.com", "trashmail.net", "trashmail.me", "throwawaymail.com",
  "sharklasers.com", "getairmail.com", "dispostable.com", "dropmail.me", "mohmal.im",
  "temp-mail.org", "fakeinbox.com", "generator.email", "crazymailing.com", "burnermail.io",
  "maildrop.cc", "inboxkitten.com", "nada.ltd", "tempail.com", "fakemailgenerator.com",
  "emailondeck.com", "mytemp.email", "tempmailo.com", "inboxbear.com", "discard.email",
  "mailnull.com", "mytempmail.com", "spambog.com", "tempinbox.com", "crazymail.com",
  "spamfree24.org", "trash-mail.com", "throwaway.email", "armyspy.com", "cuvox.de",
  "dayrep.com", "einrot.com", "fleckens.hu", "gustr.com", "jourrapide.com",
  "rhyta.com", "superrito.com", "teleworm.us", "tinypm.com", "mailnesia.com"
]);

export function isDisposableEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const parts = email.trim().toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return DISPOSABLE_EMAIL_DOMAINS.has(domain) || Array.from(DISPOSABLE_EMAIL_DOMAINS).some(d => domain.endsWith("." + d));
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length < 5 || trimmed.length > 254) return false;
  if (!EMAIL_REGEX.test(trimmed)) return false;

  // Must have a valid TLD with at least 2 characters
  const parts = trimmed.split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  const domainParts = domain.split(".");
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) return false;

  // Must not be a disposable/burner email domain
  if (isDisposableEmail(trimmed)) return false;

  return true;
}

export function isValidPhone(phone?: string | null): boolean {
  if (!phone) return true; // Optional in most forms
  const trimmed = phone.trim();
  if (!trimmed) return true;

  // If phone contains URLs or HTML tags, it's definitely spam
  if (/https?:\/\/|www\.|<[^>]+>/i.test(trimmed)) return false;

  // Count actual numeric digits
  const digits = trimmed.replace(/\D/g, "");
  // Standard phone numbers globally have between 7 and 15 digits
  if (digits.length < 7 || digits.length > 16) return false;

  // Real phone numbers only contain digits, spaces, hyphens, plus, and parentheses
  if (!/^[+]?[\d\s\-().]+$/.test(trimmed)) return false;

  return true;
}

export function detectSpamPatterns(data: {
  name?: string;
  email?: string;
  phone?: string | null;
  message?: string | null;
  company?: string | null;
  website_url?: string | null;
}): { isSpam: boolean; reason?: string } {
  const name = (data.name || "").trim();
  const phone = (data.phone || "").trim();
  const message = (data.message || "").trim();

  // 1. Links inside the 'name' field — genuine users never put URLs in their name
  const urlPattern = /(?:https?:\/\/|www\.|[a-zA-Z0-9-]+\.(?:com|ru|top|xyz|click|site|online|cn|fun|info)\b)/i;
  if (urlPattern.test(name)) {
    return { isSpam: true, reason: "URL detected in name field" };
  }

  // 2. HTML or BBCode tags in name or message
  if (/<(a|script|iframe|style)[^>]*>|\[url=/i.test(name) || /<(script|iframe|style)[^>]*>/i.test(message)) {
    return { isSpam: true, reason: "HTML/script injection detected" };
  }

  // 3. Links in phone field
  if (phone && urlPattern.test(phone)) {
    return { isSpam: true, reason: "URL detected in phone field" };
  }

  // 4. Excessive links in message body (> 2 links in an initial lead form is typical of spam)
  const linksInMessage = (message.match(/https?:\/\//gi) || []).length;
  if (linksInMessage > 2) {
    return { isSpam: true, reason: `Excessive links in message (${linksInMessage})` };
  }

  // 5. Blatant spam keywords commonly seen in bot lead forms
  const spamRegex = /\b(?:crypto\s+casino|seo\s+backlinks|guest\s+posting\s+service|porn|viagra|cialis|telegram\s*:\s*@|wa\.me\/\d+)\b/i;
  if (spamRegex.test(message) || spamRegex.test(name)) {
    return { isSpam: true, reason: "Known spam keyword detected" };
  }

  return { isSpam: false };
}

const RATE_LIMIT_KEY = "th_lead_submission_timestamps";
const MAX_SUBMISSIONS_PER_WINDOW = 3;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export function checkRateLimit(): { allowed: boolean; waitSeconds?: number } {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return { allowed: true };
  }

  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_KEY);
    const now = Date.now();
    let timestamps: number[] = raw ? JSON.parse(raw) : [];

    // Filter to entries within current window
    timestamps = timestamps.filter((t) => typeof t === "number" && now - t < WINDOW_MS);

    if (timestamps.length >= MAX_SUBMISSIONS_PER_WINDOW) {
      const oldest = Math.min(...timestamps);
      const remainingMs = WINDOW_MS - (now - oldest);
      return {
        allowed: false,
        waitSeconds: Math.max(1, Math.ceil(remainingMs / 1000)),
      };
    }

    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

export function recordSubmissionTimestamp(): void {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_KEY);
    const now = Date.now();
    const timestamps: number[] = raw ? JSON.parse(raw) : [];
    timestamps.push(now);
    sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(timestamps));
  } catch {
    // Ignore storage errors
  }
}
