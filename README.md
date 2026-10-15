# MENSIFY — The Men's Collection

A fully client-side e-commerce storefront for menswear, built with plain **HTML5, CSS3, and vanilla JavaScript**. There is no backend, no database, and no external API — every account, cart, order, and product record is generated in JavaScript and persisted in the browser's **LocalStorage**.

---

## Getting Started

No build step, no server required.

1. Unzip the project.
2. Open `index.html` directly in any modern browser (Chrome, Edge, Firefox, Safari).
3. Browse, sign up, shop, and check out — everything is saved locally in that browser.

> Tip: some browsers restrict LocalStorage on `file://` pages. If products, cart, or login don't seem to save, serve the folder with a simple local server instead, e.g.:
> ```
> python3 -m http.server 8000
> ```
> then visit `http://localhost:8000/index.html`.

---

## Site Map

| Page | File |
|---|---|
| Home | `index.html` |
| Shop (filter/search/sort) | `shop.html` |
| Product Detail | `product.html?id=...` |
| Cart | `cart.html` |
| Checkout | `checkout.html` |
| Payment / Receipt | `payment.html` |
| Orders | `orders.html` |
| Wishlist | `wishlist.html` |
| Login / Sign Up | `login.html`, `signup.html` |
| Profile | `profile.html` |
| About / Contact | `about.html`, `contact.html` |
| **Admin Dashboard** | `admin.html` |

---

## Accessing the Admin Dashboard

The admin dashboard is a separate, hidden area for managing products, orders, and customers — it's not linked in the main site navigation.

**How to get there:**
1. Open `admin.html` directly (type the URL/filename in your browser, e.g. `http://localhost:8000/admin.html`).
2. Log in with the demo admin credentials:

   ```
   Username: admin
   Password: admin123
   ```

**What you can do once logged in:**
- View store overview: total products, total orders, pending/completed/rejected orders, and total revenue.
- Add, edit, and delete products (name, category, price, discount, stock, sizes, colors, images, tags, SKU).
- Update order statuses (Incoming → Preparing → Shipped → Delivered / Completed / Rejected / Cancelled).
- View and manage the customer list.

All admin changes are written straight to LocalStorage and immediately reflected across the customer-facing site (e.g. edit a product's stock in Admin and it updates instantly in Shop).

**Logging out:** use the Logout button inside the admin dashboard, or simply close the tab — the admin session is separate from customer login sessions.

**Resetting demo data:** since everything lives in LocalStorage, you can wipe all products/orders/accounts/admin data back to the seeded defaults by clearing site data for the page (DevTools → Application → Local Storage → clear), or by opening the browser console and running `localStorage.clear()` then refreshing.

---

## Tech Notes

- **Stack:** HTML, CSS, Vanilla JavaScript, LocalStorage (no frameworks, no backend).
- **Data layer:** `js/storage.js` — centralized `DB` object handling all reads/writes to LocalStorage (users, products, cart, wishlist, orders).
- **Shared UI logic:** `js/app.js` — header/footer injection, nav badges, toasts, shared product card markup, global event binding.
- **Product data:** `js/data.js` — 14 categories, 60+ generated products, review generator, and product photo lookup (real photos pulled by category/name via LoremFlickr, with a gradient + glyph fallback if a photo fails to load).
- **Fonts:** Bebas Neue, Inter, IBM Plex Mono (Google Fonts).
- **Brand colors:** Ink Black `#111111`, Paper White `#FFFFFF`, Gold `#D4AF37`, Blue `#1E88E5`.

---

## Disclaimer

This is a front-end demo/portfolio project. Payment processing, shipping, and order fulfillment are all simulated — no real transactions, emails, or external services are involved.


## MySQL and product image improvements
See [README_MYSQL.md](README_MYSQL.md) for the MySQL schema, database setup, product API endpoints, and product image notes. The original LocalStorage workflow is retained for compatibility; the MySQL API is an initial server-side data layer, not a full account/order migration.


## Philippine currency and budget pricing

The storefront uses Philippine pesos (PHP / ₱). Seeded prices are budget-friendly sample prices: tees ₱199–₱399, polos ₱299–₱499, jeans ₱499–₱899, and shoes/sneakers generally below ₱1,500. Standard shipping is ₱99 and free for orders of ₱1,500 or more; express shipping is ₱199. Update product prices in the Admin Dashboard as needed.
