// ============ Orders page logic ============
const STATUS_STEPS = ['Placed', 'Packed', 'Out for Delivery', 'Delivered'];

function timelineHtml(order) {
  if (order.status === 'Cancelled') {
    return `<div style="text-align:center; color:var(--danger); font-weight:600; font-size:0.85rem;">This order was cancelled.</div>`;
  }
  const currentIdx = STATUS_STEPS.indexOf(order.status);
  return `<div class="timeline">${STATUS_STEPS.map((s, idx) => {
    let cls = '';
    if (idx < currentIdx) cls = 'done';
    else if (idx === currentIdx) cls = 'current';
    return `<div class="step ${cls}"><div class="line"></div><div class="dot">${idx < currentIdx ? '✓' : ''}</div><span class="label">${s}</span></div>`;
  }).join('')}</div>`;
}

function orderCardHtml(order) {
  const statusClass = 'status-' + order.status.replace(/ /g, '-');
  const date = new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  return `
  <div class="order-card">
    <div class="order-card-head">
      <div>
        <div class="order-id">Order #${order._id.slice(-8).toUpperCase()}</div>
        <div class="order-date">${date}</div>
      </div>
      <span class="status-pill ${statusClass}">${escapeHtml(order.status)}</span>
    </div>

    <div class="order-items-row">
      ${order.items.map((i) => `<div class="order-item-chip"><span>${i.icon || '🛒'}</span><span>${escapeHtml(i.name)} × ${i.quantity}</span></div>`).join('')}
    </div>

    ${timelineHtml(order)}

    <div class="order-footer" style="margin-top:16px;">
      <div style="font-size:0.85rem; color:var(--text-muted);">
        Deliver to: ${escapeHtml(order.address.line)}, ${escapeHtml(order.address.city)}
      </div>
      <div style="display:flex; align-items:center; gap:14px;">
        <b>${formatMoney(order.totalAmount)}</b>
        ${order.status === 'Placed' ? `<button class="btn btn-outline btn-sm" data-action="cancel" data-id="${order._id}">Cancel Order</button>` : ''}
      </div>
    </div>
  </div>`;
}

async function loadOrders() {
  try {
    const data = await apiFetch('/orders');
    const list = document.getElementById('ordersList');
    const empty = document.getElementById('ordersEmpty');
    if (data.orders.length === 0) { empty.classList.remove('hidden'); return; }
    list.innerHTML = data.orders.map(orderCardHtml).join('');
    list.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-action="cancel"]');
      if (!btn) return;
      if (!confirm('Cancel this order?')) return;
      try {
        await apiFetch(`/orders/${btn.dataset.id}/cancel`, { method: 'POST' });
        showToast('Order cancelled', 'info');
        loadOrders();
      } catch (err) { showToast(err.message, 'error'); }
    }, { once: true });
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!requireLogin()) return;
  loadOrders();
});
