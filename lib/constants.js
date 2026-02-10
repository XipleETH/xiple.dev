export const RESERVED_USERNAMES = new Set([
  "auth",
  "dashboard",
  "api",
  "login",
  "signup",
  "settings",
  "admin",
  "www",
  "help",
  "about",
  "pricing",
  "terms",
  "privacy"
]);

export const PLATFORM_OPTIONS = [
  { value: "steam", label: "Steam", icon: "/assets/icons/steam.svg", mono: true },
  { value: "windows", label: "Windows", icon: "/assets/icons/windows.svg", mono: false },
  { value: "android", label: "Android", icon: "/assets/icons/android.svg", mono: true },
  { value: "reddit", label: "Reddit", icon: "/assets/icons/reddit.svg", mono: true },
  { value: "nintendo", label: "Nintendo", icon: "/assets/icons/nintendo.svg", mono: true },
  { value: "playstation", label: "PlayStation", icon: "/assets/icons/playstation.svg", mono: true },
  { value: "xbox", label: "Xbox", icon: "/assets/icons/xbox.svg", mono: true },
  { value: "web", label: "Web", icon: "/assets/icons/web.svg", mono: true }
];

export const SOCIAL_OPTIONS = [
  { value: "x", label: "X", icon: "/assets/icons/x.svg", mono: true },
  { value: "github", label: "GitHub", icon: "/assets/icons/github.svg", mono: true },
  { value: "youtube", label: "YouTube", icon: "/assets/icons/youtube.svg", mono: true },
  { value: "twitch", label: "Twitch", icon: "/assets/icons/twitch.svg", mono: true },
  { value: "facebook", label: "Facebook", icon: "/assets/icons/facebook.svg", mono: true },
  { value: "instagram", label: "Instagram", icon: "/assets/icons/instagram.svg", mono: true },
  { value: "tiktok", label: "TikTok", icon: "/assets/icons/tiktok.svg", mono: true },
  { value: "discord", label: "Discord", icon: "/assets/icons/discord.svg", mono: true }
];

export const LINK_KIND_OPTIONS = [
  { value: "project", label: "Project" },
  { value: "social", label: "Social" }
];

export const ALL_LINK_OPTIONS = Array.from(
  new Map([...PLATFORM_OPTIONS, ...SOCIAL_OPTIONS].map((entry) => [entry.value, entry])).values()
);

export function getIconBySlug(slug) {
  if (!slug) {
    return null;
  }

  const normalized = String(slug).toLowerCase();
  return ALL_LINK_OPTIONS.find((entry) => entry.value === normalized) || null;
}

