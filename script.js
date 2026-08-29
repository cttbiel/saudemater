// ============ SAÚDE MATER — script.js ============

document.getElementById("year").textContent = new Date().getFullYear();

// ---- WhatsApp Float: Controle dinâmico de visibilidade ----
// Usa IntersectionObserver passivo para evitar forced reflow (getBoundingClientRect removido).
// Quando o hero sai da viewport, o botão flutuante aparece suavemente.
(function initWhatsAppFloatVisibility() {
  const floatBtn = document.querySelector(".whatsapp-float");
  const heroSection = document.getElementById("hero-sentinel") || document.querySelector(".hero");
  if (!floatBtn || !heroSection) return;

  // rootMargin: dispara quando o bottom do hero passa de 100px acima do topo da viewport
  const observer = new IntersectionObserver(
    function(entries) {
      const isHeroActive = entries[0].isIntersecting;
      floatBtn.classList.toggle("is-visible", !isHeroActive);
    },
    { root: null, rootMargin: "-100px 0px 0px 0px", threshold: 0 }
  );
  observer.observe(heroSection);
})();

// ---- Hero: imagem da Jak (WebP sem fundo) ----
(function () {
  const heroImg = document.querySelector(".hero-chamada");
  if (!heroImg) return;
  heroImg.src = "assets/Jak.webp";
  heroImg.style.maxWidth = "";
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

      allBtns.forEach((other) => {
        if (other !== btn) {
          other.setAttribute("aria-expanded", "false");
          other.nextElementSibling.hidden = true;
        }
      });

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
// ---- CARROSSEL INFINITO ----
//
// Técnica: clone-before | originais | clone-after
// Move 1 slide por vez. Ao fim dos originais, salta silenciosamente
// para o equivalente real (sem animação), criando loop perfeito.
//
// Parâmetros:
//   trackId      — id da .carousel-track ou .partners-track
//   viewportId   — id do elemento overflow:hidden (viewport)
//   prevId       — id do botão anterior
//   nextId       — id do botão próximo
//   dotsId       — id do container de dots (opcional)
//   getVisible   — função que retorna quantos slides ficam visíveis
//   autoplayMs   — intervalo do autoplay em ms (0 = desligado)
//   transitionMs — duração da animação em ms
// ================================================================
function createInfiniteCarousel({
  trackId,
  viewportId,
  prevId,
  nextId,
  dotsId,
  getVisible,
  autoplayMs = 0,
  transitionMs = 600,
}) {
  const track = document.getElementById(trackId);
  const viewport = viewportId
    ? document.getElementById(viewportId)
    : track && track.parentElement;
  const prevBtn = document.getElementById(prevId);
  const nextBtn = document.getElementById(nextId);
  const dotsContainer = dotsId ? document.getElementById(dotsId) : null;

  if (!track || !viewport) return;

  // --- 1. Coleta slides originais ---
  const originals = Array.from(track.children);
  const N = originals.length;
  if (N === 0) return;

  let visibleCount = getVisible();

  // --- 2. Monta DOM: [N clones finais] + [originais] + [N clones iniciais] ---
  function buildClones() {
    // Remove clones antigos (mantém só originais)
    Array.from(track.children).forEach((c) => {
      if (c.hasAttribute("data-clone")) c.remove();
    });

    // Clona os últimos N slides e prepend
    [...originals].reverse().forEach((s) => {
      const c = s.cloneNode(true);
      c.setAttribute("data-clone", "before");
      c.setAttribute("aria-hidden", "true");
      track.prepend(c);
    });

    // Clona os primeiros N slides e append
    [...originals].forEach((s) => {
      const c = s.cloneNode(true);
      c.setAttribute("data-clone", "after");
      c.setAttribute("aria-hidden", "true");
      track.append(c);
    });
  }

  buildClones();

  // O índice atual começa no primeiro slide real (após os N clones finais)
  let current = N; // índice no DOM total
  let isAnimating = false;
  let autoplayTimer = null;

  // --- 3. Dots (1 bolinha para cada imagem/exame) ---
  function buildDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = "";
    for (let i = 0; i < N; i++) {
      const dot = document.createElement("button");
      dot.className = "carousel-dot" + (i === 0 ? " is-active" : "");
      const slideLabel =
        originals[i].querySelector(".gallery-label")?.textContent ||
        `Exame ${i + 1}`;
      dot.setAttribute("aria-label", `Ir para ${slideLabel}`);
      dot.setAttribute("role", "tab");
      dot.addEventListener("click", () => {
        jumpToRealIndex(i);
        resetAutoplay();
      });
      dotsContainer.appendChild(dot);
    }
  }

  buildDots();

  function updateDots() {
    if (!dotsContainer) return;
    const realIndex = current - N;
    const safeReal = ((realIndex % N) + N) % N;
    dotsContainer.querySelectorAll(".carousel-dot").forEach((d, i) => {
      d.classList.toggle("is-active", i === safeReal);
    });
  }

  // --- 4. Métricas ---
  function getMetrics() {
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const vw = viewport.offsetWidth;
    const vis = getVisible();
    const slideW = (vw - gap * (vis - 1)) / vis;
    return { slideW, gap };
  }

  // --- 5. Posicionamento ---
  function setPosition(index, animated) {
    const { slideW, gap } = getMetrics();
    const offset = index * (slideW + gap);

    if (animated) {
      track.style.transition = `transform ${transitionMs}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    } else {
      track.style.transition = "none";
      // Força flush do estilo sem triggar reflow de layout completo
      void track.offsetWidth;
    }

    track.style.transform = `translateX(-${offset}px)`;
    updateDots();
  }

  function jumpToRealIndex(realIdx) {
    current = N + ((realIdx % N) + N) % N;
    setPosition(current, true);
  }

  // --- 6. Navegação ---
  function goNext() {
    if (isAnimating) return;
    isAnimating = true;
    current++;
    setPosition(current, true);
  }

  function goPrev() {
    if (isAnimating) return;
    isAnimating = true;
    current--;
    setPosition(current, true);
  }

  // Ao fim da animação, verifica se precisa saltar silenciosamente
  track.addEventListener("transitionend", () => {
    isAnimating = false;

    // Passou dos clones do final → volta para o início dos reais
    if (current >= N + N) {
      current -= N;
      setPosition(current, false);
    }
    // Entrou nos clones do início → vai para o final dos reais
    else if (current < N) {
      current += N;
      setPosition(current, false);
    }
  });

  // --- 7. Touch / Swipe (no elemento com overflow:hidden) ---
  let touchStartX = 0;
  let touchStartTime = 0;

  // Usa o viewport (parentElement do track) como área de swipe
  const swipeTarget = viewport;

  swipeTarget.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartTime = Date.now();
    },
    { passive: true }
  );

  swipeTarget.addEventListener(
    "touchend",
    (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      const elapsed = Date.now() - touchStartTime;
      if (Math.abs(diff) > 44 && elapsed < 500) {
        diff > 0 ? goNext() : goPrev();
        resetAutoplay();
      }
    },
    { passive: true }
  );

  // --- 8. Botões (opcionais) ---
  if (prevBtn) prevBtn.addEventListener("click", () => { goPrev(); resetAutoplay(); });
  if (nextBtn) nextBtn.addEventListener("click", () => { goNext(); resetAutoplay(); });

  // --- 8b. Clique no slide vizinho para navegar (estilo LoL skin selector) ---
  // Usa delegação: clicar em qualquer slide que não seja o atual navega na direção certa.
  track.addEventListener("click", (e) => {
    const slide = e.target.closest(".carousel-slide");
    if (!slide || isAnimating) return;
    const allSlides = Array.from(track.children);
    const clickedIndex = allSlides.indexOf(slide);
    if (clickedIndex < current) { goPrev(); resetAutoplay(); }
    else if (clickedIndex > current) { goNext(); resetAutoplay(); }
  });

  // Cursor pointer nos slides vizinhos
  function updateSlideCursors() {
    Array.from(track.children).forEach((slide, i) => {
      slide.style.cursor = i !== current ? "pointer" : "default";
    });
  }
  // Atualiza cursors após cada movimento
  const _origSetPos = setPosition;
  track.addEventListener("transitionend", updateSlideCursors);
  updateSlideCursors();

  // --- 9. Autoplay ---
  function startAutoplay() {
    if (!autoplayMs) return;
    autoplayTimer = setInterval(goNext, autoplayMs);
  }
  function resetAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
  }

  // --- 10. Resize: recalcula offset sem recriar o DOM ---
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const newVisible = getVisible();
      if (newVisible !== visibleCount) {
        visibleCount = newVisible;
        buildDots();
      }
      setPosition(current, false);
    }, 150);
  });

  // --- 11. Inicializa ---
  setPosition(current, false);
  updateDots();
  startAutoplay();
}

// ---- Especialidades ----
function getEspecialidadesVisible() {
  if (window.innerWidth <= 380) return 1;
  if (window.innerWidth <= 560) return 2;
  if (window.innerWidth <= 900) return 3;
  return 4;
}

createInfiniteCarousel({
  trackId: "track-especialidades",
  viewportId: null, // usa parentElement automaticamente
  prevId: "prev-especialidades",
  nextId: "next-especialidades",
  dotsId: "dots-especialidades",
  getVisible: getEspecialidadesVisible,
  autoplayMs: 5000,
  transitionMs: 550,
});

// ---- Parceiros: FOCUS CAROUSEL ----
// 1 card centralizado em foco, vizinhos aparecem nas bordas.
// A largura do card é definida pelo CSS (flex: 0 0 55%/68%/82%).
// O JS lê a largura real do DOM para calcular o offset de centralização.

function createFocusCarousel({
  trackId,
  wrapId,
  prevId,
  nextId,
  dotsId,
  autoplayMs = 4000,
  transitionMs = 520,
}) {
  const track = document.getElementById(trackId);
  const wrap = wrapId ? document.getElementById(wrapId) : track && track.parentElement;
  const prevBtn = prevId ? document.getElementById(prevId) : null;
  const nextBtn = nextId ? document.getElementById(nextId) : null;
  const dotsContainer = dotsId ? document.getElementById(dotsId) : null;

  if (!track || !wrap) return;

  const originals = Array.from(track.children);
  const N = originals.length;
  if (N === 0) return;

  // --- Clonagem: [N clones do fim] | [originais] | [N clones do início] ---
  function buildClones() {
    Array.from(track.children).forEach((c) => {
      if (c.hasAttribute("data-clone")) c.remove();
    });
    // Clones no final
    originals.forEach((s) => {
      const c = s.cloneNode(true);
      c.setAttribute("data-clone", "after");
      c.setAttribute("aria-hidden", "true");
      track.append(c);
    });
    // Clones no início (reversa para que a ordem no DOM fique idêntica a originals)
    [...originals].slice().reverse().forEach((s) => {
      const c = s.cloneNode(true);
      c.setAttribute("data-clone", "before");
      c.setAttribute("aria-hidden", "true");
      track.prepend(c);
    });
  }

  buildClones();

  let current = N; // Primeiro slide real
  let isAnimating = false;
  let autoplayTimer = null;

  // --- Constroi os dots (bolinhas) ---
  function buildDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = "";
    for (let i = 0; i < N; i++) {
      const dot = document.createElement("button");
      dot.className = "carousel-dot" + (i === 0 ? " is-active" : "");
      const partnerName =
        originals[i].querySelector("img")?.alt || `Parceiro ${i + 1}`;
      dot.setAttribute("aria-label", `Ir para ${partnerName}`);
      dot.setAttribute("role", "tab");
      dot.addEventListener("click", () => {
        jumpToRealIndex(i);
        resetAutoplay();
      });
      dotsContainer.appendChild(dot);
    }
  }

  buildDots();

  function jumpToRealIndex(realIdx) {
    if (isAnimating) return;
    isAnimating = true;
    current = N + realIdx;
    setPosition(current, true);
  }

  // --- Atualiza classe is-active nos cards e nos dots ---
  function updateActive() {
    const allCards = Array.from(track.children);
    allCards.forEach((card, i) => {
      card.classList.toggle("is-active", i === current);
    });

    if (dotsContainer) {
      const realIndex = (((current - N) % N) + N) % N;
      const dots = dotsContainer.querySelectorAll(".carousel-dot");
      dots.forEach((d, i) => {
        d.classList.toggle("is-active", i === realIndex);
      });
    }
  }

  // --- Posicionamento ultra-preciso usando offsetLeft do DOM ---
  function setPosition(index, animated) {
    const allCards = Array.from(track.children);
    if (!allCards[index]) return;

    const targetCard = allCards[index];
    const cardLeft = targetCard.offsetLeft;
    const cardWidth = targetCard.offsetWidth;
    const wrapWidth = wrap.offsetWidth;

    // Centraliza pixel-perfect o targetCard exatamente no meio do wrap
    const offset = cardLeft - (wrapWidth - cardWidth) / 2;

    if (animated) {
      track.style.transition = `transform ${transitionMs}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    } else {
      track.style.transition = "none";
      void track.getBoundingClientRect(); // força reflow
    }

    track.style.transform = `translateX(-${offset}px)`;
    updateActive();
  }

  // --- Navegação ---
  function goNext() {
    if (isAnimating) return;
    isAnimating = true;
    current++;
    setPosition(current, true);
  }

  function goPrev() {
    if (isAnimating) return;
    isAnimating = true;
    current--;
    setPosition(current, true);
  }

  // Ao fim da transição: salto silencioso se saiu dos originais
  track.addEventListener("transitionend", () => {
    isAnimating = false;
    if (current >= N * 2) {
      current -= N;
      setPosition(current, false);
    } else if (current < N) {
      current += N;
      setPosition(current, false);
    }
  });

  // --- Touch / Swipe ---
  let touchStartX = 0;
  let touchStartT = 0;
  wrap.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartT = Date.now();
    },
    { passive: true }
  );
  wrap.addEventListener(
    "touchend",
    (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 30 && Date.now() - touchStartT < 500) {
        diff > 0 ? goNext() : goPrev();
        resetAutoplay();
      }
    },
    { passive: true }
  );

  // --- Botões (setas opcionais) ---
  if (prevBtn)
    prevBtn.addEventListener("click", () => {
      goPrev();
      resetAutoplay();
    });
  if (nextBtn)
    nextBtn.addEventListener("click", () => {
      goNext();
      resetAutoplay();
    });

  // --- Clique no card vizinho para navegar ---
  track.addEventListener("click", (e) => {
    const card = e.target.closest(".partner-focus-card");
    if (!card || isAnimating) return;
    const allCards = Array.from(track.children);
    const clickedIndex = allCards.indexOf(card);
    if (clickedIndex !== current) {
      if (clickedIndex < current) goPrev();
      else goNext();
      resetAutoplay();
    }
  });

  // --- Autoplay & Pause no Hover ---
  function startAutoplay() {
    if (!autoplayMs) return;
    autoplayTimer = setInterval(goNext, autoplayMs);
  }
  function resetAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
  }

  wrap.addEventListener("mouseenter", () => clearInterval(autoplayTimer));
  wrap.addEventListener("mouseleave", () => startAutoplay());

  // --- Resize / Load: recalculam offset sem animação ---
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => setPosition(current, false), 80);
  });
  window.addEventListener("load", () => setPosition(current, false));

  // --- Init ---
  setTimeout(() => setPosition(current, false), 20);
  startAutoplay();
}

/* createFocusCarousel — parceiros ocultos temporariamente (seção em <template> no HTML).
   Restaurar descomentando quando o carrossel de parceiros for reativado.
createFocusCarousel({
  trackId: "track-partners",
  wrapId: "partners-focus-wrap",
  dotsId: "dots-partners",
  autoplayMs: 4000,
  transitionMs: 520,
});
*/