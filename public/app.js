const listEl = document.getElementById('announcementList');
const emptyEl = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');
const importantBox = document.getElementById('importantBox');
const yearEl = document.getElementById('year');

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const createEl = (tag, className, text) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
};

async function loadSettings() {
  try {
    const res = await fetch('/api/settings');
    const settings = await res.json();
    document.title = `Info Pelanggan ${settings.name}`;
    document.getElementById('pdamName').textContent = settings.name;
    document.getElementById('footerName').textContent = settings.name;
    document.getElementById('footerContact').textContent = `${settings.phone} • ${settings.email}`;
    const phone = String(settings.phone || '').replace(/[^0-9]/g, '');
    const waPhone = phone.startsWith('0') ? `62${phone.slice(1)}` : phone;
    const waButton = document.getElementById('waButton');
    waButton.href = `https://wa.me/${waPhone}?text=Halo%20${encodeURIComponent(settings.name)}%2C%20saya%20ingin%20bertanya%20tentang%20layanan%20air.`;
  } catch (error) {
    console.error(error);
  }
}

async function loadAnnouncements() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set('q', searchInput.value.trim());
  if (categoryFilter.value) params.set('category', categoryFilter.value);
  if (statusFilter.value) params.set('status', statusFilter.value);

  listEl.innerHTML = '<article class="card"><p>Memuat informasi...</p></article>';
  importantBox.hidden = true;
  importantBox.textContent = '';

  try {
    const res = await fetch(`/api/announcements?${params.toString()}`);
    const items = await res.json();
    listEl.innerHTML = '';

    const important = items.find((item) => item.priority === 'Darurat' || item.priority === 'Penting');
    if (important) {
      importantBox.hidden = false;
      importantBox.textContent = `${important.priority}: ${important.title} — ${important.area}`;
    }

    if (!items.length) {
      emptyEl.hidden = false;
      return;
    }

    emptyEl.hidden = true;
    items.forEach((item) => listEl.appendChild(renderCard(item)));
  } catch (error) {
    listEl.innerHTML = '';
    emptyEl.hidden = false;
    emptyEl.querySelector('h3').textContent = 'Gagal memuat informasi.';
    emptyEl.querySelector('p').textContent = 'Periksa koneksi atau hubungi admin PDAM.';
  }
}

function renderCard(item) {
  const card = createEl('article', 'card');
  const header = createEl('div', 'card-header');
  const title = createEl('h3', '', item.title);
  const priority = createEl('span', `badge ${item.priority}`, item.priority);
  header.append(title, priority);

  const badges = createEl('div', 'badges');
  badges.append(
    createEl('span', 'badge', item.category),
    createEl('span', 'badge', item.status)
  );

  const message = createEl('p', '', item.message);
  const meta = createEl('div', 'meta');
  const area = createEl('span');
  area.innerHTML = `<strong>Wilayah:</strong> ${escapeHtml(item.area || '-')}`;
  const date = createEl('span');
  const range = item.endDate ? `${formatDate(item.startDate)} s.d. ${formatDate(item.endDate)}` : formatDate(item.startDate);
  date.innerHTML = `<strong>Tanggal:</strong> ${escapeHtml(range)}`;
  meta.append(area, date);

  card.append(header, badges, message, meta);
  return card;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

let timer;
[searchInput, categoryFilter, statusFilter].forEach((el) => {
  el.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(loadAnnouncements, 250);
  });
});

yearEl.textContent = new Date().getFullYear();
loadSettings();
loadAnnouncements();
