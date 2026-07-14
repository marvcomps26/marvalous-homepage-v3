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
fetch("https://marvalouscompetitions.co.uk/")
  .then(r => r.text())
  .then(data => {
    alert("SUCCESS\n\n" + data.substring(0,100));
  })
  .catch(err => {
    alert("FAILED\n\n" + err);
  });
