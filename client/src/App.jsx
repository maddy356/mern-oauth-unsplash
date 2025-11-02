import { useEffect, useState } from "react";

const SERVER = import.meta.env.VITE_SERVER_URL;

function LoginButtons({ user }) {
  if (user) {
    return <span className="badge">Logged in: {user.name} ({user.provider})</span>;
  }
  return (
    <div className="btns">
      <a className="btn" href={`${SERVER}/auth/google`}>Login with Google</a>
    </div>
  );
}

function TopBanner({ top }) {
  if (!top?.length) return null;
  return (
    <div className="banner">
      <strong>Top Searches: </strong>
      {top.map((t, i) => (
        <span key={i} className="chip">{t.term} ({t.count})</span>
      ))}
    </div>
  );
}

function History({ history }) {
  if (!history?.length) return null;
  return (
    <div className="history">
      <h3>Your Recent Searches</h3>
      <ul>
        {history.map((h, i) => (
          <li key={i}>
            <code>{h.term}</code>
            <small> — {new Date(h.timestamp).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ImageGrid({ images, selected, toggle }) {
  if (!images?.length) return null;
  return (
    <div className="grid">
      {images.map((img) => (
        <label key={img.id} className="card">
          <input
            type="checkbox"
            checked={!!selected[img.id]}
            onChange={() => toggle(img.id)}
          />
          <img src={img.thumb} alt={img.alt} />
        </label>
      ))}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [top, setTop] = useState([]);
  const [term, setTerm] = useState("");
  const [message, setMessage] = useState("");
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState({});
  const [history, setHistory] = useState([]);

  // include credentials so session cookie passes
  const fetchWithCreds = (path, options = {}) =>
    fetch(`${SERVER}${path}`, {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

  useEffect(() => {
    fetchWithCreds("/api/me").then((r) => r.json()).then((d) => setUser(d.user));
    fetchWithCreds("/api/top-searches").then((r) => r.json()).then((d) => setTop(d.top || []));
  }, []);

  const doSearch = async (e) => {
    e.preventDefault();
    setMessage("");
    setImages([]);
    setSelected({});
    const r = await fetchWithCreds("/api/search", {
      method: "POST",
      body: JSON.stringify({ term })
    });
    const d = await r.json();
    if (!r.ok) {
      setMessage(d.error || "Search failed");
      return;
    }
    setMessage(d.message);
    setImages(d.images || []);
    // refresh history after each search
    fetchWithCreds("/api/history").then((r) => r.json()).then((h) => setHistory(h.history || []));
  };

  const toggle = (id) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const logout = async () => {
    await fetchWithCreds("/auth/logout", { method: "POST" });
    setUser(null);
    setHistory([]);
    setImages([]);
    setSelected({});
  };

  useEffect(() => {
    if (user) {
      fetchWithCreds("/api/history").then((r) => r.json()).then((h) => setHistory(h.history || []));
    }
  }, [user]);

  const selectedCount = Object.values(selected).filter(Boolean).length;

  return (
    <div className="container">
      <header className="header">
        <h1>Image Search (MERN + OAuth + Unsplash)</h1>
        <div className="right">
          <LoginButtons user={user} />
          {user && <button className="btn outline" onClick={logout}>Logout</button>}
        </div>
      </header>

      <TopBanner top={top} />

      <section className="search">
        <form onSubmit={doSearch}>
          <input
            placeholder="Search images (requires login)"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <button className="btn" disabled={!term}>Search</button>
        </form>
        {message && <p className="muted">{message}</p>}
        {images.length > 0 && (
          <p className="counter"><strong>Selected:</strong> {selectedCount} images</p>
        )}
      </section>

      <ImageGrid images={images} selected={selected} toggle={toggle} />

      <History history={history} />

      <footer className="footer">
        <small>Built for assignment — MERN + Passport OAuth + Unsplash</small>
      </footer>

      <style>{`
        :root { color-scheme: light dark; }
        * { box-sizing: border-box; }
        body, #root, .container { margin:0; min-height:100vh; font-family: Inter, system-ui, Arial; }
        .container { max-width: 1100px; margin: 0 auto; padding: 1.25rem; }
        .header { display:flex; align-items:center; justify-content:space-between; gap:1rem; }
        .right { display:flex; align-items:center; gap:.5rem; }
        .btns { display:flex; gap:.5rem; flex-wrap: wrap; }
        .btn { padding:.6rem .9rem; border:1px solid currentColor; border-radius:.6rem; text-decoration:none; display:inline-block; }
        .btn.outline { background:transparent; }
        .badge { padding:.4rem .6rem; border:1px solid currentColor; border-radius:.6rem; }
        .banner { margin:1rem 0; padding:.75rem; border:1px dashed currentColor; border-radius:.75rem; display:flex; gap:.5rem; flex-wrap:wrap; align-items:center;}
        .chip { padding:.25rem .5rem; border:1px solid currentColor; border-radius:1rem; }
        .search { margin:1rem 0; }
        input { padding:.6rem .7rem; border:1px solid currentColor; border-radius:.6rem; width: 280px; margin-right:.5rem; }
        .muted { opacity:.8; }
        .counter { margin:.5rem 0 0; }
        .grid { margin:1rem 0 2rem; display:grid; grid-template-columns: repeat(4, 1fr); gap:.75rem; }
        .card { position:relative; display:block; border-radius:.75rem; overflow:hidden; border:1px solid currentColor; }
        .card input { position:absolute; top:.5rem; left:.5rem; width:1.1rem; height:1.1rem; z-index:2; }
        .card img { display:block; width:100%; height:220px; object-fit:cover; }
        .history { margin: 2rem 0; }
        .history ul { list-style:none; padding:0; display:grid; gap:.35rem; }
        .footer { margin-top:2rem; text-align:center; opacity:.7; }
        @media (max-width: 900px) {
          .grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
