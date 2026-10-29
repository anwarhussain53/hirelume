import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { SIGN_IN_PATH, safeRedirectPath } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";

// Landing point for the email confirmation link. Supports both the PKCE `code`
// flow (default) and `token_hash` links from customized email templates.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : { error: new Error("missing token") };

  const url = request.nextUrl.clone();
  url.search = "";
  if (error) {
    url.pathname = SIGN_IN_PATH;
    url.searchParams.set("error", "confirmation");
  } else {
    url.pathname = safeRedirectPath(searchParams.get("next"));
  }
  return NextResponse.redirect(url);
}
