/* ==========================================================================
   MENSIFY — cart.js  (cart.html only)
   ========================================================================== */

let appliedCoupon = { code:'', pct:0 };

document.addEventListener('DOMContentLoaded', () => {
  render();

  document.getElementById('applyCouponBtn').addEventListener('click', () => {
    const code = document.getElementById('couponInput').value.trim();
    const pct = DB.validateCoupon(code);
    if (pct > 0){
      appliedCoupon = { code: code.toUpperCase(), pct };
      toast(`Coupon applied: ${pct}% off`, 'success');
    } else {
      appliedCoupon = { code:'', pct:0 };
      toast('Invalid coupon code', 'error');
    }
    render();
  });

  document.getElementById('checkoutBtn').addEventListener('click', () => {
    if (!requireLogin('Please login to checkout.')) return;
    sessionStorage.setItem('mensify_coupon', JSON.stringify(appliedCoupon));
    window.location.href = 'checkout.html';
  });
});

function render(){
  const cart = DB.getCart();
  const products = DB.getProducts();
  const empty = document.getElementById('cartEmpty');
  const content = document.getElementById('cartContent');

  if (!cart.length){
    empty.style.display = 'block';
    content.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  content.style.display = 'grid';

  const itemsWrap = document.getElementById('cartItems');
  let subtotal = 0;
  itemsWrap.innerHTML = cart.map((item, idx) => {
    const p = products.find(pp => pp.id === item.productId);
    if (!p) return '';
    const fp = finalPrice(p);
    subtotal += fp * item.qty;
    return `
    <div class="cart-row">
      <div class="cart-thumb ${p.thumbClass}"><span class="glyph">${p.glyph}</span><img class="prod-img" src="${p.images[0]}" alt="${p.name}" loading="lazy" onerror="handleImgError(this)"></div>
      <div>
        <div class="cart-item-name">${p.name}</div>
        <div class="cart-item-meta">${p.brand} · Size ${item.size} · ${item.color}</div>
        <div class="cart-item-meta" style="margin-top:4px;">${PESO(fp)} each</div>
      </div>
      <div class="qty-selector" style="margin:0;">
        <button data-act="minus" data-idx="${idx}">−</button>
        <span>${item.qty}</span>
        <button data-act="plus" data-idx="${idx}">+</button>
      </div>
      <div class="mono" style="font-weight:700;">${PESO(fp * item.qty)}</div>
      <button class="cart-remove" data-idx="${idx}" title="Remove">✕</button>
    </div>`;
  }).join('');

  itemsWrap.querySelectorAll('[data-act]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = +btn.dataset.idx;
      const item = cart[idx];
      const delta = btn.dataset.act === 'plus' ? 1 : -1;
      DB.updateCartQty(idx, item.qty + delta);
      updateNavCounts();
      render();
    });
  });
  itemsWrap.querySelectorAll('.cart-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      DB.removeFromCart(+btn.dataset.idx);
      updateNavCounts();
      toast('Item removed', 'success');
      render();
    });
  });

  const shipping = subtotal >= 1500 || subtotal === 0 ? 0 : 5;
  const tax = subtotal * 0.12;
  const couponDiscount = subtotal * (appliedCoupon.pct/100);
  const total = subtotal + shipping + tax - couponDiscount;

  document.getElementById('sumSubtotal').textContent = PESO(subtotal);
  document.getElementById('sumShipping').textContent = shipping === 0 ? 'Free' : PESO(shipping);
  document.getElementById('sumTax').textContent = PESO(tax);
  document.getElementById('sumTotal').textContent = PESO(total);
  const couponRow = document.getElementById('sumCouponRow');
  if (appliedCoupon.pct > 0){
    couponRow.style.display = 'flex';
    document.getElementById('sumCoupon').textContent = '-' + PESO(couponDiscount);
  } else {
    couponRow.style.display = 'none';
  }

  sessionStorage.setItem('mensify_totals', JSON.stringify({ subtotal, shipping, tax, couponDiscount, total, coupon: appliedCoupon }));
}
