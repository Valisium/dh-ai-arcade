/* Yours or Mine? A 90-second evening shift. Swipe each job to yourself or to your AI sidekick.
   Lesson: AI is good at the admin (drafts, translations, summaries). People keep safety, care and judgement.
   Card types: admin (give to sidekick), both (sidekick drafts, you approve: either way is fine),
   human (needs a person), safety (always yours). All guests are made up. */
(function () {
  "use strict";
  const SHIFT_SECONDS = 90;

  const CARDS = [
    // admin: the sidekick is the right call
    { t: "admin", e: "📝", m: 12, q: "Summarise 14 night notes for the morning handover.", side: "Handover drafted in seconds. Read it, then share it.", mine: "That took you 12 minutes. Your sidekick can draft it in seconds." },
    { t: "admin", e: "🇵🇱", m: 8, q: "A coach party from Kraków arrives at 14:00. Write a welcome note in Polish.", side: "Welcome note translated. A Polish-speaking colleague can read it over.", mine: "That took you 8 minutes with a phrase book. Your sidekick translates in seconds." },
    { t: "admin", e: "📣", m: 6, q: "Plan a 5-minute team huddle for a sold-out Saturday.", side: "Huddle plan ready. Add your own words of thanks.", mine: "Good huddle, but it took 6 minutes. Your sidekick can draft it." },
    { t: "admin", e: "📊", m: 10, q: "Find the top 3 themes in 40 guest comments.", side: "Three themes found in seconds. You decide what to do about them.", mine: "That took you 10 minutes. Your sidekick can sort comments fast." },
    { t: "admin", e: "🧾", m: 6, q: "Write an email to a supplier about a late delivery.", side: "Email drafted. Read it and press send.", mine: "That took you 6 minutes. Your sidekick can draft it." },
    { t: "admin", e: "🪧", m: 3, q: "Make a sign: the bar closes at 22:00 tonight.", side: "Sign made in seconds. Print it.", mine: "That took you 3 minutes. Small admin adds up." },
    { t: "admin", e: "🇩🇪", m: 4, q: "A guest speaks only German. Translate the Wi-Fi instructions.", side: "Translated in seconds. The guest is online.", mine: "That took you 4 minutes. Your sidekick translates in seconds." },
    { t: "admin", e: "📚", m: 6, q: "Write 5 quiz questions for a new starter's first day.", side: "Quiz drafted. You add the hotel's own tips.", mine: "That took you 6 minutes. Your sidekick can draft it." },
    { t: "admin", e: "🗒️", m: 5, q: "Turn your messy notes into tomorrow's to-do list.", side: "To-do list ready. You choose the order.", mine: "That took you 5 minutes. Your sidekick can tidy notes fast." },
    { t: "admin", e: "🅿️", m: 4, q: "Write a short reply to a guest who asks about parking.", side: "Reply drafted. Read it before you send it.", mine: "That took you 4 minutes. Your sidekick can draft it." },
    // both: sidekick drafts, you approve
    { t: "both", e: "⭐", m: 8, q: "Room 214 left a 2-star review about noise. Write a reply.", side: "Draft ready. Add a personal line before you post it.", mine: "Good reply. Next time, your sidekick drafts and you add the personal touch." },
    { t: "both", e: "📅", m: 15, q: "Draft next week's rota from the team's holiday requests.", side: "First draft ready. You decide what is fair.", mine: "Fine. Next time, your sidekick drafts it and you decide." },
    { t: "both", e: "💌", m: 5, q: "Write a thank-you note to housekeeping after a busy weekend.", side: "Draft ready. Add your own words. They matter most.", mine: "Lovely. Your own words matter most." },
    { t: "both", e: "💷", m: 6, q: "A guest emails to ask for a refund. Write the reply.", side: "Sidekick drafts. You decide on the refund.", mine: "Fine. Next time, your sidekick drafts and you decide." },
    // human: needs a person
    { t: "human", e: "🔑", q: "Mr Barnaby Teacake is upset. His key card fails for the third time.", mine: "Good call. A smile and a new card from you fix this.", back: "An upset guest needs a person. This one is yours." },
    { t: "human", e: "🧳", q: "A family arrives late and tired. The children are upset.", mine: "Good call. A warm welcome from you makes their night.", back: "Tired guests need a kind person. This one is yours." },
    { t: "human", e: "🫶", q: "A new team member looks worried on their first shift.", mine: "Good call. Five minutes with you means a lot.", back: "Your team needs you, not me. This one is yours." },
    { t: "human", e: "🔊", q: "Room 118 complains about loud music from Room 120.", mine: "Good call. A calm word from you at the door.", back: "This needs a calm word from a person. This one is yours." },
    { t: "human", e: "💐", q: "A regular guest, Mrs Peony Biscuit, wants to tell you about her new job.", mine: "Good call. Regulars come back for people like you.", back: "A regular guest wants you, not me. This one is yours." },
    // safety: always yours
    { t: "safety", e: "🔥", q: "The fire alarm sounds on floor 2.", mine: "Correct. Safety is always yours.", back: "This one is yours. Follow your fire procedure now." },
    { t: "safety", e: "🩹", q: "A guest feels unwell in the lift.", mine: "Correct. People first, always.", back: "This one is yours. Call for first aid now." },
    { t: "safety", e: "🥜", q: "A guest at breakfast asks if the cake has nuts.", mine: "Correct. Allergens are always yours.", back: "This one is yours. Use your allergen information." },
    { t: "safety", e: "🚪", q: "A person with no key card asks you to open Room 305.", mine: "Correct. Security is always yours.", back: "This one is yours. Follow your security steps." },
    { t: "safety", e: "💧", q: "Water comes through the ceiling in Room 210.", mine: "Correct. Make it safe first.", back: "This one is yours. Make it safe first." },
  ];

  const CSS = `
  .yom{position:absolute;inset:0;display:flex;flex-direction:column;background:linear-gradient(180deg,#EEF2F8 0%,#F8F9FB 60%)}
  .yom-hud{display:flex;align-items:center;gap:14px;padding:16px 24px 0;flex-wrap:wrap}
  .yom-clock{display:flex;align-items:center;gap:10px;background:var(--navy);color:#fff;border-radius:999px;padding:8px 18px 8px 14px;font:900 26px var(--head);font-variant-numeric:tabular-nums}
  .yom-clock.hurry{background:#D44F9A;animation:yomPulse .5s ease infinite alternate}
  @keyframes yomPulse{to{transform:scale(1.05)}}
  .yom-prog{flex:1;min-width:120px;height:12px;border-radius:999px;background:#fff;border:1px solid var(--hair);overflow:hidden}
  .yom-prog i{display:block;height:100%;background:linear-gradient(90deg,#FEC500,#FB9B1B);width:0}
  .yom-meter{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--hair);border-radius:999px;padding:8px 16px;font:900 24px var(--head);color:var(--navy);font-variant-numeric:tabular-nums}
  .yom-meter small{font:700 12px var(--head);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
  .yom-meter.bump{animation:yomBump .35s ease}
  @keyframes yomBump{40%{transform:scale(1.15)}}
  .yom-arena{flex:1;position:relative;display:grid;place-items:center;padding:12px 24px}
  .yom-stack{position:relative;width:min(580px,86vw);height:min(420px,46vh)}
  .yom-ghost{position:absolute;inset:0;border-radius:28px;background:#fff;border:1px solid var(--hair)}
  .yom-ghost.g1{transform:translateY(14px) scale(.96);opacity:.7}.yom-ghost.g2{transform:translateY(28px) scale(.92);opacity:.4}
  .yom-card{position:absolute;inset:0;border-radius:28px;background:#fff;box-shadow:var(--sh-lg);display:flex;flex-direction:column;align-items:center;justify-content:center;
    gap:18px;padding:28px 36px;text-align:center;touch-action:none;cursor:grab;will-change:transform}
  .yom-card.enter{animation:yomIn .32s cubic-bezier(.2,.9,.3,1.2) both}
  @keyframes yomIn{from{transform:translateY(40px) scale(.9);opacity:0}}
  .yom-card .em{width:110px;height:110px;border-radius:50%;background:var(--alt);display:grid;place-items:center;font-size:64px;line-height:1}
  .yom-card .q{font:800 clamp(22px,2.6vw,30px)/1.25 var(--head);color:var(--navy);max-width:22ch}
  .yom-card .when{position:absolute;top:18px;left:22px;font:800 13px var(--head);letter-spacing:.12em;color:var(--muted)}
  .yom-stamp{position:absolute;top:26px;padding:6px 16px;border:4px solid;border-radius:12px;font:900 26px var(--head);letter-spacing:.06em;opacity:0;pointer-events:none}
  .yom-stamp.l{left:22px;color:var(--navy);border-color:var(--navy);transform:rotate(-10deg)}
  .yom-stamp.r{right:22px;color:#6B5BB8;border-color:#6B5BB8;transform:rotate(10deg)}
  .yom-stamp.back{left:50%;top:14px;transform:translateX(-50%) rotate(-2deg);color:#D44F9A;border-color:#D44F9A;opacity:1;font-size:20px;background:#fff;white-space:nowrap}
  .yom-card.shake{animation:yomShake .45s ease}
  @keyframes yomShake{20%,60%{transform:translateX(-14px)}40%,80%{transform:translateX(14px)}}
  .yom-bubble{position:absolute;top:8px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;max-width:min(640px,92%);background:#fff;border-radius:20px;
    padding:12px 18px 12px 12px;box-shadow:var(--sh-md);border:2px solid var(--hair);font:700 19px/1.3 var(--head);color:var(--navy);z-index:5;animation:yomBub .25s ease both}
  .yom-bubble.good{border-color:#7FB53F}.yom-bubble.meh{border-color:#FB9B1B}.yom-bubble.bad{border-color:#D44F9A}
  @keyframes yomBub{from{opacity:0;transform:translate(-50%,-10px)}}
  .yom-av{flex:0 0 44px;height:44px;border-radius:50%;display:grid;place-items:center;font:900 15px var(--head);color:#fff;background:var(--accent)}
  .yom-av.you{background:var(--navy)}
  .yom-pts{font:900 18px var(--head);white-space:nowrap;color:#3D6A12}
  .yom-ctrl{display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:0 24px calc(20px + var(--safe-b))}
  .yom-ctrl button{min-height:84px;border-radius:24px;font:900 26px var(--head);display:flex;align-items:center;justify-content:center;gap:12px;color:#fff;box-shadow:0 6px 0 rgba(0,0,0,.18)}
  .yom-ctrl button:active{transform:translateY(4px);box-shadow:0 2px 0 rgba(0,0,0,.18)}
  .yom-ctrl button small{display:block;font:600 15px var(--text);opacity:.9}
  .yom-ctrl .mine{background:var(--navy)}
  .yom-ctrl .side{background:linear-gradient(135deg,#4A3F8A,#6B5BB8 60%,#2BA6C8)}
  .yom-res{max-width:1100px;margin:0 auto;padding:28px 24px 40px;display:grid;grid-template-columns:1.2fr 1fr;gap:24px;align-items:start}
  .yom-res .col{display:flex;flex-direction:column;gap:16px}
  .yom-big{background:var(--cover);color:#fff;border-radius:24px;padding:26px 28px}
  .yom-big .eyebrow{color:var(--gold)}
  .yom-big h2{color:#fff;font-size:44px;font-weight:900;margin:6px 0 4px}
  .yom-big .rank{font:800 20px var(--head);color:#FFE58A}
  .yom-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px}
  .yom-stats div{background:rgba(255,255,255,.12);border-radius:16px;padding:12px 14px}
  .yom-stats b{display:block;font:900 40px/1 var(--head);color:#fff}
  .yom-stats span{font:700 12px var(--head);letter-spacing:.1em;text-transform:uppercase;color:#C9D6EC}
  .yom-list{background:#fff;border:1px solid var(--hair);border-radius:20px;padding:16px 20px;display:grid;gap:10px}
  .yom-list div{display:flex;gap:12px;align-items:center;font-size:18px}
  .yom-list b{font:900 22px var(--head);color:var(--navy);min-width:40px;text-align:center}
  .yom-intro{max-width:1100px;margin:0 auto;padding:28px 24px 40px;display:grid;grid-template-columns:1.3fr 1fr;gap:28px;align-items:center;min-height:100%}
  .yom-intro .col{display:flex;flex-direction:column;gap:16px;align-items:flex-start}
  .yom-intro h1{font-size:clamp(46px,6vw,76px);font-weight:900;letter-spacing:-.025em}
  .yom-intro p.lead{font-size:23px;color:var(--body-alt);margin:0}
  .yom-warn{display:flex;gap:12px;align-items:center;background:#FBE3EF;color:#8A1F5C;border-radius:16px;padding:12px 16px;font:700 17px var(--head)}
  @media (max-width:900px){.yom-res,.yom-intro{grid-template-columns:1fr}.yom-stats b{font-size:32px}}
  `;

  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function deck() {
    // start with an easy admin card, and keep safety cards apart
    let d = shuffle(CARDS);
    const first = d.findIndex((c) => c.t === "admin");
    d.unshift(d.splice(first, 1)[0]);
    for (let i = 2; i < d.length; i++) if (d[i].t === "safety" && d[i - 1].t === "safety") { const j = d.findIndex((c, k) => k > i && c.t !== "safety"); if (j > 0) [d[i], d[j]] = [d[j], d[i]]; }
    return d;
  }
  const clockAt = (sec) => { const mins = 17 * 60 + Math.min(360, Math.floor((sec / SHIFT_SECONDS) * 360)); return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`; };

  function mount(el, api) {
    const { esc, sound, board, stats, idle } = api;
    const style = document.createElement("style"); style.textContent = CSS; el.appendChild(style);
    const root = document.createElement("div"); root.className = "yom"; el.appendChild(root);
    el.classList.add("fixed");
    let timers = [], raf = 0, alive = true;
    const later = (fn, ms) => { const t = setTimeout(() => alive && fn(), ms); timers.push(t); return t; };

    /* ---------- intro ---------- */
    function intro() {
      idle(true);
      root.style.overflowY = "auto";
      root.innerHTML = `<div class="yom-intro">
        <div class="col">
          <span class="imagine">Imagine</span>
          <h1>Yours or Mine?</h1>
          <p class="lead">Imagine an AI sidekick on your evening shift. You run the shift. Your sidekick does the admin.</p>
          <div class="rules">
            <div class="rule"><span class="arrow" style="background:var(--navy)">◀</span><div><b>Mine</b><span>Swipe left. You do the job.</span></div></div>
            <div class="rule"><span class="arrow" style="background:linear-gradient(135deg,#4A3F8A,#2BA6C8)">▶</span><div><b>Sidekick</b><span>Swipe right. AI drafts it.</span></div></div>
          </div>
          <div class="yom-warn">⚠️ Watch out. Some jobs always stay with a person.</div>
          <button class="btn btn-gold" id="go">Start my shift · 90 s</button>
        </div>
        <div class="col">${board.html("yours-or-mine", "Today's top five shifts", "pts")}</div>
      </div>`;
      root.querySelector("#go").addEventListener("click", () => { sound.tap(); countdown(); });
    }

    function countdown() {
      idle(false);
      root.style.overflowY = "hidden";
      let n = 3;
      root.innerHTML = `<div class="countdown"><b>3</b></div>`;
      sound.tick();
      const step = () => {
        n--;
        if (n === 0) { play(); return; }
        root.innerHTML = `<div class="countdown"><b>${n}</b></div>`; sound.tick(); later(step, 800);
      };
      later(step, 800);
    }

    /* ---------- play ---------- */
    let S;
    function play() {
      stats.add("yours-or-mine", "plays");
      S = { d: deck(), i: 0, mins: 0, smiles: 0, start: performance.now(), over: false, busy: false, bounced: false,
            toSide: 0, kept: 0, safeSeen: 0, safeKept: 0, safeBack: 0, humanKept: 0, good: 0, calls: 0, lastTick: -1 };
      root.innerHTML = `
        <div class="yom-hud">
          <div class="yom-clock" id="clk">🕔 <span>17:00</span></div>
          <div class="yom-prog"><i id="prog"></i></div>
          <div class="yom-meter" id="mSm">😊 <span>0</span><small>Smiles</small></div>
          <div class="yom-meter" id="mMn">⏱️ <span>0</span><small>Mins back</small></div>
        </div>
        <div class="yom-arena" id="arena">
          <div class="yom-stack" id="stack"><div class="yom-ghost g2"></div><div class="yom-ghost g1"></div></div>
        </div>
        <div class="yom-ctrl">
          <button class="mine" id="bMine">◀ <span>Mine<small>I do it</small></span></button>
          <button class="side" id="bSide"><span>Sidekick<small>AI drafts it</small></span> ▶</button>
        </div>`;
      root.querySelector("#bMine").addEventListener("click", () => decide("mine"));
      root.querySelector("#bSide").addEventListener("click", () => decide("side"));
      showCard();
      tick();
    }

    function tick() {
      if (!alive || S.over) return;
      const sec = (performance.now() - S.start) / 1000;
      const left = SHIFT_SECONDS - sec;
      const clk = root.querySelector("#clk");
      if (!clk) return;
      clk.querySelector("span").textContent = clockAt(sec);
      root.querySelector("#prog").style.width = Math.min(100, (sec / SHIFT_SECONDS) * 100) + "%";
      if (left <= 10) { clk.classList.add("hurry"); const s = Math.ceil(left); if (s !== S.lastTick) { S.lastTick = s; sound.tick(); } }
      if (left <= 0) { finish(); return; }
      raf = requestAnimationFrame(tick);
    }

    function card() { return S.d[S.i % S.d.length]; }

    function showCard() {
      if (S.i > 0 && S.i % S.d.length === 0) S.d = deck();
      const c = card();
      S.bounced = false;
      const stack = root.querySelector("#stack");
      stack.querySelector(".yom-card")?.remove();
      const sec = (performance.now() - S.start) / 1000;
      const div = document.createElement("div");
      div.className = "yom-card enter";
      div.innerHTML = `<span class="when">${clockAt(sec)}</span><span class="yom-stamp l">MINE</span><span class="yom-stamp r">SIDEKICK</span>
        <div class="em" aria-hidden="true">${c.e}</div><div class="q">${esc(c.q)}</div>`;
      stack.appendChild(div);
      if (c.t === "safety") S.safeSeen++;
      drag(div);
    }

    function drag(div) {
      let x0 = null, dx = 0, id = null;
      const L = div.querySelector(".yom-stamp.l"), R = div.querySelector(".yom-stamp.r");
      div.addEventListener("pointerdown", (e) => { if (S.busy) return; x0 = e.clientX; id = e.pointerId; div.setPointerCapture(id); div.classList.remove("enter"); div.style.transition = "none"; });
      div.addEventListener("pointermove", (e) => {
        if (x0 == null) return; dx = e.clientX - x0;
        div.style.transform = `translateX(${dx}px) rotate(${dx / 22}deg)`;
        L.style.opacity = Math.max(0, Math.min(1, -dx / 120)); R.style.opacity = Math.max(0, Math.min(1, dx / 120));
      });
      const up = () => {
        if (x0 == null) return; x0 = null;
        if (Math.abs(dx) > 110) decide(dx < 0 ? "mine" : "side", dx);
        else { div.style.transition = "transform .2s ease"; div.style.transform = ""; L.style.opacity = R.style.opacity = 0; }
        dx = 0;
      };
      div.addEventListener("pointerup", up); div.addEventListener("pointercancel", up);
    }

    function bubble(text, kind, who, pts) {
      root.querySelector(".yom-bubble")?.remove();
      const b = document.createElement("div");
      b.className = "yom-bubble " + kind;
      b.innerHTML = `<span class="yom-av ${who === "you" ? "you" : ""}">${who === "you" ? "YOU" : "AI"}</span><span>${esc(text)}</span>${pts ? `<span class="yom-pts">${esc(pts)}</span>` : ""}`;
      root.querySelector("#arena").appendChild(b);
    }
    function bump(id, val) { const m = root.querySelector(id); m.querySelector("span").textContent = val; m.classList.remove("bump"); void m.offsetWidth; m.classList.add("bump"); }

    function fly(div, dir, then) {
      div.style.transition = "transform .3s ease-in, opacity .3s ease-in";
      div.style.transform = `translateX(${dir === "mine" ? -900 : 900}px) rotate(${dir === "mine" ? -24 : 24}deg)`;
      div.style.opacity = "0";
      sound.swipe();
      later(then, 280);
    }

    function decide(dir) {
      if (S.over || S.busy) return;
      const div = root.querySelector(".yom-card"); if (!div) return;
      const c = card();
      S.busy = true;
      if (!S.bounced) S.calls++;

      if (dir === "side" && (c.t === "human" || c.t === "safety")) {
        // the sidekick sends it back: the player must take it
        if (c.t === "safety" && !S.bounced) S.safeBack++;
        S.bounced = true;
        div.style.transition = "transform .18s ease-out";
        div.style.transform = "translateX(160px) rotate(6deg)";
        sound.bounce();
        later(() => {
          div.style.transition = "transform .25s cubic-bezier(.2,.9,.3,1.3)"; div.style.transform = "";
          div.querySelectorAll(".yom-stamp.l,.yom-stamp.r").forEach((s) => (s.style.opacity = 0));
          if (!div.querySelector(".yom-stamp.back")) div.insertAdjacentHTML("beforeend", `<span class="yom-stamp back">THIS ONE IS YOURS ◀</span>`);
          div.classList.add("shake");
          bubble(c.back, "bad", "ai");
          later(() => { div.classList.remove("shake"); S.busy = false; }, 420);
        }, 180);
        return;
      }

      let msg, kind = "good", who = "ai", pts = "";
      if (dir === "side") {
        S.toSide++; S.mins += c.m; S.smiles += 1; S.good++;
        msg = c.side; pts = `+${c.m} min`; bump("#mMn", S.mins); bump("#mSm", S.smiles); sound.good();
      } else {
        S.kept++; who = "you";
        if (S.bounced) { msg = "Good. You are on it now."; kind = "meh"; sound.meh(); }
        else if (c.t === "admin") { msg = c.mine; kind = "meh"; sound.meh(); }
        else if (c.t === "both") { S.smiles += 1; S.good++; msg = c.mine; pts = "+1 😊"; bump("#mSm", S.smiles); sound.good(); }
        else { S.smiles += 2; S.good++; msg = c.mine; pts = "+2 😊"; bump("#mSm", S.smiles); sound.great();
               if (c.t === "safety") S.safeKept++; else S.humanKept++; }
      }
      bubble(msg, kind, who, pts);
      fly(div, dir, () => { S.i++; S.busy = false; if (!S.over) showCard(); });
    }

    /* ---------- results ---------- */
    function finish() {
      S.over = true; cancelAnimationFrame(raf); sound.end();
      const score = S.mins + S.smiles * 5;
      const ratio = S.calls ? S.good / S.calls : 0;
      const rank = ratio >= 0.9 && S.calls >= 12 ? "Shift Hero 🏆" : ratio >= 0.75 ? "Super Duty Manager ⭐" : ratio >= 0.5 ? "Rising Star 🌱" : "First-day Trainee 🙂";
      stats.add("yours-or-mine", "points", score);
      idle(true);
      root.style.overflowY = "auto";
      const qualifies = board.qualifies("yours-or-mine", score);
      root.innerHTML = `<div class="yom-res">
        <div class="col">
          <div class="yom-big">
            <div class="eyebrow">23:00 · Shift over</div>
            <h2>You gave ${S.mins} minutes back to your guests</h2>
            <div class="rank">${esc(rank)}</div>
            <div class="yom-stats">
              <div><b>${score}</b><span>Shift score</span></div>
              <div><b>${S.smiles}</b><span>Guest smiles</span></div>
              <div><b>${S.calls}</b><span>Jobs done</span></div>
            </div>
          </div>
          <div class="yom-list">
            <div><b>${S.toSide}</b>admin jobs you gave to your sidekick</div>
            <div><b>${S.humanKept}</b>care jobs you kept for yourself</div>
            <div><b>${S.safeKept}/${S.safeSeen}</b>safety jobs you kept straight away</div>
          </div>
          <div class="lesson-card"><div class="eyebrow">What this shows about AI</div>
            <p>AI is good at the admin: drafts, translations and summaries. People keep safety, care and judgement.</p></div>
        </div>
        <div class="col">
          ${qualifies ? `<div class="board"><h3>You made today's top five! Add your name.</h3>
            <div class="name-entry"><input id="nm" maxlength="10" autocomplete="off" autocapitalize="characters" placeholder="First name or nickname" aria-label="First name or nickname"><button class="btn btn-gold" id="save">Save</button></div>
            <div class="small-note" style="margin-top:8px">First names or nicknames only. Scores stay on this iPad.</div></div>` : ""}
          <div id="brd">${board.html("yours-or-mine", "Today's top five shifts", "pts")}</div>
          <div class="btn-row"><button class="btn btn-gold" id="again">Play again</button><button class="btn btn-ghost" id="home">All games</button></div>
        </div></div>`;
      root.querySelector("#again").addEventListener("click", () => { sound.tap(); countdown(); });
      root.querySelector("#home").addEventListener("click", () => { sound.tap(); api.home(); });
      const save = root.querySelector("#save");
      if (save) {
        const inp = root.querySelector("#nm");
        const doSave = () => {
          const n = api.cleanName(inp.value);
          if (!n) { inp.value = ""; inp.placeholder = "Try another name"; return; }
          board.add("yours-or-mine", n, score);
          const t = board.list("yours-or-mine").find((e) => e.n === n && e.s === score)?.t;
          save.closest(".board").remove();
          root.querySelector("#brd").innerHTML = board.html("yours-or-mine", "Today's top five shifts", "pts", t);
          sound.great(); inp.blur();
        };
        save.addEventListener("click", doSave);
        inp.addEventListener("keydown", (e) => { if (e.key === "Enter") doSave(); });
      }
    }

    intro();
    return () => { alive = false; timers.forEach(clearTimeout); cancelAnimationFrame(raf); el.classList.remove("fixed"); };
  }

  Arcade.register({
    id: "yours-or-mine",
    title: "Yours or Mine?",
    tagline: "Run a 90-second evening shift. Give each job to yourself or to your AI sidekick.",
    lesson: "what to give to AI, and what always stays with you",
    emoji: "🛎️",
    time: "90 seconds",
    colours: ["#A24FC0", "#4A1F6B"],
    board: { title: "Top five shifts", unit: "pts" },
    mount,
  });
})();
