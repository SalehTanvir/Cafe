import { onAuthReady } from "./auth.js";
import { db } from "./firebase-config.js";
import { 
  collection, 
  addDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getCart, updateCartItemQuantity, clearCart, subscribeToCart } from "./cart-firestore.js";

const cartItems = document.getElementById("cart-items");
const cartMessage = document.getElementById("cart-message");
const cartTotal = document.getElementById("cart-total");
const authMessage = document.getElementById("auth-message");
const orderForm = document.getElementById("orderForm");
const backButton = document.getElementById("backButton");
let cartUnsubscribe = null;

function formatPrice(value) {
	const amount = Number(value) || 0;
	return `৳ ${amount.toFixed(2)}`;
}

async function updateQuantity(itemId, delta) {
	await updateCartItemQuantity(itemId, delta);
}

async function renderCart(cart = null) {
	if (!cartItems || !cartMessage) {
		return;
	}

	if (!cart) {
		cart = await getCart();
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
	await renderCart();

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
	
	// Subscribe to real-time cart updates
	cartUnsubscribe = subscribeToCart((cart) => {
		renderCart(cart);
	});
}

initOrder();

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
	if (cartUnsubscribe) {
		cartUnsubscribe();
	}
});

if (backButton) {
	backButton.addEventListener("click", () => {
		if (window.history.length > 1) {
			window.history.back();
			return;
		}

		window.location.href = "index.html";
	});
}

if (orderForm) {
	orderForm.addEventListener("submit", async (event) => {
		event.preventDefault();

		const user = await onAuthReady();
		if (!user) {
			alert("You must be logged in to place an order.");
			return;
		}

		const cart = await getCart();
		if (!cart.length) {
			alert("Your cart is empty. Please add items first.");
			return;
		}

		const name = document.getElementById("name").value.trim();
		if (!name) {
			alert("Please enter your name.");
			return;
		}

		try {
			// Calculate total
			let totalAmount = 0;
			cart.forEach(item => {
				const quantity = Number(item.quantity) || 0;
				const price = Number(item.price) || 0;
				totalAmount += quantity * price;
			});

			// Save order to Firestore
			await addDoc(collection(db, "orders"), {
				userId: user.uid,
				userEmail: user.email,
				customerName: name,
				items: cart,
				totalAmount: totalAmount,
				status: "pending",
				createdAt: new Date()
			});

			// Clear cart from Firestore
			await clearCart();
			
			alert("Order placed successfully! Thank you for your order.");
			window.location.href = "index.html";
		} catch (error) {
			console.error("Order error:", error);
			alert("Failed to place order. Please try again.");
		}
	});
}