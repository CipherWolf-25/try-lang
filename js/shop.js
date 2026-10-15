/* ==========================================================================
   MENSIFY — shop.js  (shop.html only)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const allProducts = DB.getProducts();
  const params = new URLSearchParams(window.location.search);

  const state = {
    category: params.get('category') || '',
    price: '',
    q: params.get('q') || '',
    tag: '',
    sort: params.get('sort') || 'newest',
    page: 1,
    perPage: 12
  };

  const categorySelect = document.getElementById('categoryFilter');
  CATEGORIES.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id; opt.textContent = c.name;
    categorySelect.appendChild(opt);
  });
  categorySelect.value = state.category;

  document.getElementById('priceFilter').addEventListener('change', e => { state.price = e.target.value; state.page = 1; render(); });
  categorySelect.addEventListener('change', e => { state.category = e.target.value; state.page = 1; render(); });
  document.getElementById('sortFilter').value = state.sort;
  document.getElementById('sortFilter').addEventListener('change', e => { state.sort = e.target.value; render(); });

  const searchInput = document.getElementById('shopSearchInput');
  searchInput.value = state.q;
  searchInput.addEventListener('input', debounce(e => { state.q = e.target.value; state.page = 1; render(); }, 250));

  document.querySelectorAll('#quickChips button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#quickChips button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.tag = btn.dataset.tag;
      state.page = 1;
      render();
    });
  });
  document.querySelector('#quickChips button[data-tag=""]').classList.add('active');

  function debounce(fn, wait){
    let t; return (...a) => { clearTimeout(t); t = setTimeout(()=>fn(...a), wait); };
  }

  function applyFilters(){
    let list = [...allProducts];
    if (state.category) list = list.filter(p => p.category === state.category);
    if (state.tag) list = list.filter(p => p.tags.includes(state.tag));
    if (state.price){
      const [min,max] = state.price.split('-').map(Number);
      list = list.filter(p => { const fp = finalPrice(p); return fp >= min && fp <= max; });
    }
    if (state.q){
      const q = state.q.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q));
    }
    switch (state.sort){
      case 'price-asc': list.sort((a,b)=> finalPrice(a) - finalPrice(b)); break;
      case 'price-desc': list.sort((a,b)=> finalPrice(b) - finalPrice(a)); break;
      case 'rating': list.sort((a,b)=> b.rating - a.rating); break;
      case 'bestseller': list.sort((a,b)=> (b.tags.includes('bestseller')?1:0) - (a.tags.includes('bestseller')?1:0) || b.reviewsCount - a.reviewsCount); break;
      default: list.sort((a,b)=> b.createdRank - a.createdRank);
    }
    return list;
  }

  function render(){
    const filtered = applyFilters();
    const totalPages = Math.max(1, Math.ceil(filtered.length / state.perPage));
    state.page = Math.min(state.page, totalPages);
    const start = (state.page-1) * state.perPage;
    const pageItems = filtered.slice(start, start + state.perPage);

    document.getElementById('resultsCount').textContent = `${filtered.length} product${filtered.length!==1?'s':''} found`;

    const grid = document.getElementById('shopGrid');
    if (!pageItems.length){
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><span class="glyph">🔍</span><h3>No products found</h3><p>Try adjusting your filters or search term.</p></div>`;
    } else {
      grid.innerHTML = pageItems.map(productCardHTML).join('');
      bindProductCardEvents(grid);
    }

    const pag = document.getElementById('shopPagination');
    pag.innerHTML = '';
    for (let i=1;i<=totalPages;i++){
      const b = document.createElement('button');
      b.textContent = i;
      if (i === state.page) b.classList.add('active');
      b.addEventListener('click', () => { state.page = i; render(); window.scrollTo({top:300, behavior:'smooth'}); });
      pag.appendChild(b);
    }
  }

  render();
});
