"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function signInWithEmailAction(formData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();

  if (!email) {
    redirect("/auth?error=Please%20enter%20your%20email");
  }

  const supabase = await createClient();
  const headerStore = await headers();
  const origin = headerStore.get("origin") || env.NEXT_PUBLIC_APP_URL;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`
    }
  });

  if (error) {
    redirect(`/auth?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/auth?message=Check%20your%20email%20for%20the%20magic%20link");
}
