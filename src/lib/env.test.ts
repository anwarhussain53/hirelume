import { describe, expect, it } from "vitest";
import { parsePublicEnv } from "./env";

const valid = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
};

describe("parsePublicEnv", () => {
  it("accepts a complete config", () => {
    expect(parsePublicEnv(valid)).toEqual(valid);
  });

  it("names every missing variable", () => {
    expect(() => parsePublicEnv({})).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
    );
  });

  it("rejects a malformed URL", () => {
    expect(() => parsePublicEnv({ ...valid, NEXT_PUBLIC_SUPABASE_URL: "not-a-url" })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it("never echoes values in the error message", () => {
    const secret = "sb_publishable_should_not_leak";
    try {
      parsePublicEnv({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: secret });
      expect.unreachable();
    } catch (error) {
      expect((error as Error).message).not.toContain(secret);
    }
  });
});
