import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <main className="container stack">
      <header className="card topnav">
        <div className="brand">
          hubfol<span>.io</span>
        </div>
        <div className="toolbar">
          {user ? (
            <Link className="btn btn-primary" href="/dashboard">
              Open dashboard
            </Link>
          ) : (
            <Link className="btn btn-primary" href="/auth">
              Start now
            </Link>
          )}
        </div>
      </header>

      <section className="card hero">
        <p className="kicker">Profile Platform Builder</p>
        <h1 className="page-title">Create your own profile page at /username.</h1>
        <p className="page-sub">
          This is the base product behind your current page design. Users can claim usernames,
          add project and social links, and publish a public profile in one flow.
        </p>

        <ul className="feature-list">
          <li>Supabase Auth + Postgres</li>
          <li>RLS-secured profile and links</li>
          <li>Public route structure: <code>/username</code></li>
          <li>Ready for Vercel now, custom domain later</li>
        </ul>

        <div className="actions">
          {user ? (
            <Link className="btn btn-primary" href="/dashboard">
              Go to dashboard
            </Link>
          ) : (
            <Link className="btn btn-primary" href="/auth">
              Sign in with email
            </Link>
          )}
          <Link className="btn" href="/xiple">
            Example profile route
          </Link>
        </div>
      </section>
    </main>
  );
}
