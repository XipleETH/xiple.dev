import Link from "next/link";
import { notFound } from "next/navigation";

import { PLATFORM_OPTIONS, getIconBySlug } from "@/lib/constants";
import {
  resolveAvatarFrame,
  resolveLinkStyle,
  resolveProfileLayout,
  resolveProfileTheme
} from "@/lib/profile-customization";
import { parseProfilePlatforms } from "@/lib/profile-platforms";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PROFILE_PLATFORM_SET = new Set(PLATFORM_OPTIONS.map((entry) => entry.value));

function renderLinkRow(link, showOwnerState = false) {
  const icon = getIconBySlug(link.platform);
  const caption = [link.platform];

  if (showOwnerState && link.is_active === false) {
    caption.push("hidden");
  }

  return (
    <a
      key={link.id}
      href={link.url}
      className={`link-item${showOwnerState && link.is_active === false ? " is-inactive" : ""}`}
      target="_blank"
      rel="noreferrer noopener"
    >
      {icon?.icon ? (
        <img className={`icon${icon.mono ? " mono" : ""}`} src={icon.icon} alt="" aria-hidden="true" />
      ) : (
        <span className="icon icon-fallback" aria-hidden="true" />
      )}

      <span>
        <span className="link-title">{link.label}</span>
        {caption.filter(Boolean).length > 0 ? <span className="link-caption">{caption.filter(Boolean).join(" · ")}</span> : null}
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
    title: `/${username} | links.ngo`
  };
}

export default async function PublicProfilePage({ params }) {
  const { username } = await params;
  const normalizedUsername = String(username || "").trim().toLowerCase();

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, tagline, bio, avatar_url, profile_theme, profile_layout, avatar_frame, link_style"
    )
    .eq("username", normalizedUsername)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;

  const linksQuery = supabase
    .from("profile_links")
    .select("id, label, url, kind, platform, image_url, position, is_active")
    .eq("profile_id", profile.id)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  const { data: links } = isOwner ? await linksQuery : await linksQuery.eq("is_active", true);
  const visibleLinks = isOwner ? links || [] : (links || []).filter((entry) => entry.is_active !== false);

  const socialLinks = visibleLinks.filter((entry) => entry.kind === "social");
  const projectLinks = visibleLinks.filter((entry) => entry.kind !== "social");

  const profilePlatforms = parseProfilePlatforms(profile.tagline).filter((entry) => PROFILE_PLATFORM_SET.has(entry));
  const legacyTagline = profilePlatforms.length === 0 ? profile.tagline : null;
  const profileTheme = resolveProfileTheme(profile.profile_theme);
  const profileLayout = resolveProfileLayout(profile.profile_layout);
  const avatarFrame = resolveAvatarFrame(profile.avatar_frame);
  const linkStyle = resolveLinkStyle(profile.link_style);

  return (
    <main
      className={`profile-shell public-profile profile-theme-${profileTheme} profile-layout-${profileLayout} avatar-frame-${avatarFrame} link-style-${linkStyle}`}
    >
      {isOwner ? (
        <div className="profile-owner-row">
          <Link className="btn" href="/">
            Edit profile
          </Link>
        </div>
      ) : null}

      <section className="card profile-card">
        <div className="profile-head">
          <div className="avatar-wrap">
            <img
              src={profile.avatar_url || "/assets/profile-photo.jpg"}
              alt={`${profile.display_name || profile.username} avatar`}
            />
          </div>

          <h1 className="profile-name">{profile.display_name || profile.username}</h1>
          <p className="profile-handle">@{profile.username}</p>

          {legacyTagline ? <p className="profile-tagline">{legacyTagline}</p> : null}

          {profilePlatforms.length > 0 ? (
            <div className="profile-platforms">
              {profilePlatforms.map((entry) => {
                const icon = getIconBySlug(entry);

                return (
                  <span key={entry} className="platform-chip">
                    {icon?.icon ? <img className={`icon${icon.mono ? " mono" : ""}`} src={icon.icon} alt="" aria-hidden="true" /> : null}
                    <span>{entry}</span>
                  </span>
                );
              })}
            </div>
          ) : null}

          {profile.bio ? <p className="profile-bio">{profile.bio}</p> : null}
        </div>

        {socialLinks.length > 0 ? (
          <>
            <p className="section-title">Social</p>
            <div className="link-list">{socialLinks.map((link) => renderLinkRow(link, isOwner))}</div>
          </>
        ) : null}

        {projectLinks.length > 0 ? (
          <>
            <p className="section-title">Projects</p>
            <div className="link-list">{projectLinks.map((link) => renderLinkRow(link, isOwner))}</div>
          </>
        ) : null}

        {socialLinks.length === 0 && projectLinks.length === 0 ? (
          <p className="empty">This profile has no public links yet.</p>
        ) : null}
      </section>

      <footer className="profile-footer">
        <Link className="link-inline" href="/">
          links.ngo
        </Link>
      </footer>
    </main>
  );
}

