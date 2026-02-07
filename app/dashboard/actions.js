"use server";

import { redirect } from "next/navigation";

import { LINK_KIND_OPTIONS, RESERVED_USERNAMES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])?$/;

const VALID_LINK_KINDS = new Set(LINK_KIND_OPTIONS.map((entry) => entry.value));

function parseIntSafe(value, fallback = 0) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

async function requireUserProfile(supabase) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const { error } = await supabase.from("profiles").insert({ id: user.id });
    if (error) {
      redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
    }
  }

  return user;
}

export async function saveProfileAction(formData) {
  const supabase = await createClient();
  const user = await requireUserProfile(supabase);

  const displayName = String(formData.get("display_name") || "").trim();
  const tagline = String(formData.get("tagline") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const avatarUrl = String(formData.get("avatar_url") || "").trim();

  let username = String(formData.get("username") || "").trim().toLowerCase();
  if (username.startsWith("@")) {
    username = username.slice(1);
  }

  if (username) {
    if (!USERNAME_REGEX.test(username)) {
      redirect(
        "/dashboard?error=Username%20must%20be%203-30%20chars%20using%20lowercase,%20numbers,%20underscore"
      );
    }

    if (RESERVED_USERNAMES.has(username)) {
      redirect("/dashboard?error=This%20username%20is%20reserved");
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username: username || null,
      display_name: displayName || null,
      tagline: tagline || null,
      bio: bio || null,
      avatar_url: avatarUrl || null
    })
    .eq("id", user.id);

  if (error) {
    const duplicate = error.message.toLowerCase().includes("duplicate") || error.code === "23505";
    if (duplicate) {
      redirect("/dashboard?error=Username%20already%20taken");
    }
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard?message=Profile%20saved");
}

export async function addLinkAction(formData) {
  const supabase = await createClient();
  const user = await requireUserProfile(supabase);

  const label = String(formData.get("label") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const kind = String(formData.get("kind") || "project").trim();
  const platform = String(formData.get("platform") || "").trim().toLowerCase();
  const position = parseIntSafe(formData.get("position"), 0);

  if (!label || !url) {
    redirect("/dashboard?error=Link%20label%20and%20URL%20are%20required");
  }

  if (!VALID_LINK_KINDS.has(kind)) {
    redirect("/dashboard?error=Invalid%20link%20type");
  }

  const { error } = await supabase.from("profile_links").insert({
    profile_id: user.id,
    label,
    url,
    kind,
    platform: platform || null,
    position
  });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard?message=Link%20added");
}

export async function updateLinkAction(formData) {
  const supabase = await createClient();
  await requireUserProfile(supabase);

  const id = String(formData.get("id") || "").trim();
  const label = String(formData.get("label") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const kind = String(formData.get("kind") || "project").trim();
  const platform = String(formData.get("platform") || "").trim().toLowerCase();
  const position = parseIntSafe(formData.get("position"), 0);
  const isActive = String(formData.get("is_active") || "") === "on";

  if (!id || !label || !url) {
    redirect("/dashboard?error=Missing%20link%20fields");
  }

  const { error } = await supabase
    .from("profile_links")
    .update({
      label,
      url,
      kind: VALID_LINK_KINDS.has(kind) ? kind : "project",
      platform: platform || null,
      position,
      is_active: isActive
    })
    .eq("id", id);

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard?message=Link%20updated");
}

export async function deleteLinkAction(formData) {
  const supabase = await createClient();
  await requireUserProfile(supabase);

  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect("/dashboard?error=Missing%20link%20id");
  }

  const { error } = await supabase.from("profile_links").delete().eq("id", id);

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard?message=Link%20deleted");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
