/* ==========================================================================
   MENSIFY — storage.js
   Single source of truth for all LocalStorage reads/writes. Every other
   script goes through the DB.* helpers below instead of touching
   localStorage directly, so the "data layer" stays swappable/testable.
   ========================================================================== */

const DB = {
  KEYS: {
    PRODUCTS: 'mensify_products',
    USERS: 'mensify_users',
    SESSION: 'mensify_session',
    ADMIN_SESSION: 'mensify_admin_session',
    ORDERS: 'mensify_orders',
    CART: 'mensify_cart', // { [ownerKey]: [ {productId,size,color,qty} ] }
    WISHLIST: 'mensify_wishlist', // { [ownerKey]: [productId,...] }
    COUPONS: 'mensify_coupons',
    MESSAGES: 'mensify_contact_messages',
    NEWSLETTER: 'mensify_newsletter'
  },

  _read(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){ return fallback; }
  },
  _write(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  },

  /* ---------------- bootstrap ---------------- */
  init(){
    if (!localStorage.getItem(this.KEYS.PRODUCTS)){
      this._write(this.KEYS.PRODUCTS, generateProducts());
    }
    if (!localStorage.getItem(this.KEYS.USERS)) this._write(this.KEYS.USERS, []);
    if (!localStorage.getItem(this.KEYS.ORDERS)) this._write(this.KEYS.ORDERS, []);
    if (!localStorage.getItem(this.KEYS.CART)) this._write(this.KEYS.CART, {});
    if (!localStorage.getItem(this.KEYS.WISHLIST)) this._write(this.KEYS.WISHLIST, {});
    if (!localStorage.getItem(this.KEYS.COUPONS)) this._write(this.KEYS.COUPONS, {
      'MENSIFY10':10, 'WELCOME15':15, 'GOLD20':20
    });
    if (!localStorage.getItem(this.KEYS.MESSAGES)) this._write(this.KEYS.MESSAGES, []);
    if (!localStorage.getItem(this.KEYS.NEWSLETTER)) this._write(this.KEYS.NEWSLETTER, []);
  },

  /* ---------------- products ---------------- */
  getProducts(){ return this._read(this.KEYS.PRODUCTS, []); },
  saveProducts(list){ this._write(this.KEYS.PRODUCTS, list); },
  getProduct(id){ return this.getProducts().find(p => p.id === id); },
  upsertProduct(product){
    const list = this.getProducts();
    const idx = list.findIndex(p => p.id === product.id);
    if (idx > -1) list[idx] = product; else list.unshift(product);
    this.saveProducts(list);
  },
  deleteProduct(id){
    this.saveProducts(this.getProducts().filter(p => p.id !== id));
  },

  /* ---------------- users / auth ---------------- */
  getUsers(){ return this._read(this.KEYS.USERS, []); },
  saveUsers(list){ this._write(this.KEYS.USERS, list); },
  findUserByEmailOrUsername(v){
    v = (v||'').toLowerCase();
    return this.getUsers().find(u => u.email.toLowerCase() === v || u.username.toLowerCase() === v);
  },
  createUser(user){
    const users = this.getUsers();
    user.id = 'U-' + Date.now();
    user.joined = new Date().toISOString();
    user.addresses = user.addresses || [];
    user.avatar = user.avatar || '';
    users.push(user);
    this.saveUsers(users);
    return user;
  },
  updateUser(userId, patch){
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx > -1){ users[idx] = { ...users[idx], ...patch }; this.saveUsers(users); return users[idx]; }
    return null;
  },

  getSession(){ return this._read(this.KEYS.SESSION, null); },
  setSession(userId, remember){
    this._write(this.KEYS.SESSION, { userId, remember: !!remember, since: Date.now() });
  },
  clearSession(){ localStorage.removeItem(this.KEYS.SESSION); },
  getCurrentUser(){
    const s = this.getSession();
    if (!s) return null;
    return this.getUsers().find(u => u.id === s.userId) || null;
  },

  isAdminLoggedIn(){ return sessionStorage.getItem(this.KEYS.ADMIN_SESSION) === '1' || localStorage.getItem(this.KEYS.ADMIN_SESSION) === '1'; },
  setAdminLoggedIn(remember){
    if (remember) localStorage.setItem(this.KEYS.ADMIN_SESSION, '1');
    else sessionStorage.setItem(this.KEYS.ADMIN_SESSION, '1');
  },
  clearAdminSession(){
    sessionStorage.removeItem(this.KEYS.ADMIN_SESSION);
    localStorage.removeItem(this.KEYS.ADMIN_SESSION);
  },

  /* ---------------- cart / wishlist (guest or user scoped) ---------------- */
  ownerKey(){
    const u = this.getCurrentUser();
    return u ? u.id : 'guest';
  },
  getCart(){
    const all = this._read(this.KEYS.CART, {});
    return all[this.ownerKey()] || [];
  },
  saveCart(items){
    const all = this._read(this.KEYS.CART, {});
    all[this.ownerKey()] = items;
    this._write(this.KEYS.CART, all);
  },
  addToCart(productId, size, color, qty){
    const items = this.getCart();
    const existing = items.find(i => i.productId === productId && i.size === size && i.color === color);
    if (existing) existing.qty += qty;
    else items.push({ productId, size, color, qty });
    this.saveCart(items);
  },
  updateCartQty(index, qty){
    const items = this.getCart();
    if (items[index]){ items[index].qty = Math.max(1, qty); this.saveCart(items); }
  },
  removeFromCart(index){
    const items = this.getCart();
    items.splice(index,1);
    this.saveCart(items);
  },
  clearCart(){ this.saveCart([]); },

  getWishlist(){
    const all = this._read(this.KEYS.WISHLIST, {});
    return all[this.ownerKey()] || [];
  },
  saveWishlist(ids){
    const all = this._read(this.KEYS.WISHLIST, {});
    all[this.ownerKey()] = ids;
    this._write(this.KEYS.WISHLIST, all);
  },
  toggleWishlist(productId){
    let ids = this.getWishlist();
    if (ids.includes(productId)) ids = ids.filter(id => id !== productId);
    else ids.push(productId);
    this.saveWishlist(ids);
    return ids.includes(productId);
  },

  /* ---------------- orders ---------------- */
  getOrders(){ return this._read(this.KEYS.ORDERS, []); },
  saveOrders(list){ this._write(this.KEYS.ORDERS, list); },
  getOrdersForCurrentUser(){
    const u = this.getCurrentUser();
    if (!u) return [];
    return this.getOrders().filter(o => o.userId === u.id).sort((a,b)=> new Date(b.date) - new Date(a.date));
  },
  createOrder(order){
    const orders = this.getOrders();
    order.id = 'MNS' + Date.now().toString().slice(-8);
    order.date = new Date().toISOString();
    order.status = 'Incoming';
    order.history = [{ status:'Incoming', at: order.date }];
    orders.unshift(order);
    this.saveOrders(orders);
    return order;
  },
  updateOrderStatus(orderId, status){
    const orders = this.getOrders();
    const o = orders.find(o => o.id === orderId);
    if (o){
      o.status = status;
      o.history = o.history || [];
      o.history.push({ status, at: new Date().toISOString() });
      this.saveOrders(orders);
    }
    return o;
  },

  /* ---------------- coupons ---------------- */
  getCoupons(){ return this._read(this.KEYS.COUPONS, {}); },
  validateCoupon(code){
    const coupons = this.getCoupons();
    const pct = coupons[(code||'').toUpperCase().trim()];
    return pct || 0;
  },

  /* ---------------- contact / newsletter ---------------- */
  addContactMessage(msg){
    const list = this._read(this.KEYS.MESSAGES, []);
    msg.id = 'MSG-' + Date.now();
    msg.date = new Date().toISOString();
    list.unshift(msg);
    this._write(this.KEYS.MESSAGES, list);
  },
  addNewsletterEmail(email){
    const list = this._read(this.KEYS.NEWSLETTER, []);
    if (!list.includes(email)) list.push(email);
    this._write(this.KEYS.NEWSLETTER, list);
  }
};

DB.init();
