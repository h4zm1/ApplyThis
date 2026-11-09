// ============================================
// linked content script (with widget)
// ============================================

(function () {
  "use strict";

  console.log("[ApplyThis] LinkedIn content script loaded");


  function cleanText(raw) {
    if (!raw) return null;
    return raw.replace(/\s+/g, " ").trim();
  }

  //=========== ====
  // api functions
  //===============

  // const API_BASE = "%%API_BASE%%";
  //
  // async function getTokens() {
  //   const result = await browser.storage.local.get([
  //     "accessToken",
  //     "refreshToken",
  //   ]);
  //   return {
  //     accessToken: result.accessToken || null,
  //     refreshToken: result.refreshToken || null,
  //   };
  // }

  async function checkIfApplied(company, position) {
    try {
      const response = await browser.runtime.sendMessage({
        action: "CHECK_JOB_STATUS",
        data: { company, position },
      });

      return response;
    } catch (e) {
      console.error("[ApplyThis] Error checking job status:", e);
      return { authenticated: false, applied: false };
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

    const titleElement = getTitleElement();

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
  // true while the user has the widget hidden from the right-click menu
  let widgetHidden = false;

  function createWidget() {
    // remove existing widget if any
    const existing = document.getElementById("applythis-widget");
    if (existing) existing.remove();

    // reset wedget spot when a new job is selected
    wDragged = false;

    // create container
    const widget = document.createElement("div");
    widget.id = "applythis-widget";
	// stay hidden if we intentionally hide it (cause linkedin rebuild widget on every job)
	if (widgetHidden) widget.style.display = "none";
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
		  margin-bottom: 0.3rem;
        }
		#applythis-widget .at-input {
          width: 100%;
          padding: 8px 10px;
          margin-bottom: 8px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 13px;
          color: #202020;
          background: white;
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
		  height: 2rem;
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

  function toggleWidget(forceShow) {
    const widget = document.getElementById("applythis-widget");

    // no widget on this page (unlisted site)
    if (!widget) {
      widgetHidden = false;
      createWidget();
      return;
    }

    if (forceShow) {
      widgetHidden = false;
    } else {
      widgetHidden = !widgetHidden;
    }

    // "" will puts back the default display
    widget.style.display = widgetHidden ? "none" : "";
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

  function setToggleDot(color) {
    const toggle = document.getElementById("applythis-toggle");
    if (!toggle) return;

    // remove old dot to prevent stacking
    const oldDot = toggle.querySelector(".at-toggle-dot");
    if (oldDot) oldDot.remove();

    const dot = document.createElement("div");
    dot.className = "at-toggle-dot";
    dot.style.background = color;
    toggle.appendChild(dot);
  }

  async function updateToggleDot() {
    const jobData = scrapeJobData();
    const status = await checkIfApplied(jobData.company, jobData.position);

    if (!status.authenticated) {
      setToggleDot("#eab308"); // yellow: not logged in
    } else if (status.applied) {
      setToggleDot("#22c55e"); // green: already tracked
    } else {
      setToggleDot("#a3a3a3"); // gray: not tracked yet
    }
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
    const jobData = scrapeJobData();

    // check auth and applied status
    const status = await checkIfApplied(jobData.company, jobData.position);

    // --- not logged in ---
    if (!status.authenticated) {
      setToggleDot("#eab308");

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

    // --- already tracked ---
    if (status.applied) {
      setToggleDot("#22c55e");

      // the template is empty on purpose, the text is filled in below
      body.innerHTML = `
        <div class="at-status">
          <div class="at-dot at-applied"></div>
          <span class="at-status-text">Already tracked</span>
        </div>
        <div class="at-job-info">
          <strong id="applythis-job-company"></strong><br>
          <span id="applythis-job-position"></span>
          <div id="applythis-job-status"></div>
        </div>
        <button class="at-btn at-btn-open" id="applythis-open">
          Open Dashboard
        </button>
      `;

      // textContent means the text is never parsed as HTML
      document.getElementById("applythis-job-company").textContent =
        status.job.company;
      document.getElementById("applythis-job-position").textContent =
        status.job.position || "";
      if (status.job.status) {
        document.getElementById("applythis-job-status").textContent =
          "Status: " + status.job.status;
      }

      document
        .getElementById("applythis-open")
        .addEventListener("click", () => {
          window.open("%%APP_URL%%", "_blank");
        });
      return;
    }

    // --- not tracked yet: editable fields ---
    setToggleDot("#a3a3a3");

    body.innerHTML = `
      <div class="at-status">
        <div class="at-dot at-not-applied"></div>
        <span class="at-status-text">Not tracked yet</span>
      </div>
      <input class="at-input" id="applythis-company" placeholder="Company" />
      <input class="at-input" id="applythis-position" placeholder="Job title" />
      <button class="at-btn at-btn-track" id="applythis-track" disabled>
        Track This Job
      </button>
      <button class="at-btn at-btn-open" id="applythis-open">
        Open Dashboard
      </button>
    `;

    const companyInput = document.getElementById("applythis-company");
    const positionInput = document.getElementById("applythis-position");
    const trackBtn = document.getElementById("applythis-track");

    // prefill with .value instead of putting the text inside the HTML string,
    // so quotes or tags in a job title can't break the markup
    companyInput.value = jobData.company || "";
    positionInput.value = jobData.position || "";

    // the track button only works when both fields have text
    function updateTrackButton() {
      const hasCompany = companyInput.value.trim() !== "";
      const hasPosition = positionInput.value.trim() !== "";
      trackBtn.disabled = !(hasCompany && hasPosition);
    }

    companyInput.addEventListener("input", updateTrackButton);
    positionInput.addEventListener("input", updateTrackButton);
    updateTrackButton(); // run once for the prefilled values

    trackBtn.addEventListener("click", async () => {
      trackBtn.disabled = true;
      trackBtn.textContent = "Tracking...";

      try {
        // send what is in the fields (not the raw scrape)
        await browser.runtime.sendMessage({
          action: "TRACK_JOB",
          data: {
            company: companyInput.value.trim(),
            position: positionInput.value.trim(),
            url: jobData.url,
            status: "APPLIED",
          },
        });

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
        window.open("%%APP_URL%%", "_blank");
      });
  }

  // listener from background script

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "SCRAPE_JOB_DATA") {
      console.log("[ApplyThis] Received scrape request");
      const data = scrapeJobData();
      sendResponse(data);
    }
	
	if (message.action === "TOGGLE_WIDGET") {
      toggleWidget(message.forceShow);
    }
	
    return false;
  });

  // =======initialize===========

  // wait for linkedin to load job title before creating the widget
  function waitForTitleAndInit() {
    // unlisted sites don't get an automatic widget, the right-click menu shows it
    if (!isKnownSite()) return;

    if (getTitleElement()) {
      console.log("[ApplyThis] title found, creating widget");
      createWidget();
    } else {
      // keep checking every 500ms, up to 10 seconds
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;

        if (getTitleElement()) {
          clearInterval(interval);
          console.log("[ApplyThis] title found after waiting, creating widget");
          createWidget();
        } else if (attempts >= 20) {
          clearInterval(interval);
          console.log("[ApplyThis] title not found after 10s, widget at right corner");
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

      // only rebuild the widget if it belongs on this page
      const widgetExists = document.getElementById("applythis-widget");
      if (!isKnownSite() && !widgetExists) return;

      console.log("[ApplyThis] URL changed, reloading widget");
      setTimeout(() => {
        createWidget();
      }, 1000); // wait for linkedin to load
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
