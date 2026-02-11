import { onAuthReady } from "./auth.js";

const CART_KEY = "cafeCart";
const cartItems = document.getElementById("cart-items");
const cartMessage = document.getElementById("cart-message");
const authMessage = document.getElementById("auth-message");
const orderForm = document.getElementById("orderForm");

function getCart() {
	try {
		const stored = localStorage.getItem(CART_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch (error) {
		return [];
	}
}

function renderCart() {
	const cart = getCart();
	if (!cartItems || !cartMessage) {
		return;
	}

	cartItems.innerHTML = "";

	if (!cart.length) {
		cartMessage.textContent = "Your cart is empty. Add items from the home or menu page.";
		return;
	}

	cartMessage.textContent = "";
	cart.forEach(item => {
		const li = document.createElement("li");
		li.textContent = `${item.name} x${item.quantity} - $${item.price}`;
		cartItems.appendChild(li);
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
