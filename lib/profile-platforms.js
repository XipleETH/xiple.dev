export const PROFILE_PLATFORMS_PREFIX = "platforms:";

export function parseProfilePlatforms(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw.startsWith(PROFILE_PLATFORMS_PREFIX)) {
    return [];
  }

  const list = raw.slice(PROFILE_PLATFORMS_PREFIX.length);
  if (!list) {
    return [];
  }

  return Array.from(
    new Set(
      list
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  );
}

export function serializeProfilePlatforms(platforms) {
  const unique = Array.from(
    new Set(
      (platforms || [])
        .map((entry) => String(entry || "").trim().toLowerCase())
        .filter(Boolean)
    )
  );

  if (unique.length === 0) {
    return null;
  }

  return `${PROFILE_PLATFORMS_PREFIX}${unique.join(",")}`;
}
