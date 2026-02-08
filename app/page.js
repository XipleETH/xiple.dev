import WalletAuth from "@/app/auth/wallet-auth";
import { signOutAction } from "@/app/dashboard/actions";
import DashboardEditor from "@/app/dashboard/editor";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }) {
  const params = await searchParams;
  const message = params?.message;
  const error = params?.error;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="profile-shell stack">
        <section className="card profile-card">
          <div className="profile-head">
            <div className="avatar-wrap">
              <img src="/assets/profile-avatar.svg" alt="hubfol avatar placeholder" />
            </div>
            <h1 className="profile-name">hubfol.io</h1>
            <p className="profile-bio">
              Connect your wallet to claim a username and create your public page at <code>/username</code>.
            </p>
          </div>
        </section>

        <WalletAuth initialMessage={message} initialError={error} redirectTo="/" embedded />
      </main>
    );
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("id, username, tagline, bio, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").insert({ id: user.id });
    const { data: newProfile } = await supabase
      .from("profiles")
      .select("id, username, tagline, bio, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    profile = newProfile;
  }

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
          hubfol<span>.io</span>
        </div>
        <form action={signOutAction}>
          <button className="icon-btn" type="submit" aria-label="Disconnect wallet" title="Disconnect wallet">
            <img src="/assets/icons/wallet.svg" alt="" aria-hidden="true" />
          </button>
        </form>
      </header>

      {message ? <p className="notice ok">{message}</p> : null}
      {error ? <p className="notice err">{error}</p> : null}

      <DashboardEditor profile={profile} links={links || []} userId={user.id} returnPath="/" />
    </main>
  );
}
