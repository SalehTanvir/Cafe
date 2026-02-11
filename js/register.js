import { registerUser } from "./auth.js";

const form = document.getElementById("registerForm");
const status = document.getElementById("authStatus");

function setStatus(message, type) {
  if (!status) {
    return;
  }
  status.textContent = message;
  status.className = `auth-status ${type || ""}`.trim();
}

if (form) {
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      setStatus("Passwords do not match.", "error");
      return;
    }

    setStatus("Creating account...", "info");

    try {
      await registerUser(name, email, password);
      setStatus("Registration successful. You can log in now.", "success");
      window.setTimeout(() => {
        window.location.href = "login.html";
      }, 800);
    } catch (error) {
      setStatus(error?.message || "Registration failed.", "error");
    }
  });
}
