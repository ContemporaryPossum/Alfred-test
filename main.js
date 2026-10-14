/* =========================================================
   Alfred Wong Kai Xiang, portfolio
   Vanilla JS, no dependencies. Everything degrades gracefully:
   if this file fails to load the page is still fully usable.
   Most scroll effects live in styles.css (CSS scroll-driven animations);
   this file handles smooth wheel scrolling, entrances and the interactive parts.
   ========================================================= */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const scrollDriven = !!(window.CSS && CSS.supports && CSS.supports("animation-timeline: view()"));
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const root = document.documentElement;
  const body = document.body;

  // small helper for building elements without innerHTML
  const el = (tag, props, kids) => {
    const node = document.createElement(tag);
    Object.entries(props || {}).forEach(([k, val]) => {
      if (k === "class") node.className = val;
      else if (k === "text") node.textContent = val;
      else if (k.slice(0, 2) === "on") node.addEventListener(k.slice(2), val);
      else node.setAttribute(k, val);
    });
    (kids || []).forEach((kid) => { if (kid) node.appendChild(kid); });
    return node;
  };

  /* ---------- smooth wheel scrolling (desktop mouse and trackpad only) ---------- */
  // The page keeps native scrolling; the wheel is simply eased so the whole page glides.
  // Keyboard, scrollbar, touch and reduced-motion users get the browser's own scrolling.
  let scrollToY = (y) => window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
  if (finePointer && !reduceMotion) {
    root.classList.add("is-smooth");
    let target = window.scrollY, current = target, lastSet = target, raf = 0;
    const limit = () => root.scrollHeight - window.innerHeight;
    const frame = () => {
      // someone else moved the page (keys, scrollbar, find in page): hand control back
      if (Math.abs(window.scrollY - lastSet) > 3) { target = current = lastSet = window.scrollY; raf = 0; return; }
      current += (target - current) * 0.11;
      if (Math.abs(target - current) < 0.5) current = target;
      window.scrollTo(0, current);
      lastSet = window.scrollY;
      raf = current === target ? 0 : requestAnimationFrame(frame);
    };
    scrollToY = (y) => {
      if (!raf) { current = lastSet = window.scrollY; }
      target = clamp(y, 0, limit());
      if (!raf) raf = requestAnimationFrame(frame);
    };
    window.addEventListener("wheel", (e) => {
      if (e.ctrlKey || e.defaultPrevented || body.classList.contains("intro-active") || root.style.overflow === "hidden") return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // sideways gestures stay native
      if (e.target.closest && e.target.closest("textarea, select, .wa-preview__bubble")) return;
      e.preventDefault();
      const delta = e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? window.innerHeight : 1);
      if (!raf) { target = window.scrollY; }
      scrollToY(target + delta);
    }, { passive: false });
    window.addEventListener("resize", () => { target = clamp(target, 0, limit()); });
  }

  // in-page links glide to their section and move keyboard focus there
  document.addEventListener("click", (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const id = a.getAttribute("href");
    if (!id || id.length < 2) return;
    const dest = document.getElementById(id.slice(1));
    if (!dest) return;
    e.preventDefault();
    const pad = id === "#top" ? 0 : parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    scrollToY(dest.getBoundingClientRect().top + window.scrollY - pad);
    if (history.pushState) history.pushState(null, "", id);
    if (!dest.hasAttribute("tabindex")) dest.setAttribute("tabindex", "-1");
    dest.focus({ preventScroll: true });
  });

  /* ---------- intro: the site speaks to the visitor before the hero appears ---------- */
  const intro = $("[data-intro]");
  let introDone = false;
  const finishIntro = () => {
    if (introDone) return;
    introDone = true;
    try { sessionStorage.setItem("introSeen", "1"); } catch (_) { /* private mode */ }
    body.classList.remove("intro-active");
    body.classList.add("intro-done");
    if (intro) {
      intro.classList.add("is-leaving");
      setTimeout(() => intro.classList.add("is-hidden"), 1200);
    }
    document.dispatchEvent(new CustomEvent("intro:done"));
  };

  let introSeen = false;
  try { introSeen = sessionStorage.getItem("introSeen") === "1"; } catch (_) { /* ignore */ }
  const forceIntro = /[?&]intro\b/.test(location.search);

  if (!intro || reduceMotion || (introSeen && !forceIntro)) {
    if (intro) intro.classList.add("is-hidden");
    introDone = true;
    body.classList.add("intro-done");
    setTimeout(() => document.dispatchEvent(new CustomEvent("intro:done")), 50);
  } else {
    body.classList.add("intro-active");
    const lineEl = $("[data-intro-line]", intro);
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const width = window.innerWidth;
    const device = coarse ? (width < 820 ? "a phone" : "a tablet") : "a computer";
    // Time is always shown as Kuala Lumpur time, wherever the visitor is.
    let time = "";
    try {
      time = new Date().toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kuala_Lumpur" }).toLowerCase();
    } catch (_) {
      try { time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).toLowerCase(); } catch (__) { /* ignore */ }
    }
    const when = time ? ", at " + time + " Kuala Lumpur time" : "";
    const lines = [
      "Hello. Yes, you.",
      "You are on " + device + ", " + width + " pixels wide" + when + ".",
      "Your customers find businesses the same way, in seconds.",
      "So here is what I do with those seconds."
    ];
    let li = 0, ci = 0, timer = 0;
    const type = () => {
      const line = lines[li];
      if (ci <= line.length) {
        lineEl.textContent = line.slice(0, ci);
        ci += 1;
        timer = setTimeout(type, 13 + Math.random() * 14);
        return;
      }
      if (li === lines.length - 1) { timer = setTimeout(finishIntro, 800); return; }
      timer = setTimeout(() => {
        li += 1; ci = 0; lineEl.textContent = "";
        timer = setTimeout(type, 180);
      }, 620);
    };
    timer = setTimeout(type, 350);

    const skip = () => { clearTimeout(timer); finishIntro(); };
    intro.addEventListener("click", skip);
    document.addEventListener("keydown", (e) => {
      if (!introDone && (e.key === "Escape" || e.key === "Enter" || e.key === " ")) skip();
    });
    setTimeout(skip, 11000); // never hold a visitor hostage
  }

  /* ---------- speech bubble: small asides that react to the visitor ---------- */
  const bubble = $("[data-bubble]");
  if (bubble) {
    const said = new Set();
    let hideTimer = 0;
    const heroInView = () => window.scrollY < window.innerHeight * 0.5;
    const say = (key, text, ms) => {
      if (said.has(key) || !heroInView()) return;
      said.add(key);
      bubble.textContent = text;
      bubble.classList.add("is-on");
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => bubble.classList.remove("is-on"), ms || 6500);
    };
    document.addEventListener("intro:done", () => {
      setTimeout(() => say("hello", "Hello, I am Alfred. Take your time."), 1800);
      setTimeout(() => say("linger", "Still here? Thank you for taking a closer look."), 16000);
    });
    if (finePointer) {
      document.addEventListener("mouseout", (e) => {
        if (!e.relatedTarget && e.clientY <= 0) say("exit", "Leaving already? My WhatsApp is one click away.");
      });
    }
    const baseTitle = document.title;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        document.title = "Still here when you are | Alfred Wong";
      } else {
        document.title = baseTitle;
        say("back", "Welcome back. I kept your place.");
      }
    });
  }

  /* ---------- nav: scrolled state via sentinel, mobile menu ---------- */
  const nav = $("[data-nav]");
  const sentinel = $("[data-nav-sentinel]");
  if (nav && sentinel && "IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => nav.classList.toggle("is-scrolled", !entry.isIntersecting), { threshold: 0 }).observe(sentinel);
  } else if (nav) {
    nav.classList.add("is-scrolled");
  }
  const toggle = $("[data-nav-toggle]");
  const mobile = $("[data-nav-mobile]");
  if (nav && toggle && mobile) {
    $$("a", mobile).forEach((a, i) => a.style.setProperty("--i", i));
    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      root.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
    $$("a", mobile).forEach((a) => a.addEventListener("click", () => setOpen(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
    window.matchMedia("(min-width: 900px)").addEventListener("change", (e) => { if (e.matches) setOpen(false); });
  }

  /* ---------- headings: words rise out of a mask ---------- */
  const maskWords = (h, accentWord) => {
    const words = h.textContent.trim().split(/\s+/);
    h.setAttribute("aria-label", words.join(" "));
    h.textContent = "";
    words.forEach((word, i) => {
      const isAccent = accentWord && word.toLowerCase().replace(/[^a-z]/g, "") === accentWord;
      h.appendChild(el("span", { class: "w" + (isAccent ? " w--accent" : ""), "aria-hidden": "true" }, [
        el("span", { class: "w__in", style: "--i: " + i, text: word })
      ]));
      if (i < words.length - 1) h.appendChild(document.createTextNode(" "));
    });
  };
  $$("[data-split]").forEach((h) => maskWords(h, (h.dataset.accent || "").toLowerCase()));
  if (!reduceMotion) $$(".rv-words").forEach((h) => maskWords(h, ""));

  /* ---------- statement: split into words so each one can light up as you scroll ---------- */
  $$("[data-scrub-words]").forEach((p) => {
    const words = p.textContent.trim().split(/\s+/);
    p.setAttribute("aria-label", words.join(" "));
    p.textContent = "";
    words.forEach((word, i) => {
      const start = 18 + (i / words.length) * 40; // percentages of the scroll range
      const span = el("span", { class: "sw", "aria-hidden": "true", text: word });
      span.style.animationRange = "cover " + start.toFixed(1) + "% cover " + (start + 7).toFixed(1) + "%";
      p.appendChild(span);
      if (i < words.length - 1) p.appendChild(document.createTextNode(" "));
    });
  });

  /* ---------- ticker: a second copy keeps the fallback loop seamless ---------- */
  $$("[data-ticker] .ticker__track").forEach((track) => {
    track.innerHTML += track.innerHTML;
    $$("span", track).forEach((s, i, all) => { if (i >= all.length / 2) s.setAttribute("aria-hidden", "true"); });
  });

  /* ---------- entrances ---------- */
  const revealEls = $$(".rv, .rv-words");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach((elm) => io.observe(elm));
  } else {
    revealEls.forEach((elm) => elm.classList.add("in"));
  }

  // numbers count up once visible ("20" with data-suffix "+" ends as "20+")
  $$("[data-count]").forEach((elm) => {
    const target = parseFloat(elm.dataset.count);
    const suffix = elm.dataset.suffix || "";
    if (isNaN(target) || reduceMotion || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const start = performance.now(), dur = 1300;
      const tick = (now) => {
        const p = Math.min(1, (now - start) / dur);
        elm.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + (p === 1 ? suffix : "");
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(elm);
  });

  /* ---------- magnetic primary buttons (mouse only) ---------- */
  if (finePointer && !reduceMotion) {
    $$("[data-magnetic]").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        btn.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * 0.15).toFixed(1) + "px, " + ((e.clientY - r.top - r.height / 2) * 0.25).toFixed(1) + "px)";
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });
  }

  /* ---------- work: the horizontal reel ---------- */
  // Desktop browsers with CSS scroll-driven animations pin the reel and slide it as you scroll (see styles.css).
  // Everywhere else it is a normal sideways scroller, with arrow buttons for mouse users.
  const pan = $("[data-pan]");
  if (pan) {
    const view = $("[data-pan-view]", pan);
    const track = $("[data-pan-track]", pan);
    const cards = $$(".wcard", track);
    const bar = $("[data-pan-bar]", pan);
    const navEl = $("[data-pan-nav]", pan);
    const wide = window.matchMedia("(min-width: 1000px)");
    let pinned = false;

    const measure = () => {
      const want = scrollDriven && wide.matches && !reduceMotion;
      if (want !== pinned) { pinned = want; root.classList.toggle("pan-on", pinned); }
      if (pinned) pan.style.setProperty("--pan-dist", Math.max(0, track.scrollWidth - window.innerWidth));
      if (navEl) navEl.hidden = pinned || !finePointer;
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("load", measure);
    wide.addEventListener("change", measure);

    // sideways scroller: progress line and arrow buttons
    view.addEventListener("scroll", () => {
      if (pinned || !bar) return;
      const max = view.scrollWidth - view.clientWidth;
      bar.style.setProperty("--p", (max > 0 ? view.scrollLeft / max : 0).toFixed(4));
    }, { passive: true });
    const stepBy = (dir) => {
      const w = cards[0] ? cards[0].getBoundingClientRect().width : view.clientWidth * 0.8;
      view.scrollBy({ left: dir * (w + 40), behavior: reduceMotion ? "auto" : "smooth" });
    };
    const prev = $("[data-pan-prev]", pan), next = $("[data-pan-next]", pan);
    if (prev) prev.addEventListener("click", () => stepBy(-1));
    if (next) next.addEventListener("click", () => stepBy(1));

    // pinned reel: tabbing to a card scrolls the page to where that card is in view
    track.addEventListener("focusin", (e) => {
      if (!pinned) return;
      const card = e.target.closest(".wcard");
      if (!card) return;
      view.scrollLeft = 0;
      const dist = Math.max(1, track.scrollWidth - window.innerWidth);
      const x = clamp(card.offsetLeft + card.offsetWidth / 2 - window.innerWidth / 2, 0, dist);
      const top = pan.getBoundingClientRect().top + window.scrollY;
      scrollToY(top + (x / dist) * (pan.offsetHeight - window.innerHeight));
    });

    // cards sit far to the side, so load their images as the reel approaches rather than waiting
    if ("IntersectionObserver" in window) {
      const near = new IntersectionObserver((entries) => {
        if (!entries.some((en) => en.isIntersecting)) return;
        near.disconnect();
        $$("img[loading='lazy']", track).forEach((img) => { img.loading = "eager"; });
      }, { rootMargin: "900px 0px" });
      near.observe(pan);
    }

    // rest the pointer on a preview to scroll through the whole homepage (data-full on each card)
    if (finePointer && !reduceMotion) {
      cards.forEach((card) => {
        const src = card.dataset.full;
        const link = $(".wcard__link", card);
        const screen = $(".wcard__screen", card);
        if (!src || !link || !screen) return;
        let full = null, hovering = false, timer = 0;
        const reset = () => {
          clearTimeout(timer);
          if (!full) return;
          full.classList.remove("is-on", "is-moving");
          full.style.transitionDuration = "";
          full.style.transform = "";
        };
        const run = () => {
          if (!hovering || !full || !full.naturalHeight) return;
          const travel = full.offsetHeight - screen.clientHeight;
          if (travel <= 0) return;
          full.classList.add("is-on");
          clearTimeout(timer);
          timer = setTimeout(() => {
            if (!hovering) return;
            full.classList.add("is-moving");
            full.style.transitionDuration = Math.min(20, Math.max(6, travel / 150)).toFixed(1) + "s, .5s";
            full.style.transform = "translateY(" + (-travel) + "px)";
          }, 450);
        };
        screen.addEventListener("pointerenter", () => {
          hovering = true;
          if (!full) {
            full = el("img", { class: "wcard__full", alt: "", decoding: "async" });
            full.addEventListener("error", () => { if (full) full.remove(); full = null; }, { once: true });
            screen.appendChild(full);
            full.src = src;
          }
          if (full.complete && full.naturalHeight) run(); else full.addEventListener("load", run, { once: true });
        });
        screen.addEventListener("pointerleave", () => { hovering = false; reset(); });
      });
    }
  }

  /* ---------- videos: play only while on screen; stills for reduced motion and data saver ---------- */
  const videos = $$("video[data-lazyvideo], video[data-autovideo]");
  if (reduceMotion || saveData) {
    videos.forEach((v) => {
      v.removeAttribute("autoplay");
      try { v.pause(); } catch (_) { /* ignore */ }
      if (v.hasAttribute("src")) { v.removeAttribute("src"); v.load(); }
    });
  } else if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      const v = en.target;
      if (en.isIntersecting) {
        if (v.dataset.src && !v.getAttribute("src")) v.src = v.dataset.src;
        const p = v.play();
        if (p && p.catch) p.catch(() => { /* autoplay blocked: the poster stays */ });
      } else if (!v.paused) {
        v.pause();
      }
    }), { rootMargin: "200px 0px" });
    videos.forEach((v) => io.observe(v));
  }

  /* ---------- footer year ---------- */
  $$("[data-year]").forEach((elm) => { elm.textContent = new Date().getFullYear(); });

  /* ---------- contact form: compose a WhatsApp message, preview it live, accept prefills ---------- */
  const form = $("[data-contact-form]");
  let prefillForm = () => {}; // used by the services helper and the phone sketch
  if (form) {
    const field = (name) => form.elements[name];
    const v = (name) => (field(name) && field(name).value.trim()) || "";
    const compose = () => [
      "Hi Alfred, I would like to talk about a project.",
      "",
      v("name") ? "Name: " + v("name") : null,
      v("business") ? "Business: " + v("business") : null,
      v("phone") ? "WhatsApp: " + v("phone") : null,
      "Need: " + v("need"),
      v("text") ? "" : null,
      v("text") ? "About the business:" : null,
      v("text") || null
    ].filter((l) => l !== null).join("\n");

    // the preview shows exactly what will be sent
    const preview = $("[data-wa-preview]", form);
    const previewText = $("[data-wa-preview-text]", form);
    const update = () => { if (previewText) previewText.textContent = compose(); };
    if (preview && previewText) {
      preview.hidden = false;
      form.addEventListener("input", update);
      form.addEventListener("change", update);
      update();
    }

    // fill in what the visitor already told us elsewhere on the page, without overwriting their own words
    ["business", "text"].forEach((name) => {
      const f = field(name);
      if (f) f.addEventListener("input", () => { delete f.dataset.auto; });
    });
    prefillForm = ({ business, need, note } = {}) => {
      const b = field("business"), n = field("need"), t = field("text");
      if (business && b && (!b.value.trim() || b.dataset.auto)) { b.value = business; b.dataset.auto = "1"; }
      if (need && n) n.value = need;
      if (note && t && (!t.value.trim() || t.dataset.auto)) { t.value = note; t.dataset.auto = "1"; }
      update();
      const first = ["name", "phone", "text"].map(field).find((f) => f && !f.value.trim());
      if (first) setTimeout(() => first.focus({ preventScroll: true }), reduceMotion ? 0 : 900);
    };

    form.addEventListener("submit", (e) => {
      if (!form.checkValidity()) return; // let the browser show its validation messages
      e.preventDefault();
      const number = form.dataset.whatsapp || "60105072222";
      const url = "https://wa.me/" + number + "?text=" + encodeURIComponent(compose());
      const win = window.open(url, "_blank", "noopener");
      if (!win) location.href = url; // popup blocked: navigate instead
      const btn = form.querySelector('[type="submit"]');
      if (btn) { btn.textContent = "Opening WhatsApp"; setTimeout(() => { btn.textContent = "Send enquiry"; }, 4000); }
    });
  }

  /* ---------- services helper: three questions, one suggestion ---------- */
  // Edit the wording here. Each answer has a value (used in the logic below) and a label (shown on the button).
  const HELPER = {
    questions: [
      { id: "site", q: "Does your business have a website today?",
        options: [["none", "No, not yet"], ["weak", "Yes, but it needs work"], ["good", "Yes, and it works well"]] },
      { id: "find", q: "How do most new customers find you?",
        options: [["search", "Searching on Google"], ["social", "Facebook, Instagram or TikTok"], ["word", "Word of mouth"]] },
      { id: "post", q: "How often do you post on social media?",
        options: [["often", "Most weeks"], ["sometimes", "Now and then"], ["rarely", "Rarely or never"]] }
    ],
    // [title shown to the visitor, option chosen in the contact form]
    outcomes: {
      "new+social": ["A website, then social media", "Website and social media"],
      "redesign+social": ["A refreshed website, then social media", "Website and social media"],
      "new": ["A new website", "A new website"],
      "redesign": ["A redesign of your website", "Redesign of my current website"],
      "+social": ["Social media marketing", "Social media marketing"],
      "": ["A short chat first", "Something else"]
    },
    why: {
      site: {
        none: "Without a website, people who look you up have nowhere to check your prices, hours and location before they get in touch.",
        weak: "A website that looks dated or is hard to use on a phone can quietly send customers elsewhere. A redesign keeps what works and fixes the rest.",
        good: "Your website already does its job, so there is no need to rebuild it."
      },
      find: {
        search: "Most of your customers search on Google, so a clear website and Google Business Profile help turn those searches into calls.",
        social: "Most of your customers find you on social media, so a website gives them one place to check you are real and get in touch.",
        word: "When someone recommends you, the next thing people do is look you up, so that first impression matters."
      },
      post: {
        more: "Posting regularly, in the language your customers speak, keeps you in front of them between visits. I can plan and run that for you.",
        keep: "You already post regularly, so keep going and link your posts to your website.",
        fine: "You already post regularly too, so you may be in good shape. A short chat can still turn up small improvements."
      }
    },
    // written into the contact form so Alfred sees the answers
    note: {
      site: { none: "I do not have a website yet", weak: "I have a website that needs work", good: "I have a website that works well" },
      find: { search: "most customers find me on Google", social: "most customers find me on social media", word: "most customers find me through word of mouth" },
      post: { often: "I post on social media most weeks", sometimes: "I post on social media now and then", rarely: "I rarely post on social media" }
    }
  };

  const helper = $("[data-helper]");
  const helperPanel = $("[data-helper-panel]");
  if (helper && helperPanel) {
    const Q = HELPER.questions;
    let answers = {};
    let step = 0;
    const suggest = (a) => {
      const web = a.site === "none" ? "new" : a.site === "weak" ? "redesign" : "";
      const social = a.post !== "often";
      const [title, need] = HELPER.outcomes[web + (social ? "+social" : "")];
      const postWhy = social ? HELPER.why.post.more : web ? HELPER.why.post.keep : HELPER.why.post.fine;
      return {
        title, need,
        why: [HELPER.why.site[a.site], HELPER.why.find[a.find], postWhy].join(" "),
        note: HELPER.note.site[a.site] + ", " + HELPER.note.find[a.find] + ", and " + HELPER.note.post[a.post] + "."
      };
    };
    const progress = (done) => el("div", { class: "helper__progress", "aria-hidden": "true" },
      Q.map((_, i) => el("span", { class: i < done ? "is-done" : "" })));
    const render = (moveFocus) => {
      helperPanel.textContent = "";
      let target;
      if (step < Q.length) {
        const item = Q[step];
        target = el("p", { class: "helper__q", id: "helper-q", tabindex: "-1", text: item.q });
        helperPanel.appendChild(el("div", { class: "helper__step" }, [
          progress(step + 1),
          el("p", { class: "helper__count", text: "Question " + (step + 1) + " of " + Q.length }),
          target,
          el("div", { class: "helper__options", role: "group", "aria-labelledby": "helper-q" },
            item.options.map(([value, label]) => el("button", {
              type: "button",
              class: "helper__opt" + (answers[item.id] === value ? " is-picked" : ""),
              text: label,
              onclick: () => { answers[item.id] = value; step += 1; render(true); }
            }))),
          step > 0 ? el("button", { type: "button", class: "helper__back", text: "Back", onclick: () => { step -= 1; render(true); } }) : null
        ]));
      } else {
        const r = suggest(answers);
        target = el("p", { class: "helper__pick", tabindex: "-1", text: r.title });
        helperPanel.appendChild(el("div", { class: "helper__step" }, [
          progress(Q.length),
          el("p", { class: "helper__count", text: "My suggestion" }),
          target,
          el("p", { class: "helper__why", text: r.why }),
          el("div", { class: "helper__actions" }, [
            el("a", { class: "btn btn--primary", href: "#contact", text: "Start a project", onclick: () => prefillForm({ need: r.need, note: r.note }) }),
            el("button", { type: "button", class: "btn btn--ghost", text: "Change answers", onclick: () => { answers = {}; step = 0; render(true); } })
          ])
        ]));
      }
      if (moveFocus && target) target.focus({ preventScroll: true });
    };
    helper.hidden = false;
    render(false);
  }

  /* ---------- social: example caption in three languages ---------- */
  const sample = $("[data-sample]");
  if (sample) {
    const langButtons = $$("[data-lang]", sample);
    const captions = $$("[data-caption]", sample);
    const group = $("[data-sample-langs]", sample);
    const pick = (lang) => {
      langButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
      captions.forEach((c) => { c.hidden = c.dataset.caption !== lang; });
    };
    langButtons.forEach((b) => b.addEventListener("click", () => pick(b.dataset.lang)));
    if (group) group.hidden = false;
    pick("en");
    sample.classList.add("is-live"); // captions fade in on later switches only
  }

  /* ---------- picture yours: a live phone sketch from the visitor's business name ---------- */
  // Wording for each business type. {area} is replaced with what the visitor types (or Klang).
  const TYPES = {
    food: { tag: "Restaurant", label: "restaurant or café", title: "Fresh food, cooked every day in {area}.", sub: "Dine in, take away or order on WhatsApp.", list: ["Today's menu", "Opening hours", "Book a table"] },
    shop: { tag: "Shop", label: "shop", title: "Everything you need, right here in {area}.", sub: "See what is in stock and order on WhatsApp.", list: ["New arrivals", "Best sellers", "Delivery and pickup"] },
    trade: { tag: "Workshop", label: "workshop or trade business", title: "Solid work, done properly in {area}.", sub: "Send a photo of the job on WhatsApp for a quote.", list: ["Our services", "Recent jobs", "Get a quote"] },
    care: { tag: "Clinic", label: "clinic or wellness business", title: "Care you can trust in {area}.", sub: "Book your appointment in a few taps.", list: ["Treatments", "Meet the team", "Book a visit"] },
    service: { tag: "Local services", label: "service business", title: "Help you can count on in {area}.", sub: "Tell us what you need and we reply on WhatsApp.", list: ["What we do", "How it works", "Areas we cover"] }
  };

  const builder = $("[data-builder]");
  const mock = $("[data-mock]");
  if (builder && mock) {
    const nameIn = $("[data-builder-name]", builder);
    const areaIn = $("[data-builder-area]", builder);
    const setText = (sel, text) => $$(sel, mock).forEach((n) => { n.textContent = text; });
    const checked = (name, fallback) => { const r = $('input[name="' + name + '"]:checked', builder); return r ? r.value : fallback; };
    const state = () => ({
      typed: nameIn ? nameIn.value.trim() : "",
      name: (nameIn && nameIn.value.trim()) || "Your business",
      area: (areaIn && areaIn.value.trim()) || "Klang",
      type: TYPES[checked("y-type", "food")] ? checked("y-type", "food") : "food",
      colour: checked("y-colour", "#c53030")
    });
    const writeCopy = (s) => {
      const t = TYPES[s.type];
      setText("[data-mock-tag]", t.tag + " in " + s.area);
      setText("[data-mock-title]", t.title.replace("{area}", s.area));
      setText("[data-mock-sub]", t.sub);
      $$("[data-mock-list] li", mock).forEach((li, i) => { li.textContent = t.list[i] || ""; });
    };
    let lastType = "", swapTimer = 0;
    const paint = () => {
      const s = state();
      builder.style.setProperty("--c", s.colour);
      setText("[data-mock-name]", s.name);
      setText("[data-mock-area]", s.area);
      if (lastType && s.type !== lastType && !reduceMotion) {
        mock.classList.add("is-swapping");
        clearTimeout(swapTimer);
        swapTimer = setTimeout(() => { writeCopy(state()); mock.classList.remove("is-swapping"); }, 200);
      } else if (!mock.classList.contains("is-swapping")) {
        writeCopy(s);
      }
      lastType = s.type;
    };
    // the phone's clock shows Kuala Lumpur time, like the intro
    const clock = $("[data-mock-time]", mock);
    const tick = () => {
      try {
        clock.textContent = new Date().toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kuala_Lumpur" }).replace(/\s*[ap]\.?\s?m\.?$/i, "");
      } catch (_) { /* keep the placeholder */ }
    };
    if (clock) { tick(); setInterval(tick, 30000); }
    const go = $("[data-builder-go]", builder);
    if (go) go.addEventListener("click", () => {
      const s = state(), t = TYPES[s.type];
      prefillForm({
        business: s.typed,
        need: "A new website",
        note: "I tried the website sketch on your site. " + (s.typed
          ? "My business is " + s.typed + ", a " + t.label + " in " + s.area + "."
          : "I run a " + t.label + " in " + s.area + ".")
      });
    });
    builder.addEventListener("input", paint);
    builder.addEventListener("change", paint);
    builder.hidden = false;
    paint();
  }
})();
