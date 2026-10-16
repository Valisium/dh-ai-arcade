/* AI Arcade core: router, top bar, sound, storage, leaderboard, idle reset and admin.
   To add a game: make games/<id>.js that calls Arcade.register({...}), then add it to index.html and sw.js. */
(function () {
  "use strict";
  const VERSION = "Version 0.5 · 16th October 2026";
  const IDLE_SECONDS = 60;      // in a game: back to the landing page
  const ATTRACT_SECONDS = 30;   // on the landing page: show the scoreboard
  const BOARD_SECONDS = 20;     // on the scoreboard: back to the landing page

  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const today = () => new Date().toISOString().slice(0, 10);
  function niceDate(iso) {
    const d = new Date(iso + "T12:00:00"), n = d.getDate(), s = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
    return `${n}${s} ${d.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`;
  }
  const hhmm = (t) => new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  /* ---------- storage (never trust it to exist) ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem("arcade:" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("arcade:" + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem("arcade:" + k); } catch (e) {} },
    keys() { try { return Object.keys(localStorage).filter((k) => k.startsWith("arcade:")).map((k) => k.slice(7)); } catch (e) { return []; } },
  };

  /* ---------- sound: tiny synth, no files ---------- */
  let ctx = null;
  let muted = store.get("muted", false);
  function tone(freq, dur, type = "sine", vol = 0.12, when = 0, slide = 0) {
    if (muted) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      const t = ctx.currentTime + when, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  const sound = {
    tap() { tone(660, 0.06, "triangle", 0.08); },
    good() { tone(660, 0.1, "triangle"); tone(990, 0.16, "triangle", 0.12, 0.08); },
    great() { tone(523, 0.1, "triangle"); tone(659, 0.1, "triangle", 0.12, 0.08); tone(784, 0.2, "triangle", 0.12, 0.16); },
    meh() { tone(330, 0.16, "sine", 0.1); },
    bounce() { tone(420, 0.18, "square", 0.06, 0, 0.5); tone(300, 0.12, "triangle", 0.08, 0.16); },
    swipe() { tone(900, 0.09, "sine", 0.05, 0, 0.4); },
    tick() { tone(1200, 0.03, "square", 0.03); },
    end() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, "triangle", 0.12, i * 0.11)); },
  };
  function paintSound() {
    $("#tbSound").innerHTML = muted
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="m16 9.5 5 5m0-5-5 5"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>';
    $("#tbSound").setAttribute("aria-pressed", String(!muted));
  }

  /* ---------- leaderboard: top five for today, on this iPad ---------- */
  const BLOCK = ["FUCK", "SHIT", "CUNT", "TWAT", "DICK", "COCK", "PISS", "WANK", "PRICK", "ARSE", "BITCH", "SLAG", "NOB", "BOLLOCK", "TOSS"];
  function cleanName(s) {
    s = String(s || "").toUpperCase().replace(/[^A-Z0-9 \-]/g, "").trim().slice(0, 10);
    if (!s || BLOCK.some((b) => s.replace(/[^A-Z]/g, "").includes(b))) return "";
    return s;
  }
  // A game with board.low = true ranks the lowest score first (golf). "d" (seconds, optional) breaks a tie: faster wins.
  const lowWins = (id) => !!games.find((g) => g.id === id)?.board?.low;
  const rankCmp = (id) => { const low = lowWins(id); return (a, b) => (low ? a.s - b.s : b.s - a.s) || (a.d ?? 1e9) - (b.d ?? 1e9) || a.t - b.t; };
  const board = {
    key: (id) => `board:${id}:${today()}`,
    list(id) { return store.get(board.key(id), []); },
    qualifies(id, score, d) {
      const l = board.list(id);
      return score > 0 && (l.length < 5 || rankCmp(id)({ s: score, d, t: Date.now() }, l[l.length - 1]) < 0);
    },
    add(id, name, score, d) {
      const l = board.list(id), entry = { n: name, s: score, t: Date.now() };
      if (d != null) entry.d = d;
      l.push(entry); l.sort(rankCmp(id));
      store.set(board.key(id), l.slice(0, 5));
      return l.indexOf(entry);
    },
    html(id, title, unit, meT) {
      const l = board.list(id);
      return `<div class="board"><h3>${esc(title)}</h3>${l.length ? `<ol>${l.map((e, i) =>
        `<li class="${e.t === meT ? "me" : ""}"><span class="rk">${i + 1}</span><span>${esc(e.n)}</span><span>${esc(e.s)}${unit ? " " + esc(unit) : ""}</span></li>`).join("")}</ol>`
        : `<div class="empty">No scores yet today. Be the first!</div>`}</div>`;
    },
  };

  /* ---------- stats for Chris (admin panel) ---------- */
  const stats = {
    add(id, field, n = 1) { const k = `stats:${today()}`; const s = store.get(k, {}); s[id] = s[id] || {}; s[id][field] = (s[id][field] || 0) + n; store.set(k, s); },
    get() { return store.get(`stats:${today()}`, {}); },
  };

  /* ---------- registry + router ---------- */
  const games = [];
  let cleanup = null, idleTimer = null, idleAllowed = false, idleMs = IDLE_SECONDS * 1000, idleTo = "#/";

  function register(g) { games.push(g); }

  function setTop(label) {
    $("#tbHome").hidden = !label;
    $("#tbTitle").innerHTML = label ? `<small>AI Arcade</small>${esc(label)}` : `<small>Digital Heroes</small>AI Arcade`;
  }

  // Games call idle(true) or idle(false). The landing page and the scoreboard use their own time and target.
  function idle(allow, secs = IDLE_SECONDS, to = "#/") { idleAllowed = !!allow; idleMs = secs * 1000; idleTo = to; poke(); }
  function poke() {
    clearTimeout(idleTimer);
    if (idleAllowed) idleTimer = setTimeout(() => { if (location.hash !== idleTo) go(idleTo); }, idleMs);
  }

  function go(h) { if (location.hash === h) route(); else location.hash = h; }

  function route() {
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    const stage = $("#stage");
    stage.innerHTML = "";
    const screen = document.createElement("div");
    screen.className = "screen";
    stage.appendChild(screen);
    idle(false);
    const m = (location.hash || "").match(/^#\/play\/([\w-]+)/);
    const game = m && games.find((g) => g.id === m[1]);
    if (game) {
      setTop(game.title);
      stats.add(game.id, "opens");
      const api = { screen, sound, store, board, stats, idle, esc, home: () => go("#/"), poke, cleanName };
      cleanup = game.mount(screen, api) || null;
    } else if (location.hash === "#/board") {
      setTop("Scoreboard");
      scoreboard(screen);
      idle(true, BOARD_SECONDS, "#/");
    } else {
      setTop(null);
      landing(screen);
      idle(true, ATTRACT_SECONDS, "#/board");
    }
  }

  /* ---------- scoreboard: what each game shows for today ---------- */
  // A game can give board: {title, unit} (top five) and tally(store, day) → [[number, label], …]. Otherwise: times played.
  function tallyOf(g) {
    return g.tally ? g.tally(store, today()) : [[stats.get()[g.id]?.plays || 0, "Played today"]];
  }
  function leaderLine() {
    // show the first game that has a score today (or the first game with a board, when nobody has played yet)
    const g = games.find((x) => x.board && board.list(x.id).length) || games.find((x) => x.board);
    if (!g) return "";
    const top = board.list(g.id)[0];
    return `<button class="leader" data-board aria-label="See today's scoreboard">
      <span class="cup" aria-hidden="true">🏆</span>
      <span class="ld-body">${top
        ? `<span class="ld-eye">Top of the board today</span><b>${esc(top.n)}</b><span class="ld-sub">${esc(top.s)} ${esc(g.board.unit)} in ${esc(g.title)}</span>`
        : `<span class="ld-eye">Today's scoreboard</span><b>No scores yet</b><span class="ld-sub">Play ${esc(g.title)} and get your name on the board!</span>`}
        <span class="see">See the scoreboard <i aria-hidden="true">›</i></span></span></button>`;
  }
  function scoreboard(el) {
    el.innerHTML = `<div class="sb">
      <div class="sb-hero"><div><div class="eyebrow">Digital Heroes · Hotel Ops Event</div><h1>Today's scoreboard</h1><div class="keyline"></div></div>
        <button class="btn btn-gold" data-home>Play a game</button></div>
      <div class="sb-grid">${games.map((g) => `
        <div class="sb-card">
          <div class="sb-head"><span class="emo" style="background:linear-gradient(135deg,${g.colours[0]} 0%,${g.colours[1]} 100%)" aria-hidden="true">${g.emoji}</span><h2>${esc(g.title)}</h2></div>
          ${g.board ? board.html(g.id, g.board.title, g.board.unit) : ""}
          <div class="sb-chips">${tallyOf(g).map(([n, l]) => `<div><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join("")}</div>
        </div>`).join("")}
      </div></div>`;
    el.querySelector("[data-home]").addEventListener("click", () => { sound.tap(); go("#/"); });
  }
  function scoreText() {
    const s = stats.get(), out = [`AI Arcade: scores for ${niceDate(today())}`, ""];
    games.forEach((g) => {
      out.push(`${g.title} (opened ${s[g.id]?.opens || 0} times, played ${s[g.id]?.plays || 0} times)`);
      if (g.board) {
        const l = board.list(g.id);
        out.push(`${g.board.title}:`);
        out.push(...(l.length ? l.map((e, i) => `${i + 1}. ${e.n}, ${e.s} ${g.board.unit}, ${hhmm(e.t)}`) : ["No scores yet."]));
      }
      if (g.tally) tallyOf(g).forEach(([n, l]) => out.push(`${l}: ${n}`));
      out.push("");
    });
    out.push(VERSION);
    return out.join("\n");
  }
  async function shareScores() {
    const text = scoreText();
    if (navigator.share) {
      try { await navigator.share({ title: "AI Arcade scores", text }); return "Scores shared."; }
      catch (e) { if (e && e.name === "AbortError") return ""; }
    }
    try { await navigator.clipboard.writeText(text); return "Scores copied. Paste them into Notes or an email."; } catch (e) {}
    return null;
  }

  function landing(el) {
    el.innerHTML = `<div class="land">
      <div class="land-hero">
        <div class="eyebrow">Digital Heroes · Hotel Ops Event</div>
        <h1>AI Arcade</h1>
        <p>Quick games about AI. Find out what it is good at, and what stays with you.</p>
        <div class="keyline"></div>
        ${leaderLine()}
      </div>
      <div class="tiles">${games.map((g) => `
        <button class="tile" data-go="${esc(g.id)}" aria-label="Play ${esc(g.title)}">
          <div class="tile-band" style="background:linear-gradient(135deg,${g.colours[0]} 0%,${g.colours[1]} 100%)">
            <span class="emo" aria-hidden="true">${g.emoji}</span><span class="chip">${esc(g.time)}</span>
          </div>
          <div class="tile-body">
            <h2>${esc(g.title)}</h2>
            <p>${esc(g.tagline)}</p>
            <div class="lesson">You learn: ${esc(g.lesson)}</div>
            <div class="go"><span>Tap to play</span><i aria-hidden="true">›</i></div>
          </div>
        </button>`).join("")}
      </div>
      <div class="land-foot">
        <div><div class="tagline">Be Curious. Be Creative. Be a Digital Hero.</div>
        <div class="privacy">All guests and hotels in these games are made up. Scores stay on this iPad.</div></div>
        <div class="spectrum" aria-hidden="true">${["#FB9B1B", "#7FB53F", "#1FAE97", "#2BA6C8", "#3A77FF", "#8466D6", "#A24FC0", "#D44F9A", "#12306B"].map((c, i) => `<i style="background:${c}" class="${i === 2 ? "up" : ""}"></i>`).join("")}</div>
      </div></div>`;
    el.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => { sound.tap(); go("#/play/" + b.dataset.go); }));
    el.querySelector("[data-board]")?.addEventListener("click", () => { sound.tap(); go("#/board"); });
  }

  /* ---------- admin: press and hold the logo for 2 seconds ---------- */
  function admin() {
    const s = stats.get();
    const rows = games.map((g) => `<tr><td>${esc(g.title)}</td><td>${(s[g.id]?.opens || 0)} opened · ${(s[g.id]?.plays || 0)} played</td></tr>`).join("");
    const wrap = document.createElement("div");
    wrap.className = "admin";
    wrap.innerHTML = `<div class="box" role="dialog" aria-label="Admin">
      <div class="eyebrow">Admin · today</div><h2>AI Arcade</h2>
      <table>${rows}</table>
      <div class="btn-row" style="justify-content:flex-start">
        <button class="btn btn-gold" data-a="share">Share today's scores</button>
        <button class="btn btn-ghost" data-a="clear">Clear today's scores</button>
        <button class="btn btn-ghost" data-a="reload">Reload app</button>
        <button class="btn btn-navy" data-a="close">Close</button>
      </div>
      <div class="small-note" id="admMsg">${esc(VERSION)}</div></div>`;
    document.body.appendChild(wrap);
    let armed = false;
    wrap.addEventListener("click", (e) => {
      const a = e.target.closest("[data-a]")?.dataset.a;
      if (a === "close" || e.target === wrap) wrap.remove();
      if (a === "reload") location.reload();
      if (a === "share") {
        shareScores().then((msg) => {
          if (msg) { $("#admMsg").textContent = msg; return; }
          if (msg === "") return;
          // no Share sheet and no clipboard: show the text so Chris can select it
          const ta = document.createElement("textarea");
          ta.className = "adm-text"; ta.readOnly = true; ta.value = scoreText();
          $("#admMsg").replaceWith(ta); ta.select();
        });
      }
      if (a === "clear") {
        if (!armed) { armed = true; e.target.textContent = "Tap again to clear"; return; }
        games.forEach((g) => store.del(board.key(g.id)));
        $("#admMsg").textContent = "Today's scores are cleared.";
        e.target.textContent = "Cleared";
      }
    });
  }
  function holdToOpen(el, ms, fn) {
    let t = null;
    const start = (e) => { t = setTimeout(fn, ms); };
    const stop = () => clearTimeout(t);
    el.addEventListener("pointerdown", start);
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => el.addEventListener(ev, stop));
    el.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  function start() {
    paintSound();
    $("#tbSound").addEventListener("click", () => { muted = !muted; store.set("muted", muted); paintSound(); sound.tap(); });
    $("#tbHome").addEventListener("click", () => { sound.tap(); go("#/"); });
    holdToOpen($("#tbLogo"), 2000, admin);
    ["pointerdown", "keydown"].forEach((ev) => document.addEventListener(ev, poke, { passive: true }));
    document.addEventListener("gesturestart", (e) => e.preventDefault());
    window.addEventListener("hashchange", route);
    if (!location.hash) history.replaceState(null, "", "#/");
    route();
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  window.Arcade = { register, start, go, esc, VERSION };
})();
