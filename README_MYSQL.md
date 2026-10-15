# MENSIFY — MySQL setup and improvements

## What changed
- Added a MySQL schema for products, customers, orders, order items, and contact messages.
- Added `/api/products` (list), `/api/products/:id` (detail), `POST /api/products` (insert/update), and `DELETE /api/products/:id` endpoints to the Express server.
- Added `/api/health` MySQL connection status.
- Replaced random LoremFlickr/Picsum image substitutions with stable category-matched image CDN assets. If an image fails, the page no longer substitutes a random unrelated photo.
- Kept the existing Maya Sandbox checkout route and storefront pages.

## Setup
1. Install Node.js 18+ and MySQL 8+.
2. Open MySQL Workbench or a MySQL terminal and import `database/schema.sql`.
3. Copy `.env.example` to `.env` and fill in your local MySQL settings. Keep your Maya key in the same `.env`; never publish it.
4. Install dependencies and start the app:
   ```bash
   npm install
   npm start
   ```
5. Open `http://localhost:3000`.
6. Check `http://localhost:3000/api/health` for `mysql: "connected"`.

## Product API examples
- `GET http://localhost:3000/api/products`
- `GET http://localhost:3000/api/products/<id>`
- `POST http://localhost:3000/api/products` with JSON body, e.g.:
  ```json
  {
    "id":"M-TEE-001", "name":"Essential Tee", "brand":"Mensify",
    "category":"tshirts", "categoryName":"T-Shirts", "description":"Plain cotton crew-neck T-shirt",
    "price":499, "discount":0, "stock":20, "image":"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85",
    "images":[], "sizes":["S","M","L","XL"], "colors":["Black","White"], "tags":["featured"]
  }
  ```
- `DELETE http://localhost:3000/api/products/M-TEE-001`

## Important note
The original storefront's cart, customer session, wishlist, and current UI product cache still use browser LocalStorage for compatibility. The new MySQL schema and product API are server-side and ready for integration; this is not yet a complete migration of every checkout/account flow to MySQL. Maya credentials and payment verification should remain server-side, and this sandbox project is not production-hardened.

## Product photos
Images use fixed Unsplash CDN asset IDs grouped by product category, so the image is stable and broadly matches the product type. Before a real store launch, replace demo photos with your own licensed product photography and save each product's exact image URL in MySQL.
