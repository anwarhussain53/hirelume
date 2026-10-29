// Maps Supabase Auth error codes to messages safe to show users.
// Unknown codes get a generic message so internal details never reach the UI.

const MESSAGES: Record<string, string> = {
  invalid_credentials: "Email or password is incorrect.",
  email_not_confirmed: "Confirm your email first. Check your inbox for the link.",
  over_request_rate_limit: "Too many attempts. Wait a minute and try again.",
  over_email_send_rate_limit: "Too many emails sent. Wait a few minutes and try again.",
  weak_password: "Choose a stronger password.",
  email_address_invalid: "Enter a valid email address.",
};

export const GENERIC_AUTH_ERROR = "Something went wrong. Please try again.";

/** Sign-up errors that reveal nothing about whether an email was invited. */
export const SAFE_SIGN_UP_ERRORS = new Set([
  "over_request_rate_limit",
  "over_email_send_rate_limit",
  "weak_password",
  "email_address_invalid",
]);

export function authErrorMessage(code: string | undefined): string {
  return (code && MESSAGES[code]) || GENERIC_AUTH_ERROR;
}
