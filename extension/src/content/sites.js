
// ("content_scripts" -> "matches").
// one entry per site, every new site should have an entry here
// and it's url in manifest.json
// "var" so nothing breaks if the file ever runs twice.
var SELECTOR_SITES = [
  {
    name: "tanitjobs",
    hostPart: "tanitjobs.com",
    titleSelector: "h1.details-header__title",
    // don't grab the cards of the job list
    companySelector: ".left-top-annonce .listing-item__info--item-company",
    // just keep site adrs since url doesn't change with jobs
    linkToOrigin: true,
  },
];

function isLinkedIn() {
  return location.hostname.includes("linkedin.com");
}

// returns the table entry for the current site, or null
function findSelectorSite() {
  for (const site of SELECTOR_SITES) {
    if (location.hostname.includes(site.hostPart)) {
      return site;
    }
  }
  return null;
}

function isKnownSite() {
  return isLinkedIn() || findSelectorSite() !== null;
}

// the element the widget parks next to (null on unlisted sites)
function getTitleElement() {
  if (isLinkedIn()) {
    return document.querySelector('a[href*="/jobs/view/"]');
  }

  const site = findSelectorSite();
  if (site) {
    return document.querySelector(site.titleSelector);
  }

  return null;
}

// ---- text cleaning ----

function cleanText(raw) {
  if (!raw) return null;
  return raw.replace(/\s+/g, " ").trim();
}

function cleanCompany(raw) {
  const text = cleanText(raw);
  if (!text) return null;

  // remove a trailing dash, tanitjobs gives "OSIS -"
  return text.replace(/\s*-\s*$/, "").trim();
}

// ---- tanitjobs and any other table site ----

function scrapeWithSelector(selector) {
  const element = document.querySelector(selector);
  if (!element) return null;
  return cleanText(element.textContent);
}

// ---- LinkedIn (messy, so it keeps its own functions) ----

function scrapePosition_linkedin() {
  // look for <a> with href containing /jobs/view/
  const jobLink = document.querySelector('a[href*="/jobs/view/"]');
  if (jobLink) {
    // make sure it's long and doesn't have apply or save
    const text = jobLink.textContent.trim();
    if (text.length > 5 && !text.match(/^(apply|save)/i)) {
      return cleanText(text);
    }
  }

  // if the above fails just get it from the title (job title | companyname | linkedin)
  const titleMatch = document.title.match(/^(.+?)\s*[|]/);
  if (titleMatch) {
    const text = titleMatch[1].trim();
    // just skip if it's "jobs" or "linkedin"
    if (text.length > 5 && !text.match(/^(jobs|linkedin)/i)) {
      return text;
    }
  }

  return null;
}

function scrapeCompany_linkedin() {
  // look for href that has /company/
  const companyLinks = document.querySelectorAll('a[href*="/company/"]');
  for (const link of companyLinks) {
    const text = link.textContent.trim();
    // filter out noise: company name should be short-ish and not a generic link
    if (
      text.length > 1 &&
      text.length < 100 &&
      !text.match(/^(follow|see more|view|company page)/i)
    ) {
      return cleanText(text);
    }
  }

  // just get it from the title
  const titleParts = document.title.split(/[|]/);
  if (titleParts.length >= 2) {
    const company = titleParts[1].trim();
    if (company && !company.match(/^linkedin/i)) {
      return company;
    }
  }

  return null;
}

// ---- the one function content.js calls ----

function scrapeJobData() {
  let company = null;
  let position = null;
  let url = location.href;
  let source = "other";

  const selectorSite = findSelectorSite();

  if (isLinkedIn()) {
    company = scrapeCompany_linkedin();
    position = scrapePosition_linkedin();
    source = "linkedin";
  } else if (selectorSite) {
    company = scrapeWithSelector(selectorSite.companySelector);
    position = scrapeWithSelector(selectorSite.titleSelector);
    source = selectorSite.name;

    if (selectorSite.linkToOrigin) {
      url = location.origin;
    }
  }
  // unlisted site: company and position stay null,
  // so the popup fields just start empty

  const jobData = {
    company: cleanCompany(company),
    position: cleanText(position),
    url: url,
    source: source,
  };

  console.log("[ApplyThis] SCRAPED:", jobData);
  return jobData;
}