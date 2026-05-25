// ============================================
// this's Linkedin DOM scrapper
// work only on linkedin.com/jobs/* pages
// with some fallbacks
// ============================================

(function () {
  "use strict";

  console.log("[ApplyThis] LinkedIn content script loaded");

  // from the right side side page on selected job panel
  const SELECTORS = {
    // company name selectors
    company: [
      // job detail panel (side panel view)
      ".job-details-jobs-unified-top-card__company-name a",
      ".job-details-jobs-unified-top-card__company-name",
      // full page view
      ".jobs-unified-top-card__company-name a",
      ".jobs-unified-top-card__company-name",
      // fallbacks
      ".topcard__org-name-link",
      ".topcard__flavor--black-link",
      'a[data-tracking-control-name="public_jobs_topcard-org-name"]',
      ".artdeco-entity-lockup__subtitle a",
      ".artdeco-entity-lockup__subtitle",
    ],

    // job title selectors
    position: [
      ".job-details-jobs-unified-top-card__job-title h1 a",
      ".job-details-jobs-unified-top-card__job-title h1",
      ".job-details-jobs-unified-top-card__job-title",
      ".jobs-unified-top-card__job-title",
      ".topcard__title",
      'h1[class*="job-title"]',
      ".artdeco-entity-lockup__title",
      // generic fallback
      "h1",
    ],
  };

  // keep trying selectros till one catch and return non empty text
  function queryText(selectors) {
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent.trim();
        if (text) {
          console.log(
            `[ApplyThis] Found text with selector "${selector}": "${text}"`,
          );
          return text;
        }
      }
    }
    return null;
  }

  // clean up company names (WIP)
  function cleanCompanyName(raw) {
    if (!raw) return null;
    return raw
      .split("\n")[0] // take first line only
      .replace(/\d[\d,]*\s*followers?/i, "") // remove follower
      .replace(/\s+/g, " ") // whitespace
      .trim();
  }

  // clean up job title
  function cleanPosition(raw) {
    if (!raw) return null;
    return raw.replace(/\s+/g, " ").trim();
  }
  function scrapeJobData() {
    const rawCompany = queryText(SELECTORS.company);
    const rawPosition = queryText(SELECTORS.position);

    const company = cleanCompanyName(rawCompany);
    const position = cleanPosition(rawPosition);
    const url = window.location.href;

    console.log("[ApplyThis] SCRAPPED:", { company, position, url });

    return {
      company: company || null,
      position: position || null,
      url: url,
      source: "linkedin",
    };
  }

  // this will get called by background.js to access DOM and scrape job data
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "SCRAPE_JOB_DATA") {
      console.log("[ApplyThis] Received scrape request");
      const data = scrapeJobData();
      sendResponse(data);
    }
  });
})();

