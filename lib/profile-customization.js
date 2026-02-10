export const PROFILE_THEME_OPTIONS = [
  { value: "futurist", label: "Futurist" },
  { value: "comic", label: "Comic" },
  { value: "aurora", label: "Aurora" },
  { value: "noir", label: "Noir" }
];

export const PROFILE_LAYOUT_OPTIONS = [
  { value: "stack", label: "Stack" },
  { value: "grid", label: "Grid" },
  { value: "spotlight", label: "Spotlight" }
];

export const AVATAR_FRAME_OPTIONS = [
  { value: "ring", label: "Ring" },
  { value: "neon", label: "Neon" },
  { value: "comic", label: "Comic" },
  { value: "pixel", label: "Pixel" }
];

export const LINK_STYLE_OPTIONS = [
  { value: "glass", label: "Glass" },
  { value: "solid", label: "Solid" },
  { value: "outline", label: "Outline" }
];

const THEME_SET = new Set(PROFILE_THEME_OPTIONS.map((entry) => entry.value));
const LAYOUT_SET = new Set(PROFILE_LAYOUT_OPTIONS.map((entry) => entry.value));
const FRAME_SET = new Set(AVATAR_FRAME_OPTIONS.map((entry) => entry.value));
const LINK_STYLE_SET = new Set(LINK_STYLE_OPTIONS.map((entry) => entry.value));

export const DEFAULT_PROFILE_CUSTOMIZATION = {
  profileTheme: "futurist",
  profileLayout: "stack",
  avatarFrame: "ring",
  linkStyle: "glass"
};

export function resolveProfileTheme(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return THEME_SET.has(normalized) ? normalized : DEFAULT_PROFILE_CUSTOMIZATION.profileTheme;
}

export function resolveProfileLayout(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return LAYOUT_SET.has(normalized) ? normalized : DEFAULT_PROFILE_CUSTOMIZATION.profileLayout;
}

export function resolveAvatarFrame(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return FRAME_SET.has(normalized) ? normalized : DEFAULT_PROFILE_CUSTOMIZATION.avatarFrame;
}

export function resolveLinkStyle(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return LINK_STYLE_SET.has(normalized) ? normalized : DEFAULT_PROFILE_CUSTOMIZATION.linkStyle;
}

