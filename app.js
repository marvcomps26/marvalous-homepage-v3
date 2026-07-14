const heroSlides = document.querySelectorAll(".hero-slide");
const heroDots = document.querySelectorAll(".hero-dots button");
const heroSlider = document.querySelector(".hero-slider");

let currentHeroSlide = 0;
let heroTimer;
let touchStartX = 0;
let touchEndX = 0;

function showHeroSlide(index) {
  if (!heroSlides.length) return;

  if (index < 0) {
    index = heroSlides.length - 1;
  }

  if (index >= heroSlides.length) {
    index = 0;
  }

  heroSlides.forEach((slide, slideIndex) => {
    slide.classList.toggle("active", slideIndex === index);
  });

  heroDots.forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === index);
  });

  currentHeroSlide = index;
}

function startHeroSlider() {
  clearInterval(heroTimer);

  heroTimer = setInterval(() => {
    showHeroSlide(currentHeroSlide + 1);
  }, 4000);
}

heroDots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    showHeroSlide(index);
    startHeroSlider();
  });
});

if (heroSlider) {
  heroSlider.addEventListener(
    "touchstart",
    event => {
      touchStartX = event.changedTouches[0].screenX;
      clearInterval(heroTimer);
    },
    { passive: true }
  );

  heroSlider.addEventListener(
    "touchend",
    event => {
      touchEndX = event.changedTouches[0].screenX;

      const swipeDistance = touchEndX - touchStartX;

      if (swipeDistance < -45) {
        showHeroSlide(currentHeroSlide + 1);
      }

      if (swipeDistance > 45) {
        showHeroSlide(currentHeroSlide - 1);
      }

      startHeroSlider();
    },
    { passive: true }
  );
}
if (heroSlides.length > 1) {
  showHeroSlide(0);
  startHeroSlider();
}


/* LIVE COMPETITIONS */

async function loadLiveCompetitions() {
  const competitionScroll = document.getElementById("competitionScroll");

  if (!competitionScroll) return;

  try {
    const response = await fetch(`live-comps.json?t=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Could not load live competitions.");
    }

    const data = await response.json();
    const competitions = data.competitions || [];

    if (!competitions.length) {
      competitionScroll.innerHTML =
        `<p class="competition-empty">No live competitions found.</p>`;
      return;
    }

    competitionScroll.innerHTML = competitions.map((competition, index) => {
      const sold = Number(competition.ticketsSold || 0);
      const total = Number(competition.totalTickets || 0);

      const calculatedPercent =
        total > 0 ? Math.min((sold / total) * 100, 100) : 0;

      const displayedPercent =
        competition.percentSold ?? calculatedPercent;

      const ticketPrice =
        competition.ticketPrice === 0
          ? "FREE"
          : competition.ticketPrice != null
            ? `${Math.round(competition.ticketPrice * 100)}p`
            : "View";

      const tag =
        displayedPercent >= 80
          ? "ALMOST GONE"
          : displayedPercent >= 40
            ? "POPULAR"
            : index === 0
              ? "JUST ADDED"
              : "LIVE NOW";

      return `
        <a
          href="${competition.url}"
          class="competition-card"
          target="_blank"
          rel="noopener"
        >

          <div class="competition-image-wrap">
            <img
              src="${competition.image}"
              alt="${escapeHtml(competition.title)}"
              loading="lazy"
            >

            <span class="competition-tag">
              ${tag}
            </span>
          </div>

          <div class="competition-details">

            <h3>${escapeHtml(competition.title)}</h3>

            <div class="competition-progress-row">
              <span>${sold.toLocaleString()} sold</span>
              <span>${total.toLocaleString()} tickets</span>
            </div>

            <div class="competition-progress">
              <div
                class="competition-progress-fill"
                style="width:${calculatedPercent}%"
              ></div>
            </div>

            <div class="competition-meta">

              <span>
                <strong>${ticketPrice}</strong>
                Per ticket
              </span>

              <span>
                <strong>${competition.instantWins ?? "—"}</strong>
                Instant wins
              </span>

            </div>

            <div class="competition-enter">
              Enter now
              <b>›</b>
            </div>

          </div>

        </a>
      `;
    }).join("");

  } catch (error) {
    console.error("Live competitions failed:", error);

    competitionScroll.innerHTML =
      `<p class="competition-empty">Live competitions could not load.</p>`;
  }
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

loadLiveCompetitions();
