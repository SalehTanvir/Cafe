import { logoutUser, watchAuthState } from "./auth.js";

const loginLink = document.getElementById("loginLink");
const registerLink = document.getElementById("registerLink");
const logoutLink = document.getElementById("logoutLink");
const userDisplay = document.getElementById("userDisplay");

function setHidden(element, hidden) {
  if (!element) {
    return;
  }
  element.classList.toggle("is-hidden", hidden);
}

function updateAuthLinks(user) {
  const isLoggedIn = Boolean(user);
  if (userDisplay) {
    const name = user?.displayName || user?.email || "User";
    userDisplay.textContent = isLoggedIn ? `Hi, ${name}` : "";
  }
  setHidden(logoutLink, !isLoggedIn);
  setHidden(loginLink, isLoggedIn);
  setHidden(registerLink, isLoggedIn);
  setHidden(userDisplay, !isLoggedIn);
}

watchAuthState(updateAuthLinks);

if (logoutLink) {
  logoutLink.addEventListener("click", async event => {
    event.preventDefault();
    try {
      await logoutUser();
      updateAuthLinks(null);
      window.location.href = "index.html";
    } catch (error) {
      console.error("Logout failed.", error);
    }
  });
}
