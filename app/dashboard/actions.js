"use server";

import { redirect } from "next/navigation";

import { PLATFORM_OPTIONS, RESERVED_USERNAMES, SOCIAL_OPTIONS } from "@/lib/constants";
import {
  resolveAvatarFrame,
  resolveLinkStyle,
  resolveProfileLayout,
  resolveProfileTheme
} from "@/lib/profile-customization";
import { serializeProfilePlatforms } from "@/lib/profile-platforms";
import { createClient } from "@/lib/supabase/server";

const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])?$/;
const IMAGE_MAX_BYTES = 6 * 1024 * 1024;
const AVATAR_BUCKET = "avatars";
const LINK_IMAGE_BUCKET = "link-images";
const URL_PROTOCOLS = new Set(["http:", "https:"]);

const PROFILE_PLATFORM_SET = new Set(PLATFORM_OPTIONS.map((entry) => entry.value));
const LINK_PLATFORM_SET = new Set([...PLATFORM_OPTIONS, ...SOCIAL_OPTIONS].map((entry) => entry.value));

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^@+/, "");
}

function normalizeText(value, max = 500) {
  return String(value || "").trim().slice(0, max);
}

function normalizePlatform(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized || !LINK_PLATFORM_SET.has(normalized)) {
    return null;
  }
  return normalized;
}

function normalizePublicUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const parsed = new URL(withProtocol);
    if (!URL_PROTOCOLS.has(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function normalizeImageUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }

  if (raw.startsWith("/")) {
    return raw;
  }

  return normalizePublicUrl(raw);
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

  if (platform && LINK_PLATFORM_SET.has(platform)) {
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

  const { error } = await supabase.from("profiles").insert({ id: user.id });
  if (error && error.code !== "23505") {
    redirect("/");
  }

  return user;
}

export async function saveProfileAction(formData) {
  const supabase = await createClient();
  const user = await requireUserProfile(supabase);
  const returnPath = normalizeReturnPath(formData.get("return_path"), "/");

  const username = normalizeUsername(formData.get("username"));
  const displayName = normalizeText(formData.get("display_name"), 80);
  const bio = normalizeText(formData.get("bio"), 280);
  const profileTheme = resolveProfileTheme(formData.get("profile_theme"));
  const profileLayout = resolveProfileLayout(formData.get("profile_layout"));
  const avatarFrame = resolveAvatarFrame(formData.get("avatar_frame"));
  const linkStyle = resolveLinkStyle(formData.get("link_style"));
  let avatarUrl = normalizeImageUrl(formData.get("avatar_url"));
  const avatarFile = getFileFromForm(formData, "avatar_file");
  const selectedPlatforms = parsePlatformsCsv(formData.get("platforms"));

  if (username) {
    if (!USERNAME_REGEX.test(username) || RESERVED_USERNAMES.has(username)) {
      redirect(returnPath);
    }
  }

  if (avatarFile) {
    try {
      avatarUrl = await uploadImageFile(supabase, {
        file: avatarFile,
        bucket: AVATAR_BUCKET,
        userId: user.id,
        prefix: "avatar"
      });
    } catch {
      redirect(returnPath);
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username: username || null,
      display_name: displayName || null,
      tagline: serializeProfilePlatforms(selectedPlatforms),
      bio: bio || null,
      avatar_url: avatarUrl || null,
      profile_theme: profileTheme,
      profile_layout: profileLayout,
      avatar_frame: avatarFrame,
      link_style: linkStyle
    })
    .eq("id", user.id);

  if (error) {
    redirect(returnPath);
  }

  redirect(username ? `/${username}` : returnPath);
}

export async function addLinkAction(formData) {
  const supabase = await createClient();
  const user = await requireUserProfile(supabase);
  const returnPath = normalizeReturnPath(formData.get("return_path"), "/");

  const label = normalizeText(formData.get("label"), 120);
  const url = normalizePublicUrl(formData.get("url"));
  const platform = normalizePlatform(formData.get("platform"));
  let imageUrl = normalizeImageUrl(formData.get("image_url"));
  const imageFile = getFileFromForm(formData, "link_image_file");

  if (!label || !url) {
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
    } catch {
      redirect(returnPath);
    }
  }

  let position = 0;
  try {
    position = await resolveNextLinkPosition(supabase, user.id);
  } catch {
    redirect(returnPath);
  }

  const { error } = await supabase.from("profile_links").insert({
    profile_id: user.id,
    label,
    url,
    kind: resolveLinkKind(platform),
    platform,
    image_url: imageUrl,
    position,
    is_active: true
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
  const label = normalizeText(formData.get("label"), 120);
  const url = normalizePublicUrl(formData.get("url"));
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
    } catch {
      redirect(returnPath);
    }
  }

  const payload = {
    label,
    url,
    kind: resolveLinkKind(platform),
    platform,
    is_active: isActive
  };

  if (hasImageUrlField || imageFile) {
    payload.image_url = imageUrl;
  }

  const { error } = await supabase
    .from("profile_links")
    .update(payload)
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

