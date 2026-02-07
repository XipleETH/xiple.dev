import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container stack" style={{ maxWidth: "560px" }}>
      <section className="card" style={{ padding: "20px" }}>
        <p className="kicker">404</p>
        <h1 className="page-title" style={{ fontSize: "1.7rem", marginTop: "6px" }}>
          Profile not found
        </h1>
        <p className="page-sub">This username does not exist yet.</p>
        <div className="actions" style={{ marginTop: "12px" }}>
          <Link className="btn btn-primary" href="/">
            Go home
          </Link>
          <Link className="btn" href="/auth">
            Claim one
          </Link>
        </div>
      </section>
    </main>
  );
}
