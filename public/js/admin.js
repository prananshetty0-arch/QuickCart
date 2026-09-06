// ============ Admin dashboard logic ============
let adminProducts = [];
let adminOrders = [];

async function ensureAdmin() {
  if (!requireLogin()) return false;
  try {
    const data = await apiFetch('/auth/me');
    if (!data.user.isAdmin) {
      showToast('Admin access required', 'error');
      window.location.href = '/index.html';
      return false;
    }
    return true;
  } catch (err) {
    window.location.href = '/login.html';
    return false;
  }
}

function switchTab(tab) {
  document.querySelectorAll('.admin-side button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  ['overview', 'products', 'orders'].forEach((t) => {
    document.getElementById('admin-' + t).classList.toggle('hidden', t !== tab);
  });
}

async function loadOverview() {
  const [productsData, ordersData] = await Promise.all([
    apiFetch('/products?limit=1'),
    apiFetch('/orders/admin/all'),
  ]);
  adminOrders = ordersData.orders;
  const totalRevenue = adminOrders.reduce((sum, o) => (o.status !== 'Cancelled' ? sum + o.totalAmount : sum), 0);

  document.getElementById('statGrid').innerHTML = `
    <div class="stat-card"><div class="num">${productsData.pagination.total}</div><div class="lbl">Total Products</div></div>
    <div class="stat-card"><div class="num">${adminOrders.length}</div><div class="lbl">Total Orders</div></div>
    <div class="stat-card"><div class="num">${formatMoney(totalRevenue)}</div><div class="lbl">Total Revenue</div></div>
    <div class="stat-card"><div class="num">${adminOrders.filter((o) => o.status === 'Placed').length}</div><div class="lbl">Pending Orders</div></div>
  `;

  document.getElementById('recentOrdersBody').innerHTML = adminOrders
    .slice(0, 8)
    .map((o) => `
    <tr>
      <td>#${o._id.slice(-8).toUpperCase()}</td>
      <td>${escapeHtml(o.user ? o.user.name : 'N/A')}</td>
      <td>${formatMoney(o.totalAmount)}</td>
      <td><span class="status-pill status-${o.status.replace(/ /g, '-')}">${escapeHtml(o.status)}</span></td>
      <td>${new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
    </tr>`)
    .join('');
}

async function loadAdminProducts() {
  const data = await apiFetch('/products?limit=100');
  adminProducts = data.products;
  document.getElementById('productsBody').innerHTML = adminProducts
    .map((p) => `
    <tr>
      <td style="font-size:1.3rem;">${p.icon}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.category)}</td>
      <td>${formatMoney(p.price)}</td>
      <td>${p.stock}</td>
      <td>${(p.rating || 0).toFixed(1)} ⭐</td>
      <td>
        <button class="btn-ghost btn-sm" data-action="edit" data-id="${p._id}">Edit</button>
        <button class="btn-ghost btn-sm" data-action="delete" data-id="${p._id}" style="color:var(--danger);">Delete</button>
      </td>
    </tr>`)
    .join('');
}

function openProductModal(product) {
  document.getElementById('productModal').classList.add('open');
  document.getElementById('productModalTitle').textContent = product ? 'Edit Product' : 'Add Product';
  document.getElementById('prodId').value = product ? product._id : '';
  document.getElementById('prodName').value = product ? product.name : '';
  document.getElementById('prodDesc').value = product ? product.description : '';
  document.getElementById('prodCategory').value = product ? product.category : 'Fruits & Vegetables';
  document.getElementById('prodPrice').value = product ? product.price : '';
  document.getElementById('prodMrp').value = product ? product.mrp : '';
  document.getElementById('prodUnit').value = product ? product.unit : '';
  document.getElementById('prodStock').value = product ? product.stock : 100;
  document.getElementById('prodIcon').value = product ? product.icon : '🛒';
}

async function loadAdminOrders() {
  const data = await apiFetch('/orders/admin/all');
  adminOrders = data.orders;
  const statuses = ['Placed', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'];
  document.getElementById('allOrdersBody').innerHTML = adminOrders
    .map((o) => `
    <tr>
      <td>#${o._id.slice(-8).toUpperCase()}</td>
      <td>${escapeHtml(o.user ? o.user.name : 'N/A')}</td>
      <td>${o.items.length} item${o.items.length !== 1 ? 's' : ''}</td>
      <td>${formatMoney(o.totalAmount)}</td>
      <td><span class="status-pill status-${o.status.replace(/ /g, '-')}">${escapeHtml(o.status)}</span></td>
      <td>
        <select class="select" data-id="${o._id}" data-action="status">
          ${statuses.map((s) => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </td>
    </tr>`)
    .join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  const ok = await ensureAdmin();
  if (!ok) return;

  await loadOverview();

  document.querySelectorAll('.admin-side button').forEach((btn) => {
    btn.addEventListener('click', async () => {
      switchTab(btn.dataset.tab);
      if (btn.dataset.tab === 'products' && adminProducts.length === 0) await loadAdminProducts();
      if (btn.dataset.tab === 'orders') await loadAdminOrders();
    });
  });

  document.getElementById('addProductBtn').addEventListener('click', () => openProductModal(null));
  document.getElementById('closeProductModal').addEventListener('click', () => document.getElementById('productModal').classList.remove('open'));

  document.getElementById('productsBody').addEventListener('click', async (e) => {
    const editBtn = e.target.closest('[data-action="edit"]');
    const delBtn = e.target.closest('[data-action="delete"]');
    if (editBtn) openProductModal(adminProducts.find((p) => p._id === editBtn.dataset.id));
    if (delBtn) {
      if (!confirm('Delete this product?')) return;
      try {
        await apiFetch(`/products/${delBtn.dataset.id}`, { method: 'DELETE' });
        showToast('Product deleted', 'info');
        loadAdminProducts();
      } catch (err) { showToast(err.message, 'error'); }
    }
  });

  document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prodId').value;
    const payload = {
      name: document.getElementById('prodName').value.trim(),
      description: document.getElementById('prodDesc').value.trim(),
      category: document.getElementById('prodCategory').value,
      price: Number(document.getElementById('prodPrice').value),
      mrp: Number(document.getElementById('prodMrp').value),
      unit: document.getElementById('prodUnit').value.trim(),
      stock: Number(document.getElementById('prodStock').value),
      icon: document.getElementById('prodIcon').value.trim() || '🛒',
    };
    try {
      if (id) await apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await apiFetch('/products', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Product saved', 'success');
      document.getElementById('productModal').classList.remove('open');
      loadAdminProducts();
    } catch (err) { showToast(err.message, 'error'); }
  });

  document.getElementById('allOrdersBody').addEventListener('change', async (e) => {
    const select = e.target.closest('[data-action="status"]');
    if (!select) return;
    try {
      await apiFetch(`/orders/admin/${select.dataset.id}/status`, { method: 'PUT', body: JSON.stringify({ status: select.value }) });
      showToast('Order status updated', 'success');
      loadAdminOrders();
    } catch (err) { showToast(err.message, 'error'); }
  });
});
