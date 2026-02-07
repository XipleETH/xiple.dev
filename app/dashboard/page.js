import Link from "next/link";
import { redirect } from "next/navigation";

import {
  addLinkAction,
  deleteLinkAction,
  saveProfileAction,
  signOutAction,
  updateLinkAction
} from "@/app/dashboard/actions";
import {
  LINK_KIND_OPTIONS,
  PLATFORM_OPTIONS,
  SOCIAL_OPTIONS
} from "@/lib/constants";
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
    .select("id, username, display_name, tagline, bio, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").insert({ id: user.id });
    const { data: newProfile } = await supabase
      .from("profiles")
      .select("id, username, display_name, tagline, bio, avatar_url")
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

      <section className="card" style={{ padding: "16px" }}>
        <p className="kicker">Profile setup</p>
        <h1 className="page-title" style={{ fontSize: "1.4rem", marginTop: "4px" }}>
          Claim your username
        </h1>
        <p className="page-sub">
          Route format: <code>/username</code>. Use lowercase letters, numbers and underscore.
        </p>

        <form action={saveProfileAction} className="stack" style={{ marginTop: "12px" }}>
          <div className="grid grid-2">
            <div>
              <p className="label">Username</p>
              <input
                className="input"
                name="username"
                defaultValue={profile?.username ?? ""}
                placeholder="xipleeth"
                maxLength={30}
              />
              <p className="help">Reserved words are blocked automatically.</p>
            </div>
            <div>
              <p className="label">Display name</p>
              <input
                className="input"
                name="display_name"
                defaultValue={profile?.display_name ?? ""}
                placeholder="Xiple"
                maxLength={80}
              />
            </div>
          </div>

          <div>
            <p className="label">Tagline</p>
            <input
              className="input"
              name="tagline"
              defaultValue={profile?.tagline ?? ""}
              placeholder="Chadcoder"
              maxLength={120}
            />
          </div>

          <div>
            <p className="label">Bio</p>
            <textarea
              className="textarea"
              name="bio"
              defaultValue={profile?.bio ?? ""}
              placeholder="Shipping apps for PC, Android, Reddit and Web."
              maxLength={280}
            />
          </div>

          <div>
            <p className="label">Avatar URL</p>
            <input
              className="input"
              name="avatar_url"
              defaultValue={profile?.avatar_url ?? ""}
              placeholder="https://..."
            />
          </div>

          <button className="btn btn-primary" type="submit">
            Save profile
          </button>
        </form>
      </section>

      <section className="card" style={{ padding: "16px" }}>
        <p className="kicker">Links</p>
        <h2 className="page-title" style={{ fontSize: "1.2rem", marginTop: "4px" }}>
          Add new link
        </h2>

        <form action={addLinkAction} className="stack" style={{ marginTop: "10px" }}>
          <div className="grid grid-2">
            <div>
              <p className="label">Label</p>
              <input className="input" name="label" placeholder="Darkest Rumble" required maxLength={120} />
            </div>
            <div>
              <p className="label">URL</p>
              <input
                className="input"
                name="url"
                placeholder="https://..."
                required
                type="url"
                maxLength={500}
              />
            </div>
          </div>

          <div className="grid grid-2">
            <div>
              <p className="label">Type</p>
              <select className="select" name="kind" defaultValue="project">
                {LINK_KIND_OPTIONS.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
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
                  {SOCIAL_OPTIONS.map((entry) => (
                    <option key={entry.value} value={entry.value}>
                      {entry.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          <div>
            <p className="label">Position (lower = first)</p>
            <input className="input" type="number" name="position" defaultValue={0} />
          </div>

          <button className="btn btn-primary" type="submit">
            Add link
          </button>
        </form>
      </section>

      <section className="card" style={{ padding: "16px" }}>
        <p className="kicker">Manage links</p>
        <h2 className="page-title" style={{ fontSize: "1.2rem", marginTop: "4px" }}>
          Existing links
        </h2>

        {!links || links.length === 0 ? (
          <p className="empty" style={{ marginTop: "12px" }}>
            No links yet. Add your first one above.
          </p>
        ) : (
          <div className="stack" style={{ marginTop: "12px" }}>
            {links.map((link) => (
              <article key={link.id} className="card" style={{ padding: "12px" }}>
                <form action={updateLinkAction} className="stack">
                  <input type="hidden" name="id" value={link.id} />

                  <div className="grid grid-2">
                    <div>
                      <p className="label">Label</p>
                      <input className="input" name="label" defaultValue={link.label ?? ""} required />
                    </div>
                    <div>
                      <p className="label">URL</p>
                      <input className="input" name="url" defaultValue={link.url ?? ""} type="url" required />
                    </div>
                  </div>

                  <div className="grid grid-2">
                    <div>
                      <p className="label">Type</p>
                      <select className="select" name="kind" defaultValue={link.kind || "project"}>
                        {LINK_KIND_OPTIONS.map((entry) => (
                          <option key={entry.value} value={entry.value}>
                            {entry.label}
                          </option>
                        ))}
                      </select>
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
                          {SOCIAL_OPTIONS.map((entry) => (
                            <option key={entry.value} value={entry.value}>
                              {entry.label}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-2">
                    <div>
                      <p className="label">Position</p>
                      <input className="input" name="position" type="number" defaultValue={link.position ?? 0} />
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "20px" }}>
                      <input type="checkbox" name="is_active" defaultChecked={link.is_active !== false} />
                      Active on public page
                    </label>
                  </div>

                  <div className="toolbar">
                    <button className="btn" type="submit">
                      Save link
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
    </main>
  );
}
