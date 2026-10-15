/* ==========================================================================
   MENSIFY — wishlist.js  (wishlist.html only)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (!requireLogin('Please login to view your wishlist.')) return;
  render();
});

function render(){
  const ids = DB.getWishlist();
  const products = DB.getProducts().filter(p => ids.includes(p.id));
  const grid = document.getElementById('wishlistGrid');
  const empty = document.getElementById('wishlistEmpty');

  if (!products.length){
    empty.style.display = 'block';
    grid.innerHTML = '';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = products.map(p => {
    const fp = finalPrice(p);
    return `
    <div class="product-card" data-id="${p.id}">
      <a href="product.html?id=${p.id}" class="product-thumb ${p.thumbClass}">
        <span class="glyph">${p.glyph}</span>
        <img class="prod-img" src="${p.images[0]}" alt="${p.name}" loading="lazy" onerror="handleImgError(this)">
        <span class="product-thumb-label">${p.categoryName}</span>
      </a>
      <div class="product-body">
        <span class="product-brand">${p.brand}</span>
        <div class="product-name"><a href="product.html?id=${p.id}">${p.name}</a></div>
        <div class="product-price-row"><span class="price-now">${PESO(fp)}</span></div>
        <div class="product-actions">
          <button class="btn btn-dark move-to-cart-btn" data-id="${p.id}">Move to Cart</button>
          <button class="btn-icon remove-wish-btn" data-id="${p.id}" title="Remove">✕</button>
        </div>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.move-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = DB.getProduct(btn.dataset.id);
      DB.addToCart(p.id, p.sizes[0], p.colors[0], 1);
      DB.toggleWishlist(p.id);
      updateNavCounts();
      toast(`${p.name} moved to cart`, 'success');
      render();
    });
  });
  grid.querySelectorAll('.remove-wish-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      DB.toggleWishlist(btn.dataset.id);
      updateNavCounts();
      toast('Removed from wishlist', 'success');
      render();
    });
  });
}
