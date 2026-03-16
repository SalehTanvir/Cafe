import { db } from "./firebase-config.js";
import { collection, getDocs } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { addToCart } from "./cart-firestore.js";

const menuContainer = document.getElementById("menu-items-container");
const cartCount = document.getElementById("cartCount");
const menuSearch = document.getElementById("menuSearch");
const sortMenu = document.getElementById("sortMenu");
const viewToggle = document.getElementById("viewToggle");
const dietaryButtons = document.querySelectorAll(".diet-tag");

let menuItems = [];
let detailsModal = null;
let modalContent = null;
let currentCategory = "all";
let currentDiet = "all";
let currentSort = "name";
let isGridView = true;

// Category mapping
const categoryMap = {
  pizza: "Pizza",
  coffee: "Coffee",
  burger: "Burger",
  combo: "Combo Pack",
  beverage: "Beverage"
};

function updateCartCountBadge(cart) {
  if (!cartCount) {
    return;
  }

  const totalItems = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  cartCount.textContent = String(totalItems);
  cartCount.classList.toggle("is-hidden", totalItems === 0);
}

function generateStarRating() {
  const rating = Math.floor(Math.random() * 20) / 4 + 3.2; // 3.2 - 5
  const reviewCount = Math.floor(Math.random() * 300) + 20;
  return { rating: rating.toFixed(1), reviewCount };
}

function createStarHTML(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  let html = '';
  
  for (let i = 0; i < fullStars; i++) {
    html += '★';
  }
  
  if (hasHalfStar) {
    html += '½';
  }
  
  for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
    html += '☆';
  }
  
  return html;
}

function getBadges(item, index) {
  const badges = [];
  
  if (item.isNew || index < 3) badges.push('<span class="item-badge new"><i class="fas fa-sparkles"></i> NEW</span>');
  if (item.isPopular || Math.random() > 0.7) badges.push('<span class="item-badge popular"><i class="fas fa-fire"></i> POPULAR</span>');
  if (item.rating >= 4.7) badges.push('<span class="item-badge bestseller"><i class="fas fa-star"></i> BEST SELLER</span>');
  
  return badges.join('');
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
  const starRating = item.rating ? createStarHTML(item.rating) : createStarHTML(4);

  modalContent.innerHTML = `
    <img src="${item.image}" alt="${item.name}">
    <div class="menu-modal-info">
      <h2 id="menuModalTitle">${item.name}</h2>
      ${typeLabel}
      <div class="modal-rating">
        <span class="stars">${starRating}</span>
        <span class="rating-text">${item.rating || 4.5}<i class="fas fa-star"></i> (${item.reviews || Math.floor(Math.random() * 300) + 20} reviews)</span>
      </div>
      <p class="menu-modal-price">৳${item.price}</p>
      <p class="menu-modal-description">${description}</p>
      <div class="menu-modal-quantity">
        <label for="quantityInput">Quantity:</label>
        <div class="qty-selector">
          <button type="button" class="qty-btn minus" id="minusBtn">−</button>
          <input type="number" id="quantityInput" min="1" max="99" value="1" aria-label="Quantity">
          <button type="button" class="qty-btn plus" id="plusBtn">+</button>
        </div>
      </div>
      <div class="menu-modal-actions">
        <button type="button" class="btn" id="modalOrderBtn">Add to Cart</button>
      </div>
    </div>
  `;

  const qtyInput = modalContent.querySelector("#quantityInput");
  const minusBtn = modalContent.querySelector("#minusBtn");
  const plusBtn = modalContent.querySelector("#plusBtn");

  minusBtn.addEventListener("click", () => {
    if (qtyInput.value > 1) qtyInput.value--;
  });

  plusBtn.addEventListener("click", () => {
    if (qtyInput.value < 99) qtyInput.value++;
  });

  modalContent.querySelector("#modalOrderBtn").addEventListener("click", async () => {
    const quantity = parseInt(qtyInput.value) || 1;
    for (let i = 0; i < quantity; i++) {
      await addToCart(item);
    }
    updateCartCountBadge(await getCartItems());
    window.location.href = "order.html";
  });

  detailsModal.classList.add("is-visible");
}

async function getCartItems() {
  // Placeholder - you may need to update this based on your cart implementation
  return [];
}

function createItemElement(item, index) {
  const itemEl = document.createElement("div");
  itemEl.className = "menu-item";
  const starRating = item.rating ? createStarHTML(item.rating) : createStarHTML(4);
  const badges = getBadges(item, index);
  
  itemEl.innerHTML = `
    <div class="item-badges-container">
      ${badges}
    </div>
    <div class="item-image-wrapper">
      <img src="${item.image}" alt="${item.name}" class="item-image">
      <div class="item-overlay">
        <button class="quick-add-btn" type="button" aria-label="Quick add ${item.name}">Quick Add</button>
      </div>
    </div>
    <div class="item-details">
      <h4 class="item-name">${item.name}</h4>
      <div class="item-rating">
        <span class="stars-small">${starRating}</span>
        <span class="rating-count">${item.rating || 4.5}<i class="fas fa-star"></i></span>
      </div>
      ${item.description ? `<p class="item-short-desc">${item.description}</p>` : ""}
      ${item.dietary ? `<div class="item-dietary"><span class="diet-badge">${item.dietary}</span></div>` : ""}
      <div class="item-footer">
        <span class="item-price">৳${item.price}</span>
        <button class="item-cart-btn" type="button" aria-label="Add ${item.name} to cart">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.45a1 1 0 0 0 .9 1.5h12v-2h-10.42l.55-1h7.87a1 1 0 0 0 .92-.63l3.1-7.37a1 1 0 0 0-.92-1.37h-14.3l-.6-1.17a1 1 0 0 0-.9-.53zm3 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  const cartButton = itemEl.querySelector(".item-cart-btn");
  const quickAddBtn = itemEl.querySelector(".quick-add-btn");

  cartButton.addEventListener("click", async (event) => {
    event.stopPropagation();
    const updatedCart = await addToCart(item);
    updateCartCountBadge(updatedCart);
  });

  quickAddBtn.addEventListener("click", async (event) => {
    event.stopPropagation();
    const updatedCart = await addToCart(item);
    updateCartCountBadge(updatedCart);
  });

  itemEl.addEventListener("click", () => openDetailsModal(item));

  return itemEl;
}

function sortItems(items) {
  const sorted = [...items];
  
  switch(currentSort) {
    case "price-low":
      sorted.sort((a, b) => a.price - b.price);
      break;
    case "price-high":
      sorted.sort((a, b) => b.price - a.price);
      break;
    case "rating":
      sorted.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
      break;
    case "popular":
      sorted.sort((a, b) => (b.reviews || 50) - (a.reviews || 50));
      break;
    case "name":
    default:
      sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  return sorted;
}

function filterItems(items) {
  let filtered = items;
  
  // Category filter
  if (currentCategory !== "all") {
    filtered = filtered.filter(item => {
      const itemType = item.type?.toLowerCase();
      const categoryType = categoryMap[currentCategory]?.toLowerCase();
      return itemType === categoryType;
    });
  }
  
  // Dietary filter
  if (currentDiet !== "all") {
    filtered = filtered.filter(item => {
      const itemDiet = item.dietary?.toLowerCase() || "";
      return itemDiet.includes(currentDiet);
    });
  }
  
  return filtered;
}

function searchItems(items, query) {
  if (!query.trim()) return items;
  
  const term = query.trim().toLowerCase();
  return items.filter(item => {
    return item.name?.toLowerCase().includes(term) || 
           item.description?.toLowerCase().includes(term) ||
           item.type?.toLowerCase().includes(term);
  });
}

function renderMenuByCategory() {
  if (!menuContainer) {
    return;
  }

  menuContainer.innerHTML = "";
  
  let itemsToDisplay = filterItems(menuItems);
  itemsToDisplay = searchItems(itemsToDisplay, menuSearch?.value || "");
  itemsToDisplay = sortItems(itemsToDisplay);

  if (itemsToDisplay.length === 0) {
    menuContainer.innerHTML = `<div class="no-items-message">No items match your filters</div>`;
    return;
  }

  itemsToDisplay.forEach((item, index) => {
    const itemElement = createItemElement(item, index);
    menuContainer.appendChild(itemElement);
  });
}

function setupTabNavigation() {
  const tabButtons = document.querySelectorAll(".menu-tab-btn");
  
  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      tabButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      currentCategory = button.dataset.category;
      renderMenuByCategory();
    });
  });
}

function setupDietaryFilters() {
  dietaryButtons.forEach(button => {
    button.addEventListener("click", () => {
      dietaryButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      currentDiet = button.dataset.diet;
      renderMenuByCategory();
    });
  });
  
  // Set "All" as active by default
  dietaryButtons[0].classList.add("active");
}

async function loadMenu() {
  if (!menuContainer) {
    return;
  }

  const querySnapshot = await getDocs(collection(db, "menu"));
  menuItems = querySnapshot.docs.map((doc, index) => {
    const data = doc.data();
    const ratingData = generateStarRating();
    return {
      id: doc.id,
      ...data,
      rating: parseFloat(ratingData.rating),
      reviews: ratingData.reviewCount
    };
  });
  
  setupTabNavigation();
  setupDietaryFilters();
  renderMenuByCategory();
}

// Event listeners
if (menuSearch) {
  menuSearch.addEventListener("input", renderMenuByCategory);
}

if (sortMenu) {
  sortMenu.addEventListener("change", (e) => {
    currentSort = e.target.value;
    renderMenuByCategory();
  });
}

if (viewToggle) {
  viewToggle.addEventListener("click", () => {
    isGridView = !isGridView;
    menuContainer.classList.toggle("list-view", !isGridView);
    viewToggle.classList.toggle("list-mode", !isGridView);
  });
}

loadMenu();
