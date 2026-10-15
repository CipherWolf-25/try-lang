/* ==========================================================================
   MENSIFY — orders.js  (orders.html only)
   ========================================================================== */

const TRACK_FLOW = ['Incoming','Preparing','Shipped','Delivered','Completed'];

document.addEventListener('DOMContentLoaded', () => {
  if (!requireLogin('Please login to view your orders.')) return;

  let activeStatus = '';
  renderOrders();

  document.querySelectorAll('#statusTabs button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#statusTabs button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      activeStatus = btn.dataset.status;
      renderOrders();
    });
  });

  document.getElementById('trackModalClose').addEventListener('click', () => {
    document.getElementById('trackModal').classList.remove('open');
  });

  function renderOrders(){
    const all = DB.getOrdersForCurrentUser();
    const list = activeStatus ? all.filter(o => o.status === activeStatus) : all;
    const listEl = document.getElementById('ordersList');
    const emptyEl = document.getElementById('ordersEmpty');

    if (!list.length){
      listEl.innerHTML = '';
      emptyEl.style.display = 'block';
      emptyEl.querySelector('h3').textContent = activeStatus ? `No ${activeStatus.toLowerCase()} orders` : 'No orders yet';
      return;
    }
    emptyEl.style.display = 'none';

    listEl.innerHTML = list.map(order => {
      const itemsThumbs = order.items.map(it => `<div class="order-thumb ${it.thumbClass||''}" title="${it.name}"><span class="glyph">${it.glyph}</span><img class="prod-img" src="${it.image}" alt="${it.name}" loading="lazy" onerror="handleImgError(this)"></div>`).join('');
      const canCancel = ['Incoming','Preparing'].includes(order.status);
      const canReorder = ['Delivered','Completed','Cancelled','Rejected'].includes(order.status);
      return `
      <div class="order-card">
        <div class="order-card-head">
          <div><div class="order-id">#${order.id}</div><div class="order-date">${new Date(order.date).toLocaleDateString('en-US',{dateStyle:'medium'})} · ${order.items.length} item(s)</div></div>
          <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
        </div>
        <div class="order-items-row">${itemsThumbs}</div>
        <div class="order-card-foot">
          <div class="order-total">${PESO(order.totals.total)} <span class="muted" style="font-weight:400;font-size:12px;">via ${order.paymentMethod}</span></div>
          <div class="order-actions">
            <button class="btn btn-ghost btn-sm view-details-btn" data-id="${order.id}">View Details</button>
            <button class="btn btn-outline btn-sm track-btn" data-id="${order.id}">Track Order</button>
            ${canCancel ? `<button class="btn btn-danger btn-sm cancel-btn" data-id="${order.id}">Cancel</button>` : ''}
            ${canReorder ? `<button class="btn btn-dark btn-sm reorder-btn" data-id="${order.id}">Reorder</button>` : ''}
          </div>
        </div>
      </div>`;
    }).join('');

    listEl.querySelectorAll('.track-btn').forEach(b => b.addEventListener('click', () => openTrack(b.dataset.id)));
    listEl.querySelectorAll('.cancel-btn').forEach(b => b.addEventListener('click', () => cancelOrder(b.dataset.id)));
    listEl.querySelectorAll('.reorder-btn').forEach(b => b.addEventListener('click', () => reorder(b.dataset.id)));
    listEl.querySelectorAll('.view-details-btn').forEach(b => b.addEventListener('click', () => viewDetails(b.dataset.id)));
  }

  function openTrack(orderId){
    const order = DB.getOrders().find(o => o.id === orderId);
    if (!order) return;
    document.getElementById('trackOrderId').textContent = `#${order.id}`;
    const isTerminalBad = ['Rejected','Cancelled'].includes(order.status);
    const currentIdx = TRACK_FLOW.indexOf(order.status);
    document.getElementById('trackSteps').innerHTML = isTerminalBad
      ? `<p class="muted" style="text-align:center;width:100%;">This order was <b>${order.status.toLowerCase()}</b> and is no longer being processed.</p>`
      : TRACK_FLOW.map((step, i) => `
        <div class="track-step ${i <= currentIdx ? 'done' : ''}">
          <div class="track-dot">${i <= currentIdx ? '✓' : i+1}</div>
          <span>${step}</span>
        </div>`).join('');
    document.getElementById('trackModal').classList.add('open');
  }

  function cancelOrder(orderId){
    if (!confirm('Cancel this order? This cannot be undone.')) return;
    DB.updateOrderStatus(orderId, 'Cancelled');
    toast('Order cancelled', 'success');
    renderOrders();
  }

  function reorder(orderId){
    const order = DB.getOrders().find(o => o.id === orderId);
    if (!order) return;
    order.items.forEach(it => DB.addToCart(it.productId, it.size, it.color, it.qty));
    updateNavCounts();
    toast('Items added to your cart', 'success');
    setTimeout(()=> window.location.href = 'cart.html', 700);
  }

  function viewDetails(orderId){
    const order = DB.getOrders().find(o => o.id === orderId);
    if (!order) return;
    const itemLines = order.items.map(it => `${it.name} (${it.size}, ${it.color}) ×${it.qty} — ${PESO(it.price*it.qty)}`).join('\n');
    alert(`Order #${order.id}\nStatus: ${order.status}\nShip to: ${order.customer.fullName}, ${order.customer.address}, ${order.customer.city}\nPayment: ${order.paymentMethod}\n\nItems:\n${itemLines}\n\nTotal: ${PESO(order.totals.total)}`);
  }
});
