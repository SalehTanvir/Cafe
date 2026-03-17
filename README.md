# Cafe Aroma

A responsive cafe ordering website with a menu browser, cart, and order flow powered by Firebase.

## Features
- Browse menu items with search and filters
- Add items to a cart and update quantities
- Place orders (requires authentication)
- Firebase Auth, Firestore-backed menu, cart, and orders
- Admin pages for menu and dashboard management

## Pages
- Home: index.html
- Menu: menu.html
- Order: order.html
- Auth: login.html, register.html
- Admin: admin/login.html, admin/dashboard.html, admin/add-menu.html

## Tech Stack
- HTML, CSS, JavaScript (ES modules)
- Firebase Auth and Firestore (CDN SDK)

## Firebase Setup
1. Create a Firebase project and enable Authentication (Email/Password).
2. Create a Firestore database.
3. Update the config in js/firebase-config.js with your project keys.
4. Apply the Firestore security rules in firestore.rules. This is required for deployed admin writes.

### Firestore Rules
- Public users can read menu items.
- Only admin@cafe.com can create, update, or delete menu items.
- Users can only read and write their own carts.
- Users can create and read their own orders; admin can manage all orders.

If you use the Firebase CLI, deploy rules with:

```bash
firebase deploy --only firestore:rules
```

If you do not use the CLI, copy the contents of firestore.rules into Firestore Rules in the Firebase Console and publish them.

### Firestore Collections
- menu: menu items shown on Home and Menu pages
- carts: user carts stored by uid
- orders: submitted orders

## Run Locally
Serve the project with any static server. If you use VS Code, the Live Server extension works well.

## Notes
- Cart data is stored in Firestore when logged in, and in localStorage for guests.
- The cart badge updates automatically via cart subscriptions.
