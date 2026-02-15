import { db } from "./firebase-config.js";
import { collection, getDocs } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const menuContainer = document.getElementById("menu-container");
const menuSearch = document.getElementById("menuSearch");
const CART_KEY = "cafeCart";
let menuItems = [];
let detailsModal = null;
let modalContent = null;

function getCart() {
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(entry => entry.id === item.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1
    });
  }

  saveCart(cart);
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

  modalContent.innerHTML = `
    <img src="${item.image}" alt="${item.name}">
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

  modalContent.querySelector("#modalOrderBtn").addEventListener("click", () => {
    addToCart(item);
    window.location.href = "order.html";
  });

  detailsModal.classList.add("is-visible");
}

function createCard(item) {
  const card = document.createElement("div");
  card.className = "menu-card";
  card.innerHTML = `
    <img src="${item.image}" alt="${item.name}">
    <div class="menu-card-body">
      <h3>${item.name}</h3>
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

  const cartButton = card.querySelector(".cart-btn");
  cartButton.addEventListener("click", (event) => {
    event.stopPropagation();
    addToCart(item);
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

async function loadMenu() {
  if (!menuContainer) {
    return;
  }

  const querySnapshot = await getDocs(collection(db, "menu"));

  menuItems = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderMenu(menuItems);
}

loadMenu();

if (menuSearch) {
  menuSearch.addEventListener("input", (event) => {
    const filtered = filterMenuItems(event.target.value);
    renderMenu(filtered);
  });
}
