import { useState, useRef, useCallback } from "react";
import {
  isValidEmail,
  isDisposableEmail,
  isValidPhone,
  detectSpamPatterns,
  checkRateLimit,
  recordSubmissionTimestamp,
  type SpamCheckResult,
} from "@/lib/antiSpam";
import TurnstileWidget, { type TurnstileWidgetHandle } from "@/components/TurnstileWidget";

interface AntiSpamData {
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  company?: string | null;
  website_url?: string | null;
}

interface ValidationOptions {
  requireTurnstile?: boolean;
}

export function useAntiSpam() {
  const mountedAt = useRef<number>(Date.now());
  const hasInteracted = useRef<boolean>(false);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  // Hidden honeypot fields that bots eagerly fill out but real users never see
  const [honeypot, setHoneypot] = useState({
    hp_company_website: "",
    hp_secondary_phone: "",
  });

  // Cloudflare Turnstile token
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Call on any interaction (focus, change, pointer/touch) inside the form
  const registerInteraction = useCallback(() => {
    hasInteracted.current = true;
  }, []);

  const resetTurnstile = useCallback(() => {
    setTurnstileToken(null);
    turnstileRef.current?.reset();
  }, []);

  const validateSubmission = useCallback(
    (data: AntiSpamData, options?: ValidationOptions): SpamCheckResult => {
      // 1. Honeypot check: real users will NEVER fill these fields
      if (honeypot.hp_company_website.trim() !== "" || honeypot.hp_secondary_phone.trim() !== "") {
        return {
          valid: true,
          isBot: true,
          botReason: "Honeypot field populated by bot",
        };
      }

      // 2. Minimum submission time threshold: bots submit in < 0.7 seconds
      const elapsedSeconds = (Date.now() - mountedAt.current) / 1000;
      if (elapsedSeconds < 0.7) {
        return {
          valid: true,
          isBot: true,
          botReason: `Instantaneous submission (${elapsedSeconds.toFixed(2)}s)`,
        };
      }

      // 3. User interaction check: typing or selecting data counts as interaction
      const hasUserData = Boolean(
        (data.name && data.name.trim().length > 0) ||
        (data.email && data.email.trim().length > 0)
      );
      if (!hasInteracted.current && !hasUserData) {
        return {
          valid: true,
          isBot: true,
          botReason: "No human interaction events captured",
        };
      }

      // 4. Content heuristics (URLs in name/phone, script tags, spam copy)
      const spamCheck = detectSpamPatterns(data);
      if (spamCheck.isSpam) {
        return {
          valid: true,
          isBot: true,
          botReason: spamCheck.reason,
        };
      }

      // 5. Rate limiting per session
      const rateCheck = checkRateLimit();
      if (!rateCheck.allowed) {
        return {
          valid: false,
          isBot: false,
          userError: `Too many submissions. Please wait ${rateCheck.waitSeconds}s before trying again.`,
        };
      }

      // 6. Cloudflare Turnstile Verification check (Layer 2)
      // When a Turnstile site key is configured or explicitly required, enforce valid token
      const isTurnstileConfigured = Boolean(
        (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim()
      );
      if (options?.requireTurnstile || isTurnstileConfigured) {
        if (!turnstileToken) {
          return {
            valid: false,
            isBot: false,
            userError: "Please complete the Cloudflare security verification.",
          };
        }
      }

      // 7. User validations for genuine humans
      if (!data.name || !data.name.trim()) {
        return {
          valid: false,
          isBot: false,
          userError: "Please enter your name",
        };
      }

      if (isDisposableEmail(data.email)) {
        return {
          valid: false,
          isBot: false,
          userError: "Please enter a valid corporate or personal email address (temporary domains are not accepted)",
        };
      }

      if (!isValidEmail(data.email)) {
        return {
          valid: false,
          isBot: false,
          userError: "Please enter a valid email address",
        };
      }

      if (data.phone && !isValidPhone(data.phone)) {
        return {
          valid: false,
          isBot: false,
          userError: "Please enter a valid phone number (at least 7 digits)",
        };
      }

      return { valid: true, isBot: false };
    },
    [honeypot, turnstileToken]
  );

  /**
   * Component rendering completely invisible honeypot inputs.
   * Uses off-screen absolute positioning, zero opacity, tabIndex=-1, and aria-hidden.
   */
  const HoneypotFields = useCallback(
    () => (
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
        aria-hidden="true"
        tabIndex={-1}
      >
        <input
          type="text"
          id="hp_company_website"
          name="hp_company_website"
          aria-hidden="true"
          value={honeypot.hp_company_website}
          onChange={(e) => setHoneypot((p) => ({ ...p, hp_company_website: e.target.value }))}
          tabIndex={-1}
          autoComplete="none"
          data-lpignore="true"
          data-form-type="other"
          style={{ display: "none" }}
        />
        <input
          type="text"
          id="hp_secondary_phone"
          name="hp_secondary_phone"
          aria-hidden="true"
          value={honeypot.hp_secondary_phone}
          onChange={(e) => setHoneypot((p) => ({ ...p, hp_secondary_phone: e.target.value }))}
          tabIndex={-1}
          autoComplete="none"
          data-lpignore="true"
          data-form-type="other"
          style={{ display: "none" }}
        />
      </div>
    ),
    [honeypot]
  );

  /**
   * Layer 2: Cloudflare Turnstile Widget Component.
   * Renders the frictionless Cloudflare challenge.
   */
  const TurnstileField = useCallback(
    ({ className = "", theme = "auto" }: { className?: string; theme?: "light" | "dark" | "auto" }) => (
      <TurnstileWidget
        ref={turnstileRef}
        className={className}
        theme={theme}
        onSuccess={(token) => setTurnstileToken(token)}
        onExpire={() => setTurnstileToken(null)}
        onError={() => setTurnstileToken(null)}
      />
    ),
    []
  );

  return {
    validateSubmission,
    recordSubmission: recordSubmissionTimestamp,
    registerInteraction,
    HoneypotFields,
    TurnstileField,
    turnstileToken,
    resetTurnstile,
  };
}
