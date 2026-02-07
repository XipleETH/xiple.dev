"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

function resolveOrigin(headerStore) {
  const origin = headerStore.get("origin");
  if (origin) {
    return origin;
  }

  const forwardedHost = headerStore.get("x-forwarded-host");
  if (forwardedHost) {
    const proto = headerStore.get("x-forwarded-proto") || "https";
    return `${proto}://${forwardedHost}`;
  }

  return env.NEXT_PUBLIC_APP_URL;
}

export async function signInWithGoogleAction() {
  const supabase = await createClient();
  const headerStore = await headers();
  const origin = resolveOrigin(headerStore);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/dashboard`,
      queryParams: {
        access_type: "offline",
        prompt: "consent"
      }
    }
  });

  if (error) {
    redirect(`/auth?error=${encodeURIComponent(error.message)}`);
  }

  if (!data?.url) {
    redirect("/auth?error=Could%20not%20start%20Google%20sign%20in");
  }

  redirect(data.url);
}
