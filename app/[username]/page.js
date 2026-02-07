import Link from "next/link";
import { notFound } from "next/navigation";

import { getIconBySlug } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function renderLinkRow(link) {
  const icon = getIconBySlug(link.platform);
  const iconSrc = icon?.icon;
  const iconMono = icon?.mono;

  return (
    <a
      key={link.id}
      href={link.url}
      className="link-item"
      target="_blank"
      rel="noreferrer noopener"
    >
      {iconSrc ? (
        <img className={`icon${iconMono ? " mono" : ""}`} src={iconSrc} alt="" aria-hidden="true" />
      ) : (
        <span className="icon" aria-hidden="true" style={{ borderRadius: "50%", background: "#89a8ef" }} />
      )}
      <span>
        <span className="link-title">{link.label}</span>
        {link.platform ? <span className="link-caption">{link.platform}</span> : null}
      </span>
    </a>
  );
}

export async function generateMetadata({ params }) {
  const { username } = await params;
  return {
    title: `/${username} | hubfol.io`
  };
}

export default async function PublicProfilePage({ params }) {
  const { username } = await params;
  const normalizedUsername = String(username || "").toLowerCase();

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, tagline, bio, avatar_url")
    .eq("username", normalizedUsername)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const { data: links } = await supabase
    .from("profile_links")
    .select("id, label, url, kind, platform, position")
    .eq("profile_id", profile.id)
    .eq("is_active", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  const socialLinks = (links || []).filter((link) => link.kind === "social");
  const projectLinks = (links || []).filter((link) => link.kind !== "social");

  return (
    <main className="profile-shell">
      <section className="card profile-card">
        <div className="profile-head">
          <div className="avatar-wrap">
            <img
              src={profile.avatar_url || "/assets/profile-photo.jpg"}
              alt={`${profile.display_name || profile.username} avatar`}
            />
          </div>

          <h1 className="profile-name">{profile.display_name || profile.username}</h1>
          {profile.tagline ? <p className="profile-tagline">{profile.tagline}</p> : null}
          {profile.bio ? <p className="profile-bio">{profile.bio}</p> : null}
        </div>

        {socialLinks.length > 0 ? (
          <div className="link-list" style={{ marginTop: "14px" }}>
            {socialLinks.map((link) => renderLinkRow(link))}
          </div>
        ) : null}

        {projectLinks.length > 0 ? (
          <>
            <p className="kicker" style={{ marginTop: "16px" }}>
              Projects
            </p>
            <div className="link-list">{projectLinks.map((link) => renderLinkRow(link))}</div>
          </>
        ) : (
          <p className="empty" style={{ marginTop: "16px" }}>
            This profile has no public links yet.
          </p>
        )}
      </section>

      <footer style={{ textAlign: "center", marginTop: "12px", color: "#8da4d0", fontSize: "0.78rem" }}>
        <Link className="link-inline" href="/">
          hubfol.io
        </Link>
      </footer>
    </main>
  );
}
