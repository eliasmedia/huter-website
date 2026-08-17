/* Huter Haustechnik – UI-Interaktionen (vanilla JS, keine Abhängigkeiten) */
(function () {
  "use strict";

  /* Header: solide Leiste nach Scroll */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 40); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Mobile-Navigation */
  var hamb = document.querySelector(".hamb");
  var nav = document.querySelector(".nav");
  var scrim = document.querySelector(".nav-scrim");
  function closeNav() {
    if (!nav) return;
    nav.classList.remove("open");
    if (scrim) scrim.classList.remove("show");
    document.body.classList.remove("nav-open");
    if (hamb) {
      hamb.setAttribute("aria-expanded", "false");
      hamb.setAttribute("aria-label", "Menü öffnen");
    }
  }
  if (hamb && nav) {
    hamb.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      if (scrim) scrim.classList.toggle("show", open);
      document.body.classList.toggle("nav-open", open);
      hamb.setAttribute("aria-expanded", open ? "true" : "false");
      hamb.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    });
    /* Escape schließt das Menü */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) closeNav();
    });
    nav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeNav); });
    if (scrim) scrim.addEventListener("click", closeNav);
  }

  /* Reveal beim Scrollen */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* Lightbox für Referenz-Galerie */
  var figures = Array.prototype.slice.call(document.querySelectorAll(".gallery figure"));
  var lb = document.querySelector(".lightbox");
  if (lb && figures.length) {
    var lbImg = lb.querySelector("img");
    var idx = 0;
    var sources = figures.map(function (f) {
      var img = f.querySelector("img");
      return img.getAttribute("data-full") || img.src;
    });
    function show(i) {
      idx = (i + sources.length) % sources.length;
      lbImg.src = sources[idx];
    }
    function open(i) { show(i); lb.classList.add("open"); document.body.style.overflow = "hidden"; }
    function close() { lb.classList.remove("open"); document.body.style.overflow = ""; }
    figures.forEach(function (f, i) { f.addEventListener("click", function () { open(i); }); });
    lb.querySelector(".lb-close").addEventListener("click", close);
    lb.querySelector(".lb-next").addEventListener("click", function (e) { e.stopPropagation(); show(idx + 1); });
    lb.querySelector(".lb-prev").addEventListener("click", function (e) { e.stopPropagation(); show(idx - 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") show(idx + 1);
      if (e.key === "ArrowLeft") show(idx - 1);
    });
  }

  /* Jahr im Footer */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
