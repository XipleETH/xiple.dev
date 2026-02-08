import Link from "next/link";
import { notFound } from "next/navigation";

import { PLATFORM_OPTIONS, getIconBySlug } from "@/lib/constants";
import { parseProfilePlatforms } from "@/lib/profile-platforms";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PROFILE_PLATFORM_SET = new Set(PLATFORM_OPTIONS.map((entry) => entry.value));

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
      {link.image_url ? (
        <img className="link-thumb" src={link.image_url} alt={`${link.label} thumbnail`} loading="lazy" />
      ) : null}
    </a>
  );
}

export async function generateMetadata({ params }) {
  const { username } = await params;
  return {
    title: `/${username} | hubfol.io`
  };
}

export default async function PublicProfilePage({ params, searchParams }) {
  const { username } = await params;
  const query = await searchParams;
  const message = query?.message;
  const error = query?.error;
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

  const {
    data: { user }
  } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;

  const linkQuery = supabase
    .from("profile_links")
    .select("id, label, url, kind, platform, image_url, position, is_active")
    .eq("profile_id", profile.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  const { data: links } = isOwner ? await linkQuery : await linkQuery.eq("is_active", true);

  const visibleLinks = isOwner ? (links || []).filter((link) => link.is_active !== false) : links || [];

  const socialLinks = visibleLinks.filter((link) => link.kind === "social");
  const projectLinks = visibleLinks.filter((link) => link.kind !== "social");
  const profilePlatforms = parseProfilePlatforms(profile.tagline).filter((entry) =>
    PROFILE_PLATFORM_SET.has(entry)
  );
  const legacyTagline = profilePlatforms.length === 0 ? profile.tagline : null;

  return (
    <main className="profile-shell">
      {isOwner ? (
        <div className="profile-owner-row">
          <Link className="btn" href="/">
            Edit profile
          </Link>
        </div>
      ) : null}

      <section className="card profile-card">
        {isOwner && message ? <p className="notice ok">{message}</p> : null}
        {isOwner && error ? <p className="notice err">{error}</p> : null}

        <div className="profile-head">
          <div className="avatar-wrap">
            <img
              src={profile.avatar_url || "/assets/profile-photo.jpg"}
              alt={`${profile.display_name || profile.username} avatar`}
            />
          </div>

          <h1 className="profile-name">{profile.display_name || profile.username}</h1>
          {legacyTagline ? <p className="profile-tagline">{legacyTagline}</p> : null}
          {profilePlatforms.length > 0 ? (
            <div className="profile-platforms">
              {profilePlatforms.map((entry) => {
                const icon = getIconBySlug(entry);
                return (
                  <span key={entry} className="platform-chip">
                    {icon?.icon ? (
                      <img
                        className={`icon${icon.mono ? " mono" : ""}`}
                        src={icon.icon}
                        alt=""
                        aria-hidden="true"
                      />
                    ) : null}
                    <span>{entry}</span>
                  </span>
                );
              })}
            </div>
          ) : null}
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
