// ============ Wishlist page logic ============
document.addEventListener('DOMContentLoaded', async () => {
  if (!requireLogin()) return;

  const grid = document.getElementById('wishlistGrid');
  const emptyState = document.getElementById('wishlistEmpty');

  try {
    const data = await apiFetch('/wishlist');
    if (data.wishlist.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }
    grid.innerHTML = data.wishlist
      .map((p) => `
      <div class="card" data-id="${p._id}">
        <div class="card-media">
          <button class="wishlist-btn active" data-id="${p._id}">❤️</button>
          <span>${p.icon || '🛒'}</span>
        </div>
        <div class="card-cat">${escapeHtml(p.category)}</div>
        <div class="card-title">${escapeHtml(p.name)}</div>
        <div class="card-unit">${escapeHtml(p.unit)}</div>
        <div class="card-price-row">
          <span class="price">${formatMoney(p.price)}</span>
          ${p.mrp > p.price ? `<span class="mrp">${formatMoney(p.mrp)}</span>` : ''}
        </div>
        <div class="card-footer">
          <button class="add-btn" data-action="add" data-id="${p._id}">+ Add to Cart</button>
        </div>
      </div>`)
      .join('');
  } catch (err) {
    showToast(err.message, 'error');
  }

  grid.addEventListener('click', async (e) => {
    const removeBtn = e.target.closest('.wishlist-btn');
    const addBtn = e.target.closest('[data-action="add"]');
    if (removeBtn) {
      const id = removeBtn.dataset.id;
      try {
        await apiFetch(`/wishlist/${id}`, { method: 'POST' });
        removeBtn.closest('.card').remove();
        showToast('Removed from wishlist', 'info');
        if (!grid.children.length) emptyState.classList.remove('hidden');
      } catch (err) { showToast(err.message, 'error'); }
    }
    if (addBtn) {
      try {
        await apiFetch('/cart/add', { method: 'POST', body: JSON.stringify({ productId: addBtn.dataset.id, quantity: 1 }) });
        showToast('Added to cart', 'success');
      } catch (err) { showToast(err.message, 'error'); }
    }
  });
});
