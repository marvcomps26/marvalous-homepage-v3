/* SPLASH SCREEN */

document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splash");

  setTimeout(() => {
    if (splash) {
      splash.classList.add("hide");
    }
  }, 2400);
});

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

const heroInstantWins =
  document.getElementById("heroInstantWins");
    
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
  
    if (heroInstantWins) {
  heroInstantWins.textContent = instantWinsTotal.toLocaleString();
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
function openHowToPlay() {
  document
    .getElementById("howToPlayModal")
    .classList.add("show");
}

function closeHowToPlay() {
  document
    .getElementById("howToPlayModal")
    .classList.remove("show");
}

window.addEventListener("click", (event) => {
  const modal = document.getElementById("howToPlayModal");

  if (event.target === modal) {
    closeHowToPlay();
  }
});
/* NEXT LIVE DRAW COUNTDOWN */

let liveCountdownTimer;

async function loadNextLiveDraw() {
  const card = document.querySelector(".next-live-card");
  const title = document.getElementById("nextLiveTitle");
  const dateText = document.getElementById("nextLiveDate");
  const button = document.getElementById("watchLiveButton");

  const daysBox = document.getElementById("liveDays");
  const hoursBox = document.getElementById("liveHours");
  const minutesBox = document.getElementById("liveMinutes");
  const secondsBox = document.getElementById("liveSeconds");

  if (
    !card ||
    !title ||
    !dateText ||
    !button ||
    !daysBox ||
    !hoursBox ||
    !minutesBox ||
    !secondsBox
  ) {
    return;
  }

  try {
    const response = await fetch(`live-comps.json?t=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Could not load next live draw.");
    }

    const data = await response.json();

    if (!data.nextLiveAt) {
      title.textContent = "Next Live Draw";
      dateText.textContent = "Next live date coming soon";
      return;
    }

    const liveTime = new Date(data.nextLiveAt).getTime();
    const liveEndTime = liveTime + (90 * 60 * 1000);

    const formattedDate = new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Europe/London"
    }).format(new Date(liveTime));

    clearInterval(liveCountdownTimer);

    function updateCountdown() {
      const now = Date.now();
      const distance = liveTime - now;

      if (now >= liveTime && now < liveEndTime) {
        card.classList.add("is-live");

        title.textContent = "We’re Live Now!";
        dateText.textContent = "Join us live on Facebook";

        daysBox.textContent = "00";
        hoursBox.textContent = "00";
        minutesBox.textContent = "00";
        secondsBox.textContent = "00";

        button.textContent = "▶ JOIN LIVE NOW";
        return;
      }

      card.classList.remove("is-live");

      if (now >= liveEndTime) {
        title.textContent = "Live Draw Finished";
        dateText.textContent = "Checking for the next live draw";

        daysBox.textContent = "00";
        hoursBox.textContent = "00";
        minutesBox.textContent = "00";
        secondsBox.textContent = "00";

        button.textContent = "VIEW FACEBOOK";
        return;
      }

      const days = Math.floor(distance / 86400000);
      const hours = Math.floor((distance / 3600000) % 24);
      const minutes = Math.floor((distance / 60000) % 60);
      const seconds = Math.floor((distance / 1000) % 60);

      title.textContent = "Next Live Draw";
      dateText.textContent = formattedDate;

      daysBox.textContent = String(days).padStart(2, "0");
      hoursBox.textContent = String(hours).padStart(2, "0");
      minutesBox.textContent = String(minutes).padStart(2, "0");
      secondsBox.textContent = String(seconds).padStart(2, "0");

      button.textContent = "▶ WATCH LIVE";
    }

    updateCountdown();
    liveCountdownTimer = setInterval(updateCountdown, 1000);

  } catch (error) {
    console.error("Next live draw failed:", error);
    dateText.textContent = "Live date unavailable";
  }
}

loadNextLiveDraw();

/* Recheck the JSON every 5 minutes for a new draw date */
setInterval(loadNextLiveDraw, 5 * 60 * 1000);

async function turnOnNotifications() {
  window.OneSignalDeferred = window.OneSignalDeferred || [];

  OneSignalDeferred.push(async function(OneSignal) {
    try {
      await OneSignal.Slidedown.promptPush();
    } catch (error) {
      alert("Alerts are still loading. Please try again.");
      console.error(error);
    }
  });
}
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("./onesignalsdkworker.js")
    .then(() => {
      console.log("OneSignal worker registered");
    })
    .catch(error => {
      console.log("OneSignal worker error", error);
    });
}
/* INSTALL MARVALOUS */

let deferredPrompt = null;

const installBtn = document.getElementById("installBtn");

const isIOS =
  /iphone|ipad|ipod/i.test(navigator.userAgent);

const isStandalone =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
});

if (installBtn) {
  installBtn.addEventListener("click", async () => {

    if (isStandalone) {
      alert("Marvalous is already installed on this device.");
      return;
    }

    if (isIOS) {
      const iphoneModal =
        document.getElementById("iphoneInstallModal");

      if (iphoneModal) {
        iphoneModal.classList.add("show");
      }

      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();

      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === "accepted") {
        deferredPrompt = null;
        installBtn.style.display = "none";
      }

      return;
    }

    alert(
      "Open your browser menu and choose “Install app” or “Add to Home screen”."
    );
  });
}

function closeIphoneInstall() {
  const iphoneModal =
    document.getElementById("iphoneInstallModal");

  if (iphoneModal) {
    iphoneModal.classList.remove("show");
  }
}

window.addEventListener("click", (event) => {
  const iphoneModal =
    document.getElementById("iphoneInstallModal");

  if (event.target === iphoneModal) {
    closeIphoneInstall();
  }
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;

  if (installBtn) {
    installBtn.style.display = "none";
  }
});

if (isStandalone && installBtn) {
  installBtn.style.display = "none";
}
