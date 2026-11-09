// ============================================
// background script — ApplyThis
// ============================================

// ---- API Layer ----

const API_BASE = "%%API_BASE%%";

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

async function saveTokens(accessToken, refreshToken) {
  await browser.storage.local.set({ accessToken, refreshToken });
}

async function clearTokens() {
  await browser.storage.local.remove([
    "accessToken",
    "refreshToken",
    "userEmail",
  ]);
}

async function apiFetch(endpoint, options = {}) {
  const tokens = await getTokens();

  if (!tokens.accessToken) {
    throw new Error("NOT_AUTHENTICATED");
  }

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.accessToken}`,
      ...(options.headers || {}),
    },
  });

  if (response.status === 401 && tokens.refreshToken) {
    console.log("[ApplyThis] Access token expired, attempting refresh...");

    const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      await saveTokens(refreshData.accessToken, refreshData.refreshToken);

      response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshData.accessToken}`,
          ...(options.headers || {}),
        },
      });
    } else {
      await clearTokens();
      throw new Error("NOT_AUTHENTICATED");
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `API error: ${response.status}`);
  }

  return response.json();
}

async function login(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Login failed");
  }

  const data = await response.json();
  await saveTokens(data.accessToken, data.refreshToken);
  await browser.storage.local.set({ userEmail: email });
  return data;
}

async function createJob(jobData) {
  return apiFetch("/jobs", {
    method: "POST",
    body: JSON.stringify(jobData),
  });
}

async function isAuthenticated() {
  const tokens = await getTokens();
  return !!tokens.accessToken;
}

// ---- context menu setup ----

browser.contextMenus.removeAll().then(() => {
  browser.contextMenus.create({
    id: "applythis-toggle-widget",
    title: "Show / Hide ApplyThis widget",
    // "selection" so it also shows when text is highlighted
    contexts: ["page", "selection"],
  });
  console.log("[ApplyThis] Context menu created");
});

// ---- context menu click handler ----

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "applythis-toggle-widget") return;

  try {
    // the content script is already on this page
    await browser.tabs.sendMessage(tab.id, { action: "TOGGLE_WIDGET" });
  } catch (error) {
    // the script isn't on this page yet so inject it
    try {
      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content/sites.js", "content/content.js"],
      });

      // forceShow: the script may have built its own widget on load
      await browser.tabs.sendMessage(tab.id, {
        action: "TOGGLE_WIDGET",
        forceShow: true,
      });
    } catch (injectError) {
      console.error("[ApplyThis] Could not inject widget:", injectError);
      showNotification("Error", "Can't show the widget on this page.");
    }
  }
});

// ---- helpers (WIP) ----

function showNotification(title, message) {
  browser.notifications.create({
    type: "basic",
    title: title,
    message: message,
    iconUrl: browser.runtime.getURL("icons/bitmap.svg"),
  });
}

console.log("[ApplyThis] Background script loaded");

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === "checkJobStatus") {
//     // Run the async logic in an isolated execution block
//     checkJobStatus(message.company, message.position).then(sendResponse);
//
//     return true; // Keeps the communication channel open for the async response
//   }
// });

async function checkJobStatus(company, position) {
  // const tokens = await getTokens();
  // if (!tokens.accessToken) return { authenticated: false, applied: false };
  console.error("BEFORE TRY");
  try {
    const jobs = await apiFetch("/jobs");
    // const response = await fetch(`${API_BASE}/jobs`, {
    //   headers: {
    //     Authorization: `Bearer ${tokens.accessToken}`,
    //   },
    // });
    //
    // if (!response.ok) return { authenticated: true, applied: false };

    // const jobs = await response.json();

    // check if any jobs matches this company + position
    const match = jobs.find((job) => {
      const companyMatch =
        company && job.company.toLowerCase().includes(company.toLowerCase());
      const positionMatch =
        position && job.position.toLowerCase().includes(position.toLowerCase());
      return companyMatch && positionMatch;
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

// ---- Handle messages from content script AND popup ----
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "CHECK_JOB_STATUS") {
    checkJobStatus(message.data.company, message.data.position)
      .then((result) => {
        // send data back
        sendResponse(result);
      })
      .catch((error) => {
        console.error("[ApplyThis] Error checking status:", error);
        sendResponse({ authenticated: false, applied: false });
      });

    // keep pipline open
    return true;
  }

  if (message.action === "CHECK_AUTH") {
    isAuthenticated().then((result) => sendResponse({ authenticated: result }));
    return true;
  }

  if (message.action === "TRACK_JOB") {
    createJob(message.data)
      .then((created) => {
        console.log("[ApplyThis] Job created via widget:", created);
        showNotification(
          "Job Tracked ✓",
          `${created.position} at ${created.company}`,
        );
        sendResponse({ success: true, job: created });
      })
      .catch((error) => {
        console.error("[ApplyThis] Widget track failed:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});
