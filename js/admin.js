import { auth, db } from "./firebase-config.js";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  collection, 
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
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
const adminMenuList = document.getElementById("adminMenuList");
const editMenuForm = document.getElementById("editMenuForm");
const editMenuStatus = document.getElementById("editMenuStatus");
const adminEditCard = document.getElementById("adminEditCard");
const cancelEditBtn = document.getElementById("cancelEditBtn");

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
    const type = document.getElementById("itemType").value;
    const description = document.getElementById("itemDescription").value.trim();

    if (!name || isNaN(price) || price < 0 || !image || !type || !description) {
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
        type,
        description,
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

function setEditCardVisible(visible) {
  if (!adminEditCard) {
    return;
  }

  adminEditCard.classList.toggle("is-visible", visible);
  if (!visible && editMenuStatus) {
    editMenuStatus.textContent = "";
    editMenuStatus.className = "auth-status";
  }
}

function fillEditForm(item) {
  document.getElementById("editItemId").value = item.id;
  document.getElementById("editItemName").value = item.name || "";
  document.getElementById("editItemPrice").value = item.price ?? "";
  document.getElementById("editItemImage").value = item.image || "";
  document.getElementById("editItemType").value = item.type || "Coffee";
  document.getElementById("editItemDescription").value = item.description || "";
  setEditCardVisible(true);
}

function renderAdminMenu(items) {
  if (!adminMenuList) {
    return;
  }

  adminMenuList.innerHTML = "";
  if (!items.length) {
    adminMenuList.innerHTML = "<p>No menu items found.</p>";
    return;
  }

  items.forEach(item => {
    const row = document.createElement("div");
    row.className = "admin-menu-item";
    row.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <div>
        <h3>${item.name}</h3>
        <p>${item.type || ""} • ৳${item.price}</p>
        <p>${item.description || ""}</p>
      </div>
      <div class="admin-menu-actions">
        <button type="button" class="btn" data-action="edit">Edit</button>
        <button type="button" class="btn btn-secondary" data-action="delete">Delete</button>
      </div>
    `;

    row.querySelector("[data-action='edit']").addEventListener("click", () => {
      fillEditForm(item);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    row.querySelector("[data-action='delete']").addEventListener("click", async () => {
      const confirmed = window.confirm(`Delete ${item.name}? This cannot be undone.`);
      if (!confirmed) {
        return;
      }

      try {
        await deleteDoc(doc(db, "menu", item.id));
        await loadAdminMenu();
      } catch (error) {
        alert(error.message || "Failed to delete item.");
      }
    });

    adminMenuList.appendChild(row);
  });
}

async function loadAdminMenu() {
  if (!adminMenuList) {
    return;
  }

  const snapshot = await getDocs(collection(db, "menu"));
  const items = snapshot.docs.map(docItem => ({ id: docItem.id, ...docItem.data() }));
  renderAdminMenu(items);
}

if (adminMenuList) {
  onAuthStateChanged(auth, (user) => {
    if (!checkAdminAuth(user)) {
      return;
    }

    loadAdminMenu();
  });
}

if (editMenuForm) {
  editMenuForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const id = document.getElementById("editItemId").value;
    const name = document.getElementById("editItemName").value.trim();
    const price = parseFloat(document.getElementById("editItemPrice").value);
    const image = document.getElementById("editItemImage").value.trim();
    const type = document.getElementById("editItemType").value;
    const description = document.getElementById("editItemDescription").value.trim();

    if (!id || !name || isNaN(price) || price < 0 || !image || !type || !description) {
      if (editMenuStatus) {
        editMenuStatus.textContent = "Please fill in all fields correctly.";
        editMenuStatus.className = "auth-status error";
      }
      return;
    }

    if (editMenuStatus) {
      editMenuStatus.textContent = "Saving changes...";
      editMenuStatus.className = "auth-status info";
    }

    try {
      await updateDoc(doc(db, "menu", id), {
        name,
        price,
        image,
        type,
        description,
        updatedAt: new Date()
      });

      if (editMenuStatus) {
        editMenuStatus.textContent = "Item updated successfully.";
        editMenuStatus.className = "auth-status success";
      }

      await loadAdminMenu();
      setTimeout(() => setEditCardVisible(false), 1200);
    } catch (error) {
      if (editMenuStatus) {
        editMenuStatus.textContent = error.message || "Failed to update item.";
        editMenuStatus.className = "auth-status error";
      }
    }
  });
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", () => {
    if (editMenuForm) {
      editMenuForm.reset();
    }
    setEditCardVisible(false);
  });
}
