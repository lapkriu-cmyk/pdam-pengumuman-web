const form = document.getElementById('announcementForm');
const formTitle = document.getElementById('formTitle');
const formMessage = document.getElementById('formMessage');
const tableBody = document.getElementById('tableBody');
const resetBtn = document.getElementById('resetBtn');
const refreshBtn = document.getElementById('refreshBtn');
const logoutBtn = document.getElementById('logoutBtn');

let announcements = [];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function setMessage(text, type = '') {
  formMessage.textContent = text;
  formMessage.className = `message ${type}`.trim();
}

function resetForm() {
  form.reset();
  form.elements.id.value = '';
  form.elements.startDate.value = today();
  form.elements.published.checked = true;
  formTitle.textContent = 'Tambah Pengumuman';
  document.getElementById('saveBtn').textContent = 'Simpan Pengumuman';
  setMessage('');
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  let data = null;
  try { data = await res.json(); } catch (_) { data = {}; }
  if (!res.ok) {
    if (res.status === 401) window.location.href = '/admin/login';
    throw new Error(data.message || 'Terjadi kesalahan.');
  }
  return data;
}

async function loadAnnouncements() {
  tableBody.innerHTML = '<tr><td colspan="6">Memuat data...</td></tr>';
  try {
    announcements = await request('/api/admin/announcements');
    renderTable();
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message)}</td></tr>`;
  }
}

function renderTable() {
  tableBody.innerHTML = '';
  if (!announcements.length) {
    tableBody.innerHTML = '<tr><td colspan="6">Belum ada pengumuman.</td></tr>';
    return;
  }

  announcements.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="table-title">${escapeHtml(item.title)}</div>
        <div class="table-area">${escapeHtml(item.area || '-')}</div>
      </td>
      <td>${escapeHtml(item.category)}</td>
      <td><span class="status-pill">${escapeHtml(item.status)}</span></td>
      <td>${escapeHtml(item.priority)}</td>
      <td>${item.published ? 'Ya' : 'Tidak'}</td>
      <td>
        <div class="actions">
          <button type="button" data-action="edit" data-id="${escapeHtml(item.id)}">Edit</button>
          <button type="button" class="delete" data-action="delete" data-id="${escapeHtml(item.id)}">Hapus</button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage('Menyimpan data...');
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.published = form.elements.published.checked;
  const id = payload.id;
  delete payload.id;

  try {
    if (id) {
      await request(`/api/admin/announcements/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      setMessage('Pengumuman berhasil diperbarui.', 'success');
    } else {
      await request('/api/admin/announcements', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setMessage('Pengumuman berhasil ditambahkan.', 'success');
    }
    await loadAnnouncements();
    setTimeout(resetForm, 500);
  } catch (error) {
    setMessage(error.message, 'error');
  }
});

tableBody.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const id = button.dataset.id;
  const action = button.dataset.action;
  const item = announcements.find((row) => row.id === id);
  if (!item) return;

  if (action === 'edit') {
    form.elements.id.value = item.id;
    form.elements.title.value = item.title || '';
    form.elements.message.value = item.message || '';
    form.elements.category.value = item.category || 'Info Umum';
    form.elements.status.value = item.status || 'Aktif';
    form.elements.area.value = item.area || '';
    form.elements.priority.value = item.priority || 'Normal';
    form.elements.startDate.value = item.startDate || '';
    form.elements.endDate.value = item.endDate || '';
    form.elements.published.checked = Boolean(item.published);
    formTitle.textContent = 'Edit Pengumuman';
    document.getElementById('saveBtn').textContent = 'Update Pengumuman';
    setMessage('Mode edit aktif.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (action === 'delete') {
    const yakin = confirm(`Hapus pengumuman: ${item.title}?`);
    if (!yakin) return;
    try {
      await request(`/api/admin/announcements/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await loadAnnouncements();
    } catch (error) {
      alert(error.message);
    }
  }
});

resetBtn.addEventListener('click', resetForm);
refreshBtn.addEventListener('click', loadAnnouncements);
logoutBtn.addEventListener('click', async () => {
  try {
    await request('/api/admin/logout', { method: 'POST' });
  } finally {
    window.location.href = '/admin/login';
  }
});

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

resetForm();
loadAnnouncements();
