"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

function getOptionLabel(options, value) {
  return options.find((entry) => entry.value === value)?.label || value;
}

function SlotControl({ value, options, placeholder, compact = false, onChange }) {
  const icon = value ? getIconBySlug(value) : null;
  const label = value ? getOptionLabel(options, value) : placeholder;

  return (
    <label className={`slot-control${compact ? " compact" : ""}${value ? " filled" : ""}`}>
      <span className="slot-content">
        {icon?.icon ? (
          <img className={`icon${icon.mono ? " mono" : ""}`} src={icon.icon} alt="" aria-hidden="true" />
        ) : (
          <span className="slot-plus" aria-hidden="true">
            +
          </span>
        )}
        <span className="slot-text">{label}</span>
      </span>

      <select
        className="slot-select"
        value={value}
        onChange={(event) => onChange(String(event.target.value || ""))}
      >
        <option value="">{placeholder}</option>
        {options.map((entry) => (
          <option key={entry.value} value={entry.value}>
            {entry.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function DashboardEditor({ profile, links }) {
  const profileFormRef = useRef(null);
  const avatarFileInputRef = useRef(null);
  const profileSlotHostRef = useRef(null);

  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [selectedPlatforms, setSelectedPlatforms] = useState(() =>
    parseProfilePlatforms(profile?.tagline).filter((entry) => PLATFORM_VALUE_SET.has(entry))
  );
  const [newLinkPlatform, setNewLinkPlatform] = useState("");
  const [openProfileSlot, setOpenProfileSlot] = useState(null);
  const [linkPlatformById, setLinkPlatformById] = useState(() =>
    Object.fromEntries((links || []).map((entry) => [entry.id, entry.platform || ""]))
  );

  const previewUsername = String(username || "").trim().replace(/^@/, "").toLowerCase() || "yourname";
  const previewAvatar = String(avatarUrl || "").trim() || "/assets/profile-photo.jpg";
  const profileSlots = useMemo(() => [...selectedPlatforms, ""], [selectedPlatforms]);
  const visibleLinks = links || [];

  function handleProfileSlotChange(index, nextValue) {
    setSelectedPlatforms((current) => {
      const list = [...current];
      const next = String(nextValue || "").trim();

      if (index < list.length) {
        if (!next) {
          list.splice(index, 1);
          return list;
        }

        if (list.includes(next) && list[index] !== next) {
          return list;
        }

        list[index] = next;
        return list;
      }

      if (!next || list.includes(next)) {
        return list;
      }

      list.push(next);
      return list;
    });
  }

  useEffect(() => {
    function handleDocumentPointer(event) {
      if (!profileSlotHostRef.current) {
        return;
      }

      if (!profileSlotHostRef.current.contains(event.target)) {
        setOpenProfileSlot(null);
      }
    }

    document.addEventListener("mousedown", handleDocumentPointer);
    return () => {
      document.removeEventListener("mousedown", handleDocumentPointer);
    };
  }, []);

  function handleAvatarPickClick() {
    avatarFileInputRef.current?.click();
  }

  function handleAvatarFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setAvatarUrl(URL.createObjectURL(file));
    profileFormRef.current?.requestSubmit();
  }

  function handleExistingLinkPlatformChange(linkId, value) {
    setLinkPlatformById((current) => ({
      ...current,
      [linkId]: value
    }));
  }

  return (
    <section className="card preview-editor">
      <form ref={profileFormRef} action={saveProfileAction} className="stack" encType="multipart/form-data">
        <div className="profile-head preview-head">
          <div className="avatar-edit-wrap">
            <div className="avatar-wrap">
              <img src={previewAvatar} alt={`${previewUsername} avatar preview`} />
            </div>
            <button
              type="button"
              className="avatar-edit-btn"
              onClick={handleAvatarPickClick}
              aria-label="Upload avatar image"
              title="Change avatar"
            >
              <img src="/assets/icons/image.svg" alt="" aria-hidden="true" />
            </button>
            <input
              ref={avatarFileInputRef}
              className="sr-only-input"
              type="file"
              name="avatar_file"
              accept="image/*"
              onChange={handleAvatarFileChange}
            />
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

          <input type="hidden" name="avatar_url" value={avatarUrl} />

          <div ref={profileSlotHostRef} className="profile-slot-list">
            {profileSlots.map((value, index) => {
              const icon = value ? getIconBySlug(value) : null;
              const available = PLATFORM_OPTIONS.filter(
                (entry) => entry.value === value || !selectedPlatforms.includes(entry.value)
              );

              return (
                <div key={`profile-slot-${index}-${value || "empty"}`} className="profile-slot-wrap">
                  <button
                    type="button"
                    className={`profile-slot-btn${value ? " filled" : ""}`}
                    onClick={() => setOpenProfileSlot((current) => (current === index ? null : index))}
                    aria-label={value ? `Change platform ${value}` : "Add platform"}
                    title={value ? `Change ${value}` : "Add platform"}
                  >
                    {icon?.icon ? (
                      <img className={`icon${icon.mono ? " mono" : ""}`} src={icon.icon} alt="" aria-hidden="true" />
                    ) : (
                      <span className="slot-plus" aria-hidden="true">
                        +
                      </span>
                    )}
                  </button>

                  {openProfileSlot === index ? (
                    <div className="profile-slot-menu">
                      {available.map((entry) => {
                        const optionIcon = getIconBySlug(entry.value);
                        return (
                          <button
                            key={entry.value}
                            type="button"
                            className={`profile-slot-option${value === entry.value ? " selected" : ""}`}
                            title={entry.label}
                            aria-label={entry.label}
                            onClick={() => {
                              handleProfileSlotChange(index, entry.value);
                              setOpenProfileSlot(null);
                            }}
                          >
                            {optionIcon?.icon ? (
                              <img
                                className={`icon${optionIcon.mono ? " mono" : ""}`}
                                src={optionIcon.icon}
                                alt=""
                                aria-hidden="true"
                              />
                            ) : null}
                          </button>
                        );
                      })}
                      {value ? (
                        <button
                          type="button"
                          className="profile-slot-option remove"
                          onClick={() => {
                            handleProfileSlotChange(index, "");
                            setOpenProfileSlot(null);
                          }}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

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

              return (
                <article key={link.id} className="card link-editor-card">
                  <form action={updateLinkAction} className="stack" encType="multipart/form-data">
                    <input type="hidden" name="id" value={link.id} />

                    <input className="input" name="label" defaultValue={link.label ?? ""} required maxLength={120} />

                    <input className="input" name="url" defaultValue={link.url ?? ""} type="url" required maxLength={500} />
                    <input
                      className="input"
                      name="image_url"
                      defaultValue={link.image_url ?? ""}
                      placeholder="Image URL (optional)"
                      maxLength={500}
                    />
                    <label className="file-row">
                      <span>Upload link image</span>
                      <input className="file-input" type="file" name="link_image_file" accept="image/*" />
                    </label>

                    {link.image_url ? (
                      <img className="link-image-preview" src={link.image_url} alt={`${link.label} preview`} />
                    ) : null}

                    <SlotControl
                      value={selectedPlatform}
                      options={LINK_PLATFORM_OPTIONS}
                      placeholder="Choose platform"
                      compact
                      onChange={(nextValue) => handleExistingLinkPlatformChange(link.id, nextValue)}
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

        <form action={addLinkAction} className="card link-editor-card stack" encType="multipart/form-data">
          <p className="kicker">New Link</p>
          <input className="input" name="label" placeholder="Darkest Rumble" required maxLength={120} />
          <input className="input" name="url" placeholder="https://..." required type="url" maxLength={500} />
          <input className="input" name="image_url" placeholder="Image URL (optional)" maxLength={500} />
          <label className="file-row">
            <span>Upload link image</span>
            <input className="file-input" type="file" name="link_image_file" accept="image/*" />
          </label>

          <SlotControl
            value={newLinkPlatform}
            options={LINK_PLATFORM_OPTIONS}
            placeholder="Choose platform"
            compact
            onChange={setNewLinkPlatform}
          />
          <input type="hidden" name="platform" value={newLinkPlatform} />

          <button className="btn btn-primary" type="submit">
            Add link
          </button>
        </form>
      </section>
    </section>
  );
}
