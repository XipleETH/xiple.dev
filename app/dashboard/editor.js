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
const LINK_PLATFORM_OPTIONS = [...PLATFORM_OPTIONS, ...SOCIAL_ONLY_OPTIONS];

function PlatformButtons({ selected, onToggle, compact = false }) {
  return (
    <div className={`platform-toggle-grid${compact ? " compact" : ""}`}>
      {LINK_PLATFORM_OPTIONS.map((entry) => {
        const icon = getIconBySlug(entry.value);
        const active = selected.includes(entry.value);

        return (
          <button
            key={entry.value}
            type="button"
            className={`platform-toggle-btn${active ? " active" : ""}`}
            onClick={() => onToggle(entry.value)}
            title={entry.label}
            aria-label={entry.label}
          >
            {icon?.icon ? (
              <img className={`icon${icon.mono ? " mono" : ""}`} src={icon.icon} alt="" aria-hidden="true" />
            ) : (
              <span className="platform-dot-fallback" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function DashboardEditor({ profile, links }) {
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [selectedPlatforms, setSelectedPlatforms] = useState(() =>
    parseProfilePlatforms(profile?.tagline).filter((entry) => PLATFORM_VALUE_SET.has(entry))
  );
  const [newLinkPlatform, setNewLinkPlatform] = useState("");
  const [linkPlatformById, setLinkPlatformById] = useState(() =>
    Object.fromEntries((links || []).map((entry) => [entry.id, entry.platform || ""]))
  );

  const previewUsername = String(username || "").trim().replace(/^@/, "").toLowerCase() || "yourname";
  const previewAvatar = String(avatarUrl || "").trim() || "/assets/profile-photo.jpg";
  const selectedProfilePlatforms = useMemo(
    () =>
      selectedPlatforms
        .map((value) => PLATFORM_OPTIONS.find((entry) => entry.value === value))
        .filter(Boolean),
    [selectedPlatforms]
  );
  const visibleLinks = links || [];

  function toggleProfilePlatform(value) {
    setSelectedPlatforms((current) =>
      current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value]
    );
  }

  function toggleNewLinkPlatform(value) {
    setNewLinkPlatform((current) => (current === value ? "" : value));
  }

  function toggleExistingLinkPlatform(linkId, value) {
    setLinkPlatformById((current) => {
      const selected = current[linkId] || "";
      return {
        ...current,
        [linkId]: selected === value ? "" : value
      };
    });
  }

  return (
    <section className="card preview-editor">
      <form action={saveProfileAction} className="stack">
        <div className="profile-head preview-head">
          <div className="avatar-wrap">
            <img src={previewAvatar} alt={`${previewUsername} avatar preview`} />
          </div>

          <input
            className="inline-name-input"
            name="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="username"
            maxLength={30}
          />

          <textarea
            className="inline-bio-input"
            name="bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Write your bio..."
            maxLength={280}
          />

          <input
            className="inline-avatar-input"
            name="avatar_url"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="/assets/profile-photo.jpg"
          />

          {selectedProfilePlatforms.length > 0 ? (
            <div className="profile-platforms">
              {selectedProfilePlatforms.map((entry) => {
                const icon = getIconBySlug(entry.value);
                return (
                  <span key={entry.value} className="platform-chip">
                    {icon?.icon ? (
                      <img className={`icon${icon.mono ? " mono" : ""}`} src={icon.icon} alt="" aria-hidden="true" />
                    ) : null}
                    <span>{entry.label}</span>
                  </span>
                );
              })}
            </div>
          ) : null}

          <PlatformButtons selected={selectedPlatforms} onToggle={toggleProfilePlatform} />
          <input type="hidden" name="platforms" value={selectedPlatforms.join(",")} />
        </div>

        <button className="btn btn-primary" type="submit">
          Save profile
        </button>
      </form>

      <hr className="separator" style={{ margin: "14px 0" }} />

      <section className="stack">
        <p className="kicker">Links</p>

        {visibleLinks.length === 0 ? (
          <p className="empty">No links yet. Add your first one below.</p>
        ) : (
          <div className="stack">
            {visibleLinks.map((link) => {
              const selectedPlatform = linkPlatformById[link.id] ?? link.platform ?? "";
              const selectedArray = selectedPlatform ? [selectedPlatform] : [];

              return (
                <article key={link.id} className="card link-editor-card">
                  <form action={updateLinkAction} className="stack">
                    <input type="hidden" name="id" value={link.id} />

                    <input className="input" name="label" defaultValue={link.label ?? ""} required maxLength={120} />

                    <input className="input" name="url" defaultValue={link.url ?? ""} type="url" required maxLength={500} />

                    <PlatformButtons
                      selected={selectedArray}
                      onToggle={(value) => toggleExistingLinkPlatform(link.id, value)}
                      compact
                    />
                    <input type="hidden" name="platform" value={selectedPlatform} />

                    <label className="link-active-row">
                      <input type="checkbox" name="is_active" defaultChecked={link.is_active !== false} />
                      Active
                    </label>

                    <div className="toolbar">
                      <button className="btn" type="submit">
                        Save
                      </button>
                    </div>
                  </form>

                  <form action={deleteLinkAction}>
                    <input type="hidden" name="id" value={link.id} />
                    <button className="btn btn-danger" type="submit">
                      Delete
                    </button>
                  </form>
                </article>
              );
            })}
          </div>
        )}

        <form action={addLinkAction} className="card link-editor-card stack">
          <p className="kicker">New Link</p>
          <input className="input" name="label" placeholder="Darkest Rumble" required maxLength={120} />
          <input className="input" name="url" placeholder="https://..." required type="url" maxLength={500} />

          <PlatformButtons selected={newLinkPlatform ? [newLinkPlatform] : []} onToggle={toggleNewLinkPlatform} compact />
          <input type="hidden" name="platform" value={newLinkPlatform} />

          <button className="btn btn-primary" type="submit">
            Add link
          </button>
        </form>
      </section>
    </section>
  );
}
