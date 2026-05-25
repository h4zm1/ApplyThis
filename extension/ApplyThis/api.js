// ============================================
// ApplyThis API layer
// ============================================

const API_BASE = "http://localhost:3000/api";

// ---- token management ----

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

// ---- Auth fetch  ----

async function apiFetch(endpoint, options = {}) {
  const tokens = await getTokens();

  if (!tokens.accessToken) {
    throw new Error("NOT_AUTHENTICATED");
  }

  // first attempt with current access token
  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tokens.accessToken}`,
      ...(options.headers || {}),
    },
  });

  // if 401, try refreshing the token
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

      // retry original request with new token
      response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshData.accessToken}`,
          ...(options.headers || {}),
        },
      });
    } else {
      // refresh failed,needs to log in again
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

// ---- API methods ----

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

