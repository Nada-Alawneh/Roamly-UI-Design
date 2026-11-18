(function () {
  "use strict";

  const film = document.getElementById("jordan-film");
  const toggle = document.getElementById("jordan-film-toggle");
  if (!film || !toggle) return;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function updateLabel() {
    const playing = !film.paused;
    const arabic = document.documentElement.lang === "ar";
    const play = arabic ? "شغّل فيديو الأردن" : "Play Jordan video";
    const pause = arabic ? "أوقف فيديو الأردن مؤقتاً" : "Pause Jordan video";
    toggle.textContent = playing ? pause : play;
  }

  function play() {
    film.play().catch(updateLabel);
  }

  toggle.hidden = false;
  toggle.addEventListener("click", () => {
    if (film.paused) play();
    else film.pause();
  });
  film.addEventListener("playing", updateLabel);
  film.addEventListener("pause", updateLabel);
  film.querySelector("source").addEventListener("error", () => {
    toggle.hidden = true;
  });
  motion.addEventListener("change", () => {
    if (motion.matches) film.pause();
  });
  document.addEventListener("roamly:languagechange", updateLabel);
  updateLabel();
  if (!motion.matches) play();
})();

(function () {
  "use strict";

  const route = document.querySelector(".jordan-route");
  if (!route) return;

  const arrivals = [...document.querySelectorAll(".jordan-arrival")];
  const chapters = document.querySelector(".jordan-chapters");
  const title = route.querySelector("strong");
  const line = route.querySelector(".jordan-route-copy p");
  const map = route.querySelector(".jordan-route-map");
  const mapTitle = map.querySelector("title");
  const regions = new Map([...map.querySelectorAll("[data-region]")].map((path) => [path.dataset.region, path]));
  const chapterRegions = {
    amman: "amman", salt: "balqa", jerash: "jerash", ajloun: "ajloun", "umm-qais": "irbid",
    madaba: "madaba", "dead-sea": "balqa", karak: "karak", dana: "tafilah", petra: "maan",
    "wadi-rum": "aqaba", aqaba: "aqaba",
  };
  let highlighted;
  let frame = 0;

  function updateCopy() {
    const readingLine = window.innerHeight * 0.36;
    const finished = chapters.getBoundingClientRect().bottom <= readingLine;
    const arrival = arrivals.findLast((element) =>
      element.getBoundingClientRect().top <= readingLine);
    const arabic = document.documentElement.lang === "ar";
    const label = finished
      ? (arabic ? "إلى أن نلتقي، يا أردن" : "Until we meet again, Jordan")
      : arrival
      ? arrival.querySelector("h2").textContent
      : (arabic ? "الحكاية الأردنية" : "The Jordanian Narrative");
    const sentence = finished
      ? (arabic
        ? "هون خلص الطريق، بس في أماكن بتضلّ تمشي معنا… والأردن واحد منها."
        : "The road ends here. Some places keep walking with us, and Jordan is one of them.")
      : arrival
      ? arrival.querySelector(".jordan-arrival-line").textContent
      : (arabic ? "في كل طريق بالأردن، حكاية بتستناك." : "Every road in Jordan has a story waiting for you.");
    if (title.textContent !== label) title.textContent = label;
    if (line.textContent !== sentence) line.textContent = sentence;
    const next = finished ? null : regions.get(chapterRegions[arrival?.parentElement.id]);
    if (highlighted !== next) {
      highlighted?.classList.remove("is-current");
      next?.classList.add("is-current");
      highlighted = next;
    }
    map.classList.toggle("is-finale", finished);
    const location = next ? arrival.querySelector(".jordan-arrival-location").textContent : "";
    const mapLabel = [arabic ? "خريطة الأردن" : "Map of Jordan", location].filter(Boolean).join(" · ");
    if (mapTitle.textContent !== mapLabel) mapTitle.textContent = mapLabel;
  }

  function update() {
    frame = 0;
    updateCopy();
    route.hidden = false;
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.max(0, Math.min(1, window.scrollY / scrollable));
    const compact = window.innerWidth <= 760;
    const travel = compact ? 0.15 : 0.48;
    const start = compact ? 0.64 : 0.23;
    const edge = Math.max(0, window.innerHeight - route.offsetHeight - 18);
    const y = Math.min(edge, window.innerHeight * (start + progress * travel));
    route.style.setProperty("--jordan-flag-y", Math.round(y) + "px");
  }

  function schedule() {
    if (!frame) frame = window.requestAnimationFrame(update);
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("pageshow", schedule);
  document.addEventListener("roamly:languagechange", schedule);
  const layout = new ResizeObserver(schedule);
  layout.observe(document.body);
  schedule();
})();

(function () {
  "use strict";

  const figures = [...document.querySelectorAll(".jordan-photo[data-video]")];
  if (!figures.length) return;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const visible = new Set();
  let current = null;
  let manual = null;

  function updateButton(clip) {
    const arabic = document.documentElement.lang === "ar";
    const name = clip.figure.querySelector("figcaption").textContent;
    const playing = !clip.video.paused;
    clip.button.textContent = playing
      ? (arabic ? "إيقاف مؤقت" : "Pause clip")
      : (arabic ? "شغّل المقطع" : "Play clip");
    clip.button.setAttribute("aria-label", clip.button.textContent + " · " + name);
  }

  function play(clip) {
    if (current && current !== clip) current.video.pause();
    current = clip;
    if (!clip.video.hasAttribute("src")) clip.video.src = clip.figure.dataset.video;
    clip.video.play().catch(() => updateButton(clip));
  }

  function sync() {
    if (manual && !visible.has(manual)) manual = null;
    let next = null;
    if (!document.hidden) {
      next = manual;
      if (!next && !motion.matches) {
        const mid = window.innerHeight / 2;
        let distance = Infinity;
        for (const clip of visible) {
          const { top, height } = clip.figure.getBoundingClientRect();
          const offset = Math.abs(top + height / 2 - mid);
          if (offset < distance) {
            distance = offset;
            next = clip;
          }
        }
        if (next?.pausedByVisitor || next?.failed) next = null;
      }
    }
    if (next === current) return;
    if (next) {
      play(next);
    } else if (current) {
      current.video.pause();
      current = null;
    }
  }

  const clips = new Map();
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const clip = clips.get(entry.target);
      if (entry.intersectionRatio >= .35) {
        visible.add(clip);
      } else {
        visible.delete(clip);
        clip.video.classList.remove("is-visible");
      }
    }
    sync();
  }, { threshold: [0, .35, .65, 1] });

  for (const figure of figures) {
    const video = document.createElement("video");
    video.className = "jordan-chapter-video";
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = "none";
    video.setAttribute("aria-hidden", "true");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "jordan-clip-toggle";
    button.dataset.userContent = "";
    const clip = { figure, video, button, pausedByVisitor: false, failed: false };
    clips.set(figure, clip);
    figure.append(video, button);
    updateButton(clip);
    video.addEventListener("playing", () => {
      video.classList.add("is-visible");
      updateButton(clip);
    });
    video.addEventListener("pause", () => updateButton(clip));
    video.addEventListener("error", () => {
      clip.failed = true;
      if (manual === clip) manual = null;
      video.classList.remove("is-visible");
      button.hidden = true;
      sync();
    });
    button.addEventListener("click", () => {
      if (!video.paused) {
        clip.pausedByVisitor = true;
        if (manual === clip) manual = null;
        video.pause();
        current = null;
      } else {
        clip.pausedByVisitor = false;
        manual = clip;
        play(clip);
      }
    });
    observer.observe(figure);
  }

  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
  document.addEventListener("roamly:languagechange", () => {
    for (const clip of clips.values()) updateButton(clip);
  });
})();
