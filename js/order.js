import { onAuthReady } from "./auth.js";

const CART_KEY = "cafeCart";
const cartItems = document.getElementById("cart-items");
const cartMessage = document.getElementById("cart-message");
const cartTotal = document.getElementById("cart-total");
const authMessage = document.getElementById("auth-message");
const orderForm = document.getElementById("orderForm");
const backButton = document.getElementById("backButton");

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

function formatPrice(value) {
	const amount = Number(value) || 0;
	return `৳ ${amount.toFixed(2)}`;
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
	renderCart();
}

function renderCart() {
	const cart = getCart();
	if (!cartItems || !cartMessage) {
		return;
	}

	cartItems.innerHTML = "";

	if (!cart.length) {
		cartMessage.textContent = "Your cart is empty. Add items from the home or menu page.";
		if (cartTotal) {
			cartTotal.textContent = "৳ 0.00";
		}
		return;
	}

	cartMessage.textContent = "";
	let total = 0;
	cart.forEach(item => {
		const quantity = Number(item.quantity) || 0;
		const price = Number(item.price) || 0;
		const lineTotal = quantity * price;
		total += lineTotal;

		const li = document.createElement("li");
		li.dataset.id = item.id;
		li.innerHTML = `
			<div class="cart-row">
				<img class="cart-row-image" src="${item.image}" alt="${item.name}">
				<span class="cart-row-name">${item.name}</span>
				<div class="cart-row-controls">
					<button type="button" class="cart-qty-btn" data-action="decrease" aria-label="Decrease quantity">-</button>
					<span class="cart-qty-value">${quantity}</span>
					<button type="button" class="cart-qty-btn" data-action="increase" aria-label="Increase quantity">+</button>
				</div>
				<span class="cart-row-price">${formatPrice(lineTotal)}</span>
			</div>
		`;
		cartItems.appendChild(li);
	});

	if (cartTotal) {
		cartTotal.textContent = formatPrice(total);
	}
}

if (cartItems) {
	cartItems.addEventListener("click", (event) => {
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
}

function setFormEnabled(enabled) {
	if (!orderForm) {
		return;
	}

	const fields = orderForm.querySelectorAll("input, button");
	fields.forEach(field => {
		field.disabled = !enabled;
	});
}

async function initOrder() {
	renderCart();

	if (!authMessage) {
		return;
	}

	const user = await onAuthReady();
	if (!user) {
		authMessage.innerHTML = "Only registered users can place orders. Please log in to continue.";
		setFormEnabled(false);
		return;
	}

	authMessage.textContent = `Logged in as ${user.email || "user"}. You can place an order.`;
	setFormEnabled(true);
}

initOrder();

if (backButton) {
	backButton.addEventListener("click", () => {
		if (window.history.length > 1) {
			window.history.back();
			return;
		}

		window.location.href = "index.html";
	});
}
