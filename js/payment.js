/* ========================================================================
   MENSIFY — payment.js
   Existing payment page preserved. Maya is the only payment method that
   leaves the site for the real Maya-hosted Sandbox Checkout.
   ======================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const pendingRaw = sessionStorage.getItem('mensify_pending_order');
  if (!pendingRaw){
    window.location.href = 'shop.html';
    return;
  }

  const pending = JSON.parse(pendingRaw);
  const mayaState = new URLSearchParams(window.location.search).get('maya');

  // Maya returns to this same existing payment page. Verify the result before
  // creating the MENSIFY order. This prevents the old simulated 2-second payment.
  if (pending.paymentMethod === 'Maya') {
    if (mayaState === 'failure' || mayaState === 'cancel') {
      showMayaResult(mayaState === 'cancel' ? 'Payment Cancelled' : 'Payment Failed',
        mayaState === 'cancel' ? 'You cancelled the Maya payment. Your cart is still available.' : 'Maya could not complete the payment. Your cart is still available.');
      return;
    }

    if (mayaState === 'success') {
      const checkoutId = sessionStorage.getItem('mensify_maya_checkout_id');
      if (!checkoutId) {
        showMayaResult('Payment Verification Required', 'MENSIFY could not find the Maya checkout reference. No order was created.');
        return;
      }

      try {
        const response = await fetch(`/api/maya/status/${encodeURIComponent(checkoutId)}`);
        const status = await response.json();
        const paymentStatus = String(status.paymentStatus || status.status || '').toUpperCase();
        if (!response.ok || !['PAYMENT_SUCCESS', 'SUCCESS', 'COMPLETED', 'AUTHORIZED'].includes(paymentStatus)) {
          showMayaResult('Payment Not Confirmed', `Maya returned: ${paymentStatus || 'UNKNOWN'}. No order was created until payment is confirmed.`);
          return;
        }
        finalizeOrder('Maya');
      } catch (err) {
        showMayaResult('Payment Verification Failed', 'MENSIFY could not verify the Maya transaction. Please check your Maya Sandbox result and try again.');
      }
      return;
    }

    // First visit: create the Maya checkout on the server, then redirect to Maya.
    try {
      document.getElementById('processingView').querySelector('h2').textContent = 'Connecting to Maya…';
      const response = await fetch('/api/maya/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pending)
      });
      const data = await response.json();
      if (!response.ok || !data.redirectUrl) {
        throw new Error(data.error || 'Maya did not return a checkout URL.');
      }
      sessionStorage.setItem('mensify_maya_checkout_id', data.checkoutId || '');
      sessionStorage.setItem('mensify_maya_reference', data.requestReferenceNumber || '');
      window.location.href = data.redirectUrl;
    } catch (err) {
      showMayaResult('Maya Connection Error', err.message || 'Unable to start Maya Checkout. Make sure MENSIFY is running through npm start.');
    }
    return;
  }

  // Preserve the existing simulated flow for non-Maya payment methods.
  setTimeout(() => finalizeOrder(pending.paymentMethod), 2000);

  function finalizeOrder(method) {
    const order = DB.createOrder({ ...pending, paymentMethod: method });
    DB.clearCart();
    updateNavCounts();
    sessionStorage.removeItem('mensify_pending_order');
    sessionStorage.removeItem('mensify_coupon');
    sessionStorage.removeItem('mensify_totals');
    sessionStorage.removeItem('mensify_maya_checkout_id');
    sessionStorage.removeItem('mensify_maya_reference');
    renderSuccess(order);
  }

  function showMayaResult(title, message) {
    document.getElementById('processingView').style.display = 'none';
    const successView = document.getElementById('successView');
    successView.style.display = 'block';
    successView.querySelector('h1').textContent = title;
    const card = document.getElementById('receiptCard');
    card.innerHTML = `<div class="text-center"><p class="muted" style="line-height:1.7;">${message}</p><a class="btn btn-primary" href="checkout.html">Return to Checkout</a></div>`;
  }

  function renderSuccess(order){
    document.getElementById('processingView').style.display = 'none';
    const successView = document.getElementById('successView');
    successView.style.display = 'block';

    const dateStr = new Date(order.date).toLocaleString('en-US', { dateStyle:'medium', timeStyle:'short' });
    const itemsHtml = order.items.map(it => `
      <div class="receipt-row"><span>${it.name} (${it.size}, ${it.color}) ×${it.qty}</span><b>${PESO(it.price * it.qty)}</b></div>
    `).join('');

    document.getElementById('receiptCard').innerHTML = `
      <div class="text-center" style="margin-bottom:18px;">
        <span class="eyebrow" style="justify-content:center;">Order Confirmation</span>
        <h3 class="h-display" style="font-size:28px;margin:6px 0 0;">#${order.id}</h3>
      </div>
      <div class="receipt-row"><span>Date</span><b>${dateStr}</b></div>
      <div class="receipt-row"><span>Customer</span><b>${order.customer.fullName}</b></div>
      <div class="receipt-row"><span>Delivery Address</span><b>${order.customer.address}, ${order.customer.city}</b></div>
      <div class="receipt-row"><span>Payment Method</span><b>${order.paymentMethod}</b></div>
      <div class="receipt-row"><span>Shipping</span><b>${order.shippingMethod === 'express' ? 'Express (1-2 days)' : 'Standard (3-5 days)'}</b></div>
      <div class="divider" style="margin:16px 0;"></div>
      ${itemsHtml}
      <div class="divider" style="margin:16px 0;"></div>
      <div class="receipt-row"><span>Subtotal</span><b>${PESO(order.totals.subtotal)}</b></div>
      <div class="receipt-row"><span>Shipping Fee</span><b>${order.totals.shipping === 0 ? 'Free' : PESO(order.totals.shipping)}</b></div>
      <div class="receipt-row"><span>Tax</span><b>${PESO(order.totals.tax)}</b></div>
      ${order.totals.couponDiscount ? `<div class="receipt-row"><span>Discount</span><b>-${PESO(order.totals.couponDiscount)}</b></div>` : ''}
      <div class="receipt-row" style="border-bottom:none;font-size:16px;padding-top:14px;"><span><b>Total Paid</b></span><b>${PESO(order.totals.total)}</b></div>
    `;

    document.getElementById('downloadReceiptBtn').addEventListener('click', () => {
      const text = `MENSIFY — ORDER RECEIPT\nOrder ID: ${order.id}\nDate: ${dateStr}\nCustomer: ${order.customer.fullName}\nEmail: ${order.customer.email}\nPhone: ${order.customer.phone}\nAddress: ${order.customer.address}, ${order.customer.city}, ${order.customer.province} ${order.customer.zip}\nPayment Method: ${order.paymentMethod}\nShipping Method: ${order.shippingMethod}\n\nItems:\n${order.items.map(it => `- ${it.name} (${it.size}, ${it.color}) x${it.qty} — ${PESO(it.price*it.qty)}`).join('\n')}\n\nSubtotal: ${PESO(order.totals.subtotal)}\nShipping: ${order.totals.shipping === 0 ? 'Free' : PESO(order.totals.shipping)}\nTax: ${PESO(order.totals.tax)}\n${order.totals.couponDiscount ? 'Discount: -' + PESO(order.totals.couponDiscount) + '\n' : ''}Total Paid: ${PESO(order.totals.total)}\n\nThank you for shopping with MENSIFY.`;
      const blob = new Blob([text], { type:'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `MENSIFY-Receipt-${order.id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
});
