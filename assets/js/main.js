// Global Main Logic for JK Computers Website
document.addEventListener("DOMContentLoaded", () => {
  initNavbarScroll();
  initCategoryVideos();
  initPosterModal();
  initReviewsCarousel();
  initBottomNavActiveState();
  initHeroSlider();
});

// ── Throttle utility — limits how often fn can fire ──────────────────────────
function throttle(fn, wait) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

// ── Debounce utility — delays fn until activity stops ────────────────────────
function debounce(fn, wait) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Toggle navbar elevation on scroll (throttled to max 10×/sec)
function initNavbarScroll() {
  const navbar = document.querySelector(".navbar");
  if (!navbar) return;

  const handler = throttle(() => {
    navbar.classList.toggle("navbar-scrolled", window.scrollY > 50);
  }, 100);

  window.addEventListener("scroll", handler, { passive: true });
}

// Category video lazy-loader — exits immediately if no video elements exist
function initCategoryVideos() {
  const videos = document.querySelectorAll(".category-card-video");
  if (!videos.length) return; // fast exit on all pages without video elements

  const loadVideo = (video) => {
    if (video.dataset.loaded === "true") return;
    video.querySelectorAll("source[data-src]").forEach((source) => {
      source.src = source.dataset.src;
      source.removeAttribute("data-src");
    });
    video.load();
    video.dataset.loaded = "true";
  };

  const showFallback = (video) => {
    const fallback = video.dataset.fallback;
    if (!fallback) return;
    const image = document.createElement("img");
    image.src = fallback;
    image.alt = video.getAttribute("aria-label") || "JK Computers category image";
    image.className = video.className.replace("category-card-video", "").trim();
    image.loading = "lazy";
    video.replaceWith(image);
  };

  videos.forEach((video) => {
    video.addEventListener("error", () => showFallback(video), { once: true });
    video.querySelectorAll("source").forEach((source) => {
      source.addEventListener("error", () => showFallback(video), { once: true });
    });
  });

  if (!("IntersectionObserver" in window)) {
    videos.forEach((video) => { loadVideo(video); video.play().catch(() => {}); });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      if (entry.isIntersecting) {
        loadVideo(video);
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.2 });

  videos.forEach((video) => observer.observe(video));
}

// Poster Modal Functionality
function initPosterModal() {
  const modal = document.getElementById("posterModal");
  const modalImage = document.getElementById("modalPosterImage");
  const modalTitle = document.getElementById("modalPosterTitle");
  const closeModalBtn = document.getElementById("closeModal");
  const showroomCards = document.querySelectorAll(".showroom-card");

  if (!modal || !modalImage || !modalTitle || !closeModalBtn) return;

  // Single delegated click handler on the cards container instead of N listeners
  showroomCards.forEach((card) => {
    card.addEventListener("click", () => {
      const posterUrl = card.getAttribute("data-poster");
      const posterTitle = card.getAttribute("data-title");
      if (!posterUrl) return;
      modalImage.src = posterUrl;
      modalImage.alt = posterTitle || "";
      modalTitle.textContent = posterTitle || "";
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    });
  });

  function closeModal() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
    // Clear src after transition to free memory
    setTimeout(() => { modalImage.src = ""; }, 300);
  }

  closeModalBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("active")) closeModal();
  });
}

// Reviews Carousel Functionality
function initReviewsCarousel() {
  const track = document.getElementById("reviewsTrack");
  const dotsContainer = document.getElementById("reviewsDots");
  if (!track || !dotsContainer) return;

  // Hint browser to GPU-composite the sliding element
  track.style.willChange = "transform";

  function getVisibleCards() {
    const w = window.innerWidth;
    if (w <= 576) return 1;
    if (w <= 992) return 2;
    if (w <= 1200) return 3;
    return 4;
  }

  let currentSlide = 0;
  const totalOriginalReviews = 8;
  let autoSlideInterval;

  function getSlideWidth() {
    const cardWidth = track.children[0].offsetWidth;
    // Gap is set via CSS; measure it from computed style for accuracy
    const trackGap = parseFloat(getComputedStyle(track).gap) || 16;
    return cardWidth + trackGap;
  }

  function createDots() {
    dotsContainer.innerHTML = "";
    for (let i = 0; i < totalOriginalReviews; i++) {
      const dot = document.createElement("div");
      dot.className = "review-dot" + (i === 0 ? " active" : "");
      dot.setAttribute("aria-label", `Review ${i + 1}`);
      dot.addEventListener("click", () => goToSlide(i));
      dotsContainer.appendChild(dot);
    }
  }

  function updateActiveDot() {
    dotsContainer.querySelectorAll(".review-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === currentSlide);
    });
  }

  function goToSlide(index) {
    const target = index % totalOriginalReviews;
    track.style.transform = `translateX(-${getSlideWidth() * target}px)`;
  }

  function startAutoSlide() {
    stopAutoSlide();
    autoSlideInterval = setInterval(() => {
      currentSlide = (currentSlide + 1) % totalOriginalReviews;
      track.style.transform = `translateX(-${getSlideWidth() * currentSlide}px)`;
      updateActiveDot();
    }, 4000);
  }

  function stopAutoSlide() {
    clearInterval(autoSlideInterval);
  }

  // Touch swipe — passive listeners for smooth scrolling
  let touchStartX = 0;
  track.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  track.addEventListener("touchend", (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) < 50) return;
    currentSlide = diff > 0
      ? (currentSlide + 1) % totalOriginalReviews
      : (currentSlide - 1 + totalOriginalReviews) % totalOriginalReviews;
    goToSlide(currentSlide);
    updateActiveDot();
  }, { passive: true });

  // Pause on hover / focus
  const wrapper = document.querySelector(".reviews-carousel-wrapper");
  if (wrapper) {
    wrapper.addEventListener("mouseenter", stopAutoSlide);
    wrapper.addEventListener("mouseleave", startAutoSlide);
  }

  // Debounced resize — recalculate only after user stops resizing
  window.addEventListener("resize", debounce(() => {
    createDots();
    goToSlide(currentSlide);
  }, 200));

  createDots();
  startAutoSlide();
}

// Mobile Bottom Nav — Products active state on scroll (index.html only)
function initBottomNavActiveState() {
  const homeBtn = document.getElementById("mbn-home");
  const productsBtn = document.getElementById("mbn-products");
  const productsSection = document.getElementById("products");

  if (!homeBtn || !productsBtn || !productsSection) return;

  function setActive(activeEl) {
    [homeBtn, productsBtn].forEach((el) => {
      el.classList.remove("active");
      el.removeAttribute("aria-current");
    });
    activeEl.classList.add("active");
    activeEl.setAttribute("aria-current", "page");
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActive(productsBtn);
        } else if (window.scrollY < productsSection.offsetTop - 80) {
          setActive(homeBtn);
        }
      });
    },
    { threshold: 0.1, rootMargin: "-60px 0px 0px 0px" }
  );

  observer.observe(productsSection);
}

// Hero Image Slider — lightweight vanilla fade (no dependencies)
function initHeroSlider() {
  const slides = document.querySelectorAll("#heroSlider .hero-slide");
  if (!slides.length) return; // safe exit on pages without hero slider

  const INTERVAL_MS = 4500;
  let current = 0;
  let timer = null;

  function showSlide(index) {
    slides[current].classList.remove("active");
    current = index % slides.length;
    slides[current].classList.add("active");
  }

  function startSlider() {
    stopSlider();
    timer = setInterval(() => {
      showSlide((current + 1) % slides.length);
    }, INTERVAL_MS);
  }

  function stopSlider() {
    clearInterval(timer);
  }

  // Pause when tab is hidden to save CPU & battery
  document.addEventListener("visibilitychange", () => {
    document.hidden ? stopSlider() : startSlider();
  });

  startSlider();
}
