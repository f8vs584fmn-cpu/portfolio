const pages = [...document.querySelectorAll("[data-page]")];
const home = document.querySelector(".home");
const prismTrigger = document.querySelector("#prismTrigger");
const cursor = document.querySelector(".cursor");
const validRoutes = new Set(["home", "science", "art", "curiosity"]);

function activatePrism() {
  home.classList.add("is-awake");
  prismTrigger.setAttribute("aria-expanded", "true");
}

prismTrigger.addEventListener("pointerenter", activatePrism);
prismTrigger.addEventListener("focus", activatePrism);
prismTrigger.addEventListener("click", activatePrism);

let glowTargetX = 78;
let glowTargetY = 50;
let glowCurrentX = 78;
let glowCurrentY = 50;

home.addEventListener("pointermove", (event) => {
  home.style.setProperty("--mx", `${(event.clientX / innerWidth) * 100}%`);
  home.style.setProperty("--my", `${(event.clientY / innerHeight) * 100}%`);
  glowTargetX = (event.clientX / innerWidth) * 100;
  glowTargetY = (event.clientY / innerHeight) * 100;
});

function softenHomeGlow() {
  glowCurrentX += (glowTargetX - glowCurrentX) * 0.038;
  glowCurrentY += (glowTargetY - glowCurrentY) * 0.038;
  home.style.setProperty("--gx", `${glowCurrentX.toFixed(3)}%`);
  home.style.setProperty("--gy", `${glowCurrentY.toFixed(3)}%`);
  requestAnimationFrame(softenHomeGlow);
}

requestAnimationFrame(softenHomeGlow);

const glowColors = {
  science: "86, 199, 255",
  art: "255, 202, 78",
  curiosity: "255, 78, 91",
};

document.querySelectorAll(".theme-link").forEach((link) => {
  const glowName = [...link.classList].find((name) => glowColors[name]);
  const showGlow = () => {
    home.dataset.glow = glowName;
    home.style.setProperty("--glow", glowColors[glowName]);
  };
  const hideGlow = () => delete home.dataset.glow;
  link.addEventListener("pointerenter", showGlow);
  link.addEventListener("pointerleave", hideGlow);
  link.addEventListener("focus", showGlow);
  link.addEventListener("blur", hideGlow);
});

function getRoute() {
  const route = (location.hash.replace(/^#\/?/, "") || "home").split("/")[0];
  return validRoutes.has(route) ? route : "home";
}

function renderRoute() {
  const route = getRoute();
  pages.forEach((page) => page.classList.toggle("is-active", page.dataset.page === route));
  document.body.classList.toggle("is-detail", route !== "home");
  document.querySelectorAll(".mini-nav a").forEach((link) => {
    if (link.dataset.route === route) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  document.title = route === "home" ? "Dylan Guan 关鉴" : `${document.querySelector(`[data-page="${route}"]`).getAttribute("aria-label")} — Dylan Guan`;
  const sectionId = location.hash.replace(/^#\/?/, "").split("/")[1];
  if (sectionId) requestAnimationFrame(() => {
    const target = document.getElementById(sectionId);
    if (target) scrollTo({ top: target.offsetTop - 104, behavior: "smooth" });
  });
  else scrollTo({ top: 0, behavior: "instant" });
  requestAnimationFrame(observeReveals);
}

window.addEventListener("hashchange", renderRoute);
renderRoute();

const observer = new IntersectionObserver(
  (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")),
  { threshold: 0.12 }
);

function observeReveals() {
  document.querySelectorAll(".is-active .reveal").forEach((item) => observer.observe(item));
}

observeReveals();

if (matchMedia("(pointer: fine)").matches) {
  window.addEventListener("pointermove", (event) => {
    cursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
  });
  document.addEventListener("pointerover", (event) => {
    cursor.classList.toggle("is-hover", Boolean(event.target.closest("a, button")));
  });
}

document.querySelectorAll(".poster button").forEach((button) => {
  button.addEventListener("click", () => {
    button.textContent = "待补充";
    setTimeout(() => (button.textContent = "PLAY"), 1200);
  });
});

const videoModal = document.querySelector("#videoModal");
const modalVideo = document.querySelector("#modalVideo");
const modalVideoTitle = document.querySelector("#modalVideoTitle");
const modalNoteLink = document.querySelector("#modalNoteLink");

function stopModalVideo() {
  modalVideo.pause();
  modalVideo.removeAttribute("src");
  modalVideo.load();
}

function openVideo(slide) {
  modalVideo.src = slide.dataset.video;
  modalVideoTitle.textContent = slide.dataset.title;
  modalNoteLink.href = slide.dataset.note;
  videoModal.showModal();
  modalVideo.play().catch(() => {});
}

document.querySelectorAll(".video-slide").forEach((slide) => {
  const preview = slide.querySelector("video");
  const playButton = slide.querySelector(".video-play");
  const source = preview.getAttribute("src") || preview.dataset.src;
  preview.dataset.src = source;
  preview.removeAttribute("src");
  preview.preload = "none";
  preview.addEventListener("loadeddata", () => {
    if (preview.currentTime === 0) preview.currentTime = 0.05;
  }, { once: true });
  const loadPreview = () => {
    if (!preview.getAttribute("src")) {
      preview.src = preview.dataset.src;
      preview.preload = "metadata";
      preview.load();
    }
  };
  slide.addEventListener("pointerenter", () => {
    if (!matchMedia("(pointer: fine)").matches) return;
    loadPreview();
    preview.play().catch(() => {});
  });
  slide.addEventListener("pointerleave", () => {
    if (!matchMedia("(pointer: fine)").matches) return;
    preview.pause();
    preview.currentTime = 0.05;
  });
  playButton.addEventListener("click", () => {
    loadPreview();
    openVideo(slide);
  });
  const previewObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      loadPreview();
      previewObserver.disconnect();
    }
  }, { rootMargin: "220px 0px", threshold: 0.01 });
  previewObserver.observe(slide);
});

document.querySelectorAll("img").forEach((image, index) => {
  if (index > 1) image.loading = "lazy";
  image.decoding = "async";
});

document.querySelectorAll("[data-section-jump]").forEach((button) => {
  button.addEventListener("click", () => {
    const page = button.dataset.jumpPage || button.closest("[data-page]")?.dataset.page || "art";
    location.hash = `#/${page}/${button.dataset.sectionJump}`;
  });
});

document.querySelectorAll(".idea-track").forEach((track) => {
  if (track.dataset.loopReady) return;
  const sourceCards = [...track.children];
  const stage = track.closest(".idea-stage");
  sourceCards.forEach((card) => { card.tabIndex = 0; });
  for (let copy = 0; copy < 1; copy += 1) sourceCards.forEach((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.tabIndex = -1;
    clone.querySelectorAll("a, button").forEach((item) => item.setAttribute("tabindex", "-1"));
    track.appendChild(clone);
  });
  track.dataset.loopReady = "true";

  let offset = 0;
  let loopWidth = 1;
  let lastFrame = performance.now();
  let paused = false;
  let inView = false;
  let dragging = false;
  let moved = false;
  let dragStartX = 0;
  let dragStartOffset = 0;
  let resumeTimer = 0;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(pointer: fine)");

  const measureLoop = () => {
    const firstClone = track.children[sourceCards.length];
    loopWidth = Math.max(1, firstClone.offsetLeft - track.children[0].offsetLeft);
    offset = ((offset % loopWidth) + loopWidth) % loopWidth;
  };
  const setPaused = (value) => {
    paused = value;
    stage.classList.toggle("is-paused", value);
    lastFrame = performance.now();
  };
  const resumeSoon = (delay = 700) => {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      if (!stage.querySelector(".idea-card.is-open")) setPaused(false);
    }, delay);
  };
  const renderIdeaLoop = (now) => {
    const elapsed = Math.min(50, now - lastFrame);
    lastFrame = now;
    if (inView && !paused && !dragging && !reducedMotion.matches) {
      const speed = innerWidth <= 620 ? 27 : 36;
      offset = (offset + (elapsed / 1000) * speed) % loopWidth;
    }
    track.style.transform = `translate3d(${-offset.toFixed(2)}px,0,0)`;
    requestAnimationFrame(renderIdeaLoop);
  };

  if ("ResizeObserver" in window) new ResizeObserver(measureLoop).observe(track);
  else addEventListener("resize", measureLoop, { passive: true });
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    lastFrame = performance.now();
  }, { threshold: 0.02 }).observe(stage);
  document.addEventListener("visibilitychange", () => { lastFrame = performance.now(); });

  stage.addEventListener("pointerenter", () => {
    if (finePointer.matches) setPaused(true);
  });
  stage.addEventListener("pointerleave", () => {
    if (finePointer.matches && !stage.querySelector(".idea-card.is-open")) setPaused(false);
  });
  stage.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    clearTimeout(resumeTimer);
    dragging = true;
    moved = false;
    dragStartX = event.clientX;
    dragStartOffset = offset;
    setPaused(true);
    stage.classList.add("is-dragging");
    stage.setPointerCapture?.(event.pointerId);
  });
  stage.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const distance = event.clientX - dragStartX;
    moved ||= Math.abs(distance) > 6;
    offset = ((dragStartOffset - distance) % loopWidth + loopWidth) % loopWidth;
  });
  const finishIdeaDrag = (event) => {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove("is-dragging");
    if (stage.hasPointerCapture?.(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    resumeSoon();
  };
  stage.addEventListener("pointerup", finishIdeaDrag);
  stage.addEventListener("pointercancel", finishIdeaDrag);

  stage.addEventListener("click", (event) => {
    const card = event.target.closest(".idea-card");
    if (!card || !stage.contains(card)) return;
    if (moved) {
      event.preventDefault();
      return;
    }
    if (finePointer.matches) return;
    const willOpen = !card.classList.contains("is-open");
    stage.querySelectorAll(".idea-card.is-open").forEach((item) => item.classList.remove("is-open"));
    card.classList.toggle("is-open", willOpen);
    setPaused(willOpen);
    if (!willOpen) resumeSoon(250);
  });

  measureLoop();
  requestAnimationFrame(renderIdeaLoop);
});

const sapporoAudio = document.querySelector("#sapporoAudio");
if (sapporoAudio) {
  const songCard = sapporoAudio.closest(".song-card");
  const songTime = songCard.querySelector("#songTime");
  const songProgress = songCard.querySelector(".song-progress");
  const songToggles = [...songCard.querySelectorAll("[data-song-toggle]")];
  const formatAudioTime = (value) => {
    if (!Number.isFinite(value)) return "--:--";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };
  const syncSongState = () => {
    const isPlaying = !sapporoAudio.paused;
    songCard.classList.toggle("is-playing", isPlaying);
    songCard.querySelector(".song-disc small").textContent = isPlaying ? "正在播放" : "点击播放";
    songCard.querySelector(".song-player button span").textContent = isPlaying ? "Ⅱ" : "▶";
    songCard.querySelector(".song-player button b").textContent = isPlaying ? "暂停歌曲" : "播放歌曲";
    songToggles.forEach((button) => button.setAttribute("aria-label", `${isPlaying ? "暂停" : "播放"}《札幌航线 Vol.2》`));
  };
  songToggles.forEach((button) => button.addEventListener("click", () => {
    if (sapporoAudio.paused) sapporoAudio.play().catch(() => {});
    else sapporoAudio.pause();
  }));
  sapporoAudio.addEventListener("play", syncSongState);
  sapporoAudio.addEventListener("pause", syncSongState);
  sapporoAudio.addEventListener("ended", syncSongState);
  const updateSongProgress = () => {
    const progress = Number.isFinite(sapporoAudio.duration) && sapporoAudio.duration > 0 ? (sapporoAudio.currentTime / sapporoAudio.duration) * 100 : 0;
    songProgress.style.setProperty("--song-progress", `${progress}%`);
    songProgress.value = progress;
    songTime.textContent = `${formatAudioTime(sapporoAudio.currentTime)} / ${formatAudioTime(sapporoAudio.duration)}`;
  };
  songProgress.addEventListener("input", () => {
    if (!Number.isFinite(sapporoAudio.duration) || sapporoAudio.duration <= 0) return;
    sapporoAudio.currentTime = (Number(songProgress.value) / 100) * sapporoAudio.duration;
    updateSongProgress();
  });
  sapporoAudio.addEventListener("loadedmetadata", updateSongProgress);
  sapporoAudio.addEventListener("timeupdate", updateSongProgress);
  syncSongState();
}

document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  const track = carousel.querySelector(".carousel-track");
  const pages = [...track.children];
  const counter = carousel.querySelector(".carousel-count b");
  let index = 0;
  let touchStartX = null;

  const showPage = (nextIndex) => {
    index = (nextIndex + pages.length) % pages.length;
    track.style.transform = `translateX(${-index * 100}%)`;
    counter.textContent = index + 1;
  };

  carousel.querySelector(".carousel-prev").addEventListener("click", (event) => {
    event.stopPropagation();
    showPage(index - 1);
  });
  carousel.querySelector(".carousel-next").addEventListener("click", (event) => {
    event.stopPropagation();
    showPage(index + 1);
  });
  carousel.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    event.stopPropagation();
    touchStartX = event.clientX;
  });
  carousel.addEventListener("pointerup", (event) => {
    if (event.target.closest("button") || touchStartX === null) return;
    event.stopPropagation();
    const distance = event.clientX - touchStartX;
    if (Math.abs(distance) > 38) showPage(index + (distance < 0 ? 1 : -1));
    touchStartX = null;
  });
  carousel.addEventListener("pointercancel", () => { touchStartX = null; });
});

document.querySelector(".video-modal-close").addEventListener("click", () => videoModal.close());
videoModal.addEventListener("click", (event) => {
  if (event.target === videoModal) videoModal.close();
});
videoModal.addEventListener("close", stopModalVideo);

document.querySelectorAll(".case-rail").forEach((rail) => {
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startScroll = 0;

  rail.addEventListener("wheel", (event) => {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX) && rail.scrollWidth > rail.clientWidth) {
      event.preventDefault();
      rail.scrollLeft += event.deltaY;
    }
  }, { passive: false });

  rail.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    dragging = true;
    moved = false;
    startX = event.clientX;
    startScroll = rail.scrollLeft;
    rail.classList.add("is-dragging");
    rail.setPointerCapture(event.pointerId);
  });

  rail.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const distance = event.clientX - startX;
    moved ||= Math.abs(distance) > 5;
    rail.scrollLeft = startScroll - distance;
  });

  const endDrag = (event) => {
    if (!dragging) return;
    dragging = false;
    rail.classList.remove("is-dragging");
    if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
  };

  rail.addEventListener("pointerup", endDrag);
  rail.addEventListener("pointercancel", endDrag);
  rail.addEventListener("click", (event) => {
    if (moved) event.preventDefault();
  }, true);
});
