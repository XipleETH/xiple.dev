"use server";

import { redirect } from "next/navigation";

import { PLATFORM_OPTIONS, RESERVED_USERNAMES, SOCIAL_OPTIONS } from "@/lib/constants";
import { serializeProfilePlatforms } from "@/lib/profile-platforms";
import { createClient } from "@/lib/supabase/server";

const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])?$/;

const PROFILE_PLATFORM_SET = new Set(PLATFORM_OPTIONS.map((entry) => entry.value));
const SOCIAL_PLATFORM_SET = new Set(SOCIAL_OPTIONS.map((entry) => entry.value));
const XIPLE_USERNAME = "xiple";

const XIPLE_PROFILE_DEFAULTS = {
  bio: "Shipping apps for PC, Android, Reddit and Web.",
  avatarUrl: "/assets/profile-photo.jpg",
  platforms: ["steam", "windows", "android", "reddit", "web"]
};

const XIPLE_SEED_LINKS = [
  {
    label: "Darkest Rumble",
    url: "https://steamcommunity.com/sharedfiles/filedetails/?id=3661115905",
    kind: "project",
    platform: "steam"
  },
  {
    label: "Lookback Finance",
    url: "https://lookback.finance/",
    kind: "project",
    platform: "android"
  },
  {
    label: "@xipleeth on X",
    url: "https://x.com/xipleeth",
    kind: "social",
    platform: "x"
  },
  {
    label: "XipleETH on GitHub",
    url: "https://github.com/XipleETH",
    kind: "social",
    platform: "github"
  }
];

function normalizePlatform(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized || null;
}

function parsePlatformsCsv(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) {
    return [];
  }

  return Array.from(
    new Set(
      raw
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => PROFILE_PLATFORM_SET.has(entry))
    )
  );
}

function resolveLinkKind(platform) {
  if (platform && PROFILE_PLATFORM_SET.has(platform)) {
    return "project";
  }

  if (platform && SOCIAL_PLATFORM_SET.has(platform)) {
    return "social";
  }

  return "project";
}

async function resolveNextLinkPosition(supabase, profileId) {
  const { data, error } = await supabase
    .from("profile_links")
    .select("position")
    .eq("profile_id", profileId)
    .order("position", { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  const maxPosition = data?.[0]?.position ?? -1;
  return maxPosition + 1;
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

  const bio = String(formData.get("bio") || "").trim();
  const avatarUrl = String(formData.get("avatar_url") || "").trim();
  const selectedPlatforms = parsePlatformsCsv(formData.get("platforms"));

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

  const isXipleProfile = username === XIPLE_USERNAME;
  const tagline = serializeProfilePlatforms(
    selectedPlatforms.length > 0 ? selectedPlatforms : isXipleProfile ? XIPLE_PROFILE_DEFAULTS.platforms : []
  );

  const { error } = await supabase
    .from("profiles")
    .update({
      username: username || null,
      display_name: null,
      tagline,
      bio: bio || (isXipleProfile ? XIPLE_PROFILE_DEFAULTS.bio : null),
      avatar_url: avatarUrl || (isXipleProfile ? XIPLE_PROFILE_DEFAULTS.avatarUrl : null)
    })
    .eq("id", user.id);

  if (error) {
    const duplicate = error.message.toLowerCase().includes("duplicate") || error.code === "23505";
    if (duplicate) {
      redirect("/dashboard?error=Username%20already%20taken");
    }
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  if (isXipleProfile) {
    const { count, error: countError } = await supabase
      .from("profile_links")
      .select("id", { head: true, count: "exact" })
      .eq("profile_id", user.id);

    if (countError) {
      redirect(`/dashboard?error=${encodeURIComponent(countError.message)}`);
    }

    if ((count || 0) === 0) {
      const rows = XIPLE_SEED_LINKS.map((entry, index) => ({
        profile_id: user.id,
        label: entry.label,
        url: entry.url,
        kind: entry.kind,
        platform: entry.platform,
        position: index + 1,
        is_active: true
      }));

      const { error: seedError } = await supabase.from("profile_links").insert(rows);
      if (seedError) {
        redirect(`/dashboard?error=${encodeURIComponent(seedError.message)}`);
      }
    }
  }

  redirect("/dashboard?message=Profile%20saved");
}

export async function addLinkAction(formData) {
  const supabase = await createClient();
  const user = await requireUserProfile(supabase);

  const label = String(formData.get("label") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const platform = normalizePlatform(formData.get("platform"));

  if (!label || !url) {
    redirect("/dashboard?error=Link%20label%20and%20URL%20are%20required");
  }

  let position = 0;
  try {
    position = await resolveNextLinkPosition(supabase, user.id);
  } catch (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  const { error } = await supabase.from("profile_links").insert({
    profile_id: user.id,
    label,
    url,
    kind: resolveLinkKind(platform),
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
  const platform = normalizePlatform(formData.get("platform"));
  const isActive = String(formData.get("is_active") || "") === "on";

  if (!id || !label || !url) {
    redirect("/dashboard?error=Missing%20link%20fields");
  }

  const { error } = await supabase
    .from("profile_links")
    .update({
      label,
      url,
      kind: resolveLinkKind(platform),
      platform: platform || null,
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
