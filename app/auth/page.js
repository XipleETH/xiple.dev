import Link from "next/link";

import { signInWithEmailAction } from "@/app/auth/actions";

export default async function AuthPage({ searchParams }) {
  const params = await searchParams;
  const message = params?.message;
  const error = params?.error;

  return (
    <main className="container stack" style={{ maxWidth: "560px" }}>
      <header className="card topnav">
        <div className="brand">
          hubfol<span>.io</span>
        </div>
        <Link className="btn" href="/">
          Back
        </Link>
      </header>

      <section className="card" style={{ padding: "18px" }}>
        <p className="kicker">Auth</p>
        <h1 className="page-title" style={{ fontSize: "1.8rem", marginTop: "6px" }}>
          Sign in with magic link
        </h1>
        <p className="page-sub">No password for now. Supabase sends a secure login email.</p>

        {message ? <p className="notice ok">{message}</p> : null}
        {error ? <p className="notice err">{error}</p> : null}

        <form action={signInWithEmailAction} className="stack" style={{ marginTop: "12px" }}>
          <div>
            <p className="label">Email</p>
            <input
              className="input"
              type="email"
              name="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <button className="btn btn-primary" type="submit">
            Send magic link
          </button>
        </form>
      </section>
    </main>
  );
}
