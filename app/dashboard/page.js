import Link from "next/link";
import { redirect } from "next/navigation";

import DashboardEditor from "@/app/dashboard/editor";
import { signOutAction } from "@/app/dashboard/actions";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function normalizeBaseUrl(url) {
  return String(url || "").replace(/\/$/, "");
}

export default async function DashboardPage({ searchParams }) {
  const params = await searchParams;
  const message = params?.message;
  const error = params?.error;

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
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
    .select("id, label, url, kind, platform, position, is_active")
    .eq("profile_id", user.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  const baseUrl = normalizeBaseUrl(env.NEXT_PUBLIC_APP_URL);
  const profileUrl = profile?.username ? `${baseUrl}/${profile.username}` : null;

  return (
    <main className="container stack">
      <header className="card topnav">
        <div>
          <p className="kicker">Dashboard</p>
          <div className="brand" style={{ marginTop: "2px" }}>
            hubfol<span>.io</span>
          </div>
        </div>
        <div className="toolbar">
          <Link className="btn" href="/">
            Home
          </Link>
          {profileUrl ? (
            <a className="btn" href={profileUrl} target="_blank" rel="noreferrer noopener">
              View public page
            </a>
          ) : null}
          <form action={signOutAction}>
            <button className="btn" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>

      {message ? <p className="notice ok">{message}</p> : null}
      {error ? <p className="notice err">{error}</p> : null}

      <DashboardEditor profile={profile} links={links || []} />
    </main>
  );
}
