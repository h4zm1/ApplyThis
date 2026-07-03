// ============================================
// linked content script (with widget)
// ============================================

(function () {
  "use strict";

  console.log("[ApplyThis] LinkedIn content script loaded");

  function scrapeJobData() {
    const company = scrapeCompany();
    const position = scrapePosition();
    const url = window.location.href;

    console.log("[ApplyThis] SCRAPPED:", { company, position, url });

    return {
      company: company,
      position: position,
      url: url,
      source: "linkedin",
    };
  }

  // rip meaningful classes
  function scrapePosition() {
    // look for <a> with href containign /jobs/view/
    const jobLink = document.querySelector('a[href*="/jobs/view/"]');
    if (jobLink) {
      // make sure it's long and doesn't have apply or save
      const text = jobLink.textContent.trim();
      if (text.length > 5 && !text.match(/^(apply|save)/i)) {
        return cleanText(text);
      }
    }

    // if the above fail just get it from the title (job title | companyname | linkedin)
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

  function scrapeCompany() {
    // look for href that has /company/
    const companyLinks = document.querySelectorAll('a[href*="/company/"]');
    for (const link of companyLinks) {
      const text = link.textContent.trim();
      // filter out noise — company name should be short-ish and not a generic link
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

  function cleanText(raw) {
    if (!raw) return null;
    return raw.replace(/\s+/g, " ").trim();
  }

  //=========== ====
  // api functions
  //===============

  const API_BASE = "http://localhost:3000/api";

  async function getTokens() {
    const result = await browser.storage.local.get([
      "accessToken",
      "refreshToken",
    ]);
    return {
      accessToken: result.accessToken || null,
      refreshToken: result.refreshToken || null,
    };
  }

  async function checkIfApplied(company, position) {
    const tokens = await getTokens();
    if (!tokens.accessToken) return { authenticated: false, applied: false };

    try {
      const response = await fetch(`${API_BASE}/jobs`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (!response.ok) return { authenticated: true, applied: false };

      const jobs = await response.json();

      // check if any job matches this company + position
      const match = jobs.find((job) => {
        const companyMatch =
          company && job.company.toLowerCase().includes(company.toLowerCase());
        const positionMatch =
          position &&
          job.position &&
          job.position.toLowerCase().includes(position.toLowerCase());
        return companyMatch || (companyMatch && positionMatch);
      });

      return {
        authenticated: true,
        applied: !!match,
        job: match || null,
      };
    } catch (e) {
      console.error("[ApplyThis] Error checking job status:", e);
      return { authenticated: true, applied: false };
    }
  }

  //================
  //     widget
  //=============

  const svgUrl = browser.runtime.getURL("icons/bitmap.svg");
  // track widget drag
  let wDragged = false;

  function spawnNearJobTitle(widget) {
    // don't reposition if it got dragged already
    if (wDragged) return;

    const titleElement = document.querySelector('a[href*="/jobs/view/"]');

    if (titleElement) {
      const targetRect = titleElement.getBoundingClientRect();

      widget.style.position = "fixed";
      widget.style.zIndex = "99999";

      // park it near the job title element
      widget.style.left = `${targetRect.right + 37}px`;
      widget.style.top = `${targetRect.top + targetRect.height / 2 - 22}px`;
      widget.style.right = "auto";
      widget.style.bottom = "auto";
    } else {
      // if layout isn't ready just put it bottom rigfh
      widget.style.position = "fixed";
      widget.style.bottom = "20px";
      widget.style.right = "20px";
      widget.style.zIndex = "9999";
    }
  }

  function createWidget() {
    // remove existing widget if any
    const existing = document.getElementById("applythis-widget");
    if (existing) existing.remove();

    // reset wedget spot when a new job is selected
    wDragged = false;

    // create container
    const widget = document.createElement("div");
    widget.id = "applythis-widget";
    widget.innerHTML = `
      <style>
        #applythis-widget {
          /* display:inline-flex; */
          position: fixed;
          /* bottom: 20px; */
          /* right: 20px; */
          z-index: 99999;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        #applythis-widget * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .at-popup {
          position:absolute;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
          border: 1px solid #e0e0e0;
          width: 280px;
          overflow: hidden;
          display: none;
          animation: at-slideUp 0.2s ease;
          z-index: 1;
  padding: 5px !important;
        }

        .at-popup.at-visible {
          display: block;
        }

        @keyframes at-slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .at-header {
          padding: 14px 16px;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .at-header-title {
          font-size: 14px;
          font-weight: 600;
          color: #202020;
        }

        .at-close {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          color: #999;
          padding: 0 4px;
          line-height: 1;
        }

        .at-close:hover {
          color: #333;
        }

        .at-body {
          padding: 16px;
        }

        .at-status {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-size: 13px;
        }

        .at-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .at-dot.at-applied {
          background: #22c55e;
        }

        .at-dot.at-not-applied {
          background: #a3a3a3;
        }

        .at-dot.at-no-auth {
          background: #eab308;
        }

        .at-status-text {
          color: #555;
        }

        .at-job-info {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 10px 12px;
          margin-bottom: 5px !important;
          font-size: 12px;
          color: #555;
          line-height: 1.5;
        }

        .at-job-info strong {
          color: #202020;
        }

        .at-btn {
          width: 100%;
          padding: 10px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.15s;
        }

        .at-btn:hover {
          opacity: 0.9;
        }

        .at-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .at-btn-track {
          background: #202020;
          color: white;
          margin-bottom: 8px;
        }

        .at-btn-open {
          background: transparent;
          border: 1px solid #ddd;
          color: #555;
        }

        .at-btn-login {
          background: #202020;
          color: white;
        }

        .at-success {
          color: #22c55e;
          font-size: 13px;
          text-align: center;
          padding: 4px 0 8px;
        }

        /* toggle button */
        .at-toggle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #202020;
          /* border: none; */
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
          transition: transform 0.15s;
          margin-left: auto;
          margin-top: 8px;
          border: solid gray 1px;
        }

        .at-toggle:hover {
          transform: scale(1.1);
        }

        .at-toggle-icon {
          font-size: 20px;
          line-height: 1;
        }

        /* indicator dot on the widget */
        .at-toggle-dot {
          position: absolute;
          top: -6px;
          right: 0;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid white;
        }

        .at-toggle {
          position: relative;
          cursor:grab;
        }
        .at-toggle:active{
          cursor:grabbing;
        }
        
      </style>

      <div class="at-popup" id="applythis-popup">
        <div class="at-header">
          <span class="at-header-title">ApplyThis</span>
          <button class="at-close" id="applythis-close">✕</button>
        </div>
        <div class="at-body" id="applythis-body">
          <div class="at-status">
            <div class="at-dot at-not-applied"></div>
            <span class="at-status-text">Checking...</span>
          </div>
        </div>
      </div>

      <button class="at-toggle" id="applythis-toggle">
        <span class="at-toggle-icon">
                <img src="${svgUrl}" alt="ApplyThis" width="24" height="24" />
                  <!-- <img src="../icons/bitmap.svg" alt="ApplyThis" width="24" height="24" /> -->
        </span>
      </button>
    `;
    document.body.appendChild(widget);
    spawnNearJobTitle(widget);

    // event listeners
    const toggle = document.getElementById("applythis-toggle");
    const popup = document.getElementById("applythis-popup");
    const close = document.getElementById("applythis-close");

    toggle.addEventListener("click", () => {
      popup.classList.toggle("at-visible");
      if (popup.classList.contains("at-visible")) {
        updateWidget();
      }
    });

    close.addEventListener("click", () => {
      popup.classList.remove("at-visible");
    });

    makeDraggable(widget);
    updateToggleDot();
  }

  function makeDraggable(widget) {
    const toggle = document.getElementById("applythis-toggle");
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    // these need to be named functions so they can be removed
    function onMouseMove(e) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // only start dragging after moving 5px
      if (!isDragging && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;

      isDragging = true;
      wDragged = true;

      widget.style.position = "fixed";
      widget.style.left = `${startLeft + dx}px`;
      widget.style.top = `${startTop + dy}px`;
      widget.style.right = "auto";
      widget.style.bottom = "auto";
    }

    function onMouseUp() {
      // always clean up listeners (to prevent drag stuck in cursor)
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);

      if (isDragging) {
        // don't trigger toggle on mouseup
        toggle.addEventListener(
          "click",
          (e) => {
            e.stopImmediatePropagation();
            e.preventDefault();
          },
          { once: true, capture: true },
        );
      }

      isDragging = false;
    }

    toggle.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault(); // FIX: this should prevent text selection and image dragging

      isDragging = false;
      startX = e.clientX;
      startY = e.clientY;

      const rect = widget.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  }

  // quick indicator for login status, applied/not status
  async function updateToggleDot() {
    const toggle = document.getElementById("applythis-toggle");
    if (!toggle) return;

    const oldDot = toggle.querySelector(".at-toggle-dot");
    if (oldDot) oldDot.remove();

    const dot = document.createElement("div");
    dot.className = "at-toggle-dot";

    const jobData = scrapeJobData();
    const status = await checkIfApplied(jobData.company, jobData.position);

    if (!status.authenticated) {
      dot.style.background = "#eab308";
    } else if (status.applied) {
      dot.style.background = "#22c55e";
    } else {
      dot.style.background = "#a3a3a3";
    }

    toggle.appendChild(dot);
  }

  async function updateWidget() {
    const body = document.getElementById("applythis-body");
    const toggle = document.getElementById("applythis-toggle");
    const jobData = scrapeJobData();

    // check auth and applied status
    const status = await checkIfApplied(jobData.company, jobData.position);

    // add indicator dot to toggle button
    const dot = document.createElement("div");
    dot.className = "at-toggle-dot";

    if (!status.authenticated) {
      // not logged in
      dot.style.background = "#eab308";
      toggle.appendChild(dot);

      body.innerHTML = `
        <div class="at-status">
          <div class="at-dot at-no-auth"></div>
          <span class="at-status-text">Not logged in</span>
        </div>
        <p style="font-size: 12px; color: #888; margin-bottom: 12px;">
          Log in via the extension popup to track jobs.
        </p>
      `;
      return;
    }

    if (status.applied) {
      // already applied
      dot.style.background = "#22c55e";
      toggle.appendChild(dot);

      body.innerHTML = `
        <div class="at-status">
          <div class="at-dot at-applied"></div>
          <span class="at-status-text">Already tracked</span>
        </div>
        <div class="at-job-info">
          <strong>${status.job.company}</strong><br>
          ${status.job.position || ""}
          ${status.job.status ? `<br>Status: ${status.job.status}` : ""}
        </div>
        <button class="at-btn at-btn-open" id="applythis-open">
          Open Dashboard
        </button>
      `;

      document
        .getElementById("applythis-open")
        .addEventListener("click", () => {
          window.open("http://localhost:5173", "_blank");
        });
    } else {
      // not applied yet
      dot.style.background = "#a3a3a3";
      toggle.appendChild(dot);

      body.innerHTML = `
        <div class="at-status">
          <div class="at-dot at-not-applied"></div>
          <span class="at-status-text">Not tracked yet</span>
        </div>
        <div class="at-job-info">
          <strong>${jobData.company || "Unknown Company"}</strong><br>
          ${jobData.position || "Unknown Position"}
        </div>
        <button class="at-btn at-btn-track" id="applythis-track">
          Track This Job
        </button>
        <button class="at-btn at-btn-open" id="applythis-open">
          Open Dashboard
        </button>
      `;

      document
        .getElementById("applythis-track")
        .addEventListener("click", async () => {
          const trackBtn = document.getElementById("applythis-track");
          trackBtn.disabled = true;
          trackBtn.textContent = "Tracking...";

          try {
            // send message to background script to create the job
            await browser.runtime.sendMessage({
              action: "TRACK_JOB",
              data: {
                company: jobData.company || "Unknown Company",
                position: jobData.position || "Unknown Position",
                url: jobData.url,
                status: "APPLIED",
              },
            });

            // show success
            trackBtn.textContent = "✓ Tracked!";
            trackBtn.style.background = "#22c55e";

            // update widget after a short delay
            setTimeout(() => updateWidget(), 1000);
          } catch (error) {
            console.error("[ApplyThis] Track failed:", error);
            trackBtn.textContent = "Failed — try again";
            trackBtn.disabled = false;
            trackBtn.style.background = "#dc2626";
          }
        });

      document
        .getElementById("applythis-open")
        .addEventListener("click", () => {
          window.open("http://localhost:5173", "_blank");
        });
    }
  }

  // listener from background script

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "SCRAPE_JOB_DATA") {
      console.log("[ApplyThis] Received scrape request");
      const data = scrapeJobData();
      sendResponse(data);
    }
    return false;
  });

  // =======initialize===========

  // wait for linkedin to load job title before creating the widget
  function waitForTitleAndInit() {
    const titleElement = document.querySelector('a[href*="/jobs/view/"]');

    if (titleElement) {
      console.log("[ApplyThis] title found, creating widget");
      createWidget();
    } else {
      // keep checking every 500ms, up to 10 seconds
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        const title = document.querySelector('a[href*="/jobs/view/"]');

        if (title) {
          clearInterval(interval);
          console.log("[ApplyThis] title found after waiting, creating widget");
          createWidget();
        } else if (attempts >= 20) {
          clearInterval(interval);
          console.log(
            "[ApplyThis] title not found after 10s, widget at right corner",
          );
          createWidget();
        }
      }, 500);
    }
  }

  waitForTitleAndInit();

  // recheck when url change (SPA)
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      console.log("[ApplyThis] URL changed, reloading widget");
      setTimeout(() => {
        createWidget();
      }, 1000); // wait for linkedin to load
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
