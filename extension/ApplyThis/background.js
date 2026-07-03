// ============================================
// background script — ApplyThis
// ============================================

// ---- API Layer ----

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
    id: "applythis-track-job",
    title: "Track This Job",
    contexts: ["page"],
    documentUrlPatterns: ["*://*.linkedin.com/jobs/*"],
  });
  console.log("[ApplyThis] Context menu created");
});

// ---- context menu click handler ----

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log("[ApplyThis] Context menu clicked!", info.menuItemId);

  if (info.menuItemId !== "applythis-track-job") return;

  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      showNotification(
        "Not Logged In",
        "Please log in to ApplyThis extension first.",
      );
      return;
    }

    console.log("[ApplyThis] Sending scrape request to tab:", tab.id);

    const jobData = await browser.tabs.sendMessage(tab.id, {
      action: "SCRAPE_JOB_DATA",
    });

    console.log("[ApplyThis] Got job data:", jobData);

    if (!jobData || !jobData.company) {
      showNotification(
        "Couldn't Parse Job",
        "Couldn't extract job details from this page.",
      );
      return;
    }

    const created = await createJob({
      company: jobData.company,
      position: jobData.position || "Unknown Position",
      url: jobData.url,
      status: "APPLIED",
    });

    console.log("[ApplyThis] job created:", created);

    showNotification(
      "Job Tracked",
      `${created.position} at ${created.company}`,
    );
  } catch (error) {
    console.error("[ApplyThis] Error:", error);
    showNotification("Error", error.message);
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

// ---- Handle messages from content script AND popup ----

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
    return true; // async response
  }
});
