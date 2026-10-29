import { describe, expect, it } from "vitest";
import { firstFieldErrors, signInSchema, signUpSchema } from "./schemas";

describe("signInSchema", () => {
  it("normalizes the email", () => {
    const result = signInSchema.parse({ email: "  Anwar@Example.COM ", password: "x" });
    expect(result.email).toBe("anwar@example.com");
  });

  it("rejects a malformed email and an empty password", () => {
    const result = signInSchema.safeParse({ email: "not-an-email", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstFieldErrors(result.error)).toEqual({
        email: "Enter a valid email address.",
        password: "Enter your password.",
      });
    }
  });
});

describe("signUpSchema", () => {
  const valid = { fullName: " Anwar Hussain ", email: "a@example.com", password: "a".repeat(12) };

  it("accepts a valid sign-up and trims the name", () => {
    expect(signUpSchema.parse(valid).fullName).toBe("Anwar Hussain");
  });

  it.each([
    ["short password", { password: "a".repeat(11) }, "password", "Use at least 12 characters."],
    ["over bcrypt limit", { password: "a".repeat(73) }, "password", "Use at most 72 characters."],
    ["blank name", { fullName: "   " }, "fullName", "Enter your name."],
  ])("rejects %s", (_label, override, field, message) => {
    const result = signUpSchema.safeParse({ ...valid, ...override });
    expect(result.success).toBe(false);
    if (!result.success) expect(firstFieldErrors(result.error)[field]).toBe(message);
  });
});
