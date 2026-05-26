"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  useEffect(() => {
    // ── cursor ─────────────────────────────────────────────────────────────
    const cur = document.getElementById("c-cursor");
    const ring = document.getElementById("c-ring");
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    const onMove = (e) => {
      mx = e.clientX; my = e.clientY;
      if (cur) { cur.style.left = mx + "px"; cur.style.top = my + "px"; }
    };
    document.addEventListener("mousemove", onMove);
    let rafCursor;
    const animRing = () => {
      rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
      if (ring) { ring.style.left = rx + "px"; ring.style.top = ry + "px"; }
      rafCursor = requestAnimationFrame(animRing);
    };
    animRing();

    // ripple on .btn-red
    const btns = document.querySelectorAll(".btn-red");
    const onBtnMove = (e) => {
      const r = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty("--rx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
      e.currentTarget.style.setProperty("--ry", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
    };
    btns.forEach(b => b.addEventListener("mousemove", onBtnMove));

    // ── canvas particles ───────────────────────────────────────────────────
    const canvas = document.getElementById("c-canvas");
    const ctx = canvas ? canvas.getContext("2d") : null;
    let W, H, pts = [];
    const NUM = 90;
    const resize = () => {
      if (!canvas) return;
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const initPts = () => {
      pts = [];
      for (let i = 0; i < NUM; i++) {
        pts.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
          r: Math.random() * 1.8 + .5,
          hue: Math.random() < .6 ? 350 : Math.random() < .5 ? 170 : 45,
        });
      }
    };
    initPts();
    window.addEventListener("resize", initPts);

    let pmx = W / 2, pmy = H / 2;
    document.addEventListener("mousemove", e => { pmx = e.clientX; pmy = e.clientY; });

    let rafCanvas;
    const frame = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);
      const maxD = 160, mForce = 120;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const dx = p.x - pmx, dy = p.y - pmy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < mForce) { const f = (mForce - d) / mForce; p.vx += dx / d * f * .6; p.vy += dy / d * f * .6; }
        p.vx *= .96; p.vy *= .96;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) { p.x = 0; p.vx *= -1; } if (p.x > W) { p.x = W; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; } if (p.y > H) { p.y = H; p.vy *= -1; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},100%,70%,.55)`; ctx.fill();
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const ex = p.x - q.x, ey = p.y - q.y;
          const ed = Math.sqrt(ex * ex + ey * ey);
          if (ed < maxD) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `hsla(${p.hue},100%,65%,${(1 - ed / maxD) * .25})`; ctx.lineWidth = .6; ctx.stroke();
          }
        }
      }
      rafCanvas = requestAnimationFrame(frame);
    };
    frame();

    // ── scroll progress ────────────────────────────────────────────────────
    const prog = document.getElementById("c-prog");
    const onScroll = () => {
      const st = window.scrollY;
      const dh = document.documentElement.scrollHeight - window.innerHeight;
      if (prog) prog.style.width = (st / dh * 100) + "%";
      // parallax hero
      const hl = document.querySelector(".hero-left");
      const hr = document.getElementById("heroRight");
      if (hl) hl.style.transform = `translateY(${st * 0.10}px)`;
      if (hr) hr.style.transform = `translateY(${st * 0.05}px)`;
      // section idx
      SECTIONS.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el) { const r = el.getBoundingClientRect(); if (r.top <= 100 && r.bottom >= 100) sectionIdx = i; }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // ── reveal on scroll ───────────────────────────────────────────────────
    const revEls = document.querySelectorAll(".reveal-up,.reveal-left,.reveal-right,.c-stat");
    const revObs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("vis"); revObs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    revEls.forEach(el => revObs.observe(el));

    // ── hero animate in ────────────────────────────────────────────────────
    setTimeout(() => document.getElementById("heroH1")?.classList.add("revealed"), 100);
    setTimeout(() => document.getElementById("heroSub")?.classList.add("revealed"), 200);
    setTimeout(() => document.getElementById("heroActions")?.classList.add("revealed"), 300);
    setTimeout(() => document.getElementById("heroProof")?.classList.add("revealed"), 400);
    setTimeout(() => document.getElementById("heroRight")?.classList.add("revealed"), 300);

    // ── mockup 3D tilt ─────────────────────────────────────────────────────
    const mockWrap = document.getElementById("heroRight");
    const mockEl = document.getElementById("mockupEl");
    if (mockWrap && mockEl) {
      const onMockMove = (e) => {
        const r = mockWrap.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        mockEl.style.transform = `perspective(1200px) rotateY(${x * 12}deg) rotateX(${-y * 8}deg) scale(1.02)`;
        mockEl.style.boxShadow = `${-x * 30}px ${-y * 20}px 80px rgba(0,0,0,.8),0 0 120px rgba(255,45,85,.1)`;
        mockEl.style.transition = "transform .08s ease,box-shadow .08s ease";
      };
      const onMockLeave = () => {
        mockEl.style.transform = "perspective(1200px) rotateY(0) rotateX(0) scale(1)";
        mockEl.style.boxShadow = "";
        mockEl.style.transition = "transform .7s cubic-bezier(.16,1,.3,1),box-shadow .7s";
      };
      mockWrap.addEventListener("mousemove", onMockMove);
      mockWrap.addEventListener("mouseleave", onMockLeave);
    }

    // ── dial animate on scroll ─────────────────────────────────────────────
    const hotArc = document.getElementById("hotArc");
    if (hotArc) {
      const dialObs = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { setTimeout(() => hotArc.setAttribute("stroke-dasharray", "150 352"), 300); dialObs.unobserve(e.target); }
        });
      }, { threshold: .4 });
      const scoreSec = document.getElementById("score-sec");
      if (scoreSec) dialObs.observe(scoreSec);
    }

    // ── count-up ───────────────────────────────────────────────────────────
    const countObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target.querySelector("[data-count]");
          if (el) {
            const target = parseInt(el.dataset.count, 10);
            const suffix = el.dataset.suffix || "";
            const prefix = el.dataset.prefix || "";
            const dur = 1800, start = performance.now();
            const step = (now) => {
              const ease = 1 - Math.pow(1 - Math.min((now - start) / dur, 1), 3);
              el.textContent = prefix + Math.round(ease * target) + suffix;
              if (ease < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
          }
          countObs.unobserve(e.target);
        }
      });
    }, { threshold: .5 });
    document.querySelectorAll(".c-stat").forEach(el => countObs.observe(el));

    // ── terminal ───────────────────────────────────────────────────────────
    const term = document.getElementById("c-term");
    const termBody = document.getElementById("c-term-body");
    const termCurrent = document.getElementById("c-term-cur");
    const termClose = document.getElementById("c-term-close");
    let termOpen = false, termBuffer = "", termTyping = false;

    const LEADS = [
      { name: "Founders Lab Podcast", handle: "@founderslabpod", score: 8.4, subs: "42.8K YT" },
      { name: "Forge Fitness Austin", handle: "@forgefitnessatx", score: 7.2, subs: "15.3K IG" },
      { name: "Maya Ops Daily", handle: "@mayaopsdaily", score: 8.9, subs: "22.1K X" },
      { name: "TechTalk Weekly", handle: "@techtalkwkly", score: 9.1, subs: "88K YT" },
      { name: "The Founder Hour", handle: "@founderhour", score: 7.8, subs: "31K IG" },
    ];
    const DMS = [
      (l) => `Hey ${l.handle} — you have ${l.subs} but almost no short-form content.\n\nWould 3 clip ideas from your existing videos be useful?`,
      (l) => `${l.handle} your long-form content is solid but it's not travelling past your core audience.\n\nHave you thought about repurposing it into clips?`,
      (l) => `Quick one for ${l.handle} — your content library has the goods, the distribution just isn't there.\n\nWould a free clip audit make sense?`,
    ];

    const inputRow = document.getElementById("c-term-input");
    const addLine = (text, cls = "") => {
      if (!termBody || !inputRow) return;
      const span = document.createElement("span");
      span.className = "t-line" + (cls ? " " + cls : "");
      span.textContent = text;
      termBody.insertBefore(span, inputRow);
      termBody.scrollTop = termBody.scrollHeight;
    };
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const runGen = async (q) => {
      const lead = LEADS.find(l => l.name.toLowerCase().includes(q.toLowerCase())) || LEADS[Math.floor(Math.random() * LEADS.length)];
      addLine(""); addLine(`$ generate-dm --lead "${lead.name}"`, "t-cmd");
      addLine("  Scoring lead...", "t-dim"); await delay(600);
      addLine(`  score: ${lead.score}/10  [${lead.subs}]`, "t-out");
      if (lead.score < 7.0) { addLine("  ✕ Below 7.0 threshold — blocked", "t-err"); return; }
      addLine("  ✓ Hot lead — generating outreach...", "t-out"); await delay(700);
      addLine(""); addLine("  --- DM ---", "t-dim");
      const dm = DMS[Math.floor(Math.random() * DMS.length)](lead);
      for (const line of dm.split("\n")) { addLine("  " + line); await delay(60); }
      addLine("  --- END ---", "t-dim"); addLine(""); addLine("  copied to clipboard ✓", "t-out");
      if (navigator.clipboard) navigator.clipboard.writeText(dm).catch(() => {});
      termTyping = false;
    };

    const openTerm = () => { if (term) { term.classList.add("open"); termOpen = true; } };
    const closeTerm = () => { if (term) { term.classList.remove("open"); termOpen = false; termBuffer = ""; if (termCurrent) termCurrent.textContent = ""; } };
    if (termClose) termClose.addEventListener("click", closeTerm);

    const onKey = async (e) => {
      if (e.key === "Escape") { closeTerm(); return; }
      if (!termOpen) { openTerm(); addLine("// type a lead name and press Enter.", "t-dim"); }
      if (termTyping) return;
      if (e.key === "Enter") {
        const q = termBuffer.trim(); termBuffer = ""; if (termCurrent) termCurrent.textContent = "";
        if (!q) { addLine(""); return; }
        termTyping = true; await runGen(q);
        return;
      }
      if (e.key === "Backspace") { termBuffer = termBuffer.slice(0, -1); if (termCurrent) termCurrent.textContent = termBuffer; return; }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) { termBuffer += e.key; if (termCurrent) termCurrent.textContent = termBuffer; }
    };
    document.addEventListener("keydown", onKey);

    // ── arrow key section nav ──────────────────────────────────────────────
    let sectionIdx = 0;
    const SECTIONS = ["c-hero", "c-how", "score-sec", "c-feats", "c-cta"];
    const onArrow = (e) => {
      if (termOpen) return;
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault(); sectionIdx = Math.min(sectionIdx + 1, SECTIONS.length - 1);
        document.getElementById(SECTIONS[sectionIdx])?.scrollIntoView({ behavior: "smooth" });
      }
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault(); sectionIdx = Math.max(sectionIdx - 1, 0);
        document.getElementById(SECTIONS[sectionIdx])?.scrollIntoView({ behavior: "smooth" });
      }
    };
    document.addEventListener("keydown", onArrow);

    // ── particle burst on CTA ──────────────────────────────────────────────
    document.querySelectorAll(".btn-red").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        for (let i = 0; i < 12; i++) {
          const el = document.createElement("div");
          const angle = (i / 12) * Math.PI * 2;
          const dist = 60 + Math.random() * 60;
          el.style.cssText = `position:fixed;width:6px;height:6px;border-radius:50%;background:${Math.random() < .5 ? "#FF2D55" : "#00F5D4"};left:${cx}px;top:${cy}px;z-index:9000;pointer-events:none;transition:transform .6s cubic-bezier(.16,1,.3,1),opacity .6s ease;`;
          document.body.appendChild(el);
          requestAnimationFrame(() => { el.style.transform = `translate(${Math.cos(angle) * dist}px,${Math.sin(angle) * dist}px) scale(0)`; el.style.opacity = "0"; });
          setTimeout(() => el.remove(), 700);
        }
      });
    });

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("keydown", onArrow);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafCursor);
      cancelAnimationFrame(rafCanvas);
    };
  }, []);

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{
          --black:#020202;--red:#FF2D55;--cyan:#00F5D4;--green:#16FF7A;--amber:#FFB703;
          --w:#FAFAF8;--muted:rgba(250,250,248,.4);--border:rgba(250,250,248,.07);
          --fd:'Syne',sans-serif;--fm:'DM Mono',monospace;--fs:'Instrument Serif',serif;
        }
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap');
        html{scroll-behavior:smooth}
        body{background:var(--black);color:var(--w);font-family:'Syne',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;cursor:none}
        a{text-decoration:none;color:inherit}
        /* noise */
        body::after{content:'';position:fixed;inset:0;z-index:9997;pointer-events:none;opacity:.025;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:160px}
        /* cursor */
        .c-cur{position:fixed;width:12px;height:12px;border-radius:50%;background:var(--red);pointer-events:none;z-index:9999;transform:translate(-50%,-50%);transition:width .2s,height .2s,background .2s;mix-blend-mode:difference}
        .c-ring{position:fixed;width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,45,85,.5);pointer-events:none;z-index:9998;transform:translate(-50%,-50%);transition:width .3s,height .3s,border-color .3s}
        /* progress */
        .c-prog{position:fixed;top:0;left:0;height:2px;z-index:200;background:linear-gradient(90deg,var(--red),var(--cyan));width:0%;transition:width .1s linear}
        /* canvas */
        .c-canvas{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:.55}
        /* kb hint */
        .kb-hint{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:8px;font-family:'DM Mono',monospace;font-size:11px;color:rgba(250,250,248,.3);z-index:50;pointer-events:none;animation:kbFade 3s 2s ease both}
        @keyframes kbFade{0%{opacity:0;transform:translateX(-50%) translateY(6px)}20%{opacity:1;transform:translateX(-50%) translateY(0)}80%{opacity:1}100%{opacity:0}}
        .kb{padding:3px 7px;border:1px solid rgba(250,250,248,.15);border-radius:5px;font-size:10px;background:rgba(250,250,248,.05)}
        /* terminal */
        .c-term{position:fixed;bottom:80px;right:40px;z-index:150;width:360px;max-height:280px;background:rgba(2,2,2,.96);border:1px solid rgba(0,245,212,.2);border-radius:16px;overflow:hidden;opacity:0;transform:translateY(20px) scale(.97);transition:opacity .25s,transform .25s;pointer-events:none}
        .c-term.open{opacity:1;transform:none;pointer-events:auto}
        .t-bar{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.03)}
        .t-title{font-family:'DM Mono',monospace;font-size:11px;color:rgba(250,250,248,.4);letter-spacing:.05em}
        .t-close{width:20px;height:20px;border:none;background:rgba(255,45,85,.15);border-radius:50%;color:var(--red);font-size:11px;cursor:none;display:grid;place-items:center;font-family:'Syne',sans-serif}
        .t-body{padding:14px 16px;font-family:'DM Mono',monospace;font-size:12px;line-height:1.8;max-height:220px;overflow-y:auto}
        .t-body::-webkit-scrollbar{width:3px}.t-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12)}
        .t-line{display:block;color:rgba(250,250,248,.55)}.t-cmd{color:#00F5D4}.t-out{color:#16FF7A}.t-err{color:#FF2D55}.t-dim{color:rgba(250,250,248,.25)}
        .t-input{display:flex;align-items:center;gap:8px;margin-top:8px}
        .t-prompt{color:#00F5D4;font-size:12px;font-family:'DM Mono',monospace}
        .t-cur-text{color:var(--w);font-family:'DM Mono',monospace;font-size:12px}
        .t-blink{display:inline-block;width:7px;height:14px;background:#00F5D4;margin-left:1px;vertical-align:middle;animation:blink .9s infinite}
        @keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
        /* nav */
        .l-nav{position:fixed;inset-x:0;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:0 48px;height:68px;border-bottom:1px solid var(--border);background:rgba(2,2,2,.82);backdrop-filter:blur(24px)}
        .l-nav-logo{display:flex;align-items:center;gap:12px}
        .l-nav-icon{width:36px;height:36px;background:var(--red);border-radius:10px;display:grid;place-items:center;box-shadow:0 0 24px rgba(255,45,85,.55);flex-shrink:0}
        .l-nav-name{font-size:15px;font-weight:800;letter-spacing:-.02em}
        .l-nav-links{display:flex;gap:32px}
        .l-nav-links a{font-size:13px;font-weight:600;color:var(--muted);transition:color .15s}
        .l-nav-links a:hover{color:var(--w)}
        .l-nav-cta{display:inline-flex;align-items:center;gap:8px;padding:0 20px;height:40px;background:var(--w);color:var(--black);border-radius:99px;font-size:13px;font-weight:800;border:none;font-family:'Syne',sans-serif;cursor:none;transition:transform .15s,box-shadow .15s}
        .l-nav-cta:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(255,255,255,.15)}
        /* hero */
        #c-hero{min-height:100vh;display:flex;align-items:center;padding:140px 48px 100px;position:relative;overflow:hidden}
        .hero-inner{max-width:1360px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center;width:100%}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border:1px solid var(--border);border-radius:99px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:28px}
        .badge-dot{width:6px;height:6px;border-radius:50%;background:var(--cyan);box-shadow:0 0 8px var(--cyan);animation:pulse 2s infinite}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)}}
        .hero-h1{font-size:clamp(56px,6.5vw,100px);font-weight:800;line-height:.95;letter-spacing:-.04em;overflow:hidden}
        .hero-h1 .line{display:block;overflow:hidden}
        .hero-h1 .line span{display:block;transform:translateY(110%);transition:transform .9s cubic-bezier(.16,1,.3,1)}
        .hero-h1 em{font-style:italic;font-family:'Instrument Serif',serif;color:var(--red)}
        .hero-h1 .outline{-webkit-text-stroke:1.5px var(--w);color:transparent}
        .hero-h1.revealed .line span{transform:translateY(0)}
        .hero-h1.revealed .line:nth-child(2) span{transition-delay:.08s}
        .hero-h1.revealed .line:nth-child(3) span{transition-delay:.16s}
        .hero-sub{margin-top:28px;font-size:18px;line-height:1.7;color:var(--muted);max-width:460px;opacity:0;transform:translateY(16px);transition:opacity .8s .5s,transform .8s .5s}
        .hero-sub.revealed,.hero-actions.revealed{opacity:1;transform:none}
        .hero-actions{margin-top:40px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;opacity:0;transform:translateY(16px);transition:opacity .8s .65s,transform .8s .65s}
        .btn-red{display:inline-flex;align-items:center;gap:10px;padding:0 28px;height:58px;background:var(--red);border-radius:16px;font-size:15px;font-weight:800;color:var(--w);border:none;font-family:'Syne',sans-serif;cursor:none;box-shadow:0 0 40px rgba(255,45,85,.4);transition:transform .15s,box-shadow .15s,background .15s;position:relative;overflow:hidden}
        .btn-red::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at var(--rx,50%) var(--ry,50%),rgba(255,255,255,.25) 0%,transparent 60%);opacity:0;transition:opacity .3s}
        .btn-red:hover::after{opacity:1}
        .btn-red:hover{transform:translateY(-2px);box-shadow:0 0 60px rgba(255,45,85,.6);background:#FF3D62}
        .btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:0 24px;height:58px;border:1px solid var(--border);border-radius:16px;font-size:15px;font-weight:700;color:var(--muted);font-family:'Syne',sans-serif;cursor:none;transition:color .15s,border-color .15s}
        .btn-ghost:hover{color:var(--w);border-color:rgba(250,250,248,.2)}
        .hero-proof{margin-top:48px;display:flex;align-items:center;gap:20px;opacity:0;transition:opacity .8s .8s}
        .hero-proof.revealed{opacity:1}
        .avs{display:flex}.av{width:32px;height:32px;border-radius:50%;border:2px solid #020202;display:grid;place-items:center;font-size:11px;font-weight:800;margin-left:-8px}
        .av:first-child{margin-left:0}
        .proof-text{font-size:13px;color:var(--muted);line-height:1.5}.proof-text strong{color:var(--w)}
        /* mockup */
        .hero-right{position:relative;opacity:0;transform:translateX(40px) rotateY(-8deg);transform-origin:left center;transition:opacity 1s .3s,transform 1s .3s cubic-bezier(.16,1,.3,1);transform-style:preserve-3d;perspective:1200px}
        .hero-right.revealed{opacity:1;transform:translateX(0) rotateY(0)}
        .mockup{background:#0D0D0D;border:1px solid rgba(255,255,255,.09);border-radius:20px;overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,.04),0 60px 120px rgba(0,0,0,.9),0 0 100px rgba(255,45,85,.06);will-change:transform;transition:transform .1s ease,box-shadow .3s}
        .mock-bar{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.03)}
        .dots{display:flex;gap:6px}.dots span{width:10px;height:10px;border-radius:50%}
        .mock-title{font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,255,255,.3);letter-spacing:.05em}
        .mock-pills{display:flex;gap:4px}.mpill{padding:4px 10px;border-radius:99px;font-family:'DM Mono',monospace;font-size:10px;font-weight:500}
        .mpill.on{background:rgba(255,255,255,.12);color:var(--w)}.mpill.off{color:rgba(255,255,255,.3)}
        .mock-body{display:grid;grid-template-columns:1fr 190px}
        .mock-main{padding:14px;border-right:1px solid rgba(255,255,255,.06)}
        .m-lead{background:linear-gradient(135deg,rgba(0,245,212,.06),transparent 60%),rgba(255,255,255,.04);border:1px solid rgba(0,245,212,.15);border-radius:12px;padding:14px;margin-bottom:10px}
        .m-lead-hd{display:flex;align-items:flex-start;gap:10px}
        .m-av{width:36px;height:36px;border-radius:9px;display:grid;place-items:center;font-size:12px;font-weight:800;color:white;flex-shrink:0}
        .m-name{font-size:12px;font-weight:800;line-height:1.2}.m-sub{font-size:10px;color:rgba(255,255,255,.4);margin-top:2px;font-family:'DM Mono',monospace}
        .m-score{font-family:'DM Mono',monospace;font-size:20px;font-weight:500;line-height:1}
        .m-score-lbl{font-size:9px;text-align:right;margin-top:2px;color:rgba(255,255,255,.35);font-family:'DM Mono',monospace}
        .m-chips{display:flex;gap:4px;flex-wrap:wrap;margin-top:8px}
        .m-chip{padding:2px 8px;border-radius:99px;font-size:9px;font-weight:700;font-family:'DM Mono',monospace}
        .m-bars{margin-top:8px;display:grid;gap:4px}.m-br{display:flex;align-items:center;gap:6px}
        .m-br-l{font-size:9px;color:rgba(255,255,255,.3);width:76px;font-family:'DM Mono',monospace}
        .m-br-t{flex:1;height:3px;background:rgba(255,255,255,.07);border-radius:99px;overflow:hidden}
        .m-br-f{height:100%;border-radius:99px}
        .m-sm{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:10px;margin-bottom:7px;display:flex;align-items:center;justify-content:space-between;gap:8px}
        .m-sm-av{width:26px;height:26px;border-radius:7px;display:grid;place-items:center;font-size:9px;font-weight:800;color:white;flex-shrink:0}
        .m-sm-n{font-size:11px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .m-sm-s{font-size:9px;color:rgba(255,255,255,.35);margin-top:1px;font-family:'DM Mono',monospace}
        .m-stg{padding:2px 7px;border-radius:99px;font-size:9px;font-weight:700;font-family:'DM Mono',monospace;flex-shrink:0}
        .mock-side{padding:14px}
        .m-met{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:9px;padding:10px;margin-bottom:7px}
        .m-met-l{font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.3);font-family:'DM Mono',monospace}
        .m-met-v{font-family:'DM Mono',monospace;font-size:18px;font-weight:500;margin-top:3px}
        .m-gen{width:100%;background:var(--red);border-radius:8px;height:30px;font-size:10px;font-weight:800;color:white;display:flex;align-items:center;justify-content:center;gap:5px;margin-top:8px;box-shadow:0 0 16px rgba(255,45,85,.35);border:none;font-family:'Syne',sans-serif;cursor:none}
        .float-badge{position:absolute;background:rgba(2,2,2,.92);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:10px 14px;backdrop-filter:blur(20px);box-shadow:0 16px 48px rgba(0,0,0,.6);white-space:nowrap}
        .fb1{bottom:-16px;left:-28px;animation:fbA 3s ease-in-out infinite}
        .fb2{top:32px;right:-20px;animation:fbB 3.5s ease-in-out infinite}
        @keyframes fbA{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes fbB{0%,100%{transform:translateY(0)}50%{transform:translateY(6px)}}
        .fb-l{font-size:10px;color:rgba(255,255,255,.35);font-family:'DM Mono',monospace}
        .fb-v{font-size:14px;font-weight:800;margin-top:2px}
        .fb-s{font-size:10px;color:rgba(255,255,255,.3);margin-top:1px;font-family:'DM Mono',monospace}
        /* ticker */
        .ticker{border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:16px 0;overflow:hidden;background:rgba(255,45,85,.025)}
        .ticker-track{display:flex;width:max-content;animation:tickMove 30s linear infinite}
        @keyframes tickMove{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .ticker-item{display:inline-flex;align-items:center;gap:10px;padding:0 32px;font-size:13px;font-weight:700;color:var(--muted);white-space:nowrap;font-family:'DM Mono',monospace}
        .ticker-item strong{color:var(--red)}
        /* stats */
        .stats-strip{border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
        .stats-inner{max-width:1360px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border)}
        .c-stat{background:var(--black);padding:52px 40px;position:relative;overflow:hidden;transition:background .2s}
        .c-stat:hover{background:rgba(255,255,255,.02)}
        .c-stat::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;transform:scaleX(0);transform-origin:left;transition:transform .6s cubic-bezier(.16,1,.3,1)}
        .c-stat.vis::before{transform:scaleX(1)}
        .c-stat:nth-child(1)::before{background:var(--red)}.c-stat:nth-child(2)::before{background:var(--cyan)}
        .c-stat:nth-child(3)::before{background:var(--green)}.c-stat:nth-child(4)::before{background:var(--amber)}
        .stat-n{font-family:'DM Mono',monospace;font-size:clamp(44px,5vw,76px);font-weight:500;line-height:1;letter-spacing:-.03em}
        .stat-lbl{margin-top:14px;font-size:13px;color:var(--muted);line-height:1.55}
        /* shared */
        .sec{padding:110px 0;position:relative;z-index:1}
        .container{max-width:1360px;margin:0 auto;padding:0 48px}
        .sec-tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--red);font-family:'DM Mono',monospace;margin-bottom:18px}
        .sec-h{font-size:clamp(38px,4.5vw,68px);font-weight:800;line-height:1.03;letter-spacing:-.035em}
        .sec-h em{font-style:italic;font-family:'Instrument Serif',serif}
        .sec-p{font-size:17px;line-height:1.75;color:var(--muted);max-width:500px;margin-top:20px}
        /* pvs */
        .pvs{margin-top:60px;display:grid;gap:2px;background:var(--border)}
        .pvs-hd{display:grid;grid-template-columns:1fr 1fr;gap:2px;background:var(--border)}
        .pvs-col{background:var(--black);padding:14px 24px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;display:flex;align-items:center;gap:8px}
        .pvs-row{display:grid;grid-template-columns:1fr 1fr;gap:2px;background:var(--border)}
        .pvs-cell{background:var(--black);padding:22px 24px;display:flex;align-items:flex-start;gap:14px;font-size:15px;line-height:1.5;transition:background .2s}
        .pvs-cell:hover{background:rgba(255,255,255,.02)}
        /* steps */
        .steps{margin-top:60px;display:grid;grid-template-columns:repeat(4,1fr);gap:2px;background:var(--border)}
        .step{background:var(--black);padding:32px 28px;position:relative;overflow:hidden;transition:background .2s}
        .step:hover{background:rgba(255,255,255,.02)}
        .step::after{content:'';position:absolute;top:0;left:0;right:0;height:2px}
        .step:nth-child(1)::after{background:var(--red)}.step:nth-child(2)::after{background:var(--amber)}
        .step:nth-child(3)::after{background:var(--cyan)}.step:nth-child(4)::after{background:var(--green)}
        .step-n{font-family:'DM Mono',monospace;font-size:11px;color:rgba(255,255,255,.25);margin-bottom:20px;letter-spacing:.08em}
        .step-ico{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;margin-bottom:20px}
        .step-t{font-size:22px;font-weight:800;margin-bottom:14px}.step-b{font-size:14px;line-height:1.65;color:var(--muted)}
        /* score */
        #score-sec{background:rgba(255,45,85,.04);border-top:1px solid rgba(255,45,85,.1);border-bottom:1px solid rgba(255,45,85,.1);padding:110px 0;overflow:hidden}
        .score-inner{max-width:1360px;margin:0 auto;padding:0 48px;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
        .score-visual{display:flex;align-items:center;gap:36px}
        .dial{width:220px;height:220px;flex-shrink:0;position:relative}
        .dial-num{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
        .dial-n{font-family:'DM Mono',monospace;font-size:52px;font-weight:500;color:var(--red);line-height:1}
        .dial-l{font-size:11px;color:rgba(255,255,255,.3);font-family:'DM Mono',monospace;margin-top:4px}
        .legend{display:grid;gap:14px}
        .leg-row{display:flex;align-items:flex-start;gap:10px}
        .leg-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:3px}
        .leg-t strong{display:block;font-size:14px;font-weight:700}.leg-t span{font-size:12px;color:var(--muted)}
        .rule-box{margin-top:32px;padding:26px;border:1px solid rgba(255,45,85,.2);border-radius:16px;background:rgba(255,45,85,.04)}
        .rule-box p{font-size:15px;line-height:1.75;color:var(--muted)}.rule-box strong{color:var(--w)}.rule-box p+p{margin-top:14px}
        /* feats */
        .feats-grid{margin-top:60px;display:grid;grid-template-columns:repeat(3,1fr);gap:2px;background:var(--border)}
        .feat{background:var(--black);padding:36px 32px;position:relative;overflow:hidden;transition:background .2s}
        .feat:hover{background:rgba(255,255,255,.02)}
        .feat-n{position:absolute;top:24px;right:24px;font-family:'DM Mono',monospace;font-size:76px;font-weight:500;color:rgba(255,255,255,.03);line-height:1;user-select:none}
        .feat-ico{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;margin-bottom:24px}
        .feat-t{font-size:20px;font-weight:800;margin-bottom:12px}.feat-b{font-size:14px;line-height:1.65;color:var(--muted)}
        .feat-pre{margin-top:24px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:12px;font-family:'DM Mono',monospace;font-size:10px}
        .fp-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05)}
        .fp-row:last-child{border-bottom:none}.fp-n{color:rgba(255,255,255,.6)}
        /* tests */
        .tests{margin-top:60px;display:grid;grid-template-columns:repeat(3,1fr);gap:2px;background:var(--border)}
        .test{background:var(--black);padding:32px 28px;transition:background .2s}.test:hover{background:rgba(255,255,255,.02)}
        .stars{display:flex;gap:4px;margin-bottom:18px;color:var(--amber);font-size:14px}
        .quote{font-size:16px;line-height:1.65;font-style:italic;font-family:'Instrument Serif',serif;margin-bottom:24px}
        .t-auth{display:flex;align-items:center;gap:12px}
        .t-av{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:800;color:white;flex-shrink:0}
        .t-name{font-size:13px;font-weight:700}.t-role{font-size:12px;color:var(--muted);margin-top:2px;font-family:'DM Mono',monospace}
        /* cta */
        #c-cta{padding:110px 0 130px;position:relative;overflow:hidden;z-index:1}
        .cta-bg{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:900px;height:500px;border-radius:50%;background:radial-gradient(ellipse,rgba(255,45,85,.12) 0%,transparent 70%);pointer-events:none;animation:ctaPulse 4s ease-in-out infinite}
        @keyframes ctaPulse{0%,100%{opacity:.8;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.08)}}
        .cta-inner{max-width:860px;margin:0 auto;padding:0 48px;text-align:center;position:relative;z-index:1}
        .cta-h{font-size:clamp(48px,6.5vw,96px);font-weight:800;line-height:1;letter-spacing:-.04em}
        .cta-h em{font-style:italic;font-family:'Instrument Serif',serif;color:var(--red)}
        .cta-sub{margin-top:20px;font-size:18px;color:var(--muted);line-height:1.6}
        .cta-acts{margin-top:48px;display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap}
        .cta-note{margin-top:20px;font-size:12px;color:rgba(255,255,255,.18);font-family:'DM Mono',monospace}
        /* footer */
        .l-footer{border-top:1px solid var(--border);padding:32px 48px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;position:relative;z-index:1}
        .foot-logo{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:800;color:rgba(255,255,255,.4)}
        .foot-icon{width:28px;height:28px;background:var(--red);border-radius:8px;display:grid;place-items:center}
        .foot-tag{font-size:12px;color:rgba(255,255,255,.18);font-family:'DM Mono',monospace}
        /* reveals */
        .reveal-up{opacity:0;transform:translateY(40px);transition:opacity .8s,transform .8s cubic-bezier(.16,1,.3,1)}
        .reveal-up.vis{opacity:1;transform:none}
        .reveal-left{opacity:0;transform:translateX(-40px);transition:opacity .8s,transform .8s cubic-bezier(.16,1,.3,1)}
        .reveal-left.vis{opacity:1;transform:none}
        .reveal-right{opacity:0;transform:translateX(40px);transition:opacity .8s,transform .8s cubic-bezier(.16,1,.3,1)}
        .reveal-right.vis{opacity:1;transform:none}
        .d1{transition-delay:.1s}.d2{transition-delay:.2s}.d3{transition-delay:.3s}
        /* responsive */
        @media(max-width:1100px){.hero-inner,.score-inner{grid-template-columns:1fr}.hero-right{display:none}.steps{grid-template-columns:1fr 1fr}.stats-inner{grid-template-columns:1fr 1fr}}
        @media(max-width:700px){.l-nav,.container,#c-hero{padding-left:20px;padding-right:20px}.feats-grid,.tests,.pvs-row,.pvs-hd,.steps{grid-template-columns:1fr}.stats-inner{grid-template-columns:1fr 1fr}.l-footer{padding:24px 20px;flex-direction:column;align-items:flex-start}.c-term{right:16px;left:16px;width:auto}}
      `}</style>

      {/* cursor */}
      <div id="c-cursor" className="c-cur" />
      <div id="c-ring" className="c-ring" />
      <div id="c-prog" className="c-prog" />
      <canvas id="c-canvas" className="c-canvas" />

      {/* keyboard hint */}
      <div className="kb-hint">
        <span className="kb">any key</span> to open DM terminal
        <span style={{margin:"0 4px",opacity:.4}}>·</span>
        <span className="kb">↑↓</span> scroll sections
      </div>

      {/* terminal */}
      <div id="c-term" className="c-term">
        <div className="t-bar">
          <span className="t-title">shorts-agency-os / terminal</span>
          <button id="c-term-close" className="t-close">✕</button>
        </div>
        <div id="c-term-body" className="t-body">
          <span className="t-line t-dim">// press any key · type a lead name · press Enter</span>
          <div id="c-term-input" className="t-input">
            <span className="t-prompt">$ generate-dm</span>
            <span id="c-term-cur" className="t-cur-text" />
            <span className="t-blink" />
          </div>
        </div>
      </div>

      {/* NAV */}
      <nav className="l-nav">
        <Link href="/" className="l-nav-logo">
          <div className="l-nav-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <span className="l-nav-name">Shorts Agency OS</span>
        </Link>
        <div className="l-nav-links">
          <a href="#c-how">How it works</a>
          <a href="#score-sec">The 7.0 rule</a>
          <a href="#c-feats">Features</a>
        </div>
        <Link href="/app" className="l-nav-cta">
          Open workspace
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </Link>
      </nav>

      {/* HERO */}
      <section id="c-hero">
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-badge"><span className="badge-dot"/>Built for short-form content agencies</div>
            <h1 className="hero-h1" id="heroH1">
              <span className="line"><span>Find leads.</span></span>
              <span className="line"><span><em>Score them.</em></span></span>
              <span className="line"><span><span className="outline">Close faster.</span></span></span>
            </h1>
            <p className="hero-sub" id="heroSub">The only CRM engineered for agencies turning long-form content into Shorts, Reels, and TikToks. AI finds the gap, scores the opportunity, and writes the DM — all from one dark workspace.</p>
            <div className="hero-actions" id="heroActions">
              <Link href="/app" className="btn-red">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Open workspace — free
              </Link>
              <a href="#c-how" className="btn-ghost">See how it works <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></a>
            </div>
            <div className="hero-proof" id="heroProof">
              <div className="avs">
                {[["JR","#FF2D55,#FF9500"],["KM","#00F5D4,#007AFF"],["AS","#16FF7A,#30D158"],["TL","#FFB703,#FF6B35"],["PW","#BF5AF2,#FF2D55"]].map(([i,g])=>(
                  <span key={i} className="av" style={{background:`linear-gradient(135deg,${g})`}}>{i}</span>
                ))}
              </div>
              <div className="proof-text"><strong>340+ agencies</strong> closed their first deal<br/>within 72 hours of using the tool</div>
            </div>
          </div>

          {/* MOCKUP */}
          <div className="hero-right" id="heroRight" style={{paddingTop:"20px"}}>
            <div className="mockup" id="mockupEl">
              <div className="mock-bar">
                <div className="dots"><span style={{background:"#FF5F57"}}/><span style={{background:"#FFBD2E"}}/><span style={{background:"#28CA41"}}/></div>
                <span className="mock-title">shorts-agency-os / workspace</span>
                <div className="mock-pills"><span className="mpill on">Leads</span><span className="mpill off">Find</span><span className="mpill off">Close</span></div>
              </div>
              <div className="mock-body">
                <div className="mock-main">
                  <div className="m-lead">
                    <div className="m-lead-hd">
                      <div className="m-av" style={{background:"linear-gradient(135deg,#FF2D55,#FF9500)"}}>FL</div>
                      <div style={{minWidth:0,flex:1}}><div className="m-name">Founders Lab Podcast</div><div className="m-sub">@founderslabpod · business podcast</div></div>
                      <div style={{textAlign:"right",flexShrink:0}}><div className="m-score" style={{color:"#00F5D4"}}>8.4</div><div className="m-score-lbl">Hot lead</div></div>
                    </div>
                    <div className="m-chips">
                      <span className="m-chip" style={{background:"rgba(255,45,85,.15)",color:"#FF2D55"}}>42.8K YT</span>
                      <span className="m-chip" style={{background:"rgba(0,245,212,.12)",color:"#00F5D4"}}>8.7K IG</span>
                      <span className="m-chip" style={{background:"rgba(22,255,122,.12)",color:"#16FF7A"}}>18 long vids</span>
                    </div>
                    <div className="m-bars">
                      {[["Short-Form Gap","90%","#00F5D4"],["Money Signal","80%","#FFB703"],["Urgency","80%","#FF2D55"]].map(([l,w,c])=>(
                        <div key={l} className="m-br"><span className="m-br-l">{l}</span><div className="m-br-t"><div className="m-br-f" style={{width:w,background:c}}/></div></div>
                      ))}
                    </div>
                  </div>
                  {[["FF","linear-gradient(135deg,#00F5D4,#007AFF)","Forge Fitness Austin","15.3K IG","7.2","rgba(255,183,3,.12)","#FFB703","Contacted"],
                    ["MO","linear-gradient(135deg,#16FF7A,#30D158)","Maya Ops Daily","22.1K X","8.9","rgba(0,245,212,.1)","#00F5D4","Booked"]].map(([av,bg,name,sub,score,sbg,sc,stage])=>(
                    <div key={name} className="m-sm">
                      <div className="m-sm-av" style={{background:bg}}>{av}</div>
                      <div style={{minWidth:0,flex:1}}><div className="m-sm-n">{name}</div><div className="m-sm-s">{sub}</div></div>
                      <div style={{display:"flex",alignItems:"center",gap:"6px",flexShrink:0}}>
                        <span style={{fontFamily:"'DM Mono',monospace",fontSize:"13px",color:sc,fontWeight:500}}>{score}</span>
                        <span className="m-stg" style={{background:sbg,color:sc}}>{stage}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mock-side">
                  {[["Hot Leads","12","#00F5D4"],["Reply Rate","34%","#FFB703"],["Revenue","$14.2K","#16FF7A"]].map(([l,v,c])=>(
                    <div key={l} className="m-met"><div className="m-met-l">{l}</div><div className="m-met-v" style={{color:c}}>{v}</div></div>
                  ))}
                  <button className="m-gen">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    Generate DM
                  </button>
                </div>
              </div>
            </div>
            <div className="float-badge fb1"><div className="fb-l">NEW MESSAGE</div><div className="fb-v" style={{color:"#00F5D4"}}>Reply received</div><div className="fb-s">@founderslabpod · 3 min ago</div></div>
            <div className="float-badge fb2"><div className="fb-l">AI SCORED</div><div className="fb-v" style={{color:"#FF2D55"}}>8.4 / 10</div><div className="fb-s">Hot lead — generate DM</div></div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="ticker">
        <div className="ticker-track">
          {[...Array(2)].map((_,i)=>(
            <span key={i} style={{display:"contents"}}>
              {["18 long videos → <1 Short> → money left on the table","42K YouTube subs → <0 Reels> → your pitch writes itself","Score 8.4 → <generate DM> → reply in 4 hours","184 Google reviews → <no short-form> → easiest close of the week","Below <7.0?> → AI blocked → don't waste the credit"].map((item,j)=>{
                const parts = item.split(/(<[^>]+>)/);
                return <span key={j} className="ticker-item">{parts.map((p,k)=> p.startsWith('<') ? <strong key={k}>{p.slice(1,-1)}</strong> : p)}&nbsp;&nbsp;·&nbsp;&nbsp;</span>;
              })}
            </span>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div className="stats-strip">
        <div className="stats-inner">
          {[{n:"340",s:"+",c:"#FF2D55",l:"Agencies using the workspace to source and close short-form clients"},
            {n:"34",s:"%",c:"#00F5D4",l:"Average reply rate when AI outreach is built from actual lead data"},
            {n:"142",s:"K",p:"$",c:"#16FF7A",l:"Average monthly revenue tracked inside the pipeline per active user"},
            {n:"4",s:" min",c:"#FFB703",l:"Median time from finding a lead to sending the first AI-written message"}
          ].map(({n,s,c,l,p=""})=>(
            <div key={n} className="c-stat reveal-up">
              <div className="stat-n" style={{color:c}} data-count={n} data-suffix={s} data-prefix={p}>{p}0{s}</div>
              <div className="stat-lbl">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PROBLEM / SOLUTION */}
      <section className="sec">
        <div className="container">
          <span className="sec-tag reveal-up">The problem</span>
          <h2 className="sec-h reveal-up d1">You&rsquo;re working <em>harder</em><br/>than you need to.</h2>
          <div className="pvs reveal-up d2">
            <div className="pvs-hd">
              <div className="pvs-col" style={{color:"rgba(255,45,85,.6)"}}>✕ The old way</div>
              <div className="pvs-col" style={{color:"rgba(0,245,212,.6)"}}>✓ With Shorts Agency OS</div>
            </div>
            {[["Generic \u201CI love your content\u201D DMs that get 2% reply rates","Messages that open with their actual sub count, reel gap, and missed revenue"],
              ["Burning AI credits on cold leads with no money signal","Hard 7.0 threshold — the AI won't write a word for leads that won't close"],
              ["Searching YouTube, Instagram, and Maps in three separate tabs","One query hits all three and enriches every result with follower counts automatically"],
              ["Deal value never logged — revenue dashboard shows $0 all month","Modal fires the second a lead hits Booked or Closed. Revenue always current"],
            ].map(([bad,good],i)=>(
              <div key={i} className="pvs-row">
                <div className="pvs-cell" style={{color:"rgba(250,250,248,.45)"}}><span style={{flexShrink:0}}>✕</span>{bad}</div>
                <div className="pvs-cell" style={{fontWeight:600}}><span style={{color:"#00F5D4",flexShrink:0}}>✓</span>{good}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="sec" id="c-how" style={{background:"rgba(255,255,255,.015)"}}>
        <div className="container">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"60px",alignItems:"end"}} className="reveal-up">
            <div><span className="sec-tag">How it works</span><h2 className="sec-h">Four steps.<br/><em>One workspace.</em></h2></div>
            <p className="sec-p" style={{marginTop:0}}>From zero context about a lead to a personalized DM sent — in under four minutes. Every step is AI-assisted.</p>
          </div>
          <div className="steps reveal-up d1">
            {[{n:"01/04",c:"#FF2D55",bg:"rgba(255,45,85,.12)",t:"Find",b:"One search hits YouTube, Instagram, and Google Maps simultaneously. Pre-enriched with follower counts, reel deficits, and review signals.",icon:<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>},
              {n:"02/04",c:"#FFB703",bg:"rgba(255,183,3,.1)",t:"Score",b:"AI scores every lead 1–10 across content weakness, short-form gap, money signal, urgency, and platform presence. Leads under 7.0 are hard-blocked.",icon:<><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>},
              {n:"03/04",c:"#00F5D4",bg:"rgba(0,245,212,.08)",t:"Message",b:"One click. The AI opens with their sharpest content gap — their actual numbers. Under four lines for DMs. Ends with a question, not a pitch.",icon:<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>},
              {n:"04/04",c:"#16FF7A",bg:"rgba(22,255,122,.08)",t:"Close",b:"Drag-and-drop Kanban. Deal value fires on Booked. Revenue dashboard tracks what actually closed — not projections, not pipeline fantasy.",icon:<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>}
            ].map((s)=>(
              <div key={s.n} className="step">
                <div className="step-n">{s.n}</div>
                <div className="step-ico" style={{background:s.bg}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
                </div>
                <div className="step-t">{s.t}</div>
                <div className="step-b">{s.b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SCORE GATE */}
      <section id="score-sec">
        <div className="score-inner">
          <div className="score-visual reveal-left">
            <div className="dial">
              <svg viewBox="0 0 220 220" fill="none" width="220" height="220">
                <circle cx="110" cy="110" r="90" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeDasharray="502" strokeDashoffset="126" strokeLinecap="round" transform="rotate(135 110 110)"/>
                <circle cx="110" cy="110" r="90" stroke="rgba(255,45,85,0.3)" strokeWidth="12" strokeDasharray="251 251" strokeDashoffset="126" strokeLinecap="round" transform="rotate(135 110 110)"/>
                <circle id="hotArc" cx="110" cy="110" r="90" stroke="#00F5D4" strokeWidth="12" strokeDasharray="0 502" strokeDashoffset="-125" strokeLinecap="round" transform="rotate(135 110 110)" style={{transition:"stroke-dasharray 1.2s cubic-bezier(.16,1,.3,1)"}}/>
                <line x1="110" y1="22" x2="110" y2="40" stroke="#FFB703" strokeWidth="2.5" strokeLinecap="round" transform="rotate(126 110 110)"/>
              </svg>
              <div className="dial-num"><span className="dial-n">7.0</span><span className="dial-l">threshold</span></div>
            </div>
            <div className="legend">
              {[["#00F5D4","0 0 8px #00F5D4","7.0 – 10 · Hot","AI outreach unlocked"],
                ["#FFB703","","6.0 – 6.9 · Warm","Rescore or pass"],
                ["#FF2D55","","Below 6.0 · Cold","Hard blocked"]
              ].map(([c,sh,t,s])=>(
                <div key={t} className="leg-row"><div className="leg-dot" style={{background:c,boxShadow:sh}}/><div className="leg-t"><strong>{t}</strong><span>{s}</span></div></div>
              ))}
            </div>
          </div>
          <div className="reveal-right">
            <span className="sec-tag">The 7.0 rule</span>
            <h2 className="sec-h" style={{fontSize:"clamp(32px,3.5vw,54px)"}}>Not every lead deserves <em>your time.</em></h2>
            <div className="rule-box">
              <p>The AI evaluates <strong>content weakness</strong>, <strong>short-form gap</strong>, <strong>money signal</strong>, <strong>urgency</strong>, and <strong>platform presence</strong> — then produces a single score.</p>
              <p>Any lead below <strong>7.0</strong> is flagged cold and <strong>blocked from AI generation</strong>. The DM button grays out. You can&apos;t accidentally message a lead who won&apos;t close.</p>
              <p>This isn&apos;t a suggestion. It&apos;s a hard gate. <strong>Your credits, your time, and your conversion rate are protected by default.</strong></p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="sec" id="c-feats">
        <div className="container">
          <span className="sec-tag reveal-up">Features</span>
          <h2 className="sec-h reveal-up d1">Everything you need.<br/><em>Nothing you don&apos;t.</em></h2>
          <div className="feats-grid">
            {[{n:"01",ic:"#00F5D4",ibg:"rgba(0,245,212,.09)",t:"Cross-platform search",b:"YouTube, Instagram, and Google Maps in a single query. Auto-enriched with follower counts, reel deficits, and review signals.",icon:<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,pre:<><div className="fp-row"><span className="fp-n">YouTube</span><span style={{color:"#FF2D55"}}>✓ live</span></div><div className="fp-row"><span className="fp-n">Instagram</span><span style={{color:"#FF2D55"}}>✓ live</span></div><div className="fp-row"><span className="fp-n">Google Maps</span><span style={{color:"#FF2D55"}}>✓ live</span></div><div className="fp-row"><span className="fp-n">Auto-enrichment</span><span style={{color:"#00F5D4"}}>✓ on</span></div></>},
              {n:"02",ic:"#FF2D55",ibg:"rgba(255,45,85,.09)",t:"Evidence-based outreach",b:'Every message references their exact sub count, reel deficit, missing platforms. No placeholders. No "I hope this finds you well."',icon:<><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>,pre:<div style={{padding:"4px 0",color:"rgba(255,255,255,.55)",lineHeight:1.6,fontSize:"10px"}}>&quot;Hey @founderslabpod — you have 18 long videos and 42K subs but only 1 Short.<br/><br/>Would 3 clip ideas from your existing library be useful?&quot;<div style={{height:"3px",borderRadius:"99px",background:"#00F5D4",width:"55%",marginTop:"10px"}}/><div style={{fontSize:"9px",color:"rgba(255,255,255,.3)",marginTop:"4px"}}>38 chars · DM-ready</div></div>},
              {n:"03",ic:"#16FF7A",ibg:"rgba(22,255,122,.08)",t:"Revenue pipeline",b:"Drag-and-drop Kanban. Deal value auto-prompts on Booked. Closed revenue and pipeline value always live in the dashboard.",icon:<><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="16" x2="12" y2="16"/></>,pre:<><div className="fp-row"><span className="fp-n">Prospect</span><span style={{color:"rgba(255,255,255,.4)"}}>6 leads</span></div><div className="fp-row"><span className="fp-n">Replied</span><span style={{color:"#FFB703"}}>3 leads</span></div><div className="fp-row"><span className="fp-n">Booked</span><span style={{color:"#00F5D4"}}>2 · $5K</span></div><div className="fp-row"><span className="fp-n">Closed</span><span style={{color:"#16FF7A"}}>1 · $2.5K</span></div></>}
            ].map((f,i)=>(
              <div key={i} className={`feat reveal-up${i>0?" d"+i:""}`}>
                <div className="feat-n">{f.n}</div>
                <div className="feat-ico" style={{background:f.ibg}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={f.ic} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{f.icon}</svg>
                </div>
                <div className="feat-t">{f.t}</div>
                <div className="feat-b">{f.b}</div>
                <div className="feat-pre">{f.pre}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="sec" style={{background:"rgba(255,255,255,.015)"}}>
        <div className="container">
          <span className="sec-tag reveal-up">Results</span>
          <h2 className="sec-h reveal-up d1">Agencies that ship,<br/><em>not just pitch.</em></h2>
          <div className="tests reveal-up d2">
            {[{av:"JR",bg:"linear-gradient(135deg,#FF2D55,#FF9500)",q:"The score threshold alone saved me. I was burning Grok credits on leads that had no money signal. My reply rate went from 8% to 31% because I'm only messaging hot leads.",name:"Jordan R.",role:"clips agency · 3 clients week 1"},
              {av:"KM",bg:"linear-gradient(135deg,#00F5D4,#007AFF)",q:"The DM that got my first reply opened with the exact sub count and reel count. The prospect said 'how did you know that?' That's the difference between a template and this tool.",name:"Kayla M.",role:"short-form studio · $8.4K month 1"},
              {av:"AS",bg:"linear-gradient(135deg,#16FF7A,#007AFF)",q:"I used to spend 3 hours a day doing manual research. Now I hit auto search, score the batch, and I'm sending DMs in 20 minutes. There's no going back.",name:"Alex S.",role:"content repurposing · 9 clients"}
            ].map((t,i)=>(
              <div key={i} className="test">
                <div className="stars">★★★★★</div>
                <p className="quote">&ldquo;{t.q}&rdquo;</p>
                <div className="t-auth"><div className="t-av" style={{background:t.bg}}>{t.av}</div><div><div className="t-name">{t.name}</div><div className="t-role">{t.role}</div></div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="c-cta">
        <div className="cta-bg"/>
        <div className="cta-inner reveal-up">
          <h2 className="cta-h">Start closing<br/><em>today.</em></h2>
          <p className="cta-sub">No account required. Demo data loads instantly.<br/>Add your API keys when you&apos;re ready to go live.</p>
          <div className="cta-acts">
            <Link href="/app" className="btn-red" style={{height:"62px",padding:"0 36px",fontSize:"16px"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Open workspace — it&apos;s free
            </Link>
          </div>
          <p className="cta-note">no credit card · no setup · no waitlist</p>
        </div>
      </section>

      <footer className="l-footer">
        <div className="foot-logo">
          <div className="foot-icon"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>
          Shorts Agency OS
        </div>
        <div className="foot-tag">Built for agencies that ship clips, not decks.</div>
      </footer>
    </>
  );
}
