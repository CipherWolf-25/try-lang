/* ==========================================================================
   MENSIFY — profile.js  (profile.html only)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (!requireLogin('Please login to view your profile.')) return;
  let user = DB.getCurrentUser();

  refreshHeader();
  fillInfoForm();
  renderAddresses();
  renderOrderHistory();

  // Panel switching
  document.querySelectorAll('.profile-nav button[data-panel]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.profile-nav button[data-panel]').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.profile-panel').forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-' + btn.dataset.panel).classList.add('active');
    });
  });

  document.getElementById('logoutBtn').addEventListener('click', () => {
    DB.clearSession();
    toast('You have been logged out.', 'success');
    setTimeout(()=> window.location.href = 'index.html', 600);
  });

  // Avatar upload
  document.getElementById('avatarInput').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      user = DB.updateUser(user.id, { avatar: reader.result });
      refreshHeader();
      toast('Profile photo updated', 'success');
    };
    reader.readAsDataURL(file);
  });

  function refreshHeader(){
    const circle = document.getElementById('avatarCircle');
    const initials = (user.firstName[0]||'') + (user.lastName[0]||'');
    if (user.avatar){
      circle.style.backgroundImage = `url(${user.avatar})`;
      circle.style.backgroundSize = 'cover';
      circle.style.backgroundPosition = 'center';
      document.getElementById('avatarInitials').textContent = '';
    } else {
      document.getElementById('avatarInitials').textContent = initials.toUpperCase();
    }
    document.getElementById('profileName').textContent = `${user.firstName} ${user.lastName}`;
    document.getElementById('profileEmail').textContent = user.email;
  }

  function fillInfoForm(){
    document.getElementById('pFirstName').value = user.firstName;
    document.getElementById('pLastName').value = user.lastName;
    document.getElementById('pUsername').value = user.username;
    document.getElementById('pEmail').value = user.email;
    document.getElementById('pPhone').value = user.phone || '';
  }

  document.getElementById('infoForm').addEventListener('submit', e => {
    e.preventDefault();
    const patch = {
      firstName: document.getElementById('pFirstName').value.trim(),
      lastName: document.getElementById('pLastName').value.trim(),
      username: document.getElementById('pUsername').value.trim(),
      email: document.getElementById('pEmail').value.trim(),
      phone: document.getElementById('pPhone').value.trim()
    };
    if (!patch.firstName || !patch.lastName || !patch.email){ toast('Please complete all required fields.', 'error'); return; }
    user = DB.updateUser(user.id, patch);
    refreshHeader();
    toast('Profile updated', 'success');
  });

  function renderAddresses(){
    const wrap = document.getElementById('addressList');
    const addresses = user.addresses || [];
    if (!addresses.length){
      wrap.innerHTML = `<p class="muted">No saved addresses yet.</p>`;
      return;
    }
    wrap.innerHTML = addresses.map((a, i) => `
      <div class="address-card">
        <div>
          <b>${a.street}</b><br>
          <span class="muted" style="font-size:12.5px;">${a.city}, ${a.province} ${a.zip}</span>
        </div>
        <button class="btn-icon" data-i="${i}" title="Remove">✕</button>
      </div>`).join('');
    wrap.querySelectorAll('button[data-i]').forEach(btn => {
      btn.addEventListener('click', () => {
        const addresses2 = [...(user.addresses||[])];
        addresses2.splice(+btn.dataset.i, 1);
        user = DB.updateUser(user.id, { addresses: addresses2 });
        renderAddresses();
        toast('Address removed', 'success');
      });
    });
  }

  document.getElementById('addressForm').addEventListener('submit', e => {
    e.preventDefault();
    const addr = {
      street: document.getElementById('aStreet').value.trim(),
      city: document.getElementById('aCity').value.trim(),
      province: document.getElementById('aProvince').value.trim(),
      zip: document.getElementById('aZip').value.trim()
    };
    if (!addr.street || !addr.city){ toast('Please complete the address fields.', 'error'); return; }
    const addresses = [...(user.addresses||[]), addr];
    user = DB.updateUser(user.id, { addresses });
    renderAddresses();
    e.target.reset();
    toast('Address added', 'success');
  });

  function renderOrderHistory(){
    const orders = DB.getOrdersForCurrentUser();
    const wrap = document.getElementById('orderHistoryList');
    if (!orders.length){
      wrap.innerHTML = `<p class="muted">You haven't placed any orders yet. <a href="shop.html" style="color:var(--blue);">Start shopping →</a></p>`;
      return;
    }
    wrap.innerHTML = orders.map(o => `
      <div class="order-card">
        <div class="order-card-head">
          <div><div class="order-id">#${o.id}</div><div class="order-date">${new Date(o.date).toLocaleDateString('en-US',{dateStyle:'medium'})}</div></div>
          <span class="status-badge status-${o.status.toLowerCase()}">${o.status}</span>
        </div>
        <div class="order-card-foot">
          <span class="mono">${o.items.length} item(s)</span>
          <span class="order-total">${PESO(o.totals.total)}</span>
        </div>
      </div>`).join('');
  }

  document.getElementById('passwordForm').addEventListener('submit', e => {
    e.preventDefault();
    const cur = document.getElementById('curPass').value;
    const next = document.getElementById('newPass').value;
    const conf = document.getElementById('confNewPass').value;
    if (cur !== user.password){ toast('Current password is incorrect.', 'error'); return; }
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(next)){ toast('New password must be at least 8 characters with a letter and a number.', 'error'); return; }
    if (next !== conf){ toast('New passwords do not match.', 'error'); return; }
    user = DB.updateUser(user.id, { password: next });
    e.target.reset();
    toast('Password updated successfully', 'success');
  });
});
