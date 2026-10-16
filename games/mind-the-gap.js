/* Mind the Gap: guess the word that the AI will choose next.
   The odds are real: they come from an open AI model (see mind-the-gap-data.js and _build/games/gap_build.py).
   Lesson: AI writes one word at a time. It picks a likely word from patterns. It is a very good guesser, not a know-it-all. */
(function () {
  "use strict";
  const ROUNDS = 5;
  const DATA = window.MIND_THE_GAP;

  const CSS = `
  .mtg{max-width:1080px;margin:0 auto;padding:28px 24px 40px;min-height:100%;display:flex;flex-direction:column}
  .mtg-intro{display:grid;grid-template-columns:1.3fr 1fr;gap:28px;align-items:center;flex:1}
  .mtg-intro .col{display:flex;flex-direction:column;gap:16px;align-items:flex-start}
  .mtg-intro h1{font-size:clamp(46px,6vw,76px);font-weight:900;letter-spacing:-.025em}
  .mtg-intro p.lead{font-size:23px;color:var(--body-alt);margin:0}
  .mtg-tube{background:var(--cover);border-radius:28px;padding:32px;color:#fff;display:flex;flex-direction:column;gap:16px;box-shadow:var(--sh-lg)}
  .mtg-tube .sent{font:900 34px/1.25 var(--head);color:#fff}
  .mtg-gap{display:inline-block;min-width:150px;padding:0 14px;border-bottom:6px solid var(--gold);color:var(--gold);text-align:center;animation:mtgBlink 1.2s ease infinite}
  @keyframes mtgBlink{50%{border-color:rgba(254,197,0,.35)}}
  .mtg-gap.filled{animation:none;color:#fff;border-color:#fff}
  .mtg-head{display:flex;align-items:center;gap:16px;margin-bottom:18px}
  .mtg-dots{display:flex;gap:8px}
  .mtg-dots i{width:16px;height:16px;border-radius:50%;background:var(--hair)}
  .mtg-dots i.on{background:var(--gold)}.mtg-dots i.miss{background:var(--subtle)}.mtg-dots i.now{outline:3px solid var(--navy);outline-offset:2px}
  .mtg-score{margin-left:auto;font:900 22px var(--head);color:var(--navy)}
  .mtg-q{background:#fff;border:1px solid var(--hair);border-radius:28px;padding:30px 34px;box-shadow:var(--sh-md);font:900 clamp(30px,3.6vw,46px)/1.25 var(--head);color:var(--navy)}
  .mtg-q .mtg-gap{color:var(--navy);border-color:var(--gold)}
  .mtg-q .mtg-gap.filled{color:var(--navy);border-color:var(--navy)}
  .mtg-ask{font:800 18px var(--head);color:var(--blue-mid);margin:22px 0 12px}
  .mtg-opts{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .mtg-opt{position:relative;min-height:92px;border-radius:22px;background:#fff;border:3px solid var(--hair);box-shadow:var(--sh-sm);
    font:900 30px var(--head);color:var(--navy);display:flex;align-items:center;gap:16px;padding:0 24px;overflow:hidden;text-align:left;transition:transform .12s}
  .mtg-opt:active{transform:scale(.98)}
  .mtg-opt .bar{position:absolute;left:0;top:0;bottom:0;width:0;background:linear-gradient(90deg,rgba(254,197,0,.55),rgba(254,197,0,.25));transition:width 1s cubic-bezier(.2,.8,.2,1)}
  .mtg-opt .w,.mtg-opt .pc,.mtg-opt .tags{position:relative}
  .mtg-opt .pc{margin-left:auto;font:900 28px var(--head);font-variant-numeric:tabular-nums;opacity:0;transition:opacity .3s .6s}
  .mtg-opt .tags{display:flex;flex-direction:column;gap:4px;align-items:flex-start}
  .mtg-tag{font:800 12px var(--head);letter-spacing:.1em;text-transform:uppercase;padding:4px 10px;border-radius:999px}
  .mtg-tag.ai{background:var(--navy);color:#fff}.mtg-tag.you{background:var(--gold);color:var(--navy)}
  .mtg-opts.shown .mtg-opt{cursor:default}
  .mtg-opts.shown .pc{opacity:1}
  .mtg-opt.top{border-color:var(--navy)}
  .mtg-opt.pick{box-shadow:0 0 0 4px var(--gold)}
  .mtg-out{margin-top:18px;display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center}
  .mtg-verdict{border-radius:20px;padding:16px 20px;font:700 19px/1.35 var(--head);color:var(--navy);background:#fff;border:2px solid var(--hair)}
  .mtg-verdict b{display:block;font:900 24px var(--head);margin-bottom:4px}
  .mtg-verdict.win{border-color:#7FB53F;background:#F1F8E8}
  .mtg-verdict.twist{background:#FBE3EF;border-color:#D44F9A;color:#5A1240}
  .mtg-conf{display:inline-block;margin-top:8px;font:800 13px var(--head);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
  .mtg-src{font-size:13px;color:var(--muted);margin-top:14px}
  .mtg-end{display:grid;grid-template-columns:1.2fr 1fr;gap:24px;align-items:start}
  .mtg-end .col{display:flex;flex-direction:column;gap:16px}
  .mtg-big{background:var(--cover);color:#fff;border-radius:24px;padding:28px}
  .mtg-big .eyebrow{color:var(--gold)}
  .mtg-big h2{color:#fff;font-size:46px;font-weight:900;margin:6px 0}
  .mtg-big p{margin:0;font-size:20px;color:#DCE6F5}
  .mtg-today{background:#fff;border:1px solid var(--hair);border-radius:20px;padding:18px 20px;display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .mtg-today b{display:block;font:900 40px/1 var(--head);color:var(--navy)}
  .mtg-today span{font:700 12px var(--head);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
  @media (max-width:900px){.mtg-intro,.mtg-end{grid-template-columns:1fr}.mtg-opts{grid-template-columns:1fr}.mtg-out{grid-template-columns:1fr}}
  `;

  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function pct(o) {
    if (o.below) return `under ${Math.max(1, Math.ceil(o.floor))}%`;
    if (o.p < 0.1) return "under 0.1%";
    if (o.p < 10) return o.p.toFixed(1) + "%";
    return Math.round(o.p) + "%";
  }
  function niceDate(iso) {
    const d = new Date(iso + "T12:00:00"), n = d.getDate(), s = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
    return `${n}${s} ${d.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`;
  }
  const conf = (p) => (p >= 70 ? "Very sure" : p >= 35 ? "Quite sure" : "Not very sure");

  function mount(el, api) {
    const { esc, sound, stats, idle, store } = api;
    const style = document.createElement("style"); style.textContent = CSS; el.appendChild(style);
    const root = document.createElement("div"); root.className = "mtg"; el.appendChild(root);
    let timers = [], alive = true;
    const later = (fn, ms) => { const t = setTimeout(() => alive && fn(), ms); timers.push(t); return t; };
    const dayKey = () => "mtg:" + new Date().toISOString().slice(0, 10);

    function intro() {
      idle(true);
      const t = store.get(dayKey(), { n: 0, perfect: 0 });
      root.innerHTML = `<div class="mtg-intro">
        <div class="col">
          <span class="imagine">Real AI odds</span>
          <h1>Mind the Gap</h1>
          <p class="lead">AI writes one word at a time. Every word is a guess. Can you guess what it will say next?</p>
          <button class="btn btn-gold" id="go">Play · 5 rounds</button>
          <div class="small-note">${t.n ? `${t.n} people played today. ${t.perfect} got 5 out of 5.` : "Be the first to play today."}</div>
        </div>
        <div class="mtg-tube" aria-hidden="true">
          <div class="eyebrow" style="color:var(--gold)">How AI writes</div>
          <div class="sent" id="demoS"></div>
          <div id="demoBars" style="display:grid;gap:10px"></div>
        </div>
      </div>`;
      root.querySelector("#go").addEventListener("click", () => { sound.tap(); startGame(); });
      demo();
    }

    function demo() {
      // A good night's ___ : the model's real odds for the next word
      const s = root.querySelector("#demoS"), bars = root.querySelector("#demoBars");
      if (!s) return;
      const words = DATA.demo.s.split(" ");
      let i = 0;
      s.innerHTML = "";
      bars.innerHTML = "";
      const step = () => {
        if (!root.querySelector("#demoS")) return;
        if (i < words.length) { s.innerHTML = words.slice(0, ++i).map(esc).join(" ") + ` <span class="mtg-gap">?</span>`; later(step, 420); return; }
        bars.innerHTML = DATA.demo.opts.map((o) => `<div style="display:grid;grid-template-columns:90px 1fr 60px;gap:10px;align-items:center;font:800 20px var(--head)">
          <span>${esc(o.w)}</span><span style="height:16px;border-radius:8px;background:rgba(255,255,255,.18);overflow:hidden"><i style="display:block;height:100%;width:0;background:var(--gold);transition:width 1s ease" data-w="${o.p}"></i></span><span>${Math.round(o.p)}%</span></div>`).join("");
        requestAnimationFrame(() => requestAnimationFrame(() => bars.querySelectorAll("i").forEach((b) => (b.style.width = b.dataset.w + "%"))));
        later(() => { if (root.querySelector("#demoS")) s.innerHTML = words.map(esc).join(" ") + ` <span class="mtg-gap filled">${esc(DATA.demo.opts[0].w)}</span>`; }, 1500);
        later(() => { i = 0; demo(); }, 5200);
      };
      step();
    }

    let G;
    function startGame() {
      idle(false);
      stats.add("mind-the-gap", "plays");
      G = { list: shuffle(DATA.rounds).slice(0, ROUNDS - 1).concat([Object.assign({ twist: true }, DATA.twist)]), i: 0, score: 0, res: [] };
      round();
    }

    function head() {
      return `<div class="mtg-head"><div class="eyebrow">Round ${G.i + 1} of ${ROUNDS}</div>
        <div class="mtg-dots">${Array.from({ length: ROUNDS }, (_, k) => `<i class="${G.res[k] === true ? "on" : G.res[k] === false ? "miss" : ""} ${k === G.i ? "now" : ""}"></i>`).join("")}</div>
        <div class="mtg-score">Score ${G.score}</div></div>`;
    }

    function round() {
      const r = G.list[G.i];
      const opts = shuffle(r.opts);
      root.innerHTML = `${head()}
        <div class="mtg-q">${esc(r.s)} <span class="mtg-gap" id="gap">?</span></div>
        <div class="mtg-ask">Tap the word that you think the AI will choose.</div>
        <div class="mtg-opts" id="opts">${opts.map((o, k) => `<button class="mtg-opt" data-k="${k}"><span class="bar"></span><span class="w">${esc(o.w)}</span><span class="tags"></span><span class="pc">${esc(pct(o))}</span></button>`).join("")}</div>
        <div id="out"></div>`;
      root.querySelectorAll(".mtg-opt").forEach((b) => b.addEventListener("click", () => reveal(r, opts, +b.dataset.k), { once: true }));
    }

    function reveal(r, opts, k) {
      const box = root.querySelector("#opts");
      if (box.classList.contains("shown")) return;
      box.classList.add("shown");
      const topIdx = opts.reduce((m, o, i) => (o.p > opts[m].p ? i : m), 0);
      const won = k === topIdx;
      G.res[G.i] = won; if (won) G.score++;
      won ? sound.great() : sound.meh();
      const btns = box.querySelectorAll(".mtg-opt");
      btns.forEach((b, i) => {
        b.disabled = true;
        b.querySelector(".bar").style.width = Math.max(1.5, opts[i].p) + "%";
        const tags = [];
        if (i === topIdx) { b.classList.add("top"); tags.push(`<span class="mtg-tag ai">AI's pick</span>`); }
        if (i === k) { b.classList.add("pick"); tags.push(`<span class="mtg-tag you">Your pick</span>`); }
        b.querySelector(".tags").innerHTML = tags.join("");
      });
      const gap = root.querySelector("#gap"); gap.textContent = opts[topIdx].w; gap.classList.add("filled");
      root.querySelector(".mtg-score").textContent = "Score " + G.score;
      const last = G.i === ROUNDS - 1;
      const title = r.twist ? "Very sure. But it does not know your hotel." : won ? "You think like the AI! +1" : `The AI picked "${opts[topIdx].w}".`;
      root.querySelector("#out").innerHTML = `<div class="mtg-out">
        <div class="mtg-verdict ${r.twist ? "twist" : won ? "win" : ""}"><b>${esc(title)}</b>${esc(r.note)}
          <span class="mtg-conf">AI confidence: ${conf(opts[topIdx].p)} (${esc(pct(opts[topIdx]))})</span></div>
        <button class="btn btn-gold" id="next">${last ? "See my score" : "Next round"}</button></div>`;
      root.querySelector("#next").addEventListener("click", () => { sound.tap(); G.i++; last ? end() : round(); });
      idle(true);
    }

    function end() {
      sound.end();
      const t = store.get(dayKey(), { n: 0, perfect: 0 });
      t.n++; if (G.score === ROUNDS) t.perfect++;
      store.set(dayKey(), t);
      stats.add("mind-the-gap", "points", G.score);
      const msg = G.score === ROUNDS ? "Perfect! You think just like the AI." : G.score >= 3 ? "Good guessing. You spotted the patterns." : "You think like a hotel person, not like an AI. That is a good thing.";
      root.innerHTML = `<div class="mtg-end">
        <div class="col">
          <div class="mtg-big"><div class="eyebrow">Your score</div><h2>${G.score} out of ${ROUNDS}</h2><p>${esc(msg)}</p></div>
          <div class="lesson-card"><div class="eyebrow">What this shows about AI</div>
            <p>AI writes one word at a time. It picks a likely word from patterns in what it read. It is a very good guesser, not a know-it-all. So always read what it writes.</p></div>
          <div class="mtg-src">The odds are real. They come from ${esc(DATA.model)}, made on ${esc(niceDate(DATA.made))}.</div>
        </div>
        <div class="col">
          <div class="mtg-today"><div><b>${t.n}</b><span>Played today</span></div><div><b>${t.perfect}</b><span>Got 5 out of 5</span></div></div>
          <div class="btn-row" style="justify-content:flex-start"><button class="btn btn-gold" id="again">Play again</button><button class="btn btn-ghost" id="home">All games</button></div>
        </div></div>`;
      root.querySelector("#again").addEventListener("click", () => { sound.tap(); startGame(); });
      root.querySelector("#home").addEventListener("click", () => { sound.tap(); api.home(); });
      idle(true);
    }

    intro();
    return () => { alive = false; timers.forEach(clearTimeout); };
  }

  Arcade.register({
    id: "mind-the-gap",
    title: "Mind the Gap",
    tagline: "AI writes one word at a time. Guess the word it will choose next.",
    lesson: "how AI writes, and why it can be wrong",
    emoji: "🎯",
    time: "5 rounds · 2 min",
    colours: ["#1FAE97", "#0E5F55"],
    tally(store, day) { const t = store.get("mtg:" + day, { n: 0, perfect: 0 }); return [[t.n, "Played today"], [t.perfect, "Got 5 out of 5"]]; },
    mount,
  });
})();
