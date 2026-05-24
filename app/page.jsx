import Link from "next/link";

export const metadata = {
  title: "Shorts Agency OS — Close More. Faster.",
  description: "The only CRM engineered for agencies turning long-form content into Shorts, Reels, and TikToks. AI finds the gap, scores the opportunity, and writes the DM.",
};

export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap');

        .land * { box-sizing: border-box; margin: 0; padding: 0; }
        .land {
          background: #030303;
          color: #FAFAF8;
          font-family: 'Syne', sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
          min-height: 100vh;
        }
        .land a { text-decoration: none; color: inherit; }

        /* noise */
        .land::before {
          content: '';
          position: fixed; inset: 0; z-index: 9999;
          pointer-events: none; opacity: 0.028;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 150px;
        }

        /* nav */
        .l-nav {
          position: fixed; inset-x: 0; top: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 40px; height: 64px;
          border-bottom: 1px solid rgba(250,250,248,0.07);
          background: rgba(3,3,3,0.88);
          backdrop-filter: blur(20px);
        }
        .l-nav-logo { display: flex; align-items: center; gap: 12px; }
        .l-nav-icon {
          width: 36px; height: 36px; background: #FF2D55;
          border-radius: 10px; display: grid; place-items: center;
          box-shadow: 0 0 28px rgba(255,45,85,0.5); flex-shrink: 0;
        }
        .l-nav-name { font-size: 15px; font-weight: 800; letter-spacing: -0.02em; }
        .l-nav-cta {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 0 20px; height: 40px;
          background: #FAFAF8; color: #030303;
          border-radius: 99px; font-size: 13px; font-weight: 800;
          transition: transform 0.15s, box-shadow 0.15s;
          font-family: 'Syne', sans-serif;
        }
        .l-nav-cta:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(255,255,255,0.15); }

        /* hero */
        .l-hero {
          min-height: 100vh;
          padding: 120px 40px 80px;
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 60px; align-items: center;
          max-width: 1400px; margin: 0 auto; position: relative;
        }
        .l-hero::before {
          content: ''; position: absolute;
          top: 10%; left: -20%;
          width: 700px; height: 700px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,45,85,0.09) 0%, transparent 70%);
          pointer-events: none;
        }
        .l-hero::after {
          content: ''; position: absolute;
          bottom: 5%; right: -10%;
          width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(0,245,212,0.07) 0%, transparent 70%);
          pointer-events: none;
        }
        .l-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px;
          border: 1px solid rgba(250,250,248,0.07); border-radius: 99px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          color: rgba(250,250,248,0.38); margin-bottom: 32px;
          animation: l-fadeUp 0.6s ease both;
        }
        .l-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #00F5D4; box-shadow: 0 0 8px #00F5D4;
          animation: l-pulse 2s infinite;
        }
        @keyframes l-pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes l-fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
        @keyframes l-floatA { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
        @keyframes l-floatB { 0%,100% { transform:translateY(0); } 50% { transform:translateY(6px); } }
        @keyframes l-ticker { from { transform:translateX(0); } to { transform:translateX(-50%); } }

        .l-h1 {
          font-size: clamp(54px,6vw,96px); font-weight: 800;
          line-height: 0.95; letter-spacing: -0.04em;
          animation: l-fadeUp 0.6s 0.1s ease both;
        }
        .l-h1 em { font-style: italic; font-family: 'Instrument Serif', serif; color: #FF2D55; }
        .l-h1 .l-outline { -webkit-text-stroke: 1.5px #FAFAF8; color: transparent; }
        .l-sub {
          margin-top: 28px; font-size: 17px; line-height: 1.7;
          color: rgba(250,250,248,0.38); max-width: 440px;
          animation: l-fadeUp 0.6s 0.2s ease both;
        }
        .l-actions {
          margin-top: 40px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
          animation: l-fadeUp 0.6s 0.3s ease both;
        }
        .l-btn-p {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 0 28px; height: 56px; background: #FF2D55;
          border-radius: 16px; font-size: 15px; font-weight: 800; color: #FAFAF8;
          box-shadow: 0 0 40px rgba(255,45,85,0.4);
          transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
          font-family: 'Syne', sans-serif;
        }
        .l-btn-p:hover { transform: translateY(-2px); box-shadow: 0 0 60px rgba(255,45,85,0.55); background: #FF4167; }
        .l-btn-s {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 0 24px; height: 56px;
          border: 1px solid rgba(250,250,248,0.07); border-radius: 16px;
          font-size: 15px; font-weight: 700; color: rgba(250,250,248,0.38);
          transition: color 0.15s, border-color 0.15s;
          font-family: 'Syne', sans-serif;
        }
        .l-btn-s:hover { color: #FAFAF8; border-color: rgba(250,250,248,0.2); }
        .l-proof {
          margin-top: 48px; display: flex; align-items: center; gap: 20px;
          animation: l-fadeUp 0.6s 0.4s ease both;
        }
        .l-avs { display: flex; }
        .l-av {
          width: 32px; height: 32px; border-radius: 50%;
          border: 2px solid #030303; display: grid; place-items: center;
          font-size: 11px; font-weight: 800; margin-left: -8px;
        }
        .l-av:first-child { margin-left: 0; }
        .l-proof-text { font-size: 13px; color: rgba(250,250,248,0.38); line-height: 1.5; }
        .l-proof-text strong { color: #FAFAF8; }

        /* mockup */
        .l-mock-wrap {
          position: relative; z-index: 1;
          animation: l-fadeUp 0.7s 0.2s ease both;
          transition: transform 0.6s ease;
        }
        .l-mock {
          background: #0D0D0D;
          border: 1px solid rgba(255,255,255,0.09); border-radius: 20px; overflow: hidden;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.04), 0 40px 100px rgba(0,0,0,0.8), 0 0 80px rgba(255,45,85,0.08);
        }
        .l-mock-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.03);
        }
        .l-dots { display: flex; gap: 6px; }
        .l-dots span { width: 10px; height: 10px; border-radius: 50%; }
        .l-mock-title { font-family: 'DM Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.3); letter-spacing: 0.05em; }
        .l-pills { display: flex; gap: 4px; }
        .l-pill { padding: 4px 10px; border-radius: 99px; font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; }
        .l-pill.on { background: rgba(255,255,255,0.12); color: #FAFAF8; }
        .l-pill.off { color: rgba(255,255,255,0.3); }
        .l-mock-body { display: grid; grid-template-columns: 1fr 200px; }
        .l-mock-main { padding: 16px; border-right: 1px solid rgba(255,255,255,0.06); }

        .l-lead {
          background: linear-gradient(135deg, rgba(0,245,212,0.06), transparent 60%), rgba(255,255,255,0.04);
          border: 1px solid rgba(0,245,212,0.15); border-radius: 12px; padding: 14px; margin-bottom: 10px;
        }
        .l-lead-hd { display: flex; align-items: flex-start; gap: 10px; }
        .l-av2 {
          width: 38px; height: 38px; border-radius: 9px;
          display: grid; place-items: center;
          font-size: 13px; font-weight: 800; color: white; flex-shrink: 0;
        }
        .l-lead-name { font-size: 13px; font-weight: 800; line-height: 1.2; }
        .l-lead-sub { font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 2px; font-family: 'DM Mono', monospace; }
        .l-score { font-family: 'DM Mono', monospace; font-size: 22px; font-weight: 500; line-height: 1; }
        .l-score-lbl { font-size: 9px; text-align: right; margin-top: 2px; color: rgba(255,255,255,0.35); font-family: 'DM Mono', monospace; }
        .l-chips { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 10px; }
        .l-chip { padding: 2px 8px; border-radius: 99px; font-size: 9px; font-weight: 700; font-family: 'DM Mono', monospace; }
        .l-bars { margin-top: 10px; display: grid; gap: 5px; }
        .l-br { display: flex; align-items: center; gap: 6px; }
        .l-br-lbl { font-size: 9px; color: rgba(255,255,255,0.35); width: 80px; font-family: 'DM Mono', monospace; }
        .l-br-trk { flex: 1; height: 4px; background: rgba(255,255,255,0.07); border-radius: 99px; overflow: hidden; }
        .l-br-fill { height: 100%; border-radius: 99px; }
        .l-sm {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; padding: 11px; margin-bottom: 8px;
          display: flex; align-items: center; justify-content: space-between; gap: 8px;
        }
        .l-sm-av { width: 28px; height: 28px; border-radius: 7px; display: grid; place-items: center; font-size: 10px; font-weight: 800; color: white; flex-shrink: 0; }
        .l-sm-name { font-size: 11px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .l-sm-sub { font-size: 9px; color: rgba(255,255,255,0.35); margin-top: 2px; font-family: 'DM Mono', monospace; }
        .l-stage { padding: 2px 8px; border-radius: 99px; font-size: 9px; font-weight: 700; font-family: 'DM Mono', monospace; flex-shrink: 0; }

        .l-mock-side { padding: 14px; }
        .l-met { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 9px; padding: 10px; margin-bottom: 8px; }
        .l-met-lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: rgba(255,255,255,0.35); font-family: 'DM Mono', monospace; }
        .l-met-val { font-family: 'DM Mono', monospace; font-size: 20px; font-weight: 500; margin-top: 4px; }
        .l-gen-btn {
          width: 100%; background: #FF2D55; border-radius: 8px; height: 32px;
          font-size: 10px; font-weight: 800; color: white;
          display: flex; align-items: center; justify-content: center; gap: 5px;
          margin-top: 10px; box-shadow: 0 0 20px rgba(255,45,85,0.35);
          border: none; cursor: pointer; font-family: 'Syne', sans-serif;
        }

        .l-float {
          position: absolute; background: rgba(3,3,3,0.9);
          border: 1px solid rgba(255,255,255,0.1); border-radius: 12px;
          padding: 10px 14px; backdrop-filter: blur(20px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.5); white-space: nowrap;
        }
        .l-float-1 { bottom: -20px; left: -30px; animation: l-floatA 3s ease-in-out infinite; }
        .l-float-2 { top: 40px; right: -24px; animation: l-floatB 3.5s ease-in-out infinite; }
        .l-fl-lbl { font-size: 10px; color: rgba(255,255,255,0.4); font-family: 'DM Mono', monospace; }
        .l-fl-val { font-size: 15px; font-weight: 800; margin-top: 2px; }
        .l-fl-sub { font-size: 10px; color: rgba(255,255,255,0.35); margin-top: 2px; font-family: 'DM Mono', monospace; }

        /* ticker */
        .l-ticker {
          border-top: 1px solid rgba(250,250,248,0.07); border-bottom: 1px solid rgba(250,250,248,0.07);
          padding: 14px 0; overflow: hidden; background: rgba(255,45,85,0.03);
        }
        .l-ticker-track { display: flex; width: max-content; animation: l-ticker 28s linear infinite; }
        .l-ticker-item {
          display: inline-flex; align-items: center; gap: 10px; padding: 0 32px;
          font-size: 13px; font-weight: 700; color: rgba(250,250,248,0.38);
          white-space: nowrap; font-family: 'DM Mono', monospace;
        }
        .l-ticker-item strong { color: #FF2D55; }

        /* stats */
        .l-stats-wrap { border-top: 1px solid rgba(250,250,248,0.07); border-bottom: 1px solid rgba(250,250,248,0.07); }
        .l-stats {
          max-width: 1400px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(4,1fr);
          gap: 1px; background: rgba(250,250,248,0.07);
        }
        .l-stat { background: #030303; padding: 48px 36px; }
        .l-stat-n { font-family: 'DM Mono', monospace; font-size: clamp(40px,5vw,72px); font-weight: 500; line-height: 1; letter-spacing: -0.03em; }
        .l-stat-lbl { margin-top: 12px; font-size: 13px; color: rgba(250,250,248,0.38); line-height: 1.5; }

        /* sections */
        .l-sec { max-width: 1400px; margin: 0 auto; padding: 100px 40px; }
        .l-tag { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #FF2D55; font-family: 'DM Mono', monospace; margin-bottom: 20px; }
        .l-sec-h { font-size: clamp(36px,4.5vw,64px); font-weight: 800; line-height: 1.05; letter-spacing: -0.03em; }
        .l-sec-h em { font-style: italic; font-family: 'Instrument Serif', serif; }
        .l-sec-p { font-size: 17px; line-height: 1.7; color: rgba(250,250,248,0.38); max-width: 520px; margin-top: 20px; }

        /* pvs */
        .l-pvs { margin-top: 60px; display: grid; gap: 2px; background: rgba(250,250,248,0.07); }
        .l-pvs-hd { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; background: rgba(250,250,248,0.07); }
        .l-pvs-col { background: #030303; padding: 14px 24px; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; display: flex; align-items: center; gap: 8px; }
        .l-pvs-row { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; background: rgba(250,250,248,0.07); }
        .l-pvs-cell {
          background: #030303; padding: 22px 24px;
          display: flex; align-items: flex-start; gap: 14px;
          font-size: 15px; line-height: 1.5; transition: background 0.2s;
        }
        .l-pvs-cell:hover { background: rgba(255,255,255,0.02); }

        /* steps */
        .l-steps-intro { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: end; }
        .l-steps { margin-top: 60px; display: grid; grid-template-columns: repeat(4,1fr); gap: 2px; background: rgba(250,250,248,0.07); }
        .l-step { background: #030303; padding: 32px 28px; position: relative; overflow: hidden; transition: background 0.2s; }
        .l-step:hover { background: rgba(255,255,255,0.02); }
        .l-step::after { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
        .l-step-n { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: 0.1em; color: rgba(255,255,255,0.3); margin-bottom: 20px; }
        .l-step-ico { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; margin-bottom: 20px; }
        .l-step-t { font-size: 22px; font-weight: 800; margin-bottom: 14px; }
        .l-step-b { font-size: 14px; line-height: 1.65; color: rgba(250,250,248,0.38); }

        /* score section */
        .l-score-sec { background: rgba(255,45,85,0.04); border-top: 1px solid rgba(255,45,85,0.12); border-bottom: 1px solid rgba(255,45,85,0.12); padding: 100px 40px; }
        .l-score-inner { max-width: 1400px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .l-dial-wrap { position: relative; width: 220px; height: 220px; flex-shrink: 0; }
        .l-dial-num { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .l-dial-n { font-family: 'DM Mono', monospace; font-size: 48px; font-weight: 500; color: #FF2D55; line-height: 1; }
        .l-dial-lbl { font-size: 11px; color: rgba(255,255,255,0.35); font-family: 'DM Mono', monospace; margin-top: 4px; }
        .l-legend { margin-left: 32px; display: grid; gap: 12px; }
        .l-leg-row { display: flex; align-items: center; gap: 10px; }
        .l-leg-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .l-leg-t strong { display: block; font-weight: 700; font-size: 14px; }
        .l-leg-t span { color: rgba(250,250,248,0.38); font-size: 12px; }
        .l-rule-box { margin-top: 32px; padding: 24px; border: 1px solid rgba(255,45,85,0.2); border-radius: 16px; background: rgba(255,45,85,0.05); }
        .l-rule-box p { font-size: 15px; line-height: 1.7; color: rgba(250,250,248,0.38); }
        .l-rule-box strong { color: #FAFAF8; }

        /* features */
        .l-feats { margin-top: 60px; display: grid; grid-template-columns: repeat(3,1fr); gap: 2px; background: rgba(250,250,248,0.07); }
        .l-feat { background: #030303; padding: 36px 32px; position: relative; overflow: hidden; transition: background 0.2s; }
        .l-feat:hover { background: rgba(255,255,255,0.02); }
        .l-feat-n { position: absolute; top: 24px; right: 24px; font-family: 'DM Mono', monospace; font-size: 72px; font-weight: 500; color: rgba(255,255,255,0.03); line-height: 1; user-select: none; }
        .l-feat-ico { width: 48px; height: 48px; border-radius: 14px; display: grid; place-items: center; margin-bottom: 24px; }
        .l-feat-t { font-size: 20px; font-weight: 800; margin-bottom: 12px; }
        .l-feat-b { font-size: 14px; line-height: 1.65; color: rgba(250,250,248,0.38); }
        .l-feat-pre { margin-top: 24px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 12px; font-family: 'DM Mono', monospace; font-size: 10px; }
        .l-fp-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .l-fp-row:last-child { border-bottom: none; }
        .l-fp-name { color: rgba(255,255,255,0.7); }

        /* testimonials */
        .l-tests { display: grid; grid-template-columns: repeat(3,1fr); gap: 2px; background: rgba(250,250,248,0.07); margin-top: 60px; }
        .l-test { background: #030303; padding: 32px 28px; transition: background 0.2s; }
        .l-test:hover { background: rgba(255,255,255,0.02); }
        .l-stars { display: flex; gap: 4px; margin-bottom: 18px; color: #FFB703; font-size: 14px; }
        .l-quote { font-size: 16px; line-height: 1.65; font-style: italic; font-family: 'Instrument Serif', serif; margin-bottom: 24px; }
        .l-tauth { display: flex; align-items: center; gap: 12px; }
        .l-tav { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; font-weight: 800; color: white; flex-shrink: 0; }
        .l-tname { font-size: 13px; font-weight: 700; }
        .l-trole { font-size: 12px; color: rgba(250,250,248,0.38); margin-top: 2px; font-family: 'DM Mono', monospace; }

        /* cta */
        .l-cta { padding: 100px 40px 120px; position: relative; overflow: hidden; }
        .l-cta-glow { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: 800px; height: 400px; border-radius: 50%; background: radial-gradient(ellipse, rgba(255,45,85,0.12) 0%, transparent 70%); pointer-events: none; }
        .l-cta-inner { max-width: 800px; margin: 0 auto; text-align: center; position: relative; z-index: 1; }
        .l-cta-h { font-size: clamp(44px,6vw,88px); font-weight: 800; line-height: 1; letter-spacing: -0.04em; }
        .l-cta-h em { font-style: italic; font-family: 'Instrument Serif', serif; color: #FF2D55; }
        .l-cta-sub { margin-top: 20px; font-size: 17px; color: rgba(250,250,248,0.38); }
        .l-cta-acts { margin-top: 44px; display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }
        .l-cta-note { margin-top: 20px; font-size: 12px; color: rgba(255,255,255,0.2); font-family: 'DM Mono', monospace; }

        /* footer */
        .l-footer { border-top: 1px solid rgba(250,250,248,0.07); padding: 32px 40px; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
        .l-footer-logo { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 800; color: rgba(255,255,255,0.4); }
        .l-footer-icon { width: 28px; height: 28px; background: #FF2D55; border-radius: 8px; display: grid; place-items: center; }
        .l-footer-tag { font-size: 12px; color: rgba(255,255,255,0.2); font-family: 'DM Mono', monospace; }

        /* scroll reveal */
        .rv { opacity: 0; transform: translateY(28px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .rv.vis { opacity: 1; transform: none; }
        .rv.d1 { transition-delay: 0.08s; }
        .rv.d2 { transition-delay: 0.16s; }
        .rv.d3 { transition-delay: 0.24s; }

        @media (max-width:1100px) {
          .l-hero { grid-template-columns: 1fr; }
          .l-mock-wrap { display: none; }
          .l-steps { grid-template-columns: 1fr 1fr; }
          .l-stats { grid-template-columns: 1fr 1fr; }
          .l-score-inner { grid-template-columns: 1fr; gap: 40px; }
          .l-steps-intro { grid-template-columns: 1fr; }
        }
        @media (max-width:700px) {
          .l-nav { padding: 0 20px; }
          .l-hero { padding: 100px 20px 60px; }
          .l-sec { padding: 70px 20px; }
          .l-feats { grid-template-columns: 1fr; }
          .l-tests { grid-template-columns: 1fr; }
          .l-pvs-row { grid-template-columns: 1fr; }
          .l-pvs-hd { grid-template-columns: 1fr; }
          .l-steps { grid-template-columns: 1fr; }
          .l-stats { grid-template-columns: 1fr 1fr; }
          .l-footer { padding: 24px 20px; flex-direction: column; align-items: flex-start; }
          .l-cta { padding: 70px 20px; }
          .l-score-sec { padding: 70px 20px; }
        }
      `}</style>

      <div className="land">
        {/* NAV */}
        <nav className="l-nav">
          <Link href="/" className="l-nav-logo">
            <div className="l-nav-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <span className="l-nav-name">Shorts Agency OS</span>
          </Link>
          <Link href="/app" className="l-nav-cta">
            Open workspace
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
        </nav>

        {/* HERO */}
        <div style={{maxWidth:"1400px",margin:"0 auto"}}>
          <div className="l-hero">
            <div style={{position:"relative",zIndex:1}}>
              <div className="l-badge"><span className="l-badge-dot"/> Built for short-form content agencies</div>
              <h1 className="l-h1">Find leads.<br/><em>Score them.</em><br/><span className="l-outline">Close faster.</span></h1>
              <p className="l-sub">The only CRM engineered for agencies turning long-form content into Shorts, Reels, and TikToks. AI finds the gap, scores the opportunity, and writes the DM — all from one dark workspace.</p>
              <div className="l-actions">
                <Link href="/app" className="l-btn-p">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  Open workspace — free
                </Link>
                <a href="#how-it-works" className="l-btn-s">
                  See how it works
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </a>
              </div>
              <div className="l-proof">
                <div className="l-avs">
                  <span className="l-av" style={{background:"linear-gradient(135deg,#FF2D55,#FF9500)"}}>JR</span>
                  <span className="l-av" style={{background:"linear-gradient(135deg,#00F5D4,#007AFF)"}}>KM</span>
                  <span className="l-av" style={{background:"linear-gradient(135deg,#16FF7A,#30D158)"}}>AS</span>
                  <span className="l-av" style={{background:"linear-gradient(135deg,#FFB703,#FF6B35)"}}>TL</span>
                  <span className="l-av" style={{background:"linear-gradient(135deg,#BF5AF2,#FF2D55)"}}>PW</span>
                </div>
                <div className="l-proof-text"><strong>340+ agencies</strong> closed their first deal<br/>within 72 hours of using the tool</div>
              </div>
            </div>

            {/* MOCKUP */}
            <div className="l-mock-wrap" id="mockup-wrap" style={{position:"relative"}}>
              <div className="l-mock">
                <div className="l-mock-bar">
                  <div className="l-dots"><span style={{background:"#FF5F57"}}/><span style={{background:"#FFBD2E"}}/><span style={{background:"#28CA41"}}/></div>
                  <span className="l-mock-title">shorts-agency-os / workspace</span>
                  <div className="l-pills"><span className="l-pill on">Leads</span><span className="l-pill off">Find</span><span className="l-pill off">Close</span></div>
                </div>
                <div className="l-mock-body">
                  <div className="l-mock-main">
                    <div className="l-lead">
                      <div className="l-lead-hd">
                        <div className="l-av2" style={{background:"linear-gradient(135deg,#FF2D55,#FF9500)"}}>FL</div>
                        <div style={{minWidth:0,flex:1}}>
                          <div className="l-lead-name">Founders Lab Podcast</div>
                          <div className="l-lead-sub">@founderslabpod · business podcast</div>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div className="l-score" style={{color:"#00F5D4"}}>8.4</div>
                          <div className="l-score-lbl">Hot lead</div>
                        </div>
                      </div>
                      <div className="l-chips">
                        <span className="l-chip" style={{background:"rgba(255,45,85,0.15)",color:"#FF2D55"}}>42.8K YT subs</span>
                        <span className="l-chip" style={{background:"rgba(0,245,212,0.12)",color:"#00F5D4"}}>8.7K IG</span>
                        <span className="l-chip" style={{background:"rgba(255,183,3,0.12)",color:"#FFB703"}}>No Maps</span>
                        <span className="l-chip" style={{background:"rgba(22,255,122,0.12)",color:"#16FF7A"}}>18 long videos</span>
                      </div>
                      <div className="l-bars">
                        {[["Short-Form Gap","90%","#00F5D4","9"],["Money Signal","80%","#FFB703","8"],["Urgency","80%","#FF2D55","8"]].map(([lbl,w,c,v])=>(
                          <div key={lbl} className="l-br">
                            <span className="l-br-lbl">{lbl}</span>
                            <div className="l-br-trk"><div className="l-br-fill" style={{width:w,background:c}}/></div>
                            <span style={{fontSize:"9px",fontFamily:"'DM Mono',monospace",color:c,width:"16px",textAlign:"right"}}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="l-sm">
                      <div className="l-sm-av" style={{background:"linear-gradient(135deg,#00F5D4,#007AFF)"}}>FF</div>
                      <div style={{minWidth:0,flex:1}}><div className="l-sm-name">Forge Fitness Austin</div><div className="l-sm-sub">@forgefitnessatx · 15.3K followers</div></div>
                      <div style={{display:"flex",alignItems:"center",gap:"8px",flexShrink:0}}>
                        <span style={{fontFamily:"'DM Mono',monospace",fontSize:"14px",fontWeight:500,color:"#FFB703"}}>7.2</span>
                        <span className="l-stage" style={{background:"rgba(255,183,3,0.12)",color:"#FFB703"}}>Contacted</span>
                      </div>
                    </div>
                    <div className="l-sm">
                      <div className="l-sm-av" style={{background:"linear-gradient(135deg,#16FF7A,#30D158)"}}>MO</div>
                      <div style={{minWidth:0,flex:1}}><div className="l-sm-name">Maya Ops Daily</div><div className="l-sm-sub">@mayaopsdaily · 22.1K on X</div></div>
                      <div style={{display:"flex",alignItems:"center",gap:"8px",flexShrink:0}}>
                        <span style={{fontFamily:"'DM Mono',monospace",fontSize:"14px",fontWeight:500,color:"#00F5D4"}}>8.9</span>
                        <span className="l-stage" style={{background:"rgba(0,245,212,0.1)",color:"#00F5D4"}}>Booked</span>
                      </div>
                    </div>
                  </div>
                  <div className="l-mock-side">
                    {[["Hot Leads","12","#00F5D4"],["Reply Rate","34%","#FFB703"],["Closed Revenue","$14.2K","#16FF7A"]].map(([l,v,c])=>(
                      <div key={l} className="l-met"><div className="l-met-lbl">{l}</div><div className="l-met-val" style={{color:c}}>{v}</div></div>
                    ))}
                    <button className="l-gen-btn">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      Generate DM
                    </button>
                  </div>
                </div>
              </div>
              <div className="l-float l-float-1"><div className="l-fl-lbl">NEW MESSAGE</div><div className="l-fl-val" style={{color:"#00F5D4"}}>Reply received</div><div className="l-fl-sub">@founderslabpod · 3 min ago</div></div>
              <div className="l-float l-float-2"><div className="l-fl-lbl">AI SCORED</div><div className="l-fl-val" style={{color:"#FF2D55"}}>8.4 / 10</div><div className="l-fl-sub">Hot lead — generate DM</div></div>
            </div>
          </div>
        </div>

        {/* TICKER */}
        <div className="l-ticker">
          <div className="l-ticker-track">
            {[...Array(2)].map((_,i)=>(
              <span key={i} style={{display:"contents"}}>
                <span className="l-ticker-item">18 long videos → <strong>1 Short</strong> → money left on the table <span style={{color:"rgba(250,250,248,0.07)"}}>·</span></span>
                <span className="l-ticker-item">42K YouTube subs → <strong>0 Reels</strong> → your pitch writes itself <span style={{color:"rgba(250,250,248,0.07)"}}>·</span></span>
                <span className="l-ticker-item">Score 8.4 → <strong>generate DM</strong> → reply in 4 hours <span style={{color:"rgba(250,250,248,0.07)"}}>·</span></span>
                <span className="l-ticker-item">184 Google reviews → <strong>no short-form content</strong> → easiest close of the week <span style={{color:"rgba(250,250,248,0.07)"}}>·</span></span>
                <span className="l-ticker-item">Below <strong>7.0?</strong> → AI blocked → don&apos;t waste the credit <span style={{color:"rgba(250,250,248,0.07)"}}>·</span></span>
                <span className="l-ticker-item">Booked stage → <strong>deal value modal fires</strong> → revenue tracked automatically <span style={{color:"rgba(250,250,248,0.07)"}}>·</span></span>
              </span>
            ))}
          </div>
        </div>

        {/* STATS */}
        <div className="l-stats-wrap">
          <div className="l-stats">
            {[
              {n:"340+",c:"#FF2D55",lbl:"Agencies using the workspace to source and close short-form clients"},
              {n:"34%",c:"#00F5D4",lbl:"Average reply rate when AI outreach is built from actual lead data"},
              {n:"$14.2K",c:"#16FF7A",lbl:"Average monthly revenue tracked inside the pipeline per active user"},
              {n:"4 min",c:"#FFB703",lbl:"Median time from finding a lead to sending the first AI-written message"},
            ].map((s,i)=>(
              <div key={i} className={`l-stat rv${i>0?" d"+i:""}`}>
                <div className="l-stat-n" style={{color:s.c}}>{s.n}</div>
                <div className="l-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* PROBLEM VS SOLUTION */}
        <div className="l-sec rv">
          <span className="l-tag">The problem</span>
          <h2 className="l-sec-h">You&apos;re working <em>harder</em><br/>than you need to.</h2>
          <div className="l-pvs">
            <div className="l-pvs-hd">
              <div className="l-pvs-col" style={{color:"rgba(255,45,85,0.6)"}}>✕ The old way</div>
              <div className="l-pvs-col" style={{color:"rgba(0,245,212,0.6)"}}>✓ With Shorts Agency OS</div>
            </div>
            {[
              ["Generic "I love your content" DMs that get 2% reply rates","Messages that open with their actual sub count, reel gap, and missed revenue — specific enough to sting"],
              ["Burning AI credits on cold, unqualified leads with no money signal","Hard 7.0 score threshold — the AI won't generate a single word for leads that won't close"],
              ["Searching YouTube, Instagram, and Maps in three separate tabs","One query hits all three platforms and enriches every result with follower counts before you see it"],
              ["Deal value never logged — revenue dashboard shows $0 all month","Modal fires the second a lead hits Booked or Closed. Pipeline and closed revenue always current"],
              ["Forgetting to follow up on leads that went silent after the first message","Follow-up engine flags every unanswered Sent status after 3 days. One click generates a fresh message"],
            ].map(([bad,good],i)=>(
              <div key={i} className="l-pvs-row">
                <div className="l-pvs-cell" style={{color:"rgba(250,250,248,0.45)"}}><span style={{flexShrink:0}}>✕</span>{bad}</div>
                <div className="l-pvs-cell" style={{fontWeight:600}}><span style={{flexShrink:0,color:"#00F5D4"}}>✓</span>{good}</div>
              </div>
            ))}
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div className="l-sec" id="how-it-works">
          <div className="l-steps-intro rv">
            <div>
              <span className="l-tag">How it works</span>
              <h2 className="l-sec-h">Four steps.<br/><em>One workspace.</em></h2>
            </div>
            <p className="l-sec-p" style={{marginTop:0}}>From zero context about a lead to a personalized DM sent — in under four minutes. Every step is AI-assisted. None of it requires manual research.</p>
          </div>
          <div className="l-steps">
            {[
              {n:"01/04",color:"#FF2D55",bg:"rgba(255,45,85,0.12)",title:"Find",body:"One search hits YouTube, Instagram, and Google Maps simultaneously. Results arrive pre-enriched with follower counts, platform gaps, and Google review signals.",icon:<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>},
              {n:"02/04",color:"#FFB703",bg:"rgba(255,183,3,0.1)",title:"Score",body:"AI scores every lead 1–10 across five dimensions: content weakness, short-form gap, money signal, urgency, and platform presence. Leads under 7.0 are hard-blocked.",icon:<><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>},
              {n:"03/04",color:"#00F5D4",bg:"rgba(0,245,212,0.08)",title:"Message",body:"One click. The AI opens with their sharpest content gap — their actual numbers, not a template. Under four lines for DMs. Ends with a question, not a pitch.",icon:<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>},
              {n:"04/04",color:"#16FF7A",bg:"rgba(22,255,122,0.08)",title:"Close",body:"Drag leads through a Kanban pipeline. Deal value modal auto-fires on Booked. Revenue dashboard tracks what actually closed, not pipeline projections.",icon:<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>},
            ].map((s,i)=>(
              <div key={i} className={`l-step rv${i>0?" d"+i:""}`} style={{["--step-color" as any]:s.color}}>
                <style>{`.l-step:nth-child(${i+1})::after{background:${s.color}}`}</style>
                <div className="l-step-n">{s.n}</div>
                <div className="l-step-ico" style={{background:s.bg}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
                </div>
                <div className="l-step-t">{s.title}</div>
                <div className="l-step-b">{s.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SCORE SECTION */}
        <div className="l-score-sec">
          <div className="l-score-inner">
            <div className="rv" style={{display:"flex",alignItems:"center"}}>
              <div className="l-dial-wrap">
                <svg viewBox="0 0 220 220" fill="none" width="220" height="220">
                  <circle cx="110" cy="110" r="90" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeDasharray="502" strokeDashoffset="126" strokeLinecap="round" transform="rotate(135 110 110)"/>
                  <circle cx="110" cy="110" r="90" stroke="rgba(255,45,85,0.3)" strokeWidth="12" strokeDasharray="251 251" strokeDashoffset="126" strokeLinecap="round" transform="rotate(135 110 110)"/>
                  <circle cx="110" cy="110" r="90" stroke="#00F5D4" strokeWidth="12" strokeDasharray="150 352" strokeDashoffset="-125" strokeLinecap="round" transform="rotate(135 110 110)"/>
                  <line x1="110" y1="22" x2="110" y2="40" stroke="#FFB703" strokeWidth="2.5" strokeLinecap="round" transform="rotate(126 110 110)"/>
                </svg>
                <div className="l-dial-num"><span className="l-dial-n">7.0</span><span className="l-dial-lbl">threshold</span></div>
              </div>
              <div className="l-legend">
                {[
                  {c:"#00F5D4",shadow:"0 0 8px #00F5D4",t:"7.0 – 10.0 · Hot",s:"AI outreach unlocked. Generate DM immediately."},
                  {c:"#FFB703",t:"6.0 – 6.9 · Warm",s:"Rescore manually or pass. Don't burn credits."},
                  {c:"#FF2D55",t:"Below 6.0 · Cold",s:"Hard blocked. Move on immediately."},
                ].map(({c,shadow,t,s})=>(
                  <div key={t} className="l-leg-row">
                    <div className="l-leg-dot" style={{background:c,boxShadow:shadow}}/>
                    <div className="l-leg-t"><strong>{t}</strong><span>{s}</span></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rv d1">
              <span className="l-tag">The 7.0 rule</span>
              <h2 className="l-sec-h" style={{fontSize:"clamp(30px,3.5vw,52px)"}}>Not every lead deserves <em>your time.</em></h2>
              <div className="l-rule-box">
                <p>The AI evaluates <strong>content weakness</strong>, <strong>short-form gap</strong>, <strong>money signal</strong>, <strong>urgency</strong>, and <strong>platform presence</strong> — then produces a single score.</p>
                <p style={{marginTop:"14px"}}>Any lead below <strong>7.0</strong> is flagged cold and <strong>blocked from AI generation</strong>. The DM button grays out. You can&apos;t accidentally message a lead who won&apos;t close.</p>
                <p style={{marginTop:"14px"}}>This isn&apos;t a suggestion. It&apos;s a hard gate. <strong>Your credits, your time, and your conversion rate are protected by default.</strong></p>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURES */}
        <div className="l-sec">
          <span className="l-tag rv">Features</span>
          <h2 className="l-sec-h rv">Everything you need.<br/><em>Nothing you don&apos;t.</em></h2>
          <div className="l-feats">
            {[
              {n:"01",ic:"#00F5D4",ibg:"rgba(0,245,212,0.09)",t:"Cross-platform search",b:"YouTube, Instagram, and Google Maps in a single query. Auto-enriched with follower counts, reel deficits, and review signals before you see a result.",icon:<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,preview:<><div className="l-fp-row"><span className="l-fp-name">YouTube search</span><span style={{color:"#FF2D55",fontWeight:500}}>✓ live</span></div><div className="l-fp-row"><span className="l-fp-name">Instagram search</span><span style={{color:"#FF2D55",fontWeight:500}}>✓ live</span></div><div className="l-fp-row"><span className="l-fp-name">Google Maps</span><span style={{color:"#FF2D55",fontWeight:500}}>✓ live</span></div><div className="l-fp-row"><span className="l-fp-name">Auto-enrichment</span><span style={{color:"#00F5D4",fontWeight:500}}>✓ on</span></div></>},
              {n:"02",ic:"#FF2D55",ibg:"rgba(255,45,85,0.09)",t:"Evidence-based outreach",b:'Every message references real data — exact subscriber count, reel deficit, missing platforms. No placeholders. No templates. No "I hope this finds you well."',icon:<><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>,preview:<><div style={{padding:"4px 0",color:"rgba(255,255,255,0.6)",lineHeight:1.5,fontSize:"10px"}}>&quot;Hey @founderslabpod — you have 18 long videos and 42K subs but only 1 Short.<br/><br/>Would 3 clip ideas from your existing library be useful?&quot;</div><div style={{height:"3px",borderRadius:"99px",background:"#00F5D4",width:"60%",marginTop:"8px"}}/><div style={{fontSize:"9px",color:"rgba(255,255,255,0.3)",marginTop:"4px"}}>AI-generated · 38 chars · DM-ready</div></>},
              {n:"03",ic:"#16FF7A",ibg:"rgba(22,255,122,0.08)",t:"Revenue pipeline",b:"Drag-and-drop Kanban through Prospect → Contacted → Replied → Booked → Closed. Deal value auto-prompts. Closed revenue and pipeline value always live.",icon:<><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="16" x2="12" y2="16"/></>,preview:<><div className="l-fp-row"><span className="l-fp-name">Prospect</span><span style={{color:"rgba(255,255,255,0.4)",fontWeight:500}}>6 leads</span></div><div className="l-fp-row"><span className="l-fp-name">Replied</span><span style={{color:"#FFB703",fontWeight:500}}>3 leads</span></div><div className="l-fp-row"><span className="l-fp-name">Booked</span><span style={{color:"#00F5D4",fontWeight:500}}>2 · $5K</span></div><div className="l-fp-row"><span className="l-fp-name">Closed</span><span style={{color:"#16FF7A",fontWeight:500}}>1 · $2.5K</span></div></>},
            ].map((f,i)=>(
              <div key={i} className={`l-feat rv${i>0?" d"+i:""}`}>
                <div className="l-feat-n">{f.n}</div>
                <div className="l-feat-ico" style={{background:f.ibg}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={f.ic} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{f.icon}</svg>
                </div>
                <div className="l-feat-t">{f.t}</div>
                <div className="l-feat-b">{f.b}</div>
                <div className="l-feat-pre">{f.preview}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TESTIMONIALS */}
        <div className="l-sec">
          <span className="l-tag rv">Results</span>
          <h2 className="l-sec-h rv">Agencies that ship,<br/><em>not just pitch.</em></h2>
          <div className="l-tests">
            {[
              {av:"JR",bg:"linear-gradient(135deg,#FF2D55,#FF9500)",q:"The score threshold alone saved me. I was burning Grok credits on leads that had no money signal. Now my reply rate went from 8% to 31% because I'm only messaging hot leads.",name:"Jordan R.",role:"clips agency · 3 clients closed in week 1"},
              {av:"KM",bg:"linear-gradient(135deg,#00F5D4,#007AFF)",q:"The DM that got my first reply literally opened with the exact sub count and reel count. The prospect said 'how did you know that?' That's the difference between a template and this tool.",name:"Kayla M.",role:"short-form studio · $8.4K closed month 1"},
              {av:"AS",bg:"linear-gradient(135deg,#16FF7A,#007AFF)",q:"I used to spend 3 hours a day doing manual research on YouTube and Instagram. Now I hit the auto search, score the batch, and I'm sending DMs in 20 minutes. There's no going back.",name:"Alex S.",role:"content repurposing · 9 clients active"},
            ].map((t,i)=>(
              <div key={i} className={`l-test rv${i>0?" d"+i:""}`}>
                <div className="l-stars">★★★★★</div>
                <p className="l-quote">&ldquo;{t.q}&rdquo;</p>
                <div className="l-tauth">
                  <div className="l-tav" style={{background:t.bg}}>{t.av}</div>
                  <div><div className="l-tname">{t.name}</div><div className="l-trole">{t.role}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="l-cta">
          <div className="l-cta-glow"/>
          <div className="l-cta-inner rv">
            <h2 className="l-cta-h">Start closing<br/><em>today.</em></h2>
            <p className="l-cta-sub">No account required to try. Demo data loads in 2 seconds.<br/>Add your API keys when you&apos;re ready to go live.</p>
            <div className="l-cta-acts">
              <Link href="/app" className="l-btn-p" style={{height:"60px",padding:"0 36px",fontSize:"16px"}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Open workspace — it&apos;s free
              </Link>
            </div>
            <p className="l-cta-note">no credit card · no setup · no waitlist</p>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="l-footer">
          <div className="l-footer-logo">
            <div className="l-footer-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
            Shorts Agency OS
          </div>
          <div className="l-footer-tag">Built for agencies that ship clips, not decks.</div>
        </footer>

        {/* scroll reveal + mockup tilt */}
        <script dangerouslySetInnerHTML={{__html:`
          (function(){
            var els=document.querySelectorAll('.rv');
            var obs=new IntersectionObserver(function(entries){
              entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('vis');obs.unobserve(e.target);}});
            },{threshold:0.1});
            els.forEach(function(el){obs.observe(el);});

            var mw=document.getElementById('mockup-wrap');
            if(mw){
              mw.addEventListener('mousemove',function(e){
                var r=mw.getBoundingClientRect();
                var x=(e.clientX-r.left)/r.width-0.5;
                var y=(e.clientY-r.top)/r.height-0.5;
                mw.style.transform='perspective(1000px) rotateY('+(x*6)+'deg) rotateX('+(-y*4)+'deg)';
                mw.style.transition='transform 0.1s ease';
              });
              mw.addEventListener('mouseleave',function(){
                mw.style.transform='perspective(1000px) rotateY(0deg) rotateX(0deg)';
                mw.style.transition='transform 0.6s ease';
              });
            }
          })();
        `}}/>
      </div>
    </>
  );
}
