"use server";

import { redirect } from "next/navigation";

import { PLATFORM_OPTIONS, RESERVED_USERNAMES, SOCIAL_OPTIONS } from "@/lib/constants";
import { serializeProfilePlatforms } from "@/lib/profile-platforms";
import { createClient } from "@/lib/supabase/server";

const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])?$/;
const IMAGE_MAX_BYTES = 6 * 1024 * 1024;
const AVATAR_BUCKET = "avatars";
const LINK_IMAGE_BUCKET = "link-images";

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

function normalizeImageUrl(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function getFileFromForm(formData, fieldName) {
  const entry = formData.get(fieldName);
  if (!entry || typeof entry === "string") {
    return null;
  }

  if (!entry.size || entry.size <= 0) {
    return null;
  }

  return entry;
}

function sanitizeFileName(name) {
  return String(name || "image")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

function assertValidImageFile(file) {
  if (!String(file.type || "").startsWith("image/")) {
    throw new Error("File must be an image");
  }

  if (file.size > IMAGE_MAX_BYTES) {
    throw new Error("Image too large (max 6MB)");
  }
}

async function uploadImageFile(supabase, { file, bucket, userId, prefix }) {
  assertValidImageFile(file);
  const safeName = sanitizeFileName(file.name);
  const path = `${userId}/${prefix}-${Date.now()}-${safeName}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
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

function normalizeReturnPath(value, fallback = "/") {
  const path = String(value || "").trim();
  if (!path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }
  return path.split("?")[0] || fallback;
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
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const { error } = await supabase.from("profiles").insert({ id: user.id });
    if (error) {
      redirect("/");
    }
  }

  return user;
}

export async function saveProfileAction(formData) {
  const supabase = await createClient();
  const user = await requireUserProfile(supabase);
  const returnPath = normalizeReturnPath(formData.get("return_path"), "/");

  const bio = String(formData.get("bio") || "").trim();
  let avatarUrl = String(formData.get("avatar_url") || "").trim();
  const avatarFile = getFileFromForm(formData, "avatar_file");
  const selectedPlatforms = parsePlatformsCsv(formData.get("platforms"));

  let username = String(formData.get("username") || "").trim().toLowerCase();
  if (username.startsWith("@")) {
    username = username.slice(1);
  }

  if (username) {
    if (!USERNAME_REGEX.test(username)) {
      redirect(returnPath);
    }

    if (RESERVED_USERNAMES.has(username)) {
      redirect(returnPath);
    }
  }

  const isXipleProfile = username === XIPLE_USERNAME;
  const tagline = serializeProfilePlatforms(
    selectedPlatforms.length > 0 ? selectedPlatforms : isXipleProfile ? XIPLE_PROFILE_DEFAULTS.platforms : []
  );

  if (avatarFile) {
    try {
      avatarUrl = await uploadImageFile(supabase, {
        file: avatarFile,
        bucket: AVATAR_BUCKET,
        userId: user.id,
        prefix: "avatar"
      });
    } catch (error) {
      redirect(returnPath);
    }
  }

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
      redirect(returnPath);
    }
    redirect(returnPath);
  }

  if (isXipleProfile) {
    const { count, error: countError } = await supabase
      .from("profile_links")
      .select("id", { head: true, count: "exact" })
      .eq("profile_id", user.id);

    if (countError) {
      redirect(returnPath);
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
        redirect(returnPath);
      }
    }
  }

  const nextPath = username ? `/${username}` : returnPath;
  redirect(nextPath);
}

export async function addLinkAction(formData) {
  const supabase = await createClient();
  const user = await requireUserProfile(supabase);
  const returnPath = normalizeReturnPath(formData.get("return_path"), "/");

  const label = String(formData.get("label") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const platform = normalizePlatform(formData.get("platform"));
  let imageUrl = normalizeImageUrl(formData.get("image_url"));
  const imageFile = getFileFromForm(formData, "link_image_file");

  if (!label || !url) {
    redirect(returnPath);
  }

  let position = 0;
  try {
    position = await resolveNextLinkPosition(supabase, user.id);
  } catch (error) {
    redirect(returnPath);
  }

  if (imageFile) {
    try {
      imageUrl = await uploadImageFile(supabase, {
        file: imageFile,
        bucket: LINK_IMAGE_BUCKET,
        userId: user.id,
        prefix: "link"
      });
    } catch (error) {
      redirect(returnPath);
    }
  }

  const { error } = await supabase.from("profile_links").insert({
    profile_id: user.id,
    label,
    url,
    kind: resolveLinkKind(platform),
    platform: platform || null,
    image_url: imageUrl,
    position
  });

  if (error) {
    redirect(returnPath);
  }

  redirect(returnPath);
}

export async function updateLinkAction(formData) {
  const supabase = await createClient();
  const user = await requireUserProfile(supabase);
  const returnPath = normalizeReturnPath(formData.get("return_path"), "/");

  const id = String(formData.get("id") || "").trim();
  const label = String(formData.get("label") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const platform = normalizePlatform(formData.get("platform"));
  const hasImageUrlField = formData.has("image_url");
  let imageUrl = hasImageUrlField ? normalizeImageUrl(formData.get("image_url")) : null;
  const imageFile = getFileFromForm(formData, "link_image_file");
  const isActive = String(formData.get("is_active") || "") === "on";

  if (!id || !label || !url) {
    redirect(returnPath);
  }

  if (imageFile) {
    try {
      imageUrl = await uploadImageFile(supabase, {
        file: imageFile,
        bucket: LINK_IMAGE_BUCKET,
        userId: user.id,
        prefix: "link"
      });
    } catch (error) {
      redirect(returnPath);
    }
  }

  const updatePayload = {
    label,
    url,
    kind: resolveLinkKind(platform),
    platform: platform || null,
    is_active: isActive
  };

  if (hasImageUrlField || imageFile) {
    updatePayload.image_url = imageUrl;
  }

  const { error } = await supabase
    .from("profile_links")
    .update(updatePayload)
    .eq("id", id)
    .eq("profile_id", user.id);

  if (error) {
    redirect(returnPath);
  }

  redirect(returnPath);
}

export async function deleteLinkAction(formData) {
  const supabase = await createClient();
  const user = await requireUserProfile(supabase);
  const returnPath = normalizeReturnPath(formData.get("return_path"), "/");

  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect(returnPath);
  }

  const { error } = await supabase.from("profile_links").delete().eq("id", id).eq("profile_id", user.id);

  if (error) {
    redirect(returnPath);
  }

  redirect(returnPath);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
