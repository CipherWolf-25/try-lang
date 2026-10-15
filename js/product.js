/* ==========================================================================
   MENSIFY — product.js  (product.html only)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const product = DB.getProduct(id);
  const container = document.getElementById('pdContainer');

  if (!product){
    container.innerHTML = `<div class="empty-state"><span class="glyph">🚫</span><h3>Product not found</h3><p>The item you're looking for may have been removed.</p><a href="shop.html" class="btn btn-dark">Back to Shop</a></div>`;
    return;
  }

  document.title = product.name + ' — MENSIFY';
  document.getElementById('pdCrumbName').textContent = product.name;

  let state = { size: product.sizes[0], color: product.colors[0], qty: 1, activeImg: 0 };
  const reviews = generateReviews(product);
  const fp = finalPrice(product);
  const wished = DB.getWishlist().includes(product.id);

  container.innerHTML = `
    <div class="pd-grid">
      <div>
        <div class="pd-gallery-main ${product.thumbClass}" id="pdMainImg">
          <span class="glyph">${product.glyph}</span>
          <img class="prod-img" id="pdMainImgTag" src="${product.images[0]}" alt="${product.name}" onerror="handleImgError(this)">
        </div>
        <div class="pd-thumbs" id="pdThumbs">
          ${product.images.map((url,i)=>`<button class="${product.thumbClass} ${i===0?'active':''}" data-i="${i}" data-src="${url}"><span class="glyph">${product.glyph}</span><img class="prod-img" src="${url}" alt="${product.name} view ${i+1}" loading="lazy" onerror="handleImgError(this)"></button>`).join('')}
        </div>
      </div>
      <div>
        <span class="pd-brand">${product.brand} · ${product.categoryName}</span>
        <h1 class="pd-title">${product.name}</h1>
        <div class="pd-rating"><span class="stars">${starString(product.rating)}</span> ${product.rating} · ${product.reviewsCount} reviews · <span class="${product.stock>0?'muted':'stock-low'}">${product.stock>0? product.stock+' in stock' : 'Out of stock'}</span></div>
        <div class="pd-price">
          <span class="price-now">${PESO(fp)}</span>
          ${product.discount ? `<span class="price-old">${PESO(product.price)}</span><span class="tag tag-sale">-${product.discount}% OFF</span>` : ''}
        </div>
        <p class="pd-desc">${product.description}</p>

        <div class="pd-option-label"><span>Color: <b id="colorLabel">${state.color}</b></span></div>
        <div class="swatch-row" id="colorRow">
          ${product.colors.map(c => `<button class="color-dot ${c===state.color?'active':''}" data-color="${c}" title="${c}"><span style="background:${COLOR_SWATCHES[c]||'#ccc'}"></span></button>`).join('')}
        </div>

        <div class="pd-option-label"><span>Size: <b id="sizeLabel">${state.size}</b></span><a href="#" style="font-size:11px;color:var(--blue);">Size Guide</a></div>
        <div class="swatch-row" id="sizeRow">
          ${product.sizes.map(s => `<button class="size-box ${s===state.size?'active':''}" data-size="${s}">${s}</button>`).join('')}
        </div>

        <div class="pd-option-label"><span>Quantity</span></div>
        <div class="qty-selector">
          <button id="qtyMinus">−</button><span id="qtyVal">1</span><button id="qtyPlus">+</button>
        </div>

        <div class="pd-cta-row">
          <button class="btn btn-dark" id="addCartBtn" ${product.stock===0?'disabled':''}>Add to Cart</button>
          <button class="btn btn-primary" id="buyNowBtn" ${product.stock===0?'disabled':''}>Buy Now</button>
          <button class="btn-icon ${wished?'active':''}" id="wishBtn" title="Add to wishlist">${wished?'♥':'♡'}</button>
        </div>

        <div class="pd-meta-list">
          <div><span>SKU</span><b>${product.sku}</b></div>
          <div><span>Category</span><b>${product.categoryName}</b></div>
          <div><span>Brand</span><b>${product.brand}</b></div>
          <div><span>Shipping</span><b>Standard 3–5 days · Express 1–2 days</b></div>
        </div>
      </div>
    </div>

    <div class="pd-tabs">
      <button class="active" data-tab="desc">Description</button>
      <button data-tab="reviews">Reviews (${reviews.length})</button>
      <button data-tab="shipping">Shipping &amp; Returns</button>
    </div>
    <div class="pd-tab-panel active" id="tab-desc">
      <p class="pd-desc">${product.description} Constructed with attention to detail and finished to hold its shape wash after wash. Designed in-house by the ${product.brand} design team for versatile, everyday styling.</p>
    </div>
    <div class="pd-tab-panel" id="tab-reviews">
      ${reviews.map(r => `
        <div class="review-item">
          <div class="review-item-head">
            <div><b>${r.author}</b> <span class="muted" style="font-size:12px;"> · ${r.date}</span></div>
            <span class="stars">${starString(r.rating)}</span>
          </div>
          <p style="margin:0;color:var(--ink-soft);font-size:14px;">${r.text}</p>
        </div>`).join('')}
    </div>
    <div class="pd-tab-panel" id="tab-shipping">
      <p class="pd-desc"><b>Standard Delivery:</b> 3–5 business days, flat rate ₱99.00 (free over ₱1,500).<br>
      <b>Express Delivery:</b> 1–2 business days, flat rate ₱199.00.<br>
      <b>Returns:</b> 30-day easy returns on unworn items with original tags attached.</p>
    </div>

    <div class="section-head" style="margin-top:70px;">
      <div><span class="eyebrow">You Might Also Like</span><h2 class="section-title">Related Products</h2></div>
    </div>
    <div class="product-grid" id="relatedGrid"></div>
  `;

  // Thumbnails
  document.querySelectorAll('#pdThumbs button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#pdThumbs button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const mainImgTag = document.getElementById('pdMainImgTag');
      delete mainImgTag.dataset.fallbackTried;
      mainImgTag.src = btn.dataset.src;
      mainImgTag.style.display = '';
    });
  });

  // Color select
  document.querySelectorAll('#colorRow .color-dot').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#colorRow .color-dot').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      state.color = btn.dataset.color;
      document.getElementById('colorLabel').textContent = state.color;
    });
  });

  // Size select
  document.querySelectorAll('#sizeRow .size-box').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#sizeRow .size-box').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      state.size = btn.dataset.size;
      document.getElementById('sizeLabel').textContent = state.size;
    });
  });

  // Qty
  document.getElementById('qtyMinus').addEventListener('click', () => { state.qty = Math.max(1, state.qty-1); document.getElementById('qtyVal').textContent = state.qty; });
  document.getElementById('qtyPlus').addEventListener('click', () => { state.qty = Math.min(product.stock||10, state.qty+1); document.getElementById('qtyVal').textContent = state.qty; });

  // Add to cart / buy now
  document.getElementById('addCartBtn').addEventListener('click', () => {
    DB.addToCart(product.id, state.size, state.color, state.qty);
    updateNavCounts();
    toast(`${product.name} added to cart`, 'success');
  });
  document.getElementById('buyNowBtn').addEventListener('click', () => {
    DB.addToCart(product.id, state.size, state.color, state.qty);
    updateNavCounts();
    window.location.href = 'checkout.html';
  });

  // Wishlist
  document.getElementById('wishBtn').addEventListener('click', function(){
    if (!DB.getCurrentUser()){ toast('Please login to use your wishlist.'); window.location.href='login.html'; return; }
    const on = DB.toggleWishlist(product.id);
    this.classList.toggle('active', on);
    this.textContent = on ? '♥' : '♡';
    updateNavCounts();
    toast(on ? 'Added to wishlist' : 'Removed from wishlist', 'success');
  });

  // Tabs
  document.querySelectorAll('.pd-tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pd-tabs button').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.pd-tab-panel').forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-'+btn.dataset.tab).classList.add('active');
    });
  });

  // Related products
  const related = DB.getProducts().filter(p => p.category === product.category && p.id !== product.id).slice(0,4);
  const relGrid = document.getElementById('relatedGrid');
  relGrid.innerHTML = related.map(productCardHTML).join('');
  bindProductCardEvents(relGrid);
});
