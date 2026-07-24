// ============ SAÚDE MATER — script.js ============

document.getElementById("year").textContent = new Date().getFullYear();

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
  const isOpen = links.classList.contains("is-open");
  isOpen ? closeMenu() : openMenu();
});

// Fecha ao clicar no overlay
overlay.addEventListener("click", closeMenu);

// Fecha ao clicar em um link de navegação
links
  .querySelectorAll("a")
  .forEach((a) => a.addEventListener("click", closeMenu));

// Fecha ao pressionar Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && links.classList.contains("is-open")) {
    closeMenu();
    toggle.focus();
  }
});

// ---- Rolagem suave para links internos (#top, #beneficios, etc.) ----
// O #top aponta pra <nav>, que é position:fixed — como ele já está sempre
// visível no topo da tela, o navegador não rola nada sozinho. Por isso
// tratamos esse caso à parte, forçando scrollTo(0,0).
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
  { threshold: 0.1 },
);
revealEls.forEach((el) => io.observe(el));
