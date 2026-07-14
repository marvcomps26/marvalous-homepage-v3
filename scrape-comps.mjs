import { chromium } from "playwright";
import fs from "node:fs/promises";

const WEBSITE_URL = "https://marvalouscompetitions.co.uk/";

const browser = await chromium.launch({
  headless: true
});

try {
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
    viewport: {
      width: 1440,
      height: 1400
    }
  });

  await page.goto(WEBSITE_URL, {
  waitUntil: "domcontentloaded",
  timeout: 60000
});

await page.waitForSelector('a[href*="/competition/"]', {
  timeout: 30000
});

await page.waitForTimeout(3000);

  const pageTitle = await page.title();
  const bodyText = await page.locator("body").innerText();

  if (
    pageTitle.toLowerCase().includes("access blocked") ||
    bodyText.toLowerCase().includes("access blocked")
  ) {
    throw new Error("Website returned the Access Blocked page.");
  }

 const competitions = await page.evaluate(() => {
  const slides = Array.from(
    document.querySelectorAll(".swiper-slide")
  );

  const results = new Map();

  for (const slide of slides) {
    const link = slide.querySelector(
      'a[href*="/competition/"]'
    );

    if (!link) continue;

    const url = link.href;
    const text = (slide.innerText || "")
      .replace(/\s+/g, " ")
      .trim();

    const soldMatch = text.match(
      /(\d[\d,]*)\s*\/\s*(\d[\d,]*)/
    );

    if (!soldMatch) continue;

    const image =
      slide.querySelector("img")?.src || "";

    const percentMatch = text.match(
      /(\d+(?:\.\d+)?)%\s*Sold/i
    );

    const priceMatch = text.match(
      /£\s*(\d+(?:\.\d+)?)\s*(?:Per Ticket|Ticket)/i
    );

    const instantWinsMatch = text.match(
      /Instant Wins?\s*(\d[\d,]*)/i
    );

    const titleElement =
      slide.querySelector(
        "#threedee-info p, h1, h2, h3, h4"
      );

    let title =
      titleElement?.textContent
        ?.replace(/\s+/g, " ")
        .trim() || "";

    if (!title) {
      title = url
        .split("/competition/")[1]
        ?.replace(/-/g, " ")
        ?.replace(/\b\w/g, letter =>
          letter.toUpperCase()
        ) || "Competition";
    }

    const ticketsSold = Number(
      soldMatch[1].replace(/,/g, "")
    );

    const totalTickets = Number(
      soldMatch[2].replace(/,/g, "")
    );

    results.set(url, {
      title,
      url,
      image,
      ticketsSold,
      totalTickets,
      percentSold: percentMatch
        ? Number(percentMatch[1])
        : Number(
            ((ticketsSold / totalTickets) * 100).toFixed(2)
          ),
      ticketPrice: priceMatch
        ? Number(priceMatch[1])
        : null,
      instantWins: instantWinsMatch
        ? Number(
            instantWinsMatch[1].replace(/,/g, "")
          )
        : null
    });
  }

  return Array.from(results.values());
}); 
  if (!competitions.length) {
    throw new Error("No live competitions were found.");
  }

  const output = {
    updatedAt: new Date().toISOString(),
    count: competitions.length,
    competitions
  };

  await fs.writeFile(
    "live-comps.json",
    JSON.stringify(output, null, 2) + "\n",
    "utf8"
  );

  console.log(`Saved ${competitions.length} competitions.`);
} finally {
  await browser.close();
}
