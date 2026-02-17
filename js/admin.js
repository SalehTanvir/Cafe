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
  deleteDoc,
  query,
  orderBy
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

// Dashboard Statistics and User Management
const userCount = document.getElementById("userCount");
const orderCount = document.getElementById("orderCount");
const menuCount = document.getElementById("menuCount");
const usersList = document.getElementById("usersList");
const ordersList = document.getElementById("ordersList");

async function loadDashboardStats() {
  try {
    // Load user count
    const usersSnapshot = await getDocs(collection(db, "users"));
    if (userCount) {
      userCount.textContent = usersSnapshot.size;
    }

    // Load order count
    const ordersSnapshot = await getDocs(collection(db, "orders"));
    if (orderCount) {
      orderCount.textContent = ordersSnapshot.size;
    }

    // Load menu count
    const menuSnapshot = await getDocs(collection(db, "menu"));
    if (menuCount) {
      menuCount.textContent = menuSnapshot.size;
    }
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

async function loadUsers() {
  if (!usersList) {
    return;
  }

  try {
    const snapshot = await getDocs(collection(db, "users"));
    
    if (snapshot.empty) {
      usersList.innerHTML = "<p>No users found.</p>";
      return;
    }

    usersList.innerHTML = "";
    snapshot.forEach(docItem => {
      const userData = docItem.data();
      const userDiv = document.createElement("div");
      userDiv.className = "user-item";
      userDiv.innerHTML = `
        <div class="user-info">
          <strong>${userData.name || "N/A"}</strong>
          <span>${userData.email || "N/A"}</span>
          <span class="user-date">Joined: ${userData.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}</span>
        </div>
        <button type="button" class="btn btn-secondary btn-small" data-user-id="${docItem.id}">Delete User</button>
      `;

      const deleteBtn = userDiv.querySelector("button");
      deleteBtn.addEventListener("click", async () => {
        const confirmed = window.confirm(`Delete user ${userData.name || userData.email}? This cannot be undone.`);
        if (!confirmed) {
          return;
        }

        try {
          await deleteDoc(doc(db, "users", docItem.id));
          await loadUsers();
          await loadDashboardStats();
        } catch (error) {
          alert("Failed to delete user: " + error.message);
        }
      });

      usersList.appendChild(userDiv);
    });
  } catch (error) {
    console.error("Error loading users:", error);
    usersList.innerHTML = "<p>Error loading users.</p>";
  }
}

async function loadOrders() {
  if (!ordersList) {
    return;
  }

  try {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      ordersList.innerHTML = "<p>No orders found.</p>";
      return;
    }

    ordersList.innerHTML = "";
    snapshot.forEach(docItem => {
      const orderData = docItem.data();
      const orderDiv = document.createElement("div");
      orderDiv.className = "order-item";
      
      let itemsHtml = "";
      if (orderData.items && orderData.items.length > 0) {
        itemsHtml = orderData.items.map(item => 
          `<li>${item.name} x${item.quantity} - ৳${(item.price * item.quantity).toFixed(2)}</li>`
        ).join("");
      }

      orderDiv.innerHTML = `
        <div class="order-header">
          <div>
            <strong>Order #${docItem.id.substring(0, 8)}</strong>
            <span class="order-customer">${orderData.customerName || "N/A"}</span>
            <span class="order-email">${orderData.userEmail || "N/A"}</span>
          </div>
          <div class="order-meta">
            <span class="order-status status-${orderData.status || 'pending'}">${orderData.status || "pending"}</span>
            <span class="order-date">${orderData.createdAt ? new Date(orderData.createdAt.seconds * 1000).toLocaleString() : "N/A"}</span>
          </div>
        </div>
        <div class="order-items">
          <strong>Items:</strong>
          <ul>${itemsHtml}</ul>
        </div>
        <div class="order-total">
          <strong>Total: ৳${orderData.totalAmount ? orderData.totalAmount.toFixed(2) : "0.00"}</strong>
        </div>
      `;

      ordersList.appendChild(orderDiv);
    });
  } catch (error) {
    console.error("Error loading orders:", error);
    ordersList.innerHTML = "<p>Error loading orders.</p>";
  }
}

// Initialize dashboard
if (usersList || ordersList || userCount) {
  onAuthStateChanged(auth, (user) => {
    if (!checkAdminAuth(user)) {
      return;
    }

    loadDashboardStats();
    loadUsers();
    loadOrders();
  });
}
