"use client";
import { useState, useEffect } from "react";

// Floating lock button — only visible when not signed in as admin.
// Clicking it opens a password modal. Correct password sets is_admin in
// sessionStorage so the flag survives soft-navigations without re-prompting.
// The actual persistence gating is Supabase — guests just get local-state only.

export default function AdminGate({ session, onAdminUnlock }) {
  const [open, setOpen] = useState(false);
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setUnlocked(sessionStorage.getItem("is_admin") === "1");
  }, []);

  // Once supabase session exists, treat as unlocked too
  const isSignedIn = Boolean(session) || unlocked;
  if (isSignedIn) return null;

  function submit(e) {
    e.preventDefault();
    const adminPwd = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    if (adminPwd && pwd === adminPwd) {
      sessionStorage.setItem("is_admin", "1");
      setUnlocked(true);
      setOpen(false);
      onAdminUnlock?.();
    } else {
      setError(true);
      setPwd("");
      setTimeout(() => setError(false), 1200);
    }
  }

  return (
    <>
      <style>{`
        .al-overlay{position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.55);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif}
        .al-card{width:100%;max-width:360px;margin:0 20px;background:#0d0d0d;border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:36px 32px;box-shadow:0 40px 120px rgba(0,0,0,0.9)}
        .al-title{font-size:18px;font-weight:800;color:#fff;letter-spacing:-.02em;margin-bottom:4px}
        .al-sub{font-size:12px;color:rgba(255,255,255,0.35);font-family:'DM Mono',monospace;margin-bottom:22px}
        .al-field{width:100%;height:48px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:0 16px;font-size:14px;font-family:'Syne',sans-serif;color:#fff;outline:none;transition:border-color .2s;box-sizing:border-box}
        .al-field:focus{border-color:rgba(255,45,85,0.5);box-shadow:0 0 0 3px rgba(255,45,85,0.1)}
        .al-field.err{border-color:rgba(255,45,85,0.7);animation:alShake .4s cubic-bezier(.36,.07,.19,.97)}
        @keyframes alShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
        .al-btn{margin-top:10px;width:100%;height:48px;background:#FF2D55;border:none;border-radius:12px;font-size:14px;font-weight:800;color:#fff;font-family:'Syne',sans-serif;cursor:pointer;transition:background .15s;box-shadow:0 0 24px rgba(255,45,85,0.3)}
        .al-btn:hover{background:#FF3D62}
        .al-err{margin-top:8px;font-size:11px;color:#FF2D55;font-family:'DM Mono',monospace}
        .al-cancel{display:block;margin-top:12px;text-align:center;font-size:11px;color:rgba(255,255,255,0.2);font-family:'DM Mono',monospace;cursor:pointer;border:none;background:none;width:100%;padding:0}
        .al-cancel:hover{color:rgba(255,255,255,0.4)}
        .al-lock-btn{position:fixed;bottom:24px;right:24px;z-index:9997;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);display:grid;place-items:center;cursor:pointer;transition:background .15s,border-color .15s}
        .al-lock-btn:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.15)}
      `}</style>

      {/* subtle lock icon — bottom right */}
      {!open && (
        <button className="al-lock-btn" onClick={() => setOpen(true)} title="Owner sign in">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </button>
      )}

      {open && (
        <div className="al-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="al-card">
            <div className="al-title">Owner access</div>
            <div className="al-sub">Enter your password to enable saving</div>
            <form onSubmit={submit}>
              <input
                type="password"
                className={`al-field${error ? " err" : ""}`}
                placeholder="Password"
                value={pwd}
                onChange={(e) => { setPwd(e.target.value); setError(false); }}
                autoFocus
              />
              {error && <div className="al-err">Incorrect password.</div>}
              <button type="submit" className="al-btn">Sign in →</button>
            </form>
            <button className="al-cancel" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
