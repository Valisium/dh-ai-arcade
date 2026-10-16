/* Prompt Golf: get a good answer from AI in as few shots as you can.
   Each prompt card is one shot. The answers are real: they come from an open AI model
   (see prompt-golf-data.js and _build/games/golf_build.py). Decoy cards (magic words) give no new answer.
   Lesson: tell AI who it is for, the facts, the tone and the length. Magic words do not help. */
(function () {
  "use strict";
  const DATA = window.PROMPT_GOLF;
  const SLOTS = ["who", "facts", "tone", "length"];
  const LABEL = { who: "Who", facts: "Facts", tone: "Tone", length: "Length" };
  const HINT = {
    facts: "No facts: the AI does not know what happened, so it guesses.",
    who: "No reader: the AI does not know who it writes for.",
    tone: "No tone: the AI picks a voice for you.",
    length: "No length: the AI often writes too much.",
  };
  const EMO = { review: "⭐", note: "📋", sign: "🪧" };
  const PICK_UP = 4; // shots over par: the player picks up the ball and the hole ends

  const CSS = `
  .pg{position:absolute;inset:0;display:flex;flex-direction:column;gap:12px;padding:14px 20px calc(14px + var(--safe-b));background:linear-gradient(180deg,#EEF5E6 0%,#F8F9FB 55%)}
  .pg-hud{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
  .pg-hole{background:#2F6B1F;color:#fff;border-radius:999px;padding:7px 14px;font:900 14px var(--head);letter-spacing:.1em;text-transform:uppercase}
  .pg-name{font:900 24px var(--head);color:var(--navy)}
  .pg-sp{flex:1}
  .pg-stat{display:flex;align-items:baseline;gap:6px;background:#fff;border:1px solid var(--hair);border-radius:999px;padding:6px 14px;font:900 22px var(--head);color:var(--navy);font-variant-numeric:tabular-nums}
  .pg-stat small{font:800 11px var(--head);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
  .pg-stat.bump{animation:pgBump .35s ease}
  @keyframes pgBump{40%{transform:scale(1.15)}}
  .pg-main{flex:1;min-height:0;display:grid;grid-template-columns:.9fr 1.1fr;gap:14px}
  .pg-left{display:flex;flex-direction:column;gap:10px;min-height:0}
  .pg-scene{display:flex;gap:12px;align-items:center;background:#fff;border:1px solid var(--hair);border-radius:16px;padding:10px 14px}
  .pg-scene .em{flex:0 0 44px;height:44px;border-radius:12px;background:var(--alt);display:grid;place-items:center;font-size:24px}
  .pg-scene .tx{font:700 15px/1.3 var(--head);color:var(--navy)}
  .pg-scene .tx small{display:block;font:700 12px var(--head);color:var(--muted)}
  .pg-stars{color:#FB9B1B;letter-spacing:2px}
  .pg-prompt{flex:1;min-height:0;overflow-y:auto;background:#fff;border:2px solid var(--navy);border-radius:16px;padding:12px 14px;display:flex;flex-direction:column;gap:6px}
  .pg-prompt .eyebrow{margin-bottom:2px}
  .pg-ln{font:600 14px/1.35 var(--text);color:var(--body);padding:6px 10px;border-radius:10px;background:var(--alt)}
  .pg-ln.task{background:#2F6B1F;color:#fff;font-weight:700}
  .pg-ln.new{animation:pgIn .35s cubic-bezier(.2,.9,.3,1.2) both}
  @keyframes pgIn{from{transform:translateY(12px) scale(.96);opacity:0}}
  .pg-ans{display:flex;flex-direction:column;min-height:0;background:#fff;border-radius:16px;box-shadow:var(--sh-md);border:1px solid var(--hair);overflow:hidden}
  .pg-ans-h{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--hair)}
  .pg-av{flex:0 0 34px;height:34px;border-radius:50%;display:grid;place-items:center;font:900 13px var(--head);color:#fff;background:var(--accent)}
  .pg-ans-h b{font:900 16px var(--head);color:var(--navy);display:block}
  .pg-ans-h small{font-size:12px;color:var(--muted)}
  .pg-wc{margin-left:auto;font:800 13px var(--head);color:var(--muted);white-space:nowrap}
  .pg-body{flex:1;min-height:0;overflow-y:auto;padding:12px 16px;font:400 15px/1.45 var(--text);color:var(--body);white-space:pre-wrap;-webkit-user-select:none;user-select:none}
  .pg-body.wait{color:var(--muted);font-style:italic}
  .pg-foot{border-top:1px solid var(--hair);padding:8px 14px 10px;display:flex;flex-direction:column;gap:6px}
  .pg-checks{display:flex;gap:6px;flex-wrap:wrap}
  .pg-checks span{font:800 12px var(--head);letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;border-radius:999px;background:var(--alt);color:var(--subtle)}
  .pg-checks span.on{background:#E9F5DC;color:#2F6B1F}
  .pg-hint{font:700 14px/1.3 var(--head);color:var(--blue-mid)}
  .pg-tray{display:grid;grid-template-columns:repeat(3,1fr) 150px;gap:10px}
  .pg-card{min-height:70px;border-radius:14px;background:#fff;border:2px solid var(--hair);box-shadow:0 4px 0 #D5DDEB;padding:8px 12px;text-align:left;
    font:600 13.5px/1.3 var(--text);color:var(--navy);display:flex;align-items:center;transition:transform .12s,opacity .3s}
  .pg-card:active{transform:translateY(3px);box-shadow:0 1px 0 #D5DDEB}
  .pg-card.used{opacity:.35;box-shadow:none;transform:none;pointer-events:none;background:#F1F8E8;border-color:#CFE6B5}
  .pg-card.dud{opacity:.35;box-shadow:none;pointer-events:none;background:#FBE3EF;border-color:#F2BCD6;text-decoration:line-through}
  .pg-card.shake{animation:pgShake .4s ease}
  @keyframes pgShake{20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
  .pg-putt{grid-column:4;grid-row:1 / span 2;border-radius:18px;background:var(--gold);color:var(--navy);box-shadow:0 6px 0 #C99C00;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font:900 26px var(--head)}
  .pg-putt small{font:700 13px var(--text)}
  .pg-putt:active{transform:translateY(4px);box-shadow:0 2px 0 #C99C00}
  .pg-bubble{position:absolute;left:50%;top:64px;transform:translateX(-50%);z-index:6;max-width:min(620px,92%);background:#fff;border-radius:18px;border:3px solid var(--hair);
    box-shadow:var(--sh-lg);padding:12px 18px;font:800 18px/1.3 var(--head);color:var(--navy);text-align:center;animation:pgBub .25s ease both}
  .pg-bubble small{display:block;font:600 15px/1.35 var(--text);color:var(--body-alt);margin-top:4px}
  .pg-bubble.bad{border-color:var(--bad)}.pg-bubble.meh{border-color:var(--warn)}
  @keyframes pgBub{from{opacity:0;transform:translate(-50%,-10px)}}
  .pg-flag{position:absolute;inset:0;z-index:10;display:grid;place-items:center;background:rgba(0,30,70,.55);animation:pgFade .2s ease both}
  @keyframes pgFade{from{opacity:0}}
  .pg-flag .box{background:var(--cover);color:#fff;border-radius:28px;padding:30px 40px;text-align:center;box-shadow:var(--sh-lg);display:flex;flex-direction:column;align-items:center;gap:10px;min-width:min(440px,90%);animation:pgPop .45s cubic-bezier(.2,.9,.3,1.3) both}
  @keyframes pgPop{from{transform:scale(.7);opacity:0}}
  .pg-flag .fl{font-size:72px;line-height:1;animation:pgWave 1s ease-in-out infinite alternate;transform-origin:20% 90%}
  @keyframes pgWave{to{transform:rotate(-8deg)}}
  .pg-flag h2{color:#fff;font-size:46px;font-weight:900}
  .pg-flag p{margin:0;font-size:19px;color:#DCE6F5}
  .pg-look{max-width:420px;background:rgba(255,255,255,.14);border-left:4px solid var(--gold);border-radius:10px;padding:10px 14px;font:700 16px/1.35 var(--head);color:#fff;text-align:left}
  .pg-splash{position:absolute;inset:0;z-index:20;display:grid;place-items:center;background:linear-gradient(135deg,#2F6B1F 0%,#1F4E3A 55%,#073763 100%);color:#fff;text-align:center}
  .pg-splash .in{animation:pgPop .5s cubic-bezier(.2,.9,.3,1.3) both}
  .pg-splash .eyebrow{color:var(--gold);font-size:16px}
  .pg-splash h2{color:#fff;font-size:72px;font-weight:900;margin:8px 0}
  .pg-splash p{margin:0;font:800 24px var(--head);color:#DCE6F5}
  .pg-intro{max-width:1100px;margin:0 auto;padding:28px 24px 40px;display:grid;grid-template-columns:1.3fr 1fr;gap:28px;align-items:center;min-height:100%}
  .pg-intro .col{display:flex;flex-direction:column;gap:16px;align-items:flex-start}
  .pg-intro h1{font-size:clamp(46px,6vw,76px);font-weight:900;letter-spacing:-.025em}
  .pg-intro p.lead{font-size:22px;color:var(--body-alt);margin:0}
  .pg-rules{display:grid;gap:10px;width:100%}
  .pg-rules div{display:flex;gap:14px;align-items:center;background:#fff;border:2px solid var(--hair);border-radius:16px;padding:10px 14px}
  .pg-rules i{flex:0 0 46px;height:46px;border-radius:12px;display:grid;place-items:center;font-style:normal;font-size:24px;background:var(--alt)}
  .pg-rules b{font:900 18px var(--head);color:var(--navy);display:block}
  .pg-rules span{font-size:15px;color:var(--body-alt)}
  .pg-res{max-width:1100px;margin:0 auto;padding:28px 24px 40px;display:grid;grid-template-columns:1.2fr 1fr;gap:24px;align-items:start}
  .pg-res .col{display:flex;flex-direction:column;gap:16px}
  .pg-big{background:var(--cover);color:#fff;border-radius:24px;padding:26px 28px}
  .pg-big .eyebrow{color:var(--gold)}
  .pg-big h2{color:#fff;font-size:40px;font-weight:900;margin:6px 0 4px}
  .pg-big .rank{font:800 20px var(--head);color:#FFE58A}
  .pg-holes{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px}
  .pg-holes div{background:rgba(255,255,255,.12);border-radius:16px;padding:12px 14px}
  .pg-holes b{display:block;font:900 34px/1 var(--head);color:#fff}
  .pg-holes span{font:700 12px var(--head);letter-spacing:.08em;text-transform:uppercase;color:#C9D6EC}
  .pg-holes em{display:block;font:800 15px var(--head);font-style:normal;color:#FFE58A;margin-top:4px}
  @media (max-width:900px){
    .pg-main{grid-template-columns:1fr;grid-template-rows:auto 1fr}
    .pg-prompt{max-height:190px}
    .pg-tray{grid-template-columns:1fr 1fr}
    .pg-putt{grid-column:1 / -1;grid-row:auto;min-height:70px;flex-direction:row;gap:12px}
    .pg-intro,.pg-res{grid-template-columns:1fr}
  }
  `;

  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const keyOf = (played) => SLOTS.filter((s) => played.includes(s)).join("+");
  const words = (t) => (t.trim() ? t.trim().split(/\s+/).length : 0);
  function holeName(diff) {
    return diff <= -2 ? "Eagle" : diff === -1 ? "Birdie" : diff === 0 ? "Par" : diff === 1 ? "Bogey" : diff === 2 ? "Double bogey" : diff === 3 ? "Triple bogey" : "Picked up";
  }
  const vsPar = (d) => (d === 0 ? "Level par" : d < 0 ? `${-d} under par` : `${d} over par`);
  const vsShort = (d) => (d === 0 ? "E" : d < 0 ? String(d) : "+" + d);

  function mount(el, api) {
    const { esc, sound, board, stats, idle } = api;
    const style = document.createElement("style"); style.textContent = CSS; el.appendChild(style);
    const root = document.createElement("div"); el.appendChild(root);
    let timers = [], alive = true, typer = 0;
    const later = (fn, ms) => { const t = setTimeout(() => alive && fn(), ms); timers.push(t); return t; };
    const BOARD = ["prompt-golf", "Today's top five rounds", "shots"];

    // The answers are real model output. Show light formatting, never the raw ** and --- marks.
    const plain = (t) => t.replace(/^\s*-{3,}\s*$/gm, "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#{1,6}\s*/gm, "").replace(/\n{3,}/g, "\n\n").trim();
    const pretty = (t) => esc(t.replace(/^\s*-{3,}\s*$/gm, "").replace(/\n{3,}/g, "\n\n").trim())
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/^#{1,6}\s*(.+)$/gm, "<b>$1</b>");

    /* ---------- intro ---------- */
    function intro() {
      el.classList.remove("fixed");
      root.className = "";
      idle(true);
      root.innerHTML = `<div class="pg-intro">
        <div class="col">
          <span class="imagine">Real AI answers, made before today</span>
          <h1>Prompt Golf</h1>
          <p class="lead">Get a good answer from AI in as few shots as you can. Three holes. Lowest score wins.</p>
          <div class="pg-rules">
            <div><i>🃏</i><span><b>Card = 1 shot</b>Add a detail to your prompt. See the new AI answer.</span></div>
            <div><i>⛳</i><span><b>Putt = 1 shot</b>Tap Putt when the answer does the job.</span></div>
            <div><i>🏖️</i><span><b>Bunker = +1 shot</b>Putt too soon, and you pay. Some cards are only magic words.</span></div>
          </div>
          <button class="btn btn-gold" id="go">Tee off · 3 holes</button>
        </div>
        <div class="col">${board.html(...BOARD)}</div>
      </div>`;
      root.querySelector("#go").addEventListener("click", () => { sound.tap(); start(); });
    }

    /* ---------- a round of three holes ---------- */
    let R;
    function start() {
      stats.add("prompt-golf", "plays");
      R = { h: 0, scores: [], t0: performance.now() };
      hole();
    }

    function hole() {
      const H = DATA.holes[R.h];
      el.classList.add("fixed");
      idle(true);
      R.cur = { H, played: [], shots: 0, done: false,
        tray: shuffle([...SLOTS.map((s) => ({ s, text: H.cards[s] })), ...H.decoys.map((d) => ({ s: null, text: d }))]) };
      root.className = "pg";
      const total = R.scores.reduce((a, s) => a + s.shots - s.par, 0);
      root.innerHTML = `
        <div class="pg-hud">
          <span class="pg-hole">Hole ${R.h + 1} of ${DATA.holes.length}</span><span class="pg-name">${esc(H.name)}</span><span class="pg-sp"></span>
          <span class="pg-stat"><small>Par</small>${H.par}</span>
          <span class="pg-stat" id="sShots"><small>Shots</small><span>0</span></span>
          <span class="pg-stat"><small>Round</small>${esc(vsShort(total))}</span>
        </div>
        <div class="pg-main">
          <div class="pg-left">
            <div class="pg-scene">${scene(H)}</div>
            <div class="pg-prompt" id="prompt"><div class="eyebrow">Your prompt</div><div class="pg-ln task">${esc(H.task)}</div></div>
          </div>
          <div class="pg-ans">
            <div class="pg-ans-h"><span class="pg-av">AI</span><div><b>AI answer</b><small>Real answer from ${esc(niceModel(DATA.model))}, made before today</small></div><span class="pg-wc" id="wc"></span></div>
            <div class="pg-body" id="body"></div>
            <div class="pg-foot"><div class="pg-checks" id="checks"></div><div class="pg-hint" id="hint"></div></div>
          </div>
        </div>
        <div class="pg-tray" id="tray">${R.cur.tray.map((c, i) => `<button class="pg-card" data-i="${i}">${esc(c.text)}</button>`).join("")}
          <button class="pg-putt" id="putt">⛳ Putt<small>1 shot</small></button></div>`;
      root.querySelectorAll(".pg-card").forEach((b) => b.addEventListener("click", () => play(+b.dataset.i, b)));
      root.querySelector("#putt").addEventListener("click", putt);
      splash(H);
    }

    function niceModel(m) { return m === "qwen3:8b" ? "Qwen3 8B" : m; }

    function scene(H) {
      const s = H.scene, em = EMO[s.kind] || "⛳";
      if (s.kind === "review") return `<span class="em">${em}</span><span class="tx"><small>Guest review · ${esc(s.who)}</small><span class="pg-stars">${"★".repeat(s.stars)}${"☆".repeat(5 - s.stars)}</span> “${esc(s.text)}”</span>`;
      if (s.kind === "note") return `<span class="em">${em}</span><span class="tx"><small>Team huddle</small>${esc(s.text)}</span>`;
      return `<span class="em">${em}</span><span class="tx"><small>Breakfast area</small>${esc(s.text)}</span>`;
    }

    function splash(H) {
      const sp = document.createElement("div");
      sp.className = "pg-splash";
      sp.innerHTML = `<div class="in"><div class="eyebrow">Hole ${R.h + 1} of ${DATA.holes.length}</div><h2>${esc(H.name)}</h2><p>Par ${H.par} · ${esc(H.task)}</p></div>`;
      root.appendChild(sp);
      sound.tick();
      const go = () => { if (!sp.isConnected) return; sp.remove(); answer(); };
      sp.addEventListener("click", go);
      later(go, 1700);
    }

    function setShots(n) {
      const s = root.querySelector("#sShots"); if (!s) return;
      s.querySelector("span").textContent = n; s.classList.remove("bump"); void s.offsetWidth; s.classList.add("bump");
    }

    function checks() {
      const C = R.cur;
      root.querySelector("#checks").innerHTML = SLOTS.map((s) => `<span class="${C.played.includes(s) ? "on" : ""}">${C.played.includes(s) ? "✓" : "○"} ${LABEL[s]}</span>`).join("");
      const miss = ["facts", "who", "tone", "length"].find((s) => !C.played.includes(s));
      root.querySelector("#hint").textContent = miss ? HINT[miss] : "All four details are in. Tap Putt!";
    }

    // show the real answer for the cards played so far, with a short "writing" pause and fast typing
    // only the newest answer may type: a quick second tap cancels the first one
    let gen = 0;
    function answer() {
      const my = ++gen, C = R.cur, raw = C.H.answers[keyOf(C.played)] || "", txt = plain(raw);
      const body = root.querySelector("#body"), wc = root.querySelector("#wc");
      clearInterval(typer);
      checks();
      body.classList.add("wait"); body.textContent = "AI is writing…"; wc.textContent = "";
      later(() => {
        if (my !== gen) return;
        body.classList.remove("wait"); body.scrollTop = 0;
        let i = 0; const step = Math.max(6, Math.ceil(txt.length / 70));
        const id = setInterval(() => {
          if (!alive || my !== gen) return clearInterval(id);
          i = Math.min(txt.length, i + step);
          body.textContent = txt.slice(0, i);
          if (i >= txt.length) { clearInterval(id); body.innerHTML = pretty(raw); wc.textContent = `${words(txt)} words`; }
        }, 25);
        typer = id;
      }, 550);
    }

    function bubble(title, small, kind) {
      root.querySelector(".pg-bubble")?.remove();
      const b = document.createElement("div");
      b.className = "pg-bubble " + (kind || "");
      b.innerHTML = `${esc(title)}${small ? `<small>${esc(small)}</small>` : ""}`;
      root.appendChild(b);
      later(() => b.remove(), 2600);
    }

    function play(i, btn) {
      const C = R.cur; if (C.done) return;
      const c = C.tray[i];
      C.shots++; setShots(C.shots);
      if (!c.s) {
        // a decoy: it costs a shot, and the AI gets nothing new to use
        btn.classList.add("shake"); later(() => btn.classList.add("dud"), 380);
        sound.meh();
        bubble("Magic words! +1 shot", "Magic words give the AI nothing new to use. The answer does not get better.", "meh");
      } else {
        btn.classList.add("used");
        C.played.push(c.s);
        const ln = document.createElement("div"); ln.className = "pg-ln new"; ln.textContent = c.text;
        const p = root.querySelector("#prompt"); p.appendChild(ln); p.scrollTop = p.scrollHeight;
        sound.good();
        answer();
      }
      if (!C.done && C.shots >= C.H.par + PICK_UP) pickUp();
    }

    function putt() {
      const C = R.cur; if (C.done) return;
      C.shots++; setShots(C.shots);
      const miss = SLOTS.filter((s) => !C.played.includes(s));
      if (!miss.length) { holed(); return; }
      sound.bounce();
      root.querySelector("#putt").classList.add("shake"); later(() => root.querySelector("#putt")?.classList.remove("shake"), 420);
      bubble(`Bunker! +1 shot. Missing: ${miss.map((s) => LABEL[s]).join(", ")}.`, HINT[miss.includes("facts") ? "facts" : miss[0]], "bad");
      if (C.shots >= C.H.par + PICK_UP) pickUp();
    }

    function pickUp() { const C = R.cur; C.shots = C.H.par + PICK_UP; finishHole("You pick up the ball", "The hole ends here. Next time, add the details sooner."); }
    function holed() {
      const C = R.cur, d = C.shots - C.H.par, n = words(plain(C.H.answers[keyOf(C.played)] || ""));
      // the model does not always keep to the word limit: say so, because the person reads the answer and decides
      const look = C.H.limit && n > C.H.limit ? `Look: the AI used ${n} words, not ${C.H.limit}. AI does not always follow the rules. You read the answer and decide.` : "";
      finishHole(holeName(d) + "!", `In the hole in ${C.shots} shots. Par is ${C.H.par}.`, look);
    }

    function finishHole(title, text, look) {
      const C = R.cur; C.done = true; clearInterval(typer); gen++;
      const body = root.querySelector("#body"); if (body && C.H.answers[keyOf(C.played)]) { body.classList.remove("wait"); body.innerHTML = pretty(C.H.answers[keyOf(C.played)]); }
      R.scores.push({ name: C.H.name, shots: C.shots, par: C.H.par });
      const last = R.h === DATA.holes.length - 1;
      if (C.shots <= C.H.par) sound.great(); else sound.good();
      const f = document.createElement("div");
      f.className = "pg-flag";
      f.innerHTML = `<div class="box"><div class="fl" aria-hidden="true">⛳</div><h2>${esc(title)}</h2><p>${esc(text)}</p>
        ${look ? `<div class="pg-look">${esc(look)}</div>` : ""}
        <button class="btn btn-gold" id="next">${last ? "See my score" : "Next hole"}</button></div>`;
      root.appendChild(f);
      f.querySelector("#next").addEventListener("click", () => { sound.tap(); next(); });
    }

    function next() { R.h++; if (R.h < DATA.holes.length) hole(); else results(); }

    /* ---------- results ---------- */
    function results() {
      el.classList.remove("fixed");
      root.className = "";
      sound.end();
      idle(true);
      const shots = R.scores.reduce((a, s) => a + s.shots, 0), par = R.scores.reduce((a, s) => a + s.par, 0), d = shots - par;
      const secs = Math.round((performance.now() - R.t0) / 1000);
      const rank = d <= -3 ? "Prompt Pro 🏆" : d <= 0 ? "Club Captain ⭐" : d <= 3 ? "Weekend Golfer 🌱" : "First Lesson 🙂";
      stats.add("prompt-golf", "rounds");
      if (d <= -3) stats.add("prompt-golf", "perfect");
      const qualifies = board.qualifies("prompt-golf", shots, secs);
      root.innerHTML = `<div class="pg-res">
        <div class="col">
          <div class="pg-big">
            <div class="eyebrow">Round over · ${secs} seconds</div>
            <h2>${shots} shots · ${esc(vsPar(d))}</h2>
            <div class="rank">${esc(rank)}</div>
            <div class="pg-holes">${R.scores.map((s, i) => `<div><span>Hole ${i + 1}</span><b>${s.shots}</b><em>${esc(holeName(s.shots - s.par))}</em></div>`).join("")}</div>
          </div>
          <div class="lesson-card"><div class="eyebrow">What this shows about AI</div>
            <p>Tell AI who it is for, the facts, the tone and the length. Magic words do not help. You read the answer and decide.</p></div>
        </div>
        <div class="col">
          ${qualifies ? `<div class="board"><h3>You made today's top five! Add your name.</h3>
            <div class="name-entry"><input id="nm" maxlength="10" autocomplete="off" autocapitalize="characters" placeholder="First name or nickname" aria-label="First name or nickname"><button class="btn btn-gold" id="save">Save</button></div>
            <div class="small-note" style="margin-top:8px">First names or nicknames only. Scores stay on this iPad.</div></div>` : ""}
          <div id="brd">${board.html(...BOARD)}</div>
          <div class="btn-row"><button class="btn btn-gold" id="again">Play again</button><button class="btn btn-ghost" id="home">All games</button></div>
        </div></div>`;
      root.querySelector("#again").addEventListener("click", () => { sound.tap(); start(); });
      root.querySelector("#home").addEventListener("click", () => { sound.tap(); api.home(); });
      const save = root.querySelector("#save");
      if (save) {
        const inp = root.querySelector("#nm");
        const doSave = () => {
          const n = api.cleanName(inp.value);
          if (!n) { inp.value = ""; inp.placeholder = "Try another name"; return; }
          board.add("prompt-golf", n, shots, secs);
          const t = board.list("prompt-golf").find((e) => e.n === n && e.s === shots && e.d === secs)?.t;
          save.closest(".board").remove();
          root.querySelector("#brd").innerHTML = board.html(...BOARD, t);
          sound.great(); inp.blur();
        };
        save.addEventListener("click", doSave);
        inp.addEventListener("keydown", (e) => { if (e.key === "Enter") doSave(); });
      }
    }

    intro();
    return () => { alive = false; timers.forEach(clearTimeout); clearInterval(typer); el.classList.remove("fixed"); };
  }

  Arcade.register({
    id: "prompt-golf",
    title: "Prompt Golf",
    tagline: "Get a good answer from AI in as few shots as you can. Each prompt card costs one shot.",
    lesson: "how to ask AI for a good answer",
    emoji: "⛳",
    time: "3 holes · 2 min",
    colours: ["#7FB53F", "#2F6B1F"],
    board: { title: "Top five rounds", unit: "shots", low: true },
    tally(store, day) {
      const s = store.get(`stats:${day}`, {})["prompt-golf"] || {};
      return [[s.rounds || 0, "Rounds played"], [s.perfect || 0, "Perfect rounds"]];
    },
    mount,
  });
})();
