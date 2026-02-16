const CART_KEY = "cafeCart";
const cartToggle = document.getElementById("cartToggle");
const cartCount = document.getElementById("cartCount");
let cartPanel = null;
let cartPanelMessage = null;
let cartPanelItems = null;
let cartPanelTotal = null;
let cartPanelOrderButton = null;

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
  updateCartBadge(cart);
  renderCartPanel(cart);
}

function formatPrice(value) {
  const amount = Number(value) || 0;
  return `৳ ${amount.toFixed(2)}`;
}

function updateCartBadge(cart = getCart()) {
  if (!cartCount) {
    return;
  }

  const totalItems = cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  cartCount.textContent = String(totalItems);
  cartCount.classList.toggle("is-hidden", totalItems === 0);
}

function ensureCartPanel() {
  if (cartPanel) {
    return;
  }

  cartPanel = document.createElement("div");
  cartPanel.className = "cart-panel";
  cartPanel.id = "cartPanel";
  cartPanel.innerHTML = `
    <div class="cart-panel-overlay" data-cart-close></div>
    <div class="cart-panel-content" role="dialog" aria-modal="true" aria-labelledby="cartPanelTitle">
      <div class="cart-panel-header">
        <h3 id="cartPanelTitle">Your Cart</h3>
        <button type="button" class="cart-panel-close" data-cart-close aria-label="Close cart">&times;</button>
      </div>
      <p class="cart-panel-message" id="cartPanelMessage"></p>
      <ul class="cart-panel-items" id="cartPanelItems"></ul>
      <div class="cart-panel-summary">
        <span>Total</span>
        <strong id="cartPanelTotal">৳ 0.00</strong>
      </div>
      <div class="cart-panel-actions">
        <a class="btn" href="order.html" id="cartPanelOrder">Place Order</a>
      </div>
    </div>
  `;

  cartPanelMessage = cartPanel.querySelector("#cartPanelMessage");
  cartPanelItems = cartPanel.querySelector("#cartPanelItems");
  cartPanelTotal = cartPanel.querySelector("#cartPanelTotal");
  cartPanelOrderButton = cartPanel.querySelector("#cartPanelOrder");

  cartPanel.querySelectorAll("[data-cart-close]").forEach((button) => {
    button.addEventListener("click", () => {
      cartPanel.classList.remove("is-visible");
    });
  });

  cartPanelItems.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const itemRow = button.closest("li");
    const itemId = itemRow?.dataset.id;
    if (!itemId) {
      return;
    }

    const action = button.dataset.action;
    const delta = action === "increase" ? 1 : -1;
    updateQuantity(itemId, delta);
  });

  document.body.appendChild(cartPanel);
}

function updateQuantity(itemId, delta) {
  const cart = getCart();
  const item = cart.find(entry => entry.id === itemId);
  if (!item) {
    return;
  }

  item.quantity = (Number(item.quantity) || 0) + delta;
  if (item.quantity <= 0) {
    const index = cart.indexOf(item);
    cart.splice(index, 1);
  }

  saveCart(cart);
}

function renderCartPanel(cart = getCart()) {
  if (!cartPanelItems || !cartPanelMessage || !cartPanelTotal) {
    return;
  }

  cartPanelItems.innerHTML = "";

  if (!cart.length) {
    cartPanelMessage.textContent = "Your cart is empty. Add items from the menu.";
    cartPanelTotal.textContent = "৳ 0.00";
    if (cartPanelOrderButton) {
      cartPanelOrderButton.setAttribute("aria-disabled", "true");
      cartPanelOrderButton.classList.add("is-disabled");
    }
    return;
  }

  cartPanelMessage.textContent = "";
  let total = 0;

  cart.forEach(item => {
    const price = Number(item.price) || 0;
    const quantity = Number(item.quantity) || 0;
    const lineTotal = price * quantity;
    total += lineTotal;

    const li = document.createElement("li");
    li.dataset.id = item.id;
    li.innerHTML = `
      <div class="cart-panel-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-panel-info">
          <h4>${item.name}</h4>
          <p>${formatPrice(price)} each</p>
          <div class="cart-qty">
            <button type="button" class="cart-qty-btn" data-action="decrease" aria-label="Decrease quantity">-</button>
            <span class="cart-qty-value">${quantity}</span>
            <button type="button" class="cart-qty-btn" data-action="increase" aria-label="Increase quantity">+</button>
          </div>
        </div>
        <div class="cart-panel-price">${formatPrice(lineTotal)}</div>
      </div>
    `;
    cartPanelItems.appendChild(li);
  });

  cartPanelTotal.textContent = formatPrice(total);
  if (cartPanelOrderButton) {
    cartPanelOrderButton.removeAttribute("aria-disabled");
    cartPanelOrderButton.classList.remove("is-disabled");
  }
}

function openCartPanel() {
  ensureCartPanel();
  cartPanel.classList.add("is-visible");
  renderCartPanel();
}

if (cartToggle) {
  cartToggle.addEventListener("click", () => {
    window.location.href = "order.html";
  });
}

updateCartBadge();

window.addEventListener("storage", (event) => {
  if (event.key !== CART_KEY) {
    return;
  }

  updateCartBadge();
  renderCartPanel();
});

window.addEventListener("cart:updated", () => {
  updateCartBadge();
  renderCartPanel();
});
