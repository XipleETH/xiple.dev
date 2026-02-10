import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container stack">
      <section className="card auth-card">
        <p className="kicker">404</p>
        <h1 className="page-title">Profile not found</h1>
        <p className="page-sub">This username does not exist yet.</p>
        <div className="actions" style={{ marginTop: "8px" }}>
          <Link className="btn btn-primary" href="/">
            Go home
          </Link>
          <Link className="btn" href="/">
            Claim one
          </Link>
        </div>
      </section>
    </main>
  );
}

