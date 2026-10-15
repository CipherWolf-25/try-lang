/* ==========================================================================
   MENSIFY — admin.js  (admin.html only)
   Hidden admin dashboard simulated entirely with LocalStorage.
   Demo credentials: admin / admin123
   ========================================================================== */

const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };
let activeTags = [];

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.toggle-pass').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      btn.textContent = isPass ? '🙈' : '👁';
    });
  });

  checkGate();

  document.getElementById('adminLoginForm').addEventListener('submit', e => {
    e.preventDefault();
    const u = document.getElementById('adminUser').value.trim();
    const p = document.getElementById('adminPass').value;
    const remember = document.getElementById('adminRemember').checked;
    const msg = document.getElementById('adminLoginMsg');
    if (u === ADMIN_CREDENTIALS.username && p === ADMIN_CREDENTIALS.password){
      DB.setAdminLoggedIn(remember);
      msg.className = 'form-msg show success';
      msg.textContent = 'Login successful. Loading dashboard…';
      setTimeout(checkGate, 500);
    } else {
      msg.className = 'form-msg show error';
      msg.textContent = 'Invalid admin credentials.';
    }
  });

  document.getElementById('adminLogoutBtn').addEventListener('click', () => {
    DB.clearAdminSession();
    checkGate();
    toast('Admin logged out', 'success');
  });

  // Sidebar nav
  document.querySelectorAll('.admin-nav button[data-panel]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-nav button[data-panel]').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.admin-panel').forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('admin-' + btn.dataset.panel).classList.add('active');
    });
  });

  // Product modal
  const productModal = document.getElementById('productModal');
  document.getElementById('addProductBtn').addEventListener('click', () => openProductModal());
  document.getElementById('productModalClose').addEventListener('click', () => productModal.classList.remove('open'));
  CATEGORIES.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id; opt.textContent = c.name;
    document.getElementById('pmCategory').appendChild(opt);
  });
  document.querySelectorAll('#pmTags button').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const tag = btn.dataset.tag;
      if (activeTags.includes(tag)) activeTags = activeTags.filter(t=>t!==tag);
      else activeTags.push(tag);
    });
  });
  document.getElementById('productForm').addEventListener('submit', saveProductForm);
  document.getElementById('pmImageFile').addEventListener('change', handleProductImageFile);

  document.getElementById('prodSearch').addEventListener('input', renderProductsTable);
  document.getElementById('orderSearch').addEventListener('input', renderOrdersTable);
  document.getElementById('orderStatusFilter').addEventListener('change', renderOrdersTable);
  document.getElementById('customerSearch').addEventListener('input', renderCustomersTable);
});

function checkGate(){
  const loggedIn = DB.isAdminLoggedIn();
  document.getElementById('adminLoginShell').style.display = loggedIn ? 'none' : 'flex';
  document.getElementById('adminShell').style.display = loggedIn ? 'grid' : 'none';
  if (loggedIn) loadDashboard();
}

function loadDashboard(){
  renderOverview();
  renderProductsTable();
  renderOrdersTable();
  renderCustomersTable();
}

/* ---------------- OVERVIEW ---------------- */
function renderOverview(){
  const products = DB.getProducts();
  const orders = DB.getOrders();
  const users = DB.getUsers();

  const pending = orders.filter(o => ['Incoming','Preparing','Shipped'].includes(o.status)).length;
  const completed = orders.filter(o => o.status === 'Completed').length;
  const rejected = orders.filter(o => ['Rejected','Cancelled'].includes(o.status)).length;
  const revenue = orders.filter(o => o.status !== 'Rejected' && o.status !== 'Cancelled').reduce((s,o)=> s + o.totals.total, 0);
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;

  document.getElementById('statTotalProducts').textContent = products.length;
  document.getElementById('statTotalOrders').textContent = orders.length;
  document.getElementById('statPendingOrders').textContent = pending;
  document.getElementById('statCompletedOrders').textContent = completed;
  document.getElementById('statRejectedOrders').textContent = rejected;
  document.getElementById('statTotalCustomers').textContent = users.length;
  document.getElementById('statLowStock').textContent = lowStock;
  document.getElementById('statRevenue').textContent = PESO(revenue);

  const tbody = document.querySelector('#recentOrdersTable tbody');
  tbody.innerHTML = orders.slice(0,6).map(o => `
    <tr>
      <td class="mono">#${o.id}</td>
      <td>${o.customer.fullName}</td>
      <td>${new Date(o.date).toLocaleDateString('en-US',{dateStyle:'medium'})}</td>
      <td class="mono">${PESO(o.totals.total)}</td>
      <td><span class="status-badge status-${o.status.toLowerCase()}">${o.status}</span></td>
    </tr>`).join('') || `<tr><td colspan="5" class="muted" style="text-align:center;">No orders yet.</td></tr>`;
}

/* ---------------- PRODUCTS ---------------- */
function renderProductsTable(){
  const q = (document.getElementById('prodSearch').value || '').toLowerCase();
  const products = DB.getProducts().filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  const tbody = document.getElementById('productsTableBody');
  tbody.innerHTML = products.map(p => `
    <tr>
      <td><span class="table-thumb ${p.thumbClass}">${p.glyph}<img class="prod-img" src="${p.images[0]}" alt="${p.name}" loading="lazy" onerror="handleImgError(this)"></span>${p.name}</td>
      <td>${p.categoryName}</td>
      <td class="mono">${PESO(finalPrice(p))}${p.discount ? ` <span class="muted" style="text-decoration:line-through;">${PESO(p.price)}</span>` : ''}</td>
      <td class="${p.stock<=5?'stock-low':''}">${p.stock}</td>
      <td>${p.rating} ★</td>
      <td class="row-actions">
        <button data-edit="${p.id}">Edit</button>
        <button data-delete="${p.id}">Delete</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="6" class="muted" style="text-align:center;">No products found.</td></tr>`;

  tbody.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openProductModal(DB.getProduct(btn.dataset.edit))));
  tbody.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => {
    if (!confirm('Delete this product permanently?')) return;
    DB.deleteProduct(btn.dataset.delete);
    renderProductsTable();
    renderOverview();
    toast('Product deleted', 'success');
  }));
}

function openProductModal(product){
  activeTags = product ? [...product.tags] : [];
  document.getElementById('productModalTitle').textContent = product ? 'Edit Product' : 'Add Product';
  document.getElementById('pmId').value = product ? product.id : '';
  document.getElementById('pmName').value = product ? product.name : '';
  document.getElementById('pmBrand').value = product ? product.brand : '';
  document.getElementById('pmCategory').value = product ? product.category : CATEGORIES[0].id;
  document.getElementById('pmSku').value = product ? product.sku : 'SKU-' + Date.now().toString().slice(-6);
  document.getElementById('pmDescription').value = product ? product.description : '';
  document.getElementById('pmPrice').value = product ? product.price : '';
  document.getElementById('pmDiscount').value = product ? product.discount : 0;
  document.getElementById('pmStock').value = product ? product.stock : 20;
  document.getElementById('pmRating').value = product ? product.rating : 4.5;
  document.getElementById('pmSizes').value = product ? product.sizes.join(', ') : 'S, M, L, XL';
  document.getElementById('pmColors').value = product ? product.colors.join(', ') : 'Black, White, Navy';
  document.querySelectorAll('#pmTags button').forEach(btn => btn.classList.toggle('active', activeTags.includes(btn.dataset.tag)));

  // Product picture: show existing photo (uploaded or auto-generated) when editing
  const fileInput = document.getElementById('pmImageFile');
  const preview = document.getElementById('pmImagePreview');
  const previewEmpty = document.getElementById('pmImagePreviewEmpty');
  const imageData = document.getElementById('pmImageData');
  fileInput.value = '';
  if(product && product.images && product.images[0]){
    preview.src = product.images[0];
    preview.style.display = 'block';
    previewEmpty.style.display = 'none';
    // Only carry the value forward as a fresh upload if it was a real uploaded (base64) photo,
    // not an auto-generated one — auto-generated photos regenerate on save if left untouched.
    imageData.value = product.images[0].startsWith('data:') ? product.images[0] : '';
  } else {
    preview.src = '';
    preview.style.display = 'none';
    previewEmpty.style.display = 'block';
    imageData.value = '';
  }

  document.getElementById('productModal').classList.add('open');
}

function handleProductImageFile(e){
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById('pmImageData').value = reader.result;
    const preview = document.getElementById('pmImagePreview');
    preview.src = reader.result;
    preview.style.display = 'block';
    document.getElementById('pmImagePreviewEmpty').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function saveProductForm(e){
  e.preventDefault();
  const id = document.getElementById('pmId').value;
  const category = document.getElementById('pmCategory').value;
  const catObj = CATEGORIES.find(c => c.id === category);
  const name = document.getElementById('pmName').value.trim();
  const uploadedImage = document.getElementById('pmImageData').value;
  const existing = id ? DB.getProduct(id) : null;

  let images, thumbClass;
  if(uploadedImage){
    // Uploaded photo is used for all gallery slots for this product
    images = [uploadedImage, uploadedImage, uploadedImage];
    thumbClass = existing ? (existing.thumbClass || 'ph-1') : ['ph-1','ph-2','ph-3','ph-4','ph-5','ph-6'][Date.now() % 6];
  } else if(existing){
    images = existing.images;
    thumbClass = existing.thumbClass || 'ph-1';
  } else {
    images = productPhotoSet(category, name, Date.now() % 100000);
    thumbClass = ['ph-1','ph-2','ph-3','ph-4','ph-5','ph-6'][Date.now() % 6];
  }

  const product = {
    id: id || 'MEN-' + Date.now().toString().slice(-6),
    name,
    brand: document.getElementById('pmBrand').value.trim(),
    category,
    categoryName: catObj.name,
    description: document.getElementById('pmDescription').value.trim(),
    price: parseFloat(document.getElementById('pmPrice').value) || 0,
    discount: parseInt(document.getElementById('pmDiscount').value) || 0,
    rating: parseFloat(document.getElementById('pmRating').value) || 4.5,
    reviewsCount: id ? (existing?.reviewsCount || 10) : 0,
    stock: parseInt(document.getElementById('pmStock').value) || 0,
    sizes: document.getElementById('pmSizes').value.split(',').map(s=>s.trim()).filter(Boolean),
    colors: document.getElementById('pmColors').value.split(',').map(s=>s.trim()).filter(Boolean),
    images,
    thumbClass,
    glyph: seededGlyph(name),
    tags: activeTags,
    sku: document.getElementById('pmSku').value.trim(),
    createdRank: id ? (existing?.createdRank || Date.now()) : Date.now()
  };
  DB.upsertProduct(product);
  document.getElementById('productModal').classList.remove('open');
  renderProductsTable();
  renderOverview();
  toast(id ? 'Product updated' : 'Product added', 'success');
}

/* ---------------- ORDERS ---------------- */
const ADMIN_STATUS_LIST = ['Incoming','Preparing','Shipped','Delivered','Completed','Rejected','Cancelled'];

function renderOrdersTable(){
  const q = (document.getElementById('orderSearch').value || '').toLowerCase();
  const statusFilter = document.getElementById('orderStatusFilter').value;
  let orders = DB.getOrders();
  if (statusFilter) orders = orders.filter(o => o.status === statusFilter);
  if (q) orders = orders.filter(o => o.id.toLowerCase().includes(q) || o.customer.fullName.toLowerCase().includes(q));

  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td class="mono">#${o.id}</td>
      <td>${o.customer.fullName}</td>
      <td>${o.items.length} item(s)</td>
      <td>${o.paymentMethod}</td>
      <td class="mono">${PESO(o.totals.total)}</td>
      <td>
        <select class="status-select" data-id="${o.id}">
          ${ADMIN_STATUS_LIST.map(s => `<option ${s===o.status?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td class="row-actions">
        <button data-view="${o.id}">View</button>
      </td>
    </tr>`).join('') || `<tr><td colspan="7" class="muted" style="text-align:center;">No orders found.</td></tr>`;

  tbody.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', () => {
      DB.updateOrderStatus(sel.dataset.id, sel.value);
      toast(`Order #${sel.dataset.id} marked as ${sel.value}`, 'success');
      renderOverview();
    });
  });
  tbody.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      const o = DB.getOrders().find(x => x.id === btn.dataset.view);
      const lines = o.items.map(it => `${it.name} (${it.size}, ${it.color}) x${it.qty} — ${PESO(it.price*it.qty)}`).join('\n');
      alert(`Order #${o.id}\nCustomer: ${o.customer.fullName} (${o.customer.email})\nAddress: ${o.customer.address}, ${o.customer.city}, ${o.customer.province} ${o.customer.zip}\nPayment: ${o.paymentMethod}\nStatus: ${o.status}\n\nItems:\n${lines}\n\nTotal: ${PESO(o.totals.total)}`);
    });
  });
}

/* ---------------- CUSTOMERS ---------------- */
function renderCustomersTable(){
  const q = (document.getElementById('customerSearch').value || '').toLowerCase();
  const users = DB.getUsers().filter(u => (u.firstName+' '+u.lastName).toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  const orders = DB.getOrders();
  const tbody = document.getElementById('customersTableBody');
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.firstName} ${u.lastName} <span class="muted">(@${u.username})</span></td>
      <td>${u.email}</td>
      <td>${u.phone || '—'}</td>
      <td>${new Date(u.joined).toLocaleDateString('en-US',{dateStyle:'medium'})}</td>
      <td>${orders.filter(o=>o.userId===u.id).length}</td>
    </tr>`).join('') || `<tr><td colspan="5" class="muted" style="text-align:center;">No customers yet.</td></tr>`;
}
