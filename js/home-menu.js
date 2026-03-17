import { db } from "./firebase-config.js";
import { collection, getDocs } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { addToCart } from "./cart-firestore.js";
import { resolveImageSrc, attachImageFallback } from "./image-utils.js";

const menuContainer = document.getElementById("menu-container");
const menuSearch = document.getElementById("menuSearch");
const filterType = document.getElementById("filterType");
const filterPrice = document.getElementById("filterPrice");
const resetFilters = document.getElementById("resetFilters");
const cartCount = document.getElementById("cartCount");
let menuItems = [];
let detailsModal = null;
let modalContent = null;

function updateCartCountBadge(cart) {
  if (!cartCount) {
    return;
  }

  const totalItems = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  cartCount.textContent = String(totalItems);
  cartCount.classList.toggle("is-hidden", totalItems === 0);
}

function ensureDetailsModal() {
  if (detailsModal) {
    return;
  }

  detailsModal = document.createElement("div");
  detailsModal.className = "menu-modal";
  detailsModal.innerHTML = `
    <div class="menu-modal-overlay" data-modal-close></div>
    <div class="menu-modal-content" role="dialog" aria-modal="true" aria-labelledby="menuModalTitle">
      <button type="button" class="menu-modal-close" data-modal-close aria-label="Close details">&times;</button>
      <div class="menu-modal-body"></div>
    </div>
  `;

  modalContent = detailsModal.querySelector(".menu-modal-body");

  detailsModal.querySelectorAll("[data-modal-close]").forEach(button => {
    button.addEventListener("click", () => {
      detailsModal.classList.remove("is-visible");
    });
  });

  document.body.appendChild(detailsModal);
}

function openDetailsModal(item) {
  ensureDetailsModal();
  const description = item.description || "No description available.";
  const typeLabel = item.type ? `<span class="menu-modal-type">${item.type}</span>` : "";
  const imageSrc = resolveImageSrc(item.image);

  modalContent.innerHTML = `
    <img src="${imageSrc}" alt="${item.name}">
    <div class="menu-modal-info">
      <h2 id="menuModalTitle">${item.name}</h2>
      ${typeLabel}
      <p class="menu-modal-price">৳${item.price}</p>
      <p class="menu-modal-description">${description}</p>
      <div class="menu-modal-actions">
        <button type="button" class="btn" id="modalOrderBtn">Order Now</button>
      </div>
    </div>
  `;

  attachImageFallback(modalContent.querySelector("img"));

  modalContent.querySelector("#modalOrderBtn").addEventListener("click", async () => {
    const updatedCart = await addToCart(item);
    updateCartCountBadge(updatedCart);
    window.location.href = "order.html";
  });

  detailsModal.classList.add("is-visible");
}

function createCard(item) {
  const card = document.createElement("div");
  card.className = "menu-card";
  const description = item.description || "";
  const imageSrc = resolveImageSrc(item.image);
  card.innerHTML = `
    <img src="${imageSrc}" alt="${item.name}">
    <div class="menu-card-body">
      <h3>${item.name}</h3>
      ${description ? `<p class="menu-card-description">${description}</p>` : ""}
      <div class="menu-card-footer">
        <p>৳${item.price}</p>
        <button class="cart-btn" type="button" aria-label="Add ${item.name} to cart">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.45a1 1 0 0 0 .9 1.5h12v-2h-10.42l.55-1h7.87a1 1 0 0 0 .92-.63l3.1-7.37a1 1 0 0 0-.92-1.37h-14.3l-.6-1.17a1 1 0 0 0-.9-.53zm3 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  attachImageFallback(card.querySelector("img"));

  const cartButton = card.querySelector(".cart-btn");
  cartButton.addEventListener("click", async (event) => {
    event.stopPropagation();
    const updatedCart = await addToCart(item);
    updateCartCountBadge(updatedCart);
  });

  card.addEventListener("click", () => openDetailsModal(item));

  return card;
}

function renderMenu(items) {
  if (!menuContainer) {
    return;
  }

  menuContainer.innerHTML = "";
  items.forEach(item => {
    const card = createCard(item);
    menuContainer.appendChild(card);
  });
}

function filterMenuItems(query) {
  const term = query.trim().toLowerCase();
  if (!term) {
    return menuItems;
  }

  return menuItems.filter(item => {
    const nameMatch = item.name?.toLowerCase().includes(term);
    const typeMatch = item.type?.toLowerCase().includes(term);
    return nameMatch || typeMatch;
  });
}

function applyAllFilters() {
  let filtered = [...menuItems];

  // Apply search filter
  if (menuSearch && menuSearch.value) {
    filtered = filterMenuItems(menuSearch.value);
  }

  // Apply item type filter
  if (filterType && filterType.value) {
    filtered = filtered.filter(item => item.type === filterType.value);
  }

  // Apply price filter
  if (filterPrice && filterPrice.value) {
    const priceRange = filterPrice.value;
    filtered = filtered.filter(item => {
      const price = item.price;
      if (priceRange === "0-100") return price < 100;
      if (priceRange === "100-200") return price >= 100 && price < 200;
      if (priceRange === "200-300") return price >= 200 && price < 300;
      if (priceRange === "300+") return price >= 300;
      return true;
    });
  }

  renderMenu(filtered);
}

function populateTypeFilter() {
  if (!filterType) return;

  const types = new Set(menuItems.map(item => item.type).filter(Boolean));
  const sortedTypes = Array.from(types).sort();

  sortedTypes.forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    filterType.appendChild(option);
  });
}

async function loadMenu() {
  if (!menuContainer) {
    return;
  }

  const querySnapshot = await getDocs(collection(db, "menu"));

  menuItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // Populate the type filter dropdown
  populateTypeFilter();
  
  renderMenu(menuItems);
}

loadMenu();

if (menuSearch) {
  menuSearch.addEventListener("input", applyAllFilters);
}

if (filterType) {
  filterType.addEventListener("change", applyAllFilters);
}

if (filterPrice) {
  filterPrice.addEventListener("change", applyAllFilters);
}

if (resetFilters) {
  resetFilters.addEventListener("click", () => {
    if (menuSearch) menuSearch.value = "";
    if (filterType) filterType.value = "";
    if (filterPrice) filterPrice.value = "";
    renderMenu(menuItems);
  });
}
