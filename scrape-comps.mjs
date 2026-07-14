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
  const enterLinks = Array.from(
    document.querySelectorAll('a[href*="/competition/"]')
  ).filter(link =>
    /enter now/i.test(link.innerText || link.textContent || "")
  );

  const results = new Map();

  for (const link of enterLinks) {
    const url = link.href;
    if (!url) continue;

    let card = link.parentElement;

    // Move upwards until we reach the smallest container
    // containing both "Sold" and the ticket total.
    while (card && card !== document.body) {
      const text = (card.innerText || "")
        .replace(/\s+/g, " ")
        .trim();

      if (
        /\d+(?:\.\d+)?%\s*Sold/i.test(text) &&
        /\d[\d,]*\s*\/\s*\d[\d,]*/.test(text)
      ) {
        break;
      }

      card = card.parentElement;
    }

    if (!card || card === document.body) continue;

    const text = (card.innerText || "")
      .replace(/\s+/g, " ")
      .trim();

    const soldMatch = text.match(
      /(\d[\d,]*)\s*\/\s*(\d[\d,]*)/
    );

    if (!soldMatch) continue;

    const percentMatch = text.match(
      /(\d+(?:\.\d+)?)%\s*Sold/i
    );

    const instantWinsMatch = text.match(
      /Instant Wins?\s*([\d,]+)/i
    );

    const priceMatch =
      text.match(/£\s*(\d+(?:\.\d+)?)\s*per ticket/i) ||
      text.match(/(\d+(?:\.\d+)?)p\s*per ticket/i);

    const image =
      card.querySelector('img[src*="static.rafflex.io"]')?.src ||
      card.querySelector("img")?.src ||
      "";

    const slug =
      url.split("/competition/")[1]?.split(/[?#]/)[0] || "";

    let title = "";

    // Find a useful title near the ENTER NOW link.
    const titleCandidates = Array.from(
      card.querySelectorAll("h1,h2,h3,h4,p")
    )
      .map(element =>
        (element.textContent || "")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter(value =>
        value &&
        value.length >= 6 &&
        value.length <= 180 &&
        !/enter now|sold|instant wins|per ticket|day|hrs|mins|secs/i.test(value)
      );

    title =
      titleCandidates[titleCandidates.length - 1] ||
      slug
        .replace(/-/g, " ")
        .replace(/\b\w/g, letter => letter.toUpperCase()) ||
      "Competition";

    const ticketsSold = Number(
      soldMatch[1].replace(/,/g, "")
    );

    const totalTickets = Number(
      soldMatch[2].replace(/,/g, "")
    );

    let ticketPrice = null;

    if (priceMatch) {
      ticketPrice = priceMatch[0]
        .toLowerCase()
        .includes("p per ticket")
        ? Number(priceMatch[1]) / 100
        : Number(priceMatch[1]);
    }

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
      ticketPrice,
      instantWins: instantWinsMatch
        ? Number(instantWinsMatch[1].replace(/,/g, ""))
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
