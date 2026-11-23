/* ==========================================================================
   Warhammer 40,000 Roleplay - site scripts
   1. Light / dark mode toggle (remembers your choice)
   2. Home page slideshow of every image in /images
   3. Scroll animations: sections fade in, plus a reading progress bar
   ========================================================================== */

(function () {
  "use strict";

  var THEME_KEY = "w40k-theme";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Light / dark mode ---------- */

  function readSavedTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (e) {
      return null; // storage blocked (private window etc.)
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      /* ignore: the toggle still works for this visit */
    }
  }

  function systemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  // Runs immediately (this script is loaded in <head>) so the page
  // never flashes the wrong theme.
  applyTheme(readSavedTheme() || systemTheme());

  function setupThemeToggle() {
    var nav = document.querySelector(".side-menu");
    if (!nav) return;

    var button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle";

    function render() {
      var dark = document.documentElement.getAttribute("data-theme") === "dark";
      button.innerHTML =
        '<span class="theme-icon" aria-hidden="true">' + (dark ? "&#9788;" : "&#9790;") + "</span>" +
        '<span class="theme-label">' + (dark ? "Light mode" : "Dark mode") + "</span>";
      button.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      button.setAttribute("aria-pressed", String(dark));
    }

    button.addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      saveTheme(next);
      render();
    });

    render();
    nav.appendChild(button);
  }

  /* ---------- 2. Home page slideshow ---------- */

  // Browsers can't list a folder on a static site (GitHub Pages has no
  // directory listing), so every image in /images is named here.
  // Add a new file to this list when you add one to the folder.
  var SLIDES = [
    { file: "Imperium of Mankind.jpg", caption: "Imperium of Mankind" },
    { file: "Space Marines.jpg", caption: "Space Marines" },
    { file: "Xenos.webp", caption: "Xenos" },
    { file: "Necrons.jfif", caption: "Necrons" },
    { file: "Ork.jpg", caption: "Orks" },
    { file: "T'au.jpg", caption: "T'au Empire" },
    { file: "Tyranids.jpg", caption: "Tyranids" },
    { file: "Chaos Gods.jpg", caption: "The Chaos Gods" },
    { file: "Khorne.jfif", caption: "Khorne" },
    { file: "Tzeentch.jpeg", caption: "Tzeentch" },
    { file: "Nurgle.jpg", caption: "Nurgle" },
    { file: "Slaanesh.png", caption: "Slaanesh" }
  ];
  var SLIDE_SECONDS = 5;

  function setupSlideshow() {
    // Only on a hero marked with data-slideshow (the home page).
    var hero = document.querySelector(".hero[data-slideshow]");
    var firstImage = hero && hero.querySelector(".hero-image");
    if (!firstImage) return;

    var stage = document.createElement("div");
    stage.className = "slideshow";
    stage.setAttribute("role", "region");
    stage.setAttribute("aria-roledescription", "carousel");
    stage.setAttribute("aria-label", "Warhammer 40,000 artwork");
    hero.insertBefore(stage, firstImage);
    firstImage.remove();

    var images = SLIDES.map(function (slide, i) {
      var img = document.createElement("img");
      img.className = "hero-image slide" + (i === 0 ? " is-active" : "");
      img.src = "images/" + encodeURIComponent(slide.file);
      img.alt = slide.caption + " artwork";
      img.loading = i === 0 ? "eager" : "lazy";
      img.setAttribute("aria-hidden", i === 0 ? "false" : "true");
      stage.appendChild(img);
      return img;
    });

    var caption = document.createElement("p");
    caption.className = "slide-caption";
    caption.setAttribute("aria-live", "polite");
    stage.appendChild(caption);

    var controls = document.createElement("div");
    controls.className = "slide-controls";
    controls.innerHTML =
      '<button type="button" class="slide-prev" aria-label="Previous image">&#10094;</button>' +
      '<button type="button" class="slide-pause" aria-label="Pause slideshow">&#10074;&#10074;</button>' +
      '<button type="button" class="slide-next" aria-label="Next image">&#10095;</button>';
    stage.appendChild(controls);

    var dots = document.createElement("div");
    dots.className = "slide-dots";
    SLIDES.forEach(function (slide, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", "Show " + slide.caption);
      dot.addEventListener("click", function () { show(i); restart(); });
      dots.appendChild(dot);
    });
    stage.appendChild(dots);

    var current = 0;
    var timer = null;
    var paused = reduceMotion; // don't auto-advance for reduced-motion users
    var pauseButton = controls.querySelector(".slide-pause");

    function show(index) {
      current = (index + images.length) % images.length;
      images.forEach(function (img, i) {
        var active = i === current;
        img.classList.toggle("is-active", active);
        img.setAttribute("aria-hidden", active ? "false" : "true");
      });
      Array.prototype.forEach.call(dots.children, function (dot, i) {
        dot.classList.toggle("is-active", i === current);
        dot.setAttribute("aria-current", i === current ? "true" : "false");
      });
      caption.textContent = SLIDES[current].caption + " (" + (current + 1) + " of " + SLIDES.length + ")";
      // Warm up the next image so the fade is smooth.
      images[(current + 1) % images.length].loading = "eager";
    }

    function stop() {
      clearInterval(timer);
      timer = null;
    }

    function start() {
      stop();
      if (!paused) timer = setInterval(function () { show(current + 1); }, SLIDE_SECONDS * 1000);
    }

    function restart() {
      if (!paused) start();
    }

    function renderPause() {
      pauseButton.innerHTML = paused ? "&#9654;" : "&#10074;&#10074;";
      pauseButton.setAttribute("aria-label", paused ? "Play slideshow" : "Pause slideshow");
    }

    controls.querySelector(".slide-prev").addEventListener("click", function () { show(current - 1); restart(); });
    controls.querySelector(".slide-next").addEventListener("click", function () { show(current + 1); restart(); });
    pauseButton.addEventListener("click", function () {
      paused = !paused;
      renderPause();
      start();
    });

    // Hold still while the mouse is over it or a control has focus.
    stage.addEventListener("mouseenter", stop);
    stage.addEventListener("mouseleave", start);
    stage.addEventListener("focusin", stop);
    stage.addEventListener("focusout", start);

    // Keyboard arrows when the slideshow has focus.
    stage.tabIndex = 0;
    stage.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { show(current - 1); }
      if (e.key === "ArrowRight") { show(current + 1); }
    });

    // Skip an image that fails to load instead of showing a blank slide.
    images.forEach(function (img) {
      img.addEventListener("error", function () {
        img.classList.add("is-broken");
        if (img.classList.contains("is-active")) show(current + 1);
      });
    });

    renderPause();
    show(0);
    start();
  }

  /* ---------- 3. Scroll animations ---------- */

  function setupScrollAnimations() {
    // Reading progress bar across the top of the window.
    var bar = document.createElement("div");
    bar.className = "scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);

    function updateBar() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var amount = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = "scaleX(" + Math.min(1, Math.max(0, amount)) + ")";
    }
    window.addEventListener("scroll", updateBar, { passive: true });
    window.addEventListener("resize", updateBar);
    updateBar();

    if (reduceMotion || !("IntersectionObserver" in window)) return;

    // Sections, dividers and cards rise into view; list items and troop
    // tiles follow one after another.
    var targets = document.querySelectorAll(
      ".about, .playstyle, .troops, .faction-cards > h2, .faction-card, .divider, " +
      ".lore-list li, .goals-list li, .troops-list li"
    );

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    // Hide everything instantly (no fade-out), then let the observer fade
    // each element in as it scrolls into view.
    Array.prototype.forEach.call(targets, function (el) {
      // Stagger siblings in the same list or grid.
      var index = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty("--reveal-delay", Math.min(index, 8) * 70 + "ms");
      el.style.transition = "none";
      el.classList.add("reveal");
    });
    void document.body.offsetHeight; // apply the hidden state now
    Array.prototype.forEach.call(targets, function (el) {
      el.style.transition = "";
      observer.observe(el);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupThemeToggle();
    setupSlideshow();
    setupScrollAnimations();
  });
})();
