"use client";

import { useEffect, useState } from "react";

import {
  addLinkAction,
  deleteLinkAction,
  saveProfileAction,
  updateLinkAction
} from "@/app/dashboard/actions";
import { PLATFORM_OPTIONS, SOCIAL_OPTIONS, getIconBySlug } from "@/lib/constants";
import {
  AVATAR_FRAME_OPTIONS,
  LINK_STYLE_OPTIONS,
  PROFILE_LAYOUT_OPTIONS,
  PROFILE_THEME_OPTIONS,
  resolveAvatarFrame,
  resolveLinkStyle,
  resolveProfileLayout,
  resolveProfileTheme
} from "@/lib/profile-customization";
import { parseProfilePlatforms } from "@/lib/profile-platforms";

const PROFILE_PLATFORM_SET = new Set(PLATFORM_OPTIONS.map((entry) => entry.value));
const LINK_PLATFORM_OPTIONS = Array.from(
  new Map([...PLATFORM_OPTIONS, ...SOCIAL_OPTIONS].map((entry) => [entry.value, entry])).values()
);
const DEFAULT_AVATAR = "/assets/profile-photo.jpg";

function normalizeUsernameInput(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/^@+/, "");
}

function PlatformToggle({ value, label, icon, mono, active, onToggle }) {
  return (
    <button
      type="button"
      className={`platform-toggle${active ? " active" : ""}`}
      onClick={() => onToggle(value)}
      aria-pressed={active}
    >
      {icon ? <img className={`icon${mono ? " mono" : ""}`} src={icon} alt="" aria-hidden="true" /> : null}
      <span>{label}</span>
    </button>
  );
}

function ChoiceButton({ label, value, active, onSelect }) {
  return (
    <button
      type="button"
      className={`choice-btn${active ? " active" : ""}`}
      onClick={() => onSelect(value)}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

export default function DashboardEditor({ profile, links, returnPath = "/", previewOnly = false }) {
  const [username, setUsername] = useState(profile?.username ?? "");
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [selectedPlatforms, setSelectedPlatforms] = useState(() =>
    parseProfilePlatforms(profile?.tagline).filter((entry) => PROFILE_PLATFORM_SET.has(entry))
  );
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || DEFAULT_AVATAR);
  const [avatarObjectUrl, setAvatarObjectUrl] = useState("");
  const [profileTheme, setProfileTheme] = useState(() => resolveProfileTheme(profile?.profile_theme));
  const [profileLayout, setProfileLayout] = useState(() => resolveProfileLayout(profile?.profile_layout));
  const [avatarFrame, setAvatarFrame] = useState(() => resolveAvatarFrame(profile?.avatar_frame));
  const [linkStyle, setLinkStyle] = useState(() => resolveLinkStyle(profile?.link_style));
  const [previewNotice, setPreviewNotice] = useState("");

  const existingLinks = Array.isArray(links) ? links : [];
  const handle = normalizeUsernameInput(username) || "yourname";
  const previewName = String(displayName || "").trim() || handle;
  const previewIcon = getIconBySlug(selectedPlatforms[0] || "web");

  useEffect(() => {
    return () => {
      if (avatarObjectUrl) {
        URL.revokeObjectURL(avatarObjectUrl);
      }
    };
  }, [avatarObjectUrl]);

  function togglePlatform(platform) {
    setSelectedPlatforms((current) => {
      if (current.includes(platform)) {
        return current.filter((entry) => entry !== platform);
      }
      return [...current, platform];
    });
  }

  function handleAvatarFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (avatarObjectUrl) {
      URL.revokeObjectURL(avatarObjectUrl);
    }

    const nextObjectUrl = URL.createObjectURL(file);
    setAvatarObjectUrl(nextObjectUrl);
    setAvatarPreview(nextObjectUrl);
    setAvatarUrl("");
  }

  function handlePreviewSubmit(event) {
    if (!previewOnly) {
      return;
    }

    event.preventDefault();
    setPreviewNotice("Preview mode: changes are local only. Connect wallet to save permanently.");
  }

  return (
    <section className="stack">
      <article className="card preview-editor">
        <form
          action={previewOnly ? undefined : saveProfileAction}
          className="stack"
          encType="multipart/form-data"
          onSubmit={handlePreviewSubmit}
        >
          {previewOnly ? <p className="notice">{previewNotice || "Preview mode active. No wallet needed."}</p> : null}
          <input type="hidden" name="return_path" value={returnPath} />
          <input type="hidden" name="platforms" value={selectedPlatforms.join(",")} />
          <input type="hidden" name="avatar_url" value={avatarUrl} />
          <input type="hidden" name="profile_theme" value={profileTheme} />
          <input type="hidden" name="profile_layout" value={profileLayout} />
          <input type="hidden" name="avatar_frame" value={avatarFrame} />
          <input type="hidden" name="link_style" value={linkStyle} />

          <div className="profile-head preview-head">
            <div className="avatar-edit-wrap">
              <div className="avatar-wrap">
                <img src={avatarPreview || DEFAULT_AVATAR} alt={`${previewName} avatar preview`} />
              </div>

              <label className="avatar-edit-btn" title="Upload avatar image">
                <img src="/assets/icons/image.svg" alt="" aria-hidden="true" />
                <span className="sr-only">Upload avatar</span>
                <input
                  className="sr-only-input"
                  type="file"
                  name="avatar_file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                />
              </label>
            </div>

            <label className="field w-full">
              <span className="label">Username</span>
              <div className="input-prefix">
                <span>links.ngo/</span>
                <input
                  className="input"
                  name="username"
                  value={username}
                  maxLength={30}
                  placeholder="username"
                  onChange={(event) => setUsername(normalizeUsernameInput(event.target.value))}
                />
              </div>
            </label>

            <label className="field w-full">
              <span className="label">Display name</span>
              <input
                className="input"
                name="display_name"
                value={displayName}
                maxLength={80}
                placeholder="Your public name"
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>

            <label className="field w-full">
              <span className="label">Bio</span>
              <textarea
                className="textarea"
                name="bio"
                value={bio}
                maxLength={280}
                placeholder="What do you do?"
                onChange={(event) => setBio(event.target.value)}
              />
            </label>

            <div className="field w-full">
              <p className="label">Platforms</p>
              <div className="platform-toggle-list">
                {PLATFORM_OPTIONS.map((entry) => (
                  <PlatformToggle
                    key={entry.value}
                    value={entry.value}
                    label={entry.label}
                    icon={entry.icon}
                    mono={entry.mono}
                    active={selectedPlatforms.includes(entry.value)}
                    onToggle={togglePlatform}
                  />
                ))}
              </div>
            </div>

            <div className="field w-full">
              <p className="label">Theme</p>
              <div className="choice-grid">
                {PROFILE_THEME_OPTIONS.map((entry) => (
                  <ChoiceButton
                    key={entry.value}
                    label={entry.label}
                    value={entry.value}
                    active={profileTheme === entry.value}
                    onSelect={setProfileTheme}
                  />
                ))}
              </div>
            </div>

            <div className="field w-full">
              <p className="label">Page template</p>
              <div className="choice-grid">
                {PROFILE_LAYOUT_OPTIONS.map((entry) => (
                  <ChoiceButton
                    key={entry.value}
                    label={entry.label}
                    value={entry.value}
                    active={profileLayout === entry.value}
                    onSelect={setProfileLayout}
                  />
                ))}
              </div>
            </div>

            <div className="field w-full">
              <p className="label">Avatar frame</p>
              <div className="choice-grid">
                {AVATAR_FRAME_OPTIONS.map((entry) => (
                  <ChoiceButton
                    key={entry.value}
                    label={entry.label}
                    value={entry.value}
                    active={avatarFrame === entry.value}
                    onSelect={setAvatarFrame}
                  />
                ))}
              </div>
            </div>

            <div className="field w-full">
              <p className="label">Link style</p>
              <div className="choice-grid">
                {LINK_STYLE_OPTIONS.map((entry) => (
                  <ChoiceButton
                    key={entry.value}
                    label={entry.label}
                    value={entry.value}
                    active={linkStyle === entry.value}
                    onSelect={setLinkStyle}
                  />
                ))}
              </div>
            </div>

            <div
              className={`style-preview public-profile profile-theme-${profileTheme} profile-layout-${profileLayout} avatar-frame-${avatarFrame} link-style-${linkStyle}`}
            >
              <div className="profile-head">
                <div className="avatar-wrap">
                  <img src={avatarPreview || DEFAULT_AVATAR} alt="Style preview avatar" />
                </div>
                <p className="style-preview-name">{previewName}</p>
                <p className="style-preview-handle">@{handle}</p>
              </div>
              <div className="link-list" style={{ marginTop: "10px" }}>
                <div className="link-item">
                  {previewIcon?.icon ? (
                    <img className={`icon${previewIcon.mono ? " mono" : ""}`} src={previewIcon.icon} alt="" aria-hidden="true" />
                  ) : (
                    <span className="icon icon-fallback" aria-hidden="true" />
                  )}
                  <span>
                    <span className="link-title">Main project</span>
                    <span className="link-caption">Primary link style preview</span>
                  </span>
                </div>
                <div className="link-item">
                  <span className="icon icon-fallback" aria-hidden="true" />
                  <span>
                    <span className="link-title">Social profile</span>
                    <span className="link-caption">Template and frame preview</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button className="btn btn-primary" type="submit">
            {previewOnly ? "Apply preview" : "Save profile"}
          </button>
        </form>
      </article>

      <section className="stack">
        <p className="kicker">Your links</p>

        {existingLinks.length === 0 ? <p className="empty">No links yet. Add your first one below.</p> : null}

        {existingLinks.map((link) => (
          <article key={link.id} className="card link-editor-card">
            <form
              action={previewOnly ? undefined : updateLinkAction}
              className="stack link-editor-form"
              encType="multipart/form-data"
              onSubmit={handlePreviewSubmit}
            >
              <input type="hidden" name="id" value={link.id} />
              <input type="hidden" name="return_path" value={returnPath} />
              <input type="hidden" name="image_url" value={link.image_url || ""} />

              <div className="grid grid-2">
                <label className="field">
                  <span className="label">Label</span>
                  <input className="input" name="label" defaultValue={link.label || ""} required maxLength={120} />
                </label>

                <label className="field">
                  <span className="label">URL</span>
                  <input
                    className="input"
                    name="url"
                    type="text"
                    defaultValue={link.url || ""}
                    placeholder="https://..."
                    required
                    maxLength={500}
                  />
                </label>
              </div>

              <div className="grid grid-2">
                <label className="field">
                  <span className="label">Platform</span>
                  <select className="select" name="platform" defaultValue={link.platform || ""}>
                    <option value="">None</option>
                    {LINK_PLATFORM_OPTIONS.map((entry) => (
                      <option key={`existing-${link.id}-${entry.value}`} value={entry.value}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span className="label">Image (optional)</span>
                  <input className="file-input" type="file" name="link_image_file" accept="image/*" />
                </label>
              </div>

              {link.image_url ? (
                <img className="link-image-preview" src={link.image_url} alt={`${link.label} preview`} />
              ) : null}

              <div className="link-editor-actions">
                <label className="link-active-row">
                  <input type="checkbox" name="is_active" defaultChecked={link.is_active !== false} />
                  <span>Visible on profile</span>
                </label>

                <button className="btn btn-primary" type="submit">
                  Save changes
                </button>
              </div>
            </form>

            <form action={previewOnly ? undefined : deleteLinkAction} className="toolbar" onSubmit={handlePreviewSubmit}>
              <input type="hidden" name="id" value={link.id} />
              <input type="hidden" name="return_path" value={returnPath} />
              <button className="btn btn-danger" type="submit">
                Delete link
              </button>
            </form>
          </article>
        ))}

        <article className="card link-editor-card">
          <form
            action={previewOnly ? undefined : addLinkAction}
            className="stack link-editor-form"
            encType="multipart/form-data"
            onSubmit={handlePreviewSubmit}
          >
            <input type="hidden" name="return_path" value={returnPath} />

            <p className="kicker">Add new link</p>

            <div className="grid grid-2">
              <label className="field">
                <span className="label">Label</span>
                <input className="input" name="label" placeholder="My project" required maxLength={120} />
              </label>

              <label className="field">
                <span className="label">URL</span>
                <input className="input" name="url" type="text" placeholder="https://..." required maxLength={500} />
              </label>
            </div>

            <div className="grid grid-2">
              <label className="field">
                <span className="label">Platform</span>
                <select className="select" name="platform" defaultValue="">
                  <option value="">None</option>
                  {LINK_PLATFORM_OPTIONS.map((entry) => (
                    <option key={`new-${entry.value}`} value={entry.value}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="label">Image (optional)</span>
                <input className="file-input" type="file" name="link_image_file" accept="image/*" />
              </label>
            </div>

            <button className="btn btn-primary" type="submit">
              Add link
            </button>
          </form>
        </article>
      </section>
    </section>
  );
}
