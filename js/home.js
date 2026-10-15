/* ==========================================================================
   MENSIFY — home.js  (index.html only)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const products = DB.getProducts();

  // Category strip
  const catStrip = document.getElementById('categoryStrip');
  if (catStrip){
    catStrip.innerHTML = CATEGORIES.map(c => `
      <a class="cat-chip" href="shop.html?category=${c.id}">
        <span class="ic">${c.icon}</span>
        <b>${c.name}</b>
      </a>`).join('');
  }

  const featured = products.filter(p => p.tags.includes('featured')).slice(0,8);
  const bestSellers = products.filter(p => p.tags.includes('bestseller')).slice(0,4);
  const newArrivals = [...products].filter(p=>p.tags.includes('new')).slice(0,4);

  fillGrid('featuredGrid', featured.length ? featured : products.slice(0,8));
  fillGrid('bestSellerGrid', bestSellers.length ? bestSellers : products.slice(8,12));
  fillGrid('newArrivalGrid', newArrivals.length ? newArrivals : products.slice(12,16));

  function fillGrid(id, list){
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = list.map(productCardHTML).join('');
    bindProductCardEvents(el);
  }

  const nf = document.getElementById('heroNewsletterForm');
  nf && nf.addEventListener('submit', e => {
    e.preventDefault();
    const input = nf.querySelector('input');
    DB.addNewsletterEmail(input.value.trim());
    toast('Subscribed! Welcome to the list.', 'success');
    nf.reset();
  });
});
