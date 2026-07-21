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


    const liveCompetitionCount =
  document.getElementById("liveCompetitionCount");

const totalInstantWins =
  document.getElementById("totalInstantWins");

if (liveCompetitionCount) {
  liveCompetitionCount.textContent = competitions.length;
}

const instantWinsTotal = competitions.reduce(
  (total, competition) =>
    total + Number(competition.instantWins || 0),
  0
);

if (totalInstantWins) {
  totalInstantWins.textContent =
    instantWinsTotal >= 1000
      ? `${Math.floor(instantWinsTotal / 1000)}K+`
      : instantWinsTotal.toLocaleString();
}
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

/* TODAY'S WINNER COUNT */

async function loadTodaysWinnerCount() {
  const winnerCountElement = document.getElementById("todaysWinnerCount");

  if (!winnerCountElement) return;

  try {
    const response = await fetch(`live-comps.json?t=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Could not load today's winner count.");
    }

    const data = await response.json();
    const finalCount = Number(data.todaysWinnerCount || 0);

    let currentCount = 0;
    const duration = 700;
    const startTime = performance.now();

    function animateCount(currentTime) {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      currentCount = Math.round(finalCount * progress);

      winnerCountElement.textContent = currentCount;

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    }

    requestAnimationFrame(animateCount);

  } catch (error) {
    console.error("Today's winner count failed:", error);
    winnerCountElement.textContent = "—";
  }
}

loadTodaysWinnerCount();
