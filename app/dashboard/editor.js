"use client";

import { useMemo, useState } from "react";

import {
  addLinkAction,
  deleteLinkAction,
  saveProfileAction,
  updateLinkAction
} from "@/app/dashboard/actions";
import { PLATFORM_OPTIONS, SOCIAL_OPTIONS, getIconBySlug } from "@/lib/constants";
import { parseProfilePlatforms } from "@/lib/profile-platforms";

const PLATFORM_VALUE_SET = new Set(PLATFORM_OPTIONS.map((entry) => entry.value));

const SOCIAL_ONLY_OPTIONS = SOCIAL_OPTIONS.filter((entry) => !PLATFORM_VALUE_SET.has(entry.value));

function renderLinkItem(link) {
  const icon = getIconBySlug(link.platform);
  const iconSrc = icon?.icon;
  const iconMono = icon?.mono;

  return (
    <a key={link.id} href={link.url} className="link-item" target="_blank" rel="noreferrer noopener">
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

export default function DashboardEditor({ profile, links }) {
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [selectedPlatforms, setSelectedPlatforms] = useState(() =>
    parseProfilePlatforms(profile?.tagline).filter((entry) => PLATFORM_VALUE_SET.has(entry))
  );

  const previewUsername = String(username || "").trim().replace(/^@/, "").toLowerCase() || "yourname";
  const previewAvatar = String(avatarUrl || "").trim() || "/assets/profile-photo.jpg";
  const selectedPlatformEntries = useMemo(
    () =>
      selectedPlatforms
        .map((value) => PLATFORM_OPTIONS.find((entry) => entry.value === value))
        .filter(Boolean),
    [selectedPlatforms]
  );

  const socialLinks = useMemo(
    () => (links || []).filter((entry) => entry.is_active !== false && entry.kind === "social"),
    [links]
  );
  const projectLinks = useMemo(
    () => (links || []).filter((entry) => entry.is_active !== false && entry.kind !== "social"),
    [links]
  );

  function togglePlatform(value) {
    setSelectedPlatforms((current) =>
      current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value]
    );
  }

  return (
    <div className="dashboard-workspace">
      <section className="stack">
        <form action={saveProfileAction} className="card panel" style={{ padding: "16px" }}>
          <p className="kicker">Profile</p>
          <p className="page-sub">Edit your public card inline.</p>

          <div className="inline-profile-card">
            <div className="avatar-wrap">
              <img src={previewAvatar} alt={`${previewUsername} avatar preview`} />
            </div>

            <div className="stack" style={{ marginTop: "10px" }}>
              <div>
                <p className="label">Username</p>
                <input
                  className="input"
                  name="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="xiple"
                  maxLength={30}
                />
              </div>

              <div>
                <p className="label">Bio</p>
                <textarea
                  className="textarea"
                  name="bio"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="Shipping apps for PC, Android, Reddit and Web."
                  maxLength={280}
                />
              </div>

              <div>
                <p className="label">Avatar URL</p>
                <input
                  className="input"
                  name="avatar_url"
                  value={avatarUrl}
                  onChange={(event) => setAvatarUrl(event.target.value)}
                  placeholder="/assets/profile-photo.jpg"
                />
              </div>

              <div>
                <p className="label">Platforms you build for</p>
                <div className="platform-picker">
                  {PLATFORM_OPTIONS.map((entry) => {
                    const icon = getIconBySlug(entry.value);
                    const active = selectedPlatforms.includes(entry.value);

                    return (
                      <button
                        key={entry.value}
                        type="button"
                        className={`platform-pill${active ? " active" : ""}`}
                        onClick={() => togglePlatform(entry.value)}
                      >
                        {icon?.icon ? (
                          <img
                            className={`icon${icon.mono ? " mono" : ""}`}
                            src={icon.icon}
                            alt=""
                            aria-hidden="true"
                          />
                        ) : null}
                        <span>{entry.label}</span>
                      </button>
                    );
                  })}
                </div>
                <input type="hidden" name="platforms" value={selectedPlatforms.join(",")} />
              </div>
            </div>
          </div>

          <button className="btn btn-primary" type="submit">
            Save profile
          </button>
        </form>

        <section className="card panel" style={{ padding: "16px" }}>
          <p className="kicker">Live preview</p>
          <p className="page-sub">This is how your profile page will look.</p>

          <div className="profile-card" style={{ marginTop: "12px" }}>
            <div className="profile-head">
              <div className="avatar-wrap">
                <img src={previewAvatar} alt={`${previewUsername} avatar`} />
              </div>
              <h1 className="profile-name">{previewUsername}</h1>
              {selectedPlatformEntries.length > 0 ? (
                <div className="profile-platforms">
                  {selectedPlatformEntries.map((entry) => {
                    const icon = getIconBySlug(entry.value);
                    return (
                      <span key={entry.value} className="platform-chip">
                        {icon?.icon ? (
                          <img
                            className={`icon${icon.mono ? " mono" : ""}`}
                            src={icon.icon}
                            alt=""
                            aria-hidden="true"
                          />
                        ) : null}
                        <span>{entry.label}</span>
                      </span>
                    );
                  })}
                </div>
              ) : null}
              {bio ? <p className="profile-bio">{bio}</p> : null}
            </div>

            {socialLinks.length > 0 ? (
              <div className="link-list" style={{ marginTop: "14px" }}>
                {socialLinks.map((entry) => renderLinkItem(entry))}
              </div>
            ) : null}

            {projectLinks.length > 0 ? (
              <>
                <p className="kicker" style={{ marginTop: "16px" }}>
                  Projects
                </p>
                <div className="link-list">{projectLinks.map((entry) => renderLinkItem(entry))}</div>
              </>
            ) : (
              <p className="empty" style={{ marginTop: "14px" }}>
                Add your first project link below.
              </p>
            )}
          </div>
        </section>
      </section>

      <section className="stack">
        <form action={addLinkAction} className="card panel" style={{ padding: "16px" }}>
          <p className="kicker">Projects</p>
          <h2 className="page-title" style={{ fontSize: "1.2rem", marginTop: "4px" }}>
            Add link
          </h2>

          <div className="stack" style={{ marginTop: "10px" }}>
            <div>
              <p className="label">Label</p>
              <input className="input" name="label" placeholder="Darkest Rumble" required maxLength={120} />
            </div>

            <div>
              <p className="label">URL</p>
              <input className="input" name="url" placeholder="https://..." required type="url" maxLength={500} />
            </div>

            <div>
              <p className="label">Platform / network</p>
              <select className="select" name="platform" defaultValue="">
                <option value="">None</option>
                <optgroup label="Platforms">
                  {PLATFORM_OPTIONS.map((entry) => (
                    <option key={entry.value} value={entry.value}>
                      {entry.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Social">
                  {SOCIAL_ONLY_OPTIONS.map((entry) => (
                    <option key={entry.value} value={entry.value}>
                      {entry.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <button className="btn btn-primary" type="submit">
              Add link
            </button>
          </div>
        </form>

        <section className="card panel" style={{ padding: "16px" }}>
          <p className="kicker">Manage links</p>
          <h2 className="page-title" style={{ fontSize: "1.2rem", marginTop: "4px" }}>
            Existing links
          </h2>

          {!links || links.length === 0 ? (
            <p className="empty" style={{ marginTop: "12px" }}>
              No links yet.
            </p>
          ) : (
            <div className="stack" style={{ marginTop: "12px" }}>
              {links.map((link) => (
                <article key={link.id} className="card" style={{ padding: "12px" }}>
                  <form action={updateLinkAction} className="stack">
                    <input type="hidden" name="id" value={link.id} />

                    <div>
                      <p className="label">Label</p>
                      <input className="input" name="label" defaultValue={link.label ?? ""} required />
                    </div>

                    <div>
                      <p className="label">URL</p>
                      <input className="input" name="url" defaultValue={link.url ?? ""} type="url" required />
                    </div>

                    <div>
                      <p className="label">Platform / network</p>
                      <select className="select" name="platform" defaultValue={link.platform || ""}>
                        <option value="">None</option>
                        <optgroup label="Platforms">
                          {PLATFORM_OPTIONS.map((entry) => (
                            <option key={entry.value} value={entry.value}>
                              {entry.label}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Social">
                          {SOCIAL_ONLY_OPTIONS.map((entry) => (
                            <option key={entry.value} value={entry.value}>
                              {entry.label}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input type="checkbox" name="is_active" defaultChecked={link.is_active !== false} />
                      Active on public page
                    </label>

                    <div className="toolbar">
                      <button className="btn" type="submit">
                        Save
                      </button>
                    </div>
                  </form>

                  <hr className="separator" />

                  <form action={deleteLinkAction}>
                    <input type="hidden" name="id" value={link.id} />
                    <button className="btn btn-danger" type="submit">
                      Delete
                    </button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
