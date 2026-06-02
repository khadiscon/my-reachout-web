"use client";
import { useState, useEffect } from "react";
import { DemoContext } from "@/lib/demo-context";

export default function DemoGate({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const saved = sessionStorage.getItem("access_type");
    if (saved === "owner" || saved === "guest") setStatus(saved);
    else setStatus("locked");
  }, []);

  function signIn(pwd) {
    const correct = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    if (correct && pwd === correct) {
      sessionStorage.setItem("access_type", "owner");
      setStatus("owner");
      return true;
    }
    return false;
  }

  function continueAsGuest() {
    sessionStorage.setItem("access_type", "guest");
    setStatus("guest");
  }

  if (status === "loading") return null;

  if (status === "owner") {
    return <DemoContext.Provider value={false}>{children}</DemoContext.Provider>;
  }

  if (status === "guest") {
    return <DemoContext.Provider value={true}>{children}</DemoContext.Provider>;
  }

  return <AccessModal onSignIn={signIn} onGuest={continueAsGuest} />;
}

function AccessModal({ onSignIn, onGuest }) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState(false);

  function submit(e) {
    e.preventDefault();
    const ok = onSignIn(pwd);
    if (!ok) {
      setError(true);
      setPwd("");
      setTimeout(() => setError(false), 1200);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&display=swap');
        .ag-overlay{position:fixed;inset:0;z-index:9999;background:#060606;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif}
        .ag-overlay::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 50% 60%,rgba(255,45,85,0.09) 0%,transparent 65%);pointer-events:none}
        .ag-card{position:relative;width:100%;max-width:400px;margin:0 20px;background:#0d0d0d;border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:44px 36px;box-shadow:0 40px 120px rgba(0,0,0,0.9)}
        .ag-icon{width:52px;height:52px;background:#FF2D55;border-radius:16px;display:grid;place-items:center;margin:0 auto 20px;box-shadow:0 0 32px rgba(255,45,85,0.5)}
        .ag-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border:1px solid rgba(255,255,255,0.07);border-radius:99px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:20px;font-family:'DM Mono',monospace}
        .ag-dot{width:5px;height:5px;border-radius:50%;background:#00F5D4;box-shadow:0 0 6px #00F5D4;animation:agPulse 2s infinite}
        @keyframes agPulse{0%,100%{opacity:1}50%{opacity:.4}}
        .ag-title{font-size:22px;font-weight:800;text-align:center;color:#fff;letter-spacing:-.02em}
        .ag-sub{margin-top:8px;font-size:13px;color:rgba(255,255,255,0.4);text-align:center;line-height:1.6;font-family:'DM Mono',monospace;margin-bottom:28px}
        .ag-field{width:100%;height:52px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:0 18px;font-size:15px;font-family:'Syne',sans-serif;color:#fff;outline:none;transition:border-color .2s,box-shadow .2s;box-sizing:border-box}
        .ag-field:focus{border-color:rgba(255,45,85,0.5);box-shadow:0 0 0 3px rgba(255,45,85,0.12)}
        .ag-field.err{border-color:rgba(255,45,85,0.7);animation:agShake .4s cubic-bezier(.36,.07,.19,.97)}
        @keyframes agShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(3px)}}
        .ag-err{margin-top:10px;font-size:12px;color:#FF2D55;text-align:center;font-family:'DM Mono',monospace}
        .ag-btn{margin-top:12px;width:100%;height:52px;background:#FF2D55;border:none;border-radius:14px;font-size:15px;font-weight:800;color:#fff;font-family:'Syne',sans-serif;cursor:pointer;box-shadow:0 0 32px rgba(255,45,85,0.35);transition:transform .15s,box-shadow .15s,background .15s}
        .ag-btn:hover{transform:translateY(-1px);box-shadow:0 0 48px rgba(255,45,85,0.55);background:#FF3D62}
        .ag-divider{display:flex;align-items:center;gap:12px;margin:20px 0}
        .ag-divider-line{flex:1;height:1px;background:rgba(255,255,255,0.07)}
        .ag-divider-text{font-size:11px;color:rgba(255,255,255,0.2);font-family:'DM Mono',monospace;white-space:nowrap}
        .ag-guest-btn{width:100%;height:50px;background:transparent;border:1px solid rgba(255,255,255,0.1);border-radius:14px;font-size:14px;font-weight:800;color:rgba(255,255,255,0.5);font-family:'Syne',sans-serif;cursor:pointer;transition:border-color .2s,color .2s,background .2s}
        .ag-guest-btn:hover{border-color:rgba(255,255,255,0.2);color:rgba(255,255,255,0.8);background:rgba(255,255,255,0.04)}
        .ag-guest-note{margin-top:10px;font-size:11px;color:rgba(255,255,255,0.2);text-align:center;font-family:'DM Mono',monospace;line-height:1.5}
        .ag-back{display:block;margin-top:22px;text-align:center;font-size:12px;color:rgba(255,255,255,0.15);font-family:'DM Mono',monospace;text-decoration:none;transition:color .15s}
        .ag-back:hover{color:rgba(255,255,255,0.4)}
      `}</style>
      <div className="ag-overlay">
        <div className="ag-card" style={{ textAlign: "center" }}>
          <div className="ag-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div className="ag-badge"><span className="ag-dot"/>Live workspace</div>
          <div className="ag-title">Shorts Agency OS</div>
          <div className="ag-sub">Sign in to access your workspace,<br/>or explore as a guest.</div>

          <form onSubmit={submit} style={{ textAlign: "left" }}>
            <input
              type="password"
              className={`ag-field${error ? " err" : ""}`}
              placeholder="Enter password"
              value={pwd}
              onChange={(e) => { setPwd(e.target.value); setError(false); }}
              autoFocus
            />
            {error && <div className="ag-err">Incorrect password — try again.</div>}
            <button type="submit" className="ag-btn">Sign in →</button>
          </form>

          <div className="ag-divider">
            <div className="ag-divider-line"/>
            <div className="ag-divider-text">or</div>
            <div className="ag-divider-line"/>
          </div>

          <button className="ag-guest-btn" onClick={onGuest}>Continue as guest</button>
          <div className="ag-guest-note">No account needed · Changes won't be saved · Limited lead results</div>

          <a href="/" className="ag-back">← Back to homepage</a>
        </div>
      </div>
    </>
  );
}
