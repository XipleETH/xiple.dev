import WalletAuth from "@/app/auth/wallet-auth";
import { signOutAction } from "@/app/dashboard/actions";
import DashboardEditor from "@/app/dashboard/editor";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

