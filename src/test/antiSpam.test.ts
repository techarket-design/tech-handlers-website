import { describe, it, expect } from "vitest";
import { isValidEmail, isDisposableEmail, isValidPhone, detectSpamPatterns } from "@/lib/antiSpam";

describe("Anti-Spam Filter Tests", () => {
  describe("Email Validation", () => {
    it("accepts valid email addresses", () => {
      expect(isValidEmail("client@example.com")).toBe(true);
      expect(isValidEmail("john.doe@company.co.in")).toBe(true);
      expect(isValidEmail("contact+lead@techhandlers.in")).toBe(true);
    });

    it("rejects invalid email formats", () => {
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("test@test")).toBe(false); // No TLD
      expect(isValidEmail("abc@.com")).toBe(false);
      expect(isValidEmail("spam bot@mail.com")).toBe(false);
    });

    it("rejects disposable and burner bot email domains", () => {
      expect(isDisposableEmail("bot123@mailinator.com")).toBe(true);
      expect(isDisposableEmail("spammer@tempmail.com")).toBe(true);
      expect(isDisposableEmail("fake@10minutemail.com")).toBe(true);
      expect(isDisposableEmail("test@guerrillamail.com")).toBe(true);
      expect(isDisposableEmail("legit@gmail.com")).toBe(false);
      expect(isDisposableEmail("founder@techhandlers.in")).toBe(false);

      // isValidEmail must also reject them
      expect(isValidEmail("bot@mailinator.com")).toBe(false);
      expect(isValidEmail("scam@tempmail.com")).toBe(false);
    });
  });

  describe("Phone Validation", () => {
    it("accepts valid phone numbers", () => {
      expect(isValidPhone("+91 98765 43210")).toBe(true);
      expect(isValidPhone("9876543210")).toBe(true);
      expect(isValidPhone("+1-555-123-4567")).toBe(true);
      expect(isValidPhone("")).toBe(true); // Optional
      expect(isValidPhone(null)).toBe(true);
    });

    it("rejects spam phones containing URLs or letters", () => {
      expect(isValidPhone("Call me at https://spam.ru")).toBe(false);
      expect(isValidPhone("12345")).toBe(false); // Too short (< 7 digits)
      expect(isValidPhone("www.spamlink.com")).toBe(false);
    });
  });

  describe("Spam Pattern Heuristics", () => {
    it("detects promotional URLs in name field", () => {
      expect(detectSpamPatterns({ name: "https://casino-online.ru" }).isSpam).toBe(true);
      expect(detectSpamPatterns({ name: "Best SEO service at www.backlinks.top" }).isSpam).toBe(true);
      expect(detectSpamPatterns({ name: "John Doe" }).isSpam).toBe(false);
    });

    it("detects HTML or script tags", () => {
      expect(detectSpamPatterns({ name: "<script>alert(1)</script>" }).isSpam).toBe(true);
      expect(detectSpamPatterns({ name: "<a href='http://spam.com'>Click Here</a>" }).isSpam).toBe(true);
    });

    it("detects known spam keywords and excessive links", () => {
      expect(detectSpamPatterns({ message: "Check out https://a.com and https://b.com and https://c.com" }).isSpam).toBe(true);
      expect(detectSpamPatterns({ message: "Buy high quality seo backlinks for your site" }).isSpam).toBe(true);
      expect(detectSpamPatterns({ message: "We are looking for web development and SEO services for our real estate company." }).isSpam).toBe(false);
    });
  });
});
