// ============ Profile page logic ============
let profileAddresses = [];

function renderAddressCards() {
  const container = document.getElementById('addressesContainer');
  if (profileAddresses.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; margin-bottom:14px;">No saved addresses yet.</p>`;
    return;
  }
  container.innerHTML = profileAddresses
    .map((a) => `
    <div class="address-card">
      <div>
        <span class="label-tag">${escapeHtml(a.label)}</span> ${a.isDefault ? '<span style="font-size:0.7rem;color:var(--success);font-weight:700;">DEFAULT</span>' : ''}
        <p style="font-size:0.85rem; color:var(--text-muted); margin-top:6px;">${escapeHtml(a.line)}, ${escapeHtml(a.city)} - ${escapeHtml(a.pincode)}<br/>📞 ${escapeHtml(a.phone)}</p>
      </div>
      <div class="flex gap-8">
        <button class="btn-ghost btn-sm" data-action="edit" data-id="${a._id}">Edit</button>
        <button class="btn-ghost btn-sm" data-action="delete" data-id="${a._id}" style="color:var(--danger);">Delete</button>
      </div>
    </div>`)
    .join('');
}

async function loadProfile() {
  const data = await apiFetch('/auth/me');
  const user = data.user;
  Auth.setUser(user);
  document.getElementById('pfName').value = user.name;
  document.getElementById('pfEmail').value = user.email;
  document.getElementById('pfPhone').value = user.phone || '';
  profileAddresses = user.addresses || [];
  renderAddressCards();
}

function openAddressModal(address) {
  document.getElementById('addressModal').classList.add('open');
  document.getElementById('addrModalTitle').textContent = address ? 'Edit Address' : 'Add Address';
  document.getElementById('addrId').value = address ? address._id : '';
  document.getElementById('addrLabel').value = address ? address.label : 'Home';
  document.getElementById('addrLine').value = address ? address.line : '';
  document.getElementById('addrCity').value = address ? address.city : '';
  document.getElementById('addrPincode').value = address ? address.pincode : '';
  document.getElementById('addrPhone').value = address ? address.phone : '';
  document.getElementById('addrDefault').checked = address ? address.isDefault : false;
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireLogin()) return;

  try { await loadProfile(); } catch (err) { showToast(err.message, 'error'); }

  // Tabs
  document.querySelectorAll('.profile-side button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.profile-side button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      ['details', 'addresses', 'password'].forEach((tab) => {
        document.getElementById('tab-' + tab).classList.toggle('hidden', tab !== btn.dataset.tab);
      });
    });
  });

  document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: document.getElementById('pfName').value.trim(), phone: document.getElementById('pfPhone').value.trim() }),
      });
      showToast('Profile updated', 'success');
      loadProfile();
    } catch (err) { showToast(err.message, 'error'); }
  });

  document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: document.getElementById('currentPassword').value,
          newPassword: document.getElementById('newPassword').value,
        }),
      });
      showToast('Password updated', 'success');
      e.target.reset();
    } catch (err) { showToast(err.message, 'error'); }
  });

  document.getElementById('addAddrBtnProfile').addEventListener('click', () => openAddressModal(null));
  document.getElementById('closeAddressModal').addEventListener('click', () => document.getElementById('addressModal').classList.remove('open'));

  document.getElementById('addressesContainer').addEventListener('click', async (e) => {
    const editBtn = e.target.closest('[data-action="edit"]');
    const delBtn = e.target.closest('[data-action="delete"]');
    if (editBtn) {
      const addr = profileAddresses.find((a) => a._id === editBtn.dataset.id);
      openAddressModal(addr);
    }
    if (delBtn) {
      if (!confirm('Delete this address?')) return;
      try {
        const data = await apiFetch(`/auth/addresses/${delBtn.dataset.id}`, { method: 'DELETE' });
        profileAddresses = data.addresses;
        renderAddressCards();
        showToast('Address deleted', 'info');
      } catch (err) { showToast(err.message, 'error'); }
    }
  });

  document.getElementById('addressForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('addrId').value;
    const payload = {
      label: document.getElementById('addrLabel').value,
      line: document.getElementById('addrLine').value.trim(),
      city: document.getElementById('addrCity').value.trim(),
      pincode: document.getElementById('addrPincode').value.trim(),
      phone: document.getElementById('addrPhone').value.trim(),
      isDefault: document.getElementById('addrDefault').checked,
    };
    try {
      const data = id
        ? await apiFetch(`/auth/addresses/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await apiFetch('/auth/addresses', { method: 'POST', body: JSON.stringify(payload) });
      profileAddresses = data.addresses;
      renderAddressCards();
      document.getElementById('addressModal').classList.remove('open');
      document.getElementById('addressForm').reset();
      showToast('Address saved', 'success');
    } catch (err) { showToast(err.message, 'error'); }
  });
});
