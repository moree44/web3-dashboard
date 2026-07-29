import { describe, expect, it } from "vitest";

import { isHttpUrl, normalizeHttpUrl } from "@/lib/url";

describe("HTTP URL helpers", () => {
  it("adds https to a bare domain", () => {
    expect(normalizeHttpUrl("test.com")).toBe("https://test.com");
  });

  it("preserves an existing protocol and trims whitespace", () => {
    expect(normalizeHttpUrl("  http://test.com/path  ")).toBe("http://test.com/path");
    expect(normalizeHttpUrl("")).toBe("");
  });

  it("accepts only valid HTTP and HTTPS URLs", () => {
    expect(isHttpUrl("https://test.com")).toBe(true);
    expect(isHttpUrl("http://localhost:3000/path")).toBe(true);
    expect(isHttpUrl("ftp://test.com")).toBe(false);
    expect(isHttpUrl("not a url")).toBe(false);
  });
});
