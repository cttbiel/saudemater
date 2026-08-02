// ============ SAÚDE MATER — script.js ============

document.getElementById("year").textContent = new Date().getFullYear();

// ---- Hero: troca imagem responsiva (desktop = corpo inteiro, tablet = busto) ----
(function () {
  const heroImg = document.querySelector(".hero-chamada");
  if (!heroImg) return;
  const FULL = "assets/chamada.png";
  const BUST = "assets/chamada-bust.png";
  function updateHeroImg() {
    const isMobile = window.innerWidth <= 700;
    const isTablet = window.innerWidth <= 900 && window.innerWidth > 700;
    heroImg.src = isTablet ? BUST : FULL;
    heroImg.style.maxWidth = isTablet ? "280px" : "";
  }
  updateHeroImg();
  window.addEventListener("resize", updateHeroImg);
})();

// ---- Menu mobile ----
const toggle = document.getElementById("nav-toggle");
const links = document.getElementById("nav-links");
const overlay = document.getElementById("nav-overlay");

function openMenu() {
  links.classList.add("is-open");
  toggle.classList.add("is-open");
  overlay.classList.add("is-open");
  toggle.setAttribute("aria-expanded", "true");
  toggle.setAttribute("aria-label", "Fechar menu");
  document.body.classList.add("menu-open");
}

function closeMenu() {
  links.classList.remove("is-open");
  toggle.classList.remove("is-open");
  overlay.classList.remove("is-open");
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Abrir menu");
  document.body.classList.remove("menu-open");
}

toggle.addEventListener("click", () => {
  links.classList.contains("is-open") ? closeMenu() : openMenu();
});
overlay.addEventListener("click", closeMenu);
links.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && links.classList.contains("is-open")) {
    closeMenu();
    toggle.focus();
  }
});

// ---- Rolagem suave ----
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  const hash = link.getAttribute("href");
  if (!hash || hash === "#") return;
  link.addEventListener("click", (e) => {
    const target = document.querySelector(hash);
    if (!target) return;
    e.preventDefault();
    if (hash === "#top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// ---- FAQ accordion — suporta variantes --cream e --navy ----
function initFaqAccordion(selector) {
  const allBtns = document.querySelectorAll(selector);
  allBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      const answer = btn.nextElementSibling;

      // Fecha todos os outros do mesmo grupo
      allBtns.forEach((other) => {
        if (other !== btn) {
          other.setAttribute("aria-expanded", "false");
          other.nextElementSibling.hidden = true;
        }
      });

      // Alterna o atual
      btn.setAttribute("aria-expanded", String(!isOpen));
      answer.hidden = isOpen;
    });
  });
}

initFaqAccordion(".faq-question--cream");
initFaqAccordion(".faq-question--navy");

// ---- Reveal on scroll ----
const revealEls = document.querySelectorAll(".reveal");
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08 }
);
revealEls.forEach((el) => io.observe(el));

// ================================================================
// ---- CARROSSEL GENÉRICO ----
// Cria um carrossel com setas e dots dado:
//   trackId:    id da .carousel-track
//   prevId:     id do botão anterior
//   nextId:     id do botão próximo
//   dotsId:     id do container de dots
//   visibleCount: quantos slides ficam visíveis ao mesmo tempo
//   autoplayMs: intervalo em ms (0 = sem autoplay)
// ================================================================
function createCarousel({ trackId, prevId, nextId, dotsId, visibleCount, autoplayMs = 0 }) {
  const track = document.getElementById(trackId);
  const prevBtn = document.getElementById(prevId);
  const nextBtn = document.getElementById(nextId);
  const dotsContainer = dotsId ? document.getElementById(dotsId) : null;

  if (!track || !prevBtn || !nextBtn) return;

  const slides = Array.from(track.children);
  const total = slides.length;
  let current = 0;
  let autoplayTimer = null;

  // Quantos grupos de slides existem
  const groups = Math.ceil(total / visibleCount);

  // Cria dots
  if (dotsContainer) {
    dotsContainer.innerHTML = "";
    for (let i = 0; i < groups; i++) {
      const dot = document.createElement("button");
      dot.className = "carousel-dot" + (i === 0 ? " is-active" : "");
      dot.setAttribute("aria-label", `Ir para o grupo ${i + 1}`);
      dot.setAttribute("role", "tab");
      dot.addEventListener("click", () => goTo(i));
      dotsContainer.appendChild(dot);
    }
  }

  function getSlideWidth() {
    if (slides.length === 0) return 0;
    const style = getComputedStyle(track);
    const gap = parseFloat(style.gap) || 0;
    // largura de um slide = (viewport - gaps) / visibleCount
    const viewport = track.parentElement.offsetWidth;
    return (viewport - gap * (visibleCount - 1)) / visibleCount;
  }

  function goTo(index) {
    current = ((index % groups) + groups) % groups;
    const slideW = getSlideWidth();
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const offset = current * visibleCount * (slideW + gap);
    track.style.transform = `translateX(-${offset}px)`;

    if (dotsContainer) {
      dotsContainer.querySelectorAll(".carousel-dot").forEach((d, i) => {
        d.classList.toggle("is-active", i === current);
      });
    }
  }

  function prev() { goTo(current - 1); }
  function next() { goTo(current + 1); }

  prevBtn.addEventListener("click", () => { prev(); resetAutoplay(); });
  nextBtn.addEventListener("click", () => { next(); resetAutoplay(); });

  // Touch/swipe support
  let touchStartX = 0;
  track.parentElement.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  track.parentElement.addEventListener("touchend", (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? next() : prev();
      resetAutoplay();
    }
  }, { passive: true });

  // Autoplay
  function startAutoplay() {
    if (!autoplayMs) return;
    autoplayTimer = setInterval(next, autoplayMs);
  }
  function resetAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
  }

  // Recalcula ao redimensionar
  window.addEventListener("resize", () => goTo(current));

  // Inicia
  goTo(0);
  startAutoplay();
}

// ---- Carrossel de Especialidades ----
// Calcula quantos slides ficam visíveis de acordo com o viewport
function getEspecialidadesVisible() {
  if (window.innerWidth <= 380) return 1;
  if (window.innerWidth <= 560) return 2;
  if (window.innerWidth <= 900) return 3;
  return 4;
}

createCarousel({
  trackId: "track-especialidades",
  prevId: "prev-especialidades",
  nextId: "next-especialidades",
  dotsId: "dots-especialidades",
  visibleCount: getEspecialidadesVisible(),
  autoplayMs: 4500,
});

// Recria o carrossel ao redimensionar para ajustar visibleCount
let resizeDebounce;
window.addEventListener("resize", () => {
  clearTimeout(resizeDebounce);
  resizeDebounce = setTimeout(() => {
    createCarousel({
      trackId: "track-especialidades",
      prevId: "prev-especialidades",
      nextId: "next-especialidades",
      dotsId: "dots-especialidades",
      visibleCount: getEspecialidadesVisible(),
      autoplayMs: 4500,
    });
  }, 250);
});

// ---- Carrossel de Parceiros ----
function getPartnersVisible() {
  if (window.innerWidth <= 380) return 2;
  if (window.innerWidth <= 560) return 3;
  if (window.innerWidth <= 900) return 4;
  if (window.innerWidth <= 1100) return 5;
  return 6;
}

createCarousel({
  trackId: "track-partners",
  prevId: "prev-partners",
  nextId: "next-partners",
  dotsId: null,
  visibleCount: getPartnersVisible(),
  autoplayMs: 7000,
});

window.addEventListener("resize", () => {
  clearTimeout(resizeDebounce);
  resizeDebounce = setTimeout(() => {
    createCarousel({
      trackId: "track-partners",
      prevId: "prev-partners",
      nextId: "next-partners",
      dotsId: null,
      visibleCount: getPartnersVisible(),
      autoplayMs: 7000,
    });
  }, 250);
});