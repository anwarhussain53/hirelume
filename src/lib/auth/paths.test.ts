import { describe, expect, it } from "vitest";
import { HOME_PATH, isAuthPage, isPublicPath, safeRedirectPath } from "./paths";

describe("safeRedirectPath", () => {
  it.each([
    ["/jobs", "/jobs"],
    ["/jobs/123?tab=ranking#top", "/jobs/123?tab=ranking#top"],
    ["/eval", "/eval"],
  ])("keeps same-origin path %s", (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });

  it.each([
    ["absolute URL", "https://evil.example/jobs"],
    ["protocol-relative", "//evil.example"],
    ["backslash trick", "/\\evil.example"],
    ["tab trick", "/\t/evil.example"],
    ["javascript scheme", "javascript:alert(1)"],
    ["relative path", "jobs"],
    ["empty string", ""],
    ["non-string", 42],
    ["undefined", undefined],
    ["auth page loop", "/sign-in?next=/jobs"],
  ])("falls back for %s", (_label, input) => {
    expect(safeRedirectPath(input)).toBe(HOME_PATH);
  });

  it("uses a custom fallback", () => {
    expect(safeRedirectPath("//evil.example", "/")).toBe("/");
  });
});

describe("isPublicPath", () => {
  it.each(["/", "/sign-in", "/sign-up", "/no-access", "/auth/confirm"])("%s is public", (path) => {
    expect(isPublicPath(path)).toBe(true);
  });

  it.each(["/jobs", "/jobs/123", "/eval", "/sign-in-other", "/authx"])("%s is protected", (path) => {
    expect(isPublicPath(path)).toBe(false);
  });
});

describe("isAuthPage", () => {
  it("matches only the sign-in and sign-up pages", () => {
    expect(isAuthPage("/sign-in")).toBe(true);
    expect(isAuthPage("/sign-up")).toBe(true);
    expect(isAuthPage("/auth/confirm")).toBe(false);
    expect(isAuthPage("/")).toBe(false);
  });
});
