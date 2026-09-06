// ============ Home / Shop page logic ============
const state = {
  category: 'All',
  search: '',
  sort: '',
  page: 1,
  limit: 12,
  categories: [],
  wishlistIds: new Set(),
  cart: {}, // productId -> quantity, from server cart
};

function categoryEmoji(cat) {
  const map = {
    'Fruits & Vegetables': '🥦', 'Dairy & Breakfast': '🥛', 'Snacks & Munchies': '🍪',
    'Beverages': '🥤', 'Bakery': '🍞', 'Personal Care': '🧴', 'Household': '🧽', 'Atta, Rice & Dal': '🌾',
  };
  return map[cat] || '🛒';
}

async function loadCategories() {
  try {
    const data = await apiFetch('/products/categories');
    state.categories = data.categories;
    renderCategoryStrip();
  } catch (e) { /* silent */ }
}

function renderCategoryStrip() {
  const strip = document.getElementById('categoryStrip');
  if (!strip) return;
  const all = ['All', ...state.categories];
  strip.innerHTML = all
    .map(
      (c) =>
        `<button class="chip ${c === state.category ? 'active' : ''}" data-cat="${escapeHtml(c)}">${categoryEmoji(c)} ${escapeHtml(c)}</button>`
    )
    .join('');
  strip.querySelectorAll('.chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.category = btn.dataset.cat;
      state.page = 1;
      renderCategoryStrip();
      loadProducts();
    });
  });
}

async function loadWishlistIds() {
  if (!Auth.isLoggedIn()) return;
  try {
    const data = await apiFetch('/wishlist');
    state.wishlistIds = new Set(data.wishlist.map((p) => p._id));
  } catch (e) { /* silent */ }
}

async function loadCartQuantities() {
  if (!Auth.isLoggedIn()) return;
  try {
    const data = await apiFetch('/cart');
    state.cart = {};
    data.items.forEach((i) => { state.cart[i.product._id] = i.quantity; });
  } catch (e) { /* silent */ }
}

function renderSkeletons() {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = Array.from({ length: 8 })
    .map(() => `<div class="card skeleton-card skeleton"></div>`)
    .join('');
}

function productCardHtml(p) {
  const qty = state.cart[p._id] || 0;
  const wished = state.wishlistIds.has(p._id);
  const discount = p.discountPercent || Math.round(((p.mrp - p.price) / p.mrp) * 100);
  return `
  <div class="card" data-id="${p._id}">
    <div class="card-media">
      ${discount > 0 ? `<span class="discount-badge">${discount}% OFF</span>` : ''}
      <button class="wishlist-btn ${wished ? 'active' : ''}" data-action="wishlist" data-id="${p._id}" title="Save for later">${wished ? '❤️' : '🤍'}</button>
      <span>${p.icon || '🛒'}</span>
    </div>
    <div class="card-cat">${escapeHtml(p.category)}</div>
    <div class="card-title">${escapeHtml(p.name)}</div>
    <div class="card-unit">${escapeHtml(p.unit)}</div>
    <div class="card-rating"><span class="stars">${starString(p.rating || 4)}</span> <span>(${p.numReviews || 0})</span></div>
    <div class="card-price-row">
      <span class="price">${formatMoney(p.price)}</span>
      ${p.mrp > p.price ? `<span class="mrp">${formatMoney(p.mrp)}</span>` : ''}
    </div>
    <div class="card-footer" data-cart-area="${p._id}">
      ${qty > 0
        ? `<div class="qty-stepper"><button data-action="dec" data-id="${p._id}">−</button><span>${qty}</span><button data-action="inc" data-id="${p._id}">+</button></div>`
        : `<button class="add-btn" data-action="add" data-id="${p._id}">+ Add to Cart</button>`}
    </div>
  </div>`;
}

async function loadProducts() {
  renderSkeletons();
  const params = new URLSearchParams();
  if (state.category && state.category !== 'All') params.set('category', state.category);
  if (state.search) params.set('search', state.search);
  if (state.sort) params.set('sort', state.sort);
  params.set('page', state.page);
  params.set('limit', state.limit);

  try {
    const data = await apiFetch(`/products?${params.toString()}`);
    const grid = document.getElementById('productGrid');
    const emptyState = document.getElementById('emptyState');
    const resultCount = document.getElementById('resultCount');
    const sectionTitle = document.getElementById('sectionTitle');

    sectionTitle.textContent = state.search
      ? `Results for "${state.search}"`
      : state.category !== 'All' ? state.category : 'All Products';

    if (data.products.length === 0) {
      grid.innerHTML = '';
      emptyState.classList.remove('hidden');
      resultCount.textContent = '';
    } else {
      emptyState.classList.add('hidden');
      grid.innerHTML = data.products.map(productCardHtml).join('');
      resultCount.textContent = `${data.pagination.total} product${data.pagination.total !== 1 ? 's' : ''} found`;
    }
    renderPagination(data.pagination);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderPagination(pagination) {
  const bar = document.getElementById('paginationBar');
  if (!pagination || pagination.totalPages <= 1) { bar.innerHTML = ''; return; }
  let html = '';
  for (let i = 1; i <= pagination.totalPages; i++) {
    html += `<button class="btn ${i === pagination.page ? 'btn-primary' : 'btn-outline'} btn-sm" data-page="${i}">${i}</button>`;
  }
  bar.innerHTML = html;
  bar.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.page = Number(btn.dataset.page);
      loadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

async function handleAddToCart(productId) {
  if (!Auth.isLoggedIn()) {
    window.location.href = `/login.html?next=${encodeURIComponent('/index.html')}`;
    return;
  }
  try {
    await apiFetch('/cart/add', { method: 'POST', body: JSON.stringify({ productId, quantity: 1 }) });
    state.cart[productId] = (state.cart[productId] || 0) + 1;
    updateCardQty(productId);
    updateCartBadge();
    showToast('Added to cart', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleChangeQty(productId, delta) {
  const newQty = (state.cart[productId] || 0) + delta;
  try {
    await apiFetch('/cart/update', { method: 'PUT', body: JSON.stringify({ productId, quantity: newQty }) });
    if (newQty <= 0) delete state.cart[productId]; else state.cart[productId] = newQty;
    updateCardQty(productId);
    updateCartBadge();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function updateCardQty(productId) {
  const area = document.querySelector(`[data-cart-area="${productId}"]`);
  if (!area) return;
  const qty = state.cart[productId] || 0;
  area.innerHTML = qty > 0
    ? `<div class="qty-stepper"><button data-action="dec" data-id="${productId}">−</button><span>${qty}</span><button data-action="inc" data-id="${productId}">+</button></div>`
    : `<button class="add-btn" data-action="add" data-id="${productId}">+ Add to Cart</button>`;
}

async function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const total = Object.values(state.cart).reduce((a, b) => a + b, 0);
  if (total > 0) { badge.textContent = total > 99 ? '99+' : total; badge.classList.remove('hidden'); }
  else badge.classList.add('hidden');
}

async function handleToggleWishlist(productId, btn) {
  if (!Auth.isLoggedIn()) {
    window.location.href = `/login.html?next=${encodeURIComponent('/index.html')}`;
    return;
  }
  try {
    const data = await apiFetch(`/wishlist/${productId}`, { method: 'POST' });
    if (data.added) { state.wishlistIds.add(productId); btn.classList.add('active'); btn.textContent = '❤️'; showToast('Added to wishlist', 'success'); }
    else { state.wishlistIds.delete(productId); btn.classList.remove('active'); btn.textContent = '🤍'; showToast('Removed from wishlist', 'info'); }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('search')) state.search = params.get('search');

  await Promise.all([loadCategories(), loadWishlistIds(), loadCartQuantities()]);
  loadProducts();

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      state.sort = sortSelect.value;
      state.page = 1;
      loadProducts();
    });
  }

  document.getElementById('productGrid').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    if (action === 'add') handleAddToCart(id);
    else if (action === 'inc') handleChangeQty(id, 1);
    else if (action === 'dec') handleChangeQty(id, -1);
    else if (action === 'wishlist') handleToggleWishlist(id, btn);
  });
});
