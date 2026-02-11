import { loginUser, watchAuthState } from "./auth.js";

const form = document.getElementById("loginForm");
const status = document.getElementById("authStatus");

function setStatus(message, type) {
  if (!status) {
    return;
  }
  status.textContent = message;
  status.className = `auth-status ${type || ""}`.trim();
}

watchAuthState(user => {
  if (user) {
    setStatus(`Logged in as ${user.email || "user"}.`, "success");
  }
});

if (form) {
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    setStatus("Signing in...", "info");

    try {
      await loginUser(email, password);
      setStatus("Login successful. Redirecting to order page...", "success");
      window.setTimeout(() => {
        window.location.href = "order.html";
      }, 600);
    } catch (error) {
      setStatus(error?.message || "Login failed.", "error");
    }
  });
}
