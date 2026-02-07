import Link from "next/link";

import { signInWithGoogleAction } from "@/app/auth/actions";

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
          Continue with Google
        </h1>
        <p className="page-sub">Use your Google account to create or access your dashboard.</p>

        {message ? <p className="notice ok">{message}</p> : null}
        {error ? <p className="notice err">{error}</p> : null}

        <form action={signInWithGoogleAction} className="stack" style={{ marginTop: "12px" }}>
          <button className="btn btn-primary" type="submit">
            Sign in with Google
          </button>
        </form>
      </section>
    </main>
  );
}
