import { auth, db } from "./firebase-config.js";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  collection, 
  addDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Admin email whitelist (only this email can access admin)
const ADMIN_EMAILS = ["admin@cafe.com"];

function isAdmin(email) {
  return ADMIN_EMAILS.includes(email?.toLowerCase());
}

function checkAdminAuth(user) {
  if (!user || !isAdmin(user.email)) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

// Admin Login Handler
const adminLoginForm = document.getElementById("adminLoginForm");
const adminLoginStatus = document.getElementById("adminLoginStatus");

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;

    adminLoginStatus.textContent = "Signing in...";
    adminLoginStatus.className = "auth-status info";

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (!isAdmin(userCredential.user.email)) {
        await signOut(auth);
        adminLoginStatus.textContent = "Access denied. Not an admin account.";
        adminLoginStatus.className = "auth-status error";
        return;
      }

      adminLoginStatus.textContent = "Login successful! Redirecting...";
      adminLoginStatus.className = "auth-status success";
      
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 600);
    } catch (error) {
      adminLoginStatus.textContent = error.message || "Login failed.";
      adminLoginStatus.className = "auth-status error";
    }
  });
}

// Protect admin pages (dashboard, add-menu)
const adminUserDisplay = document.getElementById("adminUserDisplay");
const adminLogout = document.getElementById("adminLogout");

if (adminUserDisplay || adminLogout) {
  onAuthStateChanged(auth, (user) => {
    if (!checkAdminAuth(user)) {
      return;
    }

    if (adminUserDisplay) {
      adminUserDisplay.textContent = user.displayName || user.email;
    }
  });
}

// Admin Logout
if (adminLogout) {
  adminLogout.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
      window.location.href = "login.html";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  });
}

// Add Menu Item Handler
const addMenuForm = document.getElementById("addMenuForm");
const addMenuStatus = document.getElementById("addMenuStatus");

if (addMenuForm) {
  onAuthStateChanged(auth, (user) => {
    if (!checkAdminAuth(user)) {
      return;
    }
  });

  addMenuForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("itemName").value.trim();
    const price = parseFloat(document.getElementById("itemPrice").value);
    const image = document.getElementById("itemImage").value.trim();

    if (!name || isNaN(price) || price < 0 || !image) {
      addMenuStatus.textContent = "Please fill in all fields correctly.";
      addMenuStatus.className = "auth-status error";
      return;
    }

    addMenuStatus.textContent = "Adding item...";
    addMenuStatus.className = "auth-status info";

    try {
      await addDoc(collection(db, "menu"), {
        name,
        price,
        image,
        createdAt: new Date()
      });

      addMenuStatus.textContent = "Item added successfully!";
      addMenuStatus.className = "auth-status success";
      
      addMenuForm.reset();

      setTimeout(() => {
        addMenuStatus.textContent = "";
      }, 3000);
    } catch (error) {
      addMenuStatus.textContent = error.message || "Failed to add item.";
      addMenuStatus.className = "auth-status error";
    }
  });
}
