import { db, auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Fallback to localStorage for non-authenticated users
const CART_KEY = "cafeCart";
let currentUser = null;
let cartListeners = [];

// Initialize auth state tracking
onAuthStateChanged(auth, (user) => {
  const wasLoggedIn = !!currentUser;
  currentUser = user;
  
  // If user just logged in, migrate localStorage cart to Firestore
  if (user && !wasLoggedIn) {
    migrateLocalCartToFirestore();
  }
  
  // If user logged out, keep localStorage cart
  if (!user && wasLoggedIn) {
    notifyCartListeners();
  }
});

// Get cart from appropriate storage
export async function getCart() {
  if (currentUser) {
    try {
      const cartDoc = await getDoc(doc(db, "carts", currentUser.uid));
      if (cartDoc.exists()) {
        return cartDoc.data().items || [];
      }
      return [];
    } catch (error) {
      console.error("Error loading cart from Firestore:", error);
      return getLocalCart();
    }
  } else {
    return getLocalCart();
  }
}

// Save cart to appropriate storage
export async function saveCart(cart) {
  if (currentUser) {
    try {
      await setDoc(doc(db, "carts", currentUser.uid), {
        items: cart,
        updatedAt: new Date()
      });
      notifyCartListeners(cart);
    } catch (error) {
      console.error("Error saving cart to Firestore:", error);
      saveLocalCart(cart);
    }
  } else {
    saveLocalCart(cart);
  }
}

// Clear cart from storage
export async function clearCart() {
  if (currentUser) {
    try {
      await deleteDoc(doc(db, "carts", currentUser.uid));
      notifyCartListeners([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  } else {
    localStorage.removeItem(CART_KEY);
    notifyCartListeners([]);
  }
}

// Add item to cart
export async function addToCart(item) {
  const cart = await getCart();
  const existing = cart.find(entry => entry.id === item.id);
  
  if (existing) {
    existing.quantity = (Number(existing.quantity) || 0) + 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  
  await saveCart(cart);
  return cart;
}

// Update item quantity in cart
export async function updateCartItemQuantity(itemId, delta) {
  const cart = await getCart();
  const item = cart.find(entry => entry.id === itemId);
  
  if (!item) {
    return cart;
  }
  
  item.quantity = (Number(item.quantity) || 0) + delta;
  
  if (item.quantity <= 0) {
    const index = cart.indexOf(item);
    cart.splice(index, 1);
  }
  
  await saveCart(cart);
  return cart;
}

// Listen to cart changes (real-time for Firestore)
export function subscribeToCart(callback) {
  cartListeners.push(callback);
  
  // If logged in, set up Firestore listener
  if (currentUser) {
    const unsubscribe = onSnapshot(
      doc(db, "carts", currentUser.uid),
      (snapshot) => {
        const cart = snapshot.exists() ? snapshot.data().items || [] : [];
        callback(cart);
      },
      (error) => {
        console.error("Cart subscription error:", error);
      }
    );
    
    return unsubscribe;
  } else {
    // For non-authenticated users, listen to localStorage changes
    const handler = (event) => {
      if (event.key === CART_KEY) {
        callback(getLocalCart());
      }
    };
    window.addEventListener("storage", handler);
    
    return () => window.removeEventListener("storage", handler);
  }
}

// Unsubscribe from cart changes
export function unsubscribeFromCart(callback) {
  cartListeners = cartListeners.filter(cb => cb !== callback);
}

// Helper: Get cart from localStorage
function getLocalCart() {
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
}

// Helper: Save cart to localStorage
function saveLocalCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  notifyCartListeners(cart);
}

// Helper: Notify all listeners of cart changes
function notifyCartListeners(cart = null) {
  if (!cart) {
    getCart().then(c => {
      cartListeners.forEach(callback => callback(c));
    });
  } else {
    cartListeners.forEach(callback => callback(cart));
  }
}

// Helper: Migrate localStorage cart to Firestore when user logs in
async function migrateLocalCartToFirestore() {
  const localCart = getLocalCart();
  if (localCart.length > 0 && currentUser) {
    try {
      await saveCart(localCart);
      localStorage.removeItem(CART_KEY);
    } catch (error) {
      console.error("Error migrating cart:", error);
    }
  }
}
