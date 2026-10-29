import { describe, expect, it } from "vitest";
import { GENERIC_AUTH_ERROR, SAFE_SIGN_UP_ERRORS, authErrorMessage } from "./errors";

describe("authErrorMessage", () => {
  it("maps known codes", () => {
    expect(authErrorMessage("invalid_credentials")).toBe("Email or password is incorrect.");
  });

  it("hides unknown codes and internal errors", () => {
    expect(authErrorMessage("unexpected_failure")).toBe(GENERIC_AUTH_ERROR);
    expect(authErrorMessage(undefined)).toBe(GENERIC_AUTH_ERROR);
  });

  it("never treats the invite-gate failure as a safe sign-up error", () => {
    // The trigger rejection surfaces as unexpected_failure; showing it would reveal who is invited.
    expect(SAFE_SIGN_UP_ERRORS.has("unexpected_failure")).toBe(false);
    expect(SAFE_SIGN_UP_ERRORS.has("user_already_exists")).toBe(false);
  });
});
