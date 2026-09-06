// ============ Cart page logic ============
const cartPageState = {
  items: [],
  subtotal: 0,
  discount: 0,
  deliveryFee: 0,
  couponCode: '',
  addresses: [],
  selectedAddressId: null,
  availableCoupons: [],
};

const FREE_DELIVERY_THRESHOLD = 199;
const DELIVERY_FEE = 25;

function recalcTotals() {
  cartPageState.subtotal = cartPageState.items.reduce((sum, i) => sum + i.subtotal, 0);
  const afterDiscount = cartPageState.subtotal - cartPageState.discount;
  cartPageState.deliveryFee = afterDiscount >= FREE_DELIVERY_THRESHOLD || cartPageState.items.length === 0 ? 0 : DELIVERY_FEE;
  renderSummary();
}

function renderSummary() {
  document.getElementById('sumSubtotal').textContent = formatMoney(cartPageState.subtotal);
  document.getElementById('sumDiscount').textContent = '-' + formatMoney(cartPageState.discount);
  document.getElementById('sumDelivery').textContent = cartPageState.deliveryFee === 0 ? 'FREE' : formatMoney(cartPageState.deliveryFee);
  const total = cartPageState.subtotal - cartPageState.discount + cartPageState.deliveryFee;
  document.getElementById('sumTotal').textContent = formatMoney(Math.max(total, 0));
}

function renderCartItems() {
  const list = document.getElementById('cartItemsList');
  const layout = document.getElementById('cartLayout');
  const empty = document.getElementById('cartEmpty');
  const loading = document.getElementById('cartLoading');
  loading.classList.add('hidden');

  if (cartPageState.items.length === 0) {
    layout.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }
  layout.classList.remove('hidden');
  empty.classList.add('hidden');

  list.innerHTML = cartPageState.items
    .map((i) => `
    <div class="cart-item" data-id="${i.product._id}">
      <div class="media">${i.product.icon || '🛒'}</div>
      <div class="info">
        <h4>${escapeHtml(i.product.name)}</h4>
        <div class="unit">${escapeHtml(i.product.unit)} · ${formatMoney(i.product.price)} each</div>
        <div class="qty-stepper" style="max-width:120px; margin-top:8px;">
          <button data-action="dec" data-id="${i.product._id}">−</button>
          <span>${i.quantity}</span>
          <button data-action="inc" data-id="${i.product._id}">+</button>
        </div>
      </div>
      <div class="price-col">
        <div class="line-total">${formatMoney(i.subtotal)}</div>
        <a href="#" class="remove-link" data-action="remove" data-id="${i.product._id}">Remove</a>
      </div>
    </div>`)
    .join('');
}

async function loadCart() {
  try {
    const data = await apiFetch('/cart');
    cartPageState.items = data.items;
    renderCartItems();
    recalcTotals();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function changeQty(productId, delta) {
  const item = cartPageState.items.find((i) => i.product._id === productId);
  if (!item) return;
  const newQty = item.quantity + delta;
  try {
    const data = await apiFetch('/cart/update', { method: 'PUT', body: JSON.stringify({ productId, quantity: newQty }) });
    cartPageState.items = data.items;
    renderCartItems();
    recalcTotals();
  } catch (err) { showToast(err.message, 'error'); }
}

async function removeItem(productId) {
  try {
    const data = await apiFetch(`/cart/remove/${productId}`, { method: 'DELETE' });
    cartPageState.items = data.items;
    renderCartItems();
    recalcTotals();
    showToast('Item removed', 'info');
  } catch (err) { showToast(err.message, 'error'); }
}

// ---- Coupons ----
async function loadAvailableCoupons() {
  try {
    const data = await apiFetch('/coupons');
    cartPageState.availableCoupons = data.coupons;
    renderAvailableCoupons();
  } catch (e) { /* silent */ }
}

function renderAvailableCoupons() {
  const box = document.getElementById('availableCoupons');
  if (cartPageState.couponCode) { box.innerHTML = ''; return; }
  box.innerHTML = cartPageState.availableCoupons
    .map((c) => `
    <div class="coupon-suggest">
      <span><b>${escapeHtml(c.code)}</b> — ${escapeHtml(c.description)}</span>
      <button class="btn btn-outline btn-sm" data-code="${escapeHtml(c.code)}">Apply</button>
    </div>`)
    .join('');
  box.querySelectorAll('button[data-code]').forEach((btn) => {
    btn.addEventListener('click', () => applyCoupon(btn.dataset.code));
  });
}

async function applyCoupon(code) {
  if (!code) return;
  try {
    const data = await apiFetch('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal: cartPageState.subtotal }),
    });
    cartPageState.discount = data.discount;
    cartPageState.couponCode = data.code;
    document.getElementById('couponAppliedBox').innerHTML = `
      <div class="coupon-chip"><span>🏷️ ${escapeHtml(data.code)} applied — you saved ${formatMoney(data.discount)}</span>
      <button id="removeCouponBtn" style="background:none;border:none;color:var(--brand-dark);font-weight:700;">✕</button></div>`;
    document.getElementById('removeCouponBtn').addEventListener('click', removeCoupon);
    document.getElementById('couponInput').value = '';
    renderAvailableCoupons();
    recalcTotals();
    showToast('Coupon applied!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function removeCoupon() {
  cartPageState.discount = 0;
  cartPageState.couponCode = '';
  document.getElementById('couponAppliedBox').innerHTML = '';
  renderAvailableCoupons();
  recalcTotals();
}

// ---- Addresses ----
async function loadAddresses() {
  try {
    const data = await apiFetch('/auth/me');
    cartPageState.addresses = data.user.addresses || [];
    if (!cartPageState.selectedAddressId) {
      const def = cartPageState.addresses.find((a) => a.isDefault) || cartPageState.addresses[0];
      cartPageState.selectedAddressId = def ? def._id : null;
    }
    renderAddresses();
  } catch (err) { /* silent */ }
}

function renderAddresses() {
  const list = document.getElementById('addressList');
  if (cartPageState.addresses.length === 0) {
    list.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem;">No saved address yet. Add one to continue.</p>`;
    return;
  }
  list.innerHTML = cartPageState.addresses
    .map((a) => `
    <div class="address-option ${a._id === cartPageState.selectedAddressId ? 'selected' : ''}" data-id="${a._id}">
      <span class="label-tag">${escapeHtml(a.label)}</span>
      <p>${escapeHtml(a.line)}, ${escapeHtml(a.city)} - ${escapeHtml(a.pincode)}<br/>📞 ${escapeHtml(a.phone)}</p>
    </div>`)
    .join('');
  list.querySelectorAll('.address-option').forEach((el) => {
    el.addEventListener('click', () => {
      cartPageState.selectedAddressId = el.dataset.id;
      renderAddresses();
    });
  });
}

async function saveNewAddress(e) {
  e.preventDefault();
  try {
    const data = await apiFetch('/auth/addresses', {
      method: 'POST',
      body: JSON.stringify({
        label: document.getElementById('addrLabel').value,
        line: document.getElementById('addrLine').value.trim(),
        city: document.getElementById('addrCity').value.trim(),
        pincode: document.getElementById('addrPincode').value.trim(),
        phone: document.getElementById('addrPhone').value.trim(),
      }),
    });
    cartPageState.addresses = data.addresses;
    cartPageState.selectedAddressId = data.addresses[data.addresses.length - 1]._id;
    renderAddresses();
    document.getElementById('addressModal').classList.remove('open');
    document.getElementById('addressForm').reset();
    showToast('Address saved', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

// ---- Checkout ----
async function placeOrder() {
  if (!cartPageState.selectedAddressId) {
    showToast('Please add or select a delivery address', 'error');
    return;
  }
  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;
  btn.textContent = 'Placing order...';
  try {
    const payload = {
      addressId: cartPageState.selectedAddressId,
      couponCode: cartPageState.couponCode || undefined,
      paymentMethod: document.getElementById('paymentMethod').value,
    };
    const data = await apiFetch('/orders/checkout', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Order placed successfully! 🎉', 'success');
    setTimeout(() => { window.location.href = '/orders.html'; }, 900);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Place Order';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireLogin()) return;

  await Promise.all([loadCart(), loadAvailableCoupons(), loadAddresses()]);

  document.getElementById('cartItemsList').addEventListener('click', (e) => {
    e.preventDefault();
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (btn.dataset.action === 'inc') changeQty(id, 1);
    else if (btn.dataset.action === 'dec') changeQty(id, -1);
    else if (btn.dataset.action === 'remove') removeItem(id);
  });

  document.getElementById('applyCouponBtn').addEventListener('click', () => {
    applyCoupon(document.getElementById('couponInput').value.trim());
  });

  document.getElementById('addAddressBtn').addEventListener('click', () => {
    document.getElementById('addressModal').classList.add('open');
  });
  document.getElementById('closeAddressModal').addEventListener('click', () => {
    document.getElementById('addressModal').classList.remove('open');
  });
  document.getElementById('addressForm').addEventListener('submit', saveNewAddress);
  document.getElementById('placeOrderBtn').addEventListener('click', placeOrder);
});
