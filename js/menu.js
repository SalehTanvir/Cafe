import { db } from "./firebase-config.js";
import { collection, getDocs } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const menuContainer = document.getElementById("menu-container");
const CART_KEY = "cafeCart";

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

function createCard(item) {
  const card = document.createElement("div");
  card.className = "menu-card";
  card.innerHTML = `
    <img src="${item.image}" alt="${item.name}">
    <div class="menu-card-body">
      <h3>${item.name}</h3>
      <div class="menu-card-footer">
        <p>$${item.price}</p>
        <button class="cart-btn" type="button" aria-label="Add ${item.name} to cart">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 4h-2l-1 2h2l3.6 7.59-1.35 2.45a1 1 0 0 0 .9 1.5h12v-2h-10.42l.55-1h7.87a1 1 0 0 0 .92-.63l3.1-7.37a1 1 0 0 0-.92-1.37h-14.3l-.6-1.17a1 1 0 0 0-.9-.53zm3 16a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
          </svg>
        </button>
      </div>
    </div>
  `;

  const cartButton = card.querySelector(".cart-btn");
  cartButton.addEventListener("click", () => addToCart(item));

  return card;
}

async function loadMenu() {
  if (!menuContainer) {
    return;
  }

  const querySnapshot = await getDocs(collection(db, "menu"));

  querySnapshot.forEach(doc => {
    const item = { id: doc.id, ...doc.data() };
    const card = createCard(item);
    menuContainer.appendChild(card);
  });
}

loadMenu();
