(() => {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  const year = document.querySelector("[data-year]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && nav) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    };

    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      setOpen(open);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
  }

  // Ambient cursor wash
  if (!reduceMotion) {
    let mx = 50;
    let my = 20;
    let raf = 0;
    window.addEventListener(
      "pointermove",
      (event) => {
        mx = (event.clientX / window.innerWidth) * 100;
        my = (event.clientY / window.innerHeight) * 100;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          document.documentElement.style.setProperty("--mx", `${mx}%`);
          document.documentElement.style.setProperty("--my", `${my}%`);
          raf = 0;
        });
      },
      { passive: true }
    );
  }

  // Scroll reveals
  const reveals = document.querySelectorAll("[data-reveal]");
  if (!reveals.length || reduceMotion) {
    reveals.forEach((el) => el.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach((el) => observer.observe(el));
  }

  // Parallax float shots
  const parallaxEls = document.querySelectorAll("[data-parallax]");
  if (parallaxEls.length && !reduceMotion) {
    let ticking = false;
    const updateParallax = () => {
      const mid = window.innerHeight * 0.5;
      parallaxEls.forEach((el) => {
        const speed = Number(el.getAttribute("data-parallax") || 0.1);
        const rect = el.getBoundingClientRect();
        const offset = (rect.top + rect.height * 0.5 - mid) * -speed;
        el.style.translate = `0 ${offset.toFixed(1)}px`;
      });
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(updateParallax);
      },
      { passive: true }
    );
    updateParallax();
  }

  // 3D tilt on screenshots
  const tilts = document.querySelectorAll("[data-tilt]");
  if (tilts.length && !reduceMotion) {
    tilts.forEach((el) => {
      const max = 7;
      el.addEventListener("pointermove", (event) => {
        const rect = el.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        const rx = (0.5 - y) * max;
        const ry = (x - 0.5) * max;
        el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(1.01)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transform = "";
      });
    });
  }

  // Lightbox preview
  const root = document.querySelector("[data-lightbox-root]");
  const img = document.querySelector("[data-lightbox-img]");
  const caption = document.querySelector("[data-lightbox-caption]");
  const closeBtn = document.querySelector("[data-lightbox-close]");

  const closeLightbox = () => {
    if (!root) return;
    root.hidden = true;
    document.body.style.overflow = "";
    if (img) img.removeAttribute("src");
  };

  const openLightbox = (src, text, alt) => {
    if (!root || !img) return;
    img.src = src;
    img.alt = alt || text || "Product preview";
    if (caption) caption.textContent = text || "";
    root.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn?.focus();
  };

  document.querySelectorAll("[data-lightbox]").forEach((el) => {
    const activate = () => {
      openLightbox(
        el.getAttribute("data-lightbox"),
        el.getAttribute("data-caption") || "",
        el.querySelector("img")?.alt || ""
      );
    };
    el.addEventListener("click", activate);
    if (el.tagName !== "BUTTON") {
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
    }
  });

  closeBtn?.addEventListener("click", closeLightbox);
  root?.addEventListener("click", (event) => {
    if (event.target === root) closeLightbox();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && root && !root.hidden) closeLightbox();
  });
})();
