/* ==========================================================================
   MENSIFY — app.js
   Shared across every page: header/footer injection, mobile nav, nav badge
   counts, toast notifications, currency + star helpers, product card markup,
   newsletter signup. Loaded after storage.js + data.js on every page.
   ========================================================================== */

const PESO = (n) => '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* Global image fallback: every product photo gets a second real-photo attempt
   (a different free photo service, same seed) before dropping back to the
   gradient + glyph placeholder. Ensures every product card always shows SOME
   picture even if the primary photo source is briefly unavailable. */
function handleImgError(img){
  // Do not replace a failed product photo with a random, unrelated image.
  img.dataset.fallbackTried = '1';
  img.style.display = 'none';
  if (img.parentElement) img.parentElement.classList.add('image-unavailable');
}

function starString(rating){
  const full = Math.round(rating);
  return '★★★★★'.slice(0,full) + '☆☆☆☆☆'.slice(0, 5-full);
}

function finalPrice(p){
  return p.discount ? +(p.price * (1 - p.discount/100)).toFixed(2) : p.price;
}

function toast(message, type='default'){
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap){
    wrap = document.createElement('div');
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = message;
  wrap.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition='opacity .3s ease'; setTimeout(()=>el.remove(), 320); }, 2600);
}

/* ---------------- Header / Footer ---------------- */
const NAV_LINKS = [
  { href:'index.html', label:'Home' },
  { href:'shop.html', label:'Shop' },
  { href:'shop.html', label:'Categories' },
  { href:'about.html', label:'About' },
  { href:'contact.html', label:'Contact' }
];

function renderHeader(active=''){
  const mount = document.getElementById('site-header');
  if (!mount) return;
  const user = DB.getCurrentUser();
  mount.innerHTML = `
    <div class="marquee-strip">
      <div class="marquee-track">
        <span>Free shipping on orders over ₱1,500</span><span>New drop — Autumn/Winter collection</span><span>30-day easy returns</span><span>Use code WELCOME15 for 15% off</span>
        <span>Free shipping on orders over ₱1,500</span><span>New drop — Autumn/Winter collection</span><span>30-day easy returns</span><span>Use code WELCOME15 for 15% off</span>
      </div>
    </div>
    <header class="site-header">
      <div class="container nav-wrap">
        <a href="index.html" class="logo">MENSIFY<em>.</em><small>THE MEN'S COLLECTION</small></a>
        <nav class="nav-links">
          <a href="index.html" class="${active==='home'?'active':''}">Home</a>
          <a href="shop.html" class="${active==='shop'?'active':''}">Shop</a>
          <a href="shop.html#categories" class="${active==='categories'?'active':''}">Categories</a>
          <a href="about.html" class="${active==='about'?'active':''}">About</a>
          <a href="contact.html" class="${active==='contact'?'active':''}">Contact</a>
        </nav>
        <div class="nav-actions">
          <form class="nav-search" id="navSearchForm" role="search">
            <input type="text" id="navSearchInput" placeholder="Search products…" autocomplete="off">
            <button type="submit" aria-label="Search">🔍</button>
          </form>
          <a href="${user ? 'profile.html' : 'login.html'}" class="icon-btn" title="${user ? 'My Account' : 'Login'}">👤</a>
          <a href="wishlist.html" class="icon-btn" title="Wishlist">♡<span class="count-pill" id="wishlistCount">0</span></a>
          <a href="cart.html" class="icon-btn" title="Cart">🛍️<span class="count-pill" id="cartCount">0</span></a>
          <button class="hamburger" id="hamburgerBtn" aria-label="Menu">☰</button>
        </div>
      </div>
    </header>
    <div class="mobile-nav" id="mobileNav">
      <button class="mobile-nav-close" id="mobileNavClose">✕</button>
      <a href="index.html">Home</a>
      <a href="shop.html">Shop</a>
      <a href="wishlist.html">Wishlist</a>
      <a href="cart.html">Cart</a>
      <a href="orders.html">Orders</a>
      <a href="about.html">About</a>
      <a href="contact.html">Contact</a>
      <a href="${user ? 'profile.html' : 'login.html'}">${user ? 'My Account' : 'Login'}</a>
    </div>
  `;

  const hb = document.getElementById('hamburgerBtn');
  const mn = document.getElementById('mobileNav');
  hb && hb.addEventListener('click', () => mn.classList.add('open'));
  document.getElementById('mobileNavClose').addEventListener('click', () => mn.classList.remove('open'));

  const searchForm = document.getElementById('navSearchForm');
  searchForm.addEventListener('submit', e => {
    e.preventDefault();
    const q = document.getElementById('navSearchInput').value.trim();
    window.location.href = 'shop.html?q=' + encodeURIComponent(q);
  });

  updateNavCounts();
}

function updateNavCounts(){
  const cartEl = document.getElementById('cartCount');
  const wishEl = document.getElementById('wishlistCount');
  if (cartEl){
    const cart = DB.getCart();
    cartEl.textContent = cart.reduce((s,i)=>s+i.qty,0);
  }
  if (wishEl){
    wishEl.textContent = DB.getWishlist().length;
  }
}

function renderFooter(){
  const mount = document.getElementById('site-footer');
  if (!mount) return;
  mount.innerHTML = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <div class="footer-logo">MENSIFY.</div>
            <p>Premium menswear for the modern man — built on clean design, honest fabrics and a fit that works every day.</p>
            <div class="footer-social">
              <a href="#" aria-label="Instagram">IG</a>
              <a href="#" aria-label="Facebook">FB</a>
              <a href="#" aria-label="X">X</a>
              <a href="#" aria-label="TikTok">TT</a>
            </div>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              <li><a href="shop.html">New Arrivals</a></li>
              <li><a href="shop.html">Best Sellers</a></li>
              <li><a href="shop.html">Special Offers</a></li>
              <li><a href="shop.html">All Products</a></li>
            </ul>
          </div>
          <div>
            <h4>Account</h4>
            <ul>
              <li><a href="login.html">Login</a></li>
              <li><a href="signup.html">Create Account</a></li>
              <li><a href="orders.html">Track Order</a></li>
              <li><a href="wishlist.html">Wishlist</a></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><a href="about.html">About Us</a></li>
              <li><a href="contact.html">Contact</a></li>
              <li><a href="contact.html">Support</a></li>
              <li><a href="admin.html">Admin</a></li>
            </ul>
          </div>
          <div>
            <h4>Newsletter</h4>
            <p>Subscribe for early access to new drops and member-only offers.</p>
            <form class="field" id="footerNewsletterForm" style="margin-top:14px;display:flex;gap:8px;">
              <input type="email" required placeholder="Your email" style="flex:1;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.06);color:#fff;padding:11px 16px;font-size:12.5px;">
              <button class="btn btn-gold btn-sm" type="submit">Join</button>
            </form>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} MENSIFY. All rights reserved.</span>
          <span>Crafted with care · Front-end only demo build</span>
        </div>
      </div>
    </footer>
  `;
  const nf = document.getElementById('footerNewsletterForm');
  nf && nf.addEventListener('submit', e => {
    e.preventDefault();
    const input = nf.querySelector('input');
    DB.addNewsletterEmail(input.value.trim());
    toast('Subscribed! Welcome to the list.', 'success');
    nf.reset();
  });
}

/* ---------------- Product card markup (shared by home/shop/wishlist/related) ---------------- */
function productCardHTML(p){
  const fp = finalPrice(p);
  const wished = DB.getWishlist().includes(p.id);
  const badges = [];
  if (p.tags.includes('new')) badges.push('<span class="pbadge pbadge-new">New</span>');
  if (p.discount) badges.push(`<span class="pbadge pbadge-sale">-${p.discount}%</span>`);
  if (p.tags.includes('bestseller')) badges.push('<span class="pbadge pbadge-best">Bestseller</span>');
  if (p.stock === 0) badges.push('<span class="pbadge pbadge-out">Out of Stock</span>');
  return `
  <div class="product-card" data-id="${p.id}">
    <a href="product.html?id=${p.id}" class="product-thumb ${p.thumbClass}">
      <div class="product-badges">${badges.join('')}</div>
      <span class="glyph">${p.glyph}</span>
      <img class="prod-img" src="${p.images[0]}" alt="${p.name}" loading="lazy" onerror="handleImgError(this)">
      <span class="product-thumb-label">${p.categoryName}</span>
    </a>
    <div class="product-quick">
      <button class="wish-btn ${wished?'active':''}" data-id="${p.id}" title="Add to Wishlist">${wished ? '♥' : '♡'}</button>
      <button class="view-btn" title="Quick View" onclick="window.location.href='product.html?id=${p.id}'">👁</button>
    </div>
    <div class="product-body">
      <span class="product-brand">${p.brand}</span>
      <div class="product-name"><a href="product.html?id=${p.id}">${p.name}</a></div>
      <div class="product-rating"><span class="stars">${starString(p.rating)}</span> ${p.rating} (${p.reviewsCount})</div>
      <div class="product-price-row">
        <span class="price-now">${PESO(fp)}</span>
        ${p.discount ? `<span class="price-old">${PESO(p.price)}</span><span class="price-off">-${p.discount}%</span>` : ''}
      </div>
      ${p.stock>0 && p.stock<=5 ? `<span class="stock-low">Only ${p.stock} left</span>` : ''}
      <div class="product-actions">
        <button class="btn btn-dark add-cart-btn" data-id="${p.id}" ${p.stock===0?'disabled':''}>${p.stock===0?'Sold Out':'Add to Cart'}</button>
      </div>
    </div>
  </div>`;
}

function bindProductCardEvents(container){
  container.querySelectorAll('.wish-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      if (!DB.getCurrentUser()){ toast('Please login to use your wishlist.'); window.location.href='login.html'; return; }
      const on = DB.toggleWishlist(btn.dataset.id);
      btn.classList.toggle('active', on);
      btn.textContent = on ? '♥' : '♡';
      updateNavCounts();
      toast(on ? 'Added to wishlist' : 'Removed from wishlist', 'success');
    });
  });
  container.querySelectorAll('.add-cart-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const p = DB.getProduct(btn.dataset.id);
      if (!p || p.stock === 0) return;
      DB.addToCart(p.id, p.sizes[0], p.colors[0], 1);
      updateNavCounts();
      toast(`${p.name} added to cart`, 'success');
    });
  });
}

/* ---------------- Auth guard helper ---------------- */
function requireLogin(redirectMsg){
  if (!DB.getCurrentUser()){
    toast(redirectMsg || 'Please login to continue.');
    setTimeout(()=> window.location.href = 'login.html?next=' + encodeURIComponent(window.location.pathname + window.location.search), 700);
    return false;
  }
  return true;
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeader(document.body.dataset.page || '');
  renderFooter();
});
