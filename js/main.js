(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  const year = document.querySelector("[data-year]");

  if (year) year.textContent = String(new Date().getFullYear());

  const onScroll = () => header?.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && nav) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  }

  // Reveal on scroll
  const reveals = document.querySelectorAll("[data-reveal]");
  if (!reveals.length || reduceMotion) {
    reveals.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  }

  // Feature tabs
  const tabs = document.querySelectorAll("[data-feature-tab]");
  const panels = document.querySelectorAll("[data-feature-panel]");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const id = tab.getAttribute("data-feature-tab");
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", String(on));
      });
      panels.forEach((panel) => {
        const match = panel.getAttribute("data-feature-panel") === id;
        panel.hidden = !match;
      });
    });
  });

  // Product sliders
  const createSlider = (root) => {
    const track = root.querySelector("[data-slider-track]");
    const slides = [...root.querySelectorAll("[data-slide]")];
    const dotsWrap = root.querySelector("[data-slider-dots]");
    const prev = root.querySelector("[data-slider-prev]");
    const next = root.querySelector("[data-slider-next]");
    if (!track || slides.length < 2) return;

    let index = 0;
    let timer = 0;
    let startX = 0;
    let deltaX = 0;
    let dragging = false;
    const autoplay = Number(root.getAttribute("data-autoplay") || 0);

    const goTo = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      track.style.transform = `translate3d(${-index * 100}%, 0, 0)`;
      slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
      dotsWrap?.querySelectorAll(".slider-dot").forEach((dot, i) => {
        dot.classList.toggle("is-active", i === index);
        dot.setAttribute("aria-current", i === index ? "true" : "false");
      });
    };

    slides.forEach((slide, i) => {
      const label = slide.querySelector("strong")?.textContent || `Slide ${i + 1}`;
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = `slider-dot${i === 0 ? " is-active" : ""}`;
      dot.setAttribute("aria-label", `Show ${label}`);
      if (i === 0) dot.setAttribute("aria-current", "true");
      dot.addEventListener("click", () => {
        goTo(i);
        restart();
      });
      dotsWrap?.appendChild(dot);
    });

    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = 0;
    };

    const start = () => {
      if (reduceMotion || !autoplay) return;
      stop();
      timer = window.setInterval(() => goTo(index + 1), autoplay);
    };

    const restart = () => {
      stop();
      start();
    };

    prev?.addEventListener("click", () => {
      goTo(index - 1);
      restart();
    });
    next?.addEventListener("click", () => {
      goTo(index + 1);
      restart();
    });

    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goTo(index - 1);
        restart();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goTo(index + 1);
        restart();
      }
    });
    root.setAttribute("tabindex", "0");

    const stage = root.querySelector(".slider-stage");
    stage?.addEventListener(
      "pointerdown",
      (e) => {
        dragging = true;
        startX = e.clientX;
        deltaX = 0;
        stage.setPointerCapture?.(e.pointerId);
        stop();
      },
      { passive: true }
    );
    stage?.addEventListener(
      "pointermove",
      (e) => {
        if (!dragging) return;
        deltaX = e.clientX - startX;
        track.style.transition = "none";
        track.style.transform = `translate3d(calc(${-index * 100}% + ${deltaX}px), 0, 0)`;
      },
      { passive: true }
    );
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      track.style.transition = "";
      if (Math.abs(deltaX) > 50) goTo(index + (deltaX < 0 ? 1 : -1));
      else goTo(index);
      restart();
    };
    stage?.addEventListener("pointerup", endDrag);
    stage?.addEventListener("pointercancel", endDrag);
    stage?.addEventListener("pointerleave", endDrag);

    root.addEventListener("mouseenter", stop);
    root.addEventListener("mouseleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", (e) => {
      if (!root.contains(e.relatedTarget)) start();
    });

    goTo(0);
    start();
  };

  document.querySelectorAll("[data-slider]").forEach(createSlider);

  // PWA install + service worker
  let deferredPrompt = null;
  const installBtn = document.querySelector("[data-install]");
  const toast = document.querySelector("[data-install-toast]");
  const installConfirm = document.querySelector("[data-install-confirm]");
  const installDismiss = document.querySelector("[data-install-dismiss]");

  const showInstall = () => {
    if (installBtn) installBtn.hidden = false;
    if (toast && !sessionStorage.getItem("corex-install-dismissed")) toast.hidden = false;
  };

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstall();
  });

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (installBtn) installBtn.hidden = true;
    if (toast) toast.hidden = true;
  };

  installBtn?.addEventListener("click", promptInstall);
  installConfirm?.addEventListener("click", promptInstall);
  installDismiss?.addEventListener("click", () => {
    if (toast) toast.hidden = true;
    sessionStorage.setItem("corex-install-dismissed", "1");
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }
})();
