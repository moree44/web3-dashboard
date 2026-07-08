import { describe, expect, it } from "vitest";

import { isValidUsername, normalizeUsername, toInternalEmail } from "@/lib/auth/username";

describe("username auth adapter", () => {
  it("accepts valid lowercase usernames", () => {
    expect(isValidUsername("moree_44")).toBe(true);
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeUsername("  moree  ")).toBe("moree");
    expect(toInternalEmail("  moree  ")).toBe("moree@web3-hunting.local");
  });

  it("rejects uppercase and unsupported characters", () => {
    expect(isValidUsername("Moree")).toBe(false);
    expect(isValidUsername("moree-44")).toBe(false);
    expect(isValidUsername("moree@example.com")).toBe(false);
  });

  it("enforces the 3 to 24 character length", () => {
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("a".repeat(24))).toBe(true);
    expect(isValidUsername("a".repeat(25))).toBe(false);
  });

  it("refuses to generate an internal email for invalid input", () => {
    expect(() => toInternalEmail("Moree")).toThrow("Invalid username");
  });
});
