/* ==========================================================================
   MENSIFY — checkout.js  (checkout.html only)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (!requireLogin('Please login to checkout.')) return;

  const cart = DB.getCart();
  const products = DB.getProducts();
  const form = document.getElementById('checkoutForm');

  if (!cart.length){
    document.getElementById('checkoutEmpty').style.display = 'block';
    return;
  }
  form.style.display = 'grid';

  const user = DB.getCurrentUser();
  document.getElementById('fullName').value = (user.firstName + ' ' + user.lastName).trim();
  document.getElementById('ckEmail').value = user.email;
  document.getElementById('phone').value = user.phone || '';
  if (user.addresses && user.addresses[0]){
    document.getElementById('address').value = user.addresses[0].street || '';
    document.getElementById('city').value = user.addresses[0].city || '';
    document.getElementById('province').value = user.addresses[0].province || '';
    document.getElementById('zip').value = user.addresses[0].zip || '';
  }

  let shipMethod = 'standard';
  let payMethod = 'COD';
  const coupon = JSON.parse(sessionStorage.getItem('mensify_coupon') || '{"code":"","pct":0}');

  let subtotal = 0;
  const itemsEl = document.getElementById('checkoutItems');
  itemsEl.innerHTML = cart.map(item => {
    const p = products.find(pp => pp.id === item.productId);
    if (!p) return '';
    const fp = finalPrice(p);
    subtotal += fp * item.qty;
    return `<div style="display:flex;justify-content:space-between;font-size:13px;padding:8px 0;border-bottom:1px solid var(--line-soft);">
      <span>${p.name} <span class="muted">×${item.qty}</span><br><span class="muted" style="font-size:11px;">Size ${item.size} · ${item.color}</span></span>
      <span class="mono">${PESO(fp*item.qty)}</span>
    </div>`;
  }).join('');

  function recalc(){
    const shipping = shipMethod === 'express' ? 199 : (subtotal >= 1500 ? 0 : 99);
    const tax = subtotal * 0.12;
    const couponDiscount = subtotal * (coupon.pct/100);
    const total = subtotal + shipping + tax - couponDiscount;
    document.getElementById('coSubtotal').textContent = PESO(subtotal);
    document.getElementById('coShipping').textContent = shipping === 0 ? 'Free' : PESO(shipping);
    document.getElementById('coTax').textContent = PESO(tax);
    document.getElementById('coTotal').textContent = PESO(total);
    const cr = document.getElementById('coCouponRow');
    if (coupon.pct > 0){ cr.style.display='flex'; document.getElementById('coCoupon').textContent = '-' + PESO(couponDiscount); }
    return { subtotal, shipping, tax, couponDiscount, total };
  }
  recalc();
  document.getElementById('stdPrice').textContent = subtotal >= 1500 ? 'Free' : '₱99.00';

  document.querySelectorAll('.ship-option').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.ship-option').forEach(o=>o.classList.remove('active'));
      el.classList.add('active');
      shipMethod = el.dataset.val;
      recalc();
    });
  });
  document.querySelectorAll('.pay-option').forEach(el => {
    el.addEventListener('click', () => {
      document.querySelectorAll('.pay-option').forEach(o=>o.classList.remove('active'));
      el.classList.add('active');
      payMethod = el.dataset.val;
      document.getElementById('cardFields').style.display = (payMethod === 'Credit Card' || payMethod === 'Debit Card') ? 'block' : 'none';
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const required = ['fullName','phone','ckEmail','address','province','city','zip'];
    for (const id of required){
      const el = document.getElementById(id);
      if (!el.value.trim()){ toast('Please complete all shipping fields.', 'error'); el.focus(); return; }
    }
    if ((payMethod === 'Credit Card' || payMethod === 'Debit Card')){
      const num = document.getElementById('cardNumber').value.trim();
      const exp = document.getElementById('cardExpiry').value.trim();
      const cvv = document.getElementById('cardCvv').value.trim();
      if (num.replace(/\s/g,'').length < 12 || !exp || cvv.length < 3){
        toast('Please enter valid card details.', 'error'); return;
      }
    }

    const totals = recalc();
    const pendingOrder = {
      userId: user.id,
      items: cart.map(item => {
        const p = products.find(pp => pp.id === item.productId);
        return { productId: item.productId, name: p.name, brand: p.brand, glyph: p.glyph, image: p.images[0], thumbClass: p.thumbClass, size: item.size, color: item.color, qty: item.qty, price: finalPrice(p) };
      }),
      customer: {
        fullName: document.getElementById('fullName').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('ckEmail').value.trim(),
        address: document.getElementById('address').value.trim(),
        province: document.getElementById('province').value.trim(),
        city: document.getElementById('city').value.trim(),
        zip: document.getElementById('zip').value.trim()
      },
      shippingMethod: shipMethod,
      paymentMethod: payMethod,
      totals
    };
    sessionStorage.setItem('mensify_pending_order', JSON.stringify(pendingOrder));
    window.location.href = 'payment.html';
  });
});
