// ============================================
// handling login, logout and view toggling
// ============================================

document.addEventListener("DOMContentLoaded", async () => {
  // ---- element reference (like @Viewchild in angular) ----
  const loginView = document.getElementById("login-view");
  const loggedInView = document.getElementById("loggedin-view");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const openSiteBtn = document.getElementById("open-site-btn");
  const errorMessage = document.getElementById("error-message");
  const userEmailDisplay = document.getElementById("user-email");

  function showLogin() {
    loginView.classList.remove("hidden");
    loggedInView.classList.add("hidden");
  }

  function showLoggedIn(email) {
    loginView.classList.add("hidden");
    loggedInView.classList.remove("hidden");
    userEmailDisplay.textContent = email;
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add("visible");
    // auto-hide after 5 seconds
    setTimeout(() => {
      errorMessage.classList.remove("visible");
    }, 5000);
  }

  // ---- check auth status ----

  try {
    const authenticated = await isAuthenticated();
    if (authenticated) {
      const stored = await browser.storage.local.get(["userEmail"]);
      showLoggedIn(stored.userEmail || "Unknown");
    } else {
      showLogin();
    }
  } catch (e) {
    showLogin();
  }

  // ---- login handler ----

  loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError("Please enter both email and password.");
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    try {
      await login(email, password);
      showLoggedIn(email);
    } catch (error) {
      console.error("[ApplyThis] Login failed:", error);
      showError(error.message || "Login failed. Check your credentials.");
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Log In";
    }
  });

  // ---- trigger login when enter is pressed ----

  passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      loginBtn.click();
    }
  });

  // ---- logout handler ----

  logoutBtn.addEventListener("click", async () => {
    await clearTokens();
    showLogin();
    emailInput.value = "";
    passwordInput.value = "";
  });

  // ---- open applythis site (local for now) ----

  openSiteBtn.addEventListener("click", () => {
    browser.tabs.create({ url: "http://localhost:5173" });
  });
});
