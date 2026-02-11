import WalletAuth from "@/app/auth/wallet-auth";
import { signOutAction } from "@/app/dashboard/actions";
import DashboardEditor from "@/app/dashboard/editor";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DEMO_PROFILE = {
  id: "preview",
  username: "creator",
  display_name: "Preview Creator",
  tagline: "platforms:web,steam",
  bio: "This is preview mode without wallet. Customize the page and we iterate fast.",
  avatar_url: "/assets/profile-photo.jpg",
  profile_theme: "futurist",
  profile_layout: "stack",
  avatar_frame: "ring",
  link_style: "glass"
};

const DEMO_LINKS = [
  {
    id: 1,
    label: "Main project",
    url: "https://example.com",
    kind: "project",
    platform: "web",
    image_url: "",
    position: 0,
    is_active: true
  },
  {
    id: 2,
    label: "My social",
    url: "https://instagram.com",
    kind: "social",
    platform: "instagram",
    image_url: "",
    position: 1,
    is_active: true
  }
];

async function loadOrCreateProfile(supabase, userId) {
  const fields =
    "id, username, display_name, tagline, bio, avatar_url, profile_theme, profile_layout, avatar_frame, link_style";

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select(fields)
    .eq("id", userId)
    .maybeSingle();

  if (existingProfile) {
    return existingProfile;
  }

  await supabase.from("profiles").insert({ id: userId });

  const { data: createdProfile } = await supabase
    .from("profiles")
    .select(fields)
    .eq("id", userId)
    .maybeSingle();

  return (
    createdProfile || {
      id: userId,
      username: null,
      display_name: null,
      tagline: null,
      bio: null,
      avatar_url: null,
      profile_theme: "futurist",
      profile_layout: "stack",
      avatar_frame: "ring",
      link_style: "glass"
    }
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="profile-shell stack">
        <section className="card hero">
          <p className="kicker">Free forever · no ads</p>
          <h1 className="page-title">links.ngo</h1>
          <p className="page-sub">
            Claim your page at <code>/username</code> and publish all your links from one profile.
          </p>
          <ul className="feature-list">
            <li>Public route per user</li>
            <li>Custom avatar, bio and platform tags</li>
            <li>Themes, templates and avatar frames</li>
            <li>Project and social links in one place</li>
          </ul>
        </section>

        <section className="card preview-editor stack">
          <p className="kicker">No wallet required</p>
          <p className="page-sub">
            You are in preview mode. Edit styles and layout now; connect wallet only when you want to save to your real account.
          </p>
          <DashboardEditor profile={DEMO_PROFILE} links={DEMO_LINKS} returnPath="/" previewOnly />
        </section>

        <WalletAuth redirectTo="/" embedded />
      </main>
    );
  }

  const profile = await loadOrCreateProfile(supabase, user.id);

  const { data: links } = await supabase
    .from("profile_links")
    .select("id, label, url, kind, platform, image_url, position, is_active")
    .eq("profile_id", user.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <main className="profile-shell stack">
      <header className="card topnav topnav-simple">
        <div className="brand">
          links<span>.ngo</span>
        </div>

        <form action={signOutAction}>
          <button className="icon-btn" type="submit" aria-label="Disconnect wallet" title="Disconnect wallet">
            <img src="/assets/icons/wallet.svg" alt="" aria-hidden="true" />
          </button>
        </form>
      </header>

      <DashboardEditor profile={profile} links={links || []} returnPath="/" />
    </main>
  );
}

