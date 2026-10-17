/**
 * Roamly Admin Command Hub — Interactions & Logic
 */

/* ---------- 1. DATA SOURCES ---------- */
const bookings = [
  {
    name: 'Nada Alawneh',
    dest: 'Istanbul, Turkey',
    ref: '#RMLY-9824X',
    pay: 'Paid in Full ($4.99)',
    payBg: 'var(--sky-bg)',
    payFg: 'var(--sky)',
    status: 'Confirmed',
    statBg: 'var(--emerald-bg)',
    statFg: 'var(--emerald)'
  },
  {
    name: 'Ahmad Omar',
    dest: 'Paris, France',
    ref: '#RMLY-4412B',
    pay: 'Split Bill ($3.50/ea)',
    payBg: 'var(--amber-bg)',
    payFg: 'var(--gold-600)',
    status: 'Pending Party',
    statBg: 'var(--amber-bg)',
    statFg: 'var(--gold-600)'
  },
  {
    name: 'Sara Khalid',
    dest: 'Bali, Indonesia',
    ref: '#RMLY-7731C',
    pay: 'Wallet Credit ($28.00)',
    payBg: 'var(--purple-bg)',
    payFg: 'var(--purple)',
    status: 'Confirmed',
    statBg: 'var(--emerald-bg)',
    statFg: 'var(--emerald)'
  }
];

const prompts = [
  {
    text: '"Make it a Seafood restaurant instead of museum"',
    status: 'Handled successfully in 1.2s',
    uid: '#8921',
    trip: 'Istanbul Trip'
  },
  {
    text: '"Make it kid-friendly activity"',
    status: 'Handled successfully in 0.9s',
    uid: '#1142',
    trip: 'Paris Trip'
  },
  {
    text: '"Swap Day 3 hike for a spa day instead"',
    status: 'Handled successfully in 1.0s',
    uid: '#5033',
    trip: 'Bali Trip'
  }
];

const promos = [
  {
    code: 'ROAM20',
    desc: '20% off on Pro Monthly subscription.',
    redemp: '142 users'
  },
  {
    code: 'VIP50',
    desc: '50% off on Annual Family plans.',
    redemp: '48 users'
  },
  {
    code: 'WELCOME10',
    desc: '10% off first AI itinerary for new users.',
    redemp: '312 users'
  }
];

const bookingQuery = { value: '' };
const promoStorageKey = 'roamly-admin-promos';
const settingsStorageKey = 'roamly-admin-settings';
const profileStorageKey = 'roamly-admin-profile';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}

/* ---------- 2. DYNAMIC RENDERING ---------- */
function renderBookings(list) {
  const tbody = document.getElementById('bookings-tbody');
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = '<tr><td class="empty-state" colspan="6">No bookings match your search.</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(b => `
    <tr>
      <td class="booking-name">${escapeHtml(b.name)}</td>
      <td>${escapeHtml(b.dest)}</td>
      <td class="booking-reference">${escapeHtml(b.ref)}</td>
      <td><span class="badge" style="background:${b.payBg};color:${b.payFg};">${escapeHtml(b.pay)}</span></td>
      <td><span class="badge" style="background:${b.statBg};color:${b.statFg};">${escapeHtml(b.status)}</span></td>
      <td style="text-align:right;">
        <button class="icon-btn" type="button" title="Remove booking" aria-label="Remove booking ${escapeHtml(b.ref)}" data-delete-booking="${escapeHtml(b.ref)}">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function renderPrompts() {
  const container = document.getElementById('prompts-body');
  if (!container) return;

  container.innerHTML = prompts.map(p => `
    <div class="prompt-card">
      <div>
        <div class="prompt-eyebrow">User Request / Micro-Prompt</div>
        <div class="prompt-text">${p.text}</div>
        <span class="prompt-status"><i class="fa-solid fa-circle-check"></i> ${p.status}</span>
      </div>
      <div class="prompt-meta">User ID: ${p.uid}<br>${p.trip}</div>
    </div>
  `).join('');
}

function renderPromos() {
  const container = document.getElementById('promo-grid');
  if (!container) return;

  container.innerHTML = promos.map(p => `
    <div class="promo-card">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span class="promo-code">${escapeHtml(p.code)}</span>
        <span class="badge" style="background:var(--emerald-bg);color:var(--emerald);">Active</span>
      </div>
      <p class="promo-desc">${escapeHtml(p.desc)}</p>
      <p class="promo-redemp">Redemptions: ${escapeHtml(p.redemp)}</p>
    </div>
  `).join('');
}

/* ---------- 3. TAB SWITCHING ---------- */
const titles = {
  overview: 'Dashboard Overview',
  bookings: 'Bookings & Split Bills Ledger',
  'ai-monitor': 'AI Prompts & Activity Monitor',
  promos: 'Promo Codes Management',
  settings: 'System Settings'
};

function switchAdminTab(tabId) {
  if (!titles[tabId]) return;
  if (window.location.hash !== `#${tabId}`) history.replaceState(null, '', `#${tabId}`);
  // Hide all tabs & activate the selected one
  document.querySelectorAll('.admin-tab').forEach(el => el.classList.remove('active'));
  const targetTab = document.getElementById('tab-' + tabId);
  if (targetTab) targetTab.classList.add('active');

  // Update sidebar active link
  document.querySelectorAll('.admin-nav-link').forEach(el => el.classList.remove('active'));
  const targetNav = document.getElementById('nav-' + tabId);
  document.querySelectorAll('.admin-nav-link').forEach(el => el.removeAttribute('aria-current'));
  if (targetNav) {
    targetNav.classList.add('active');
    targetNav.setAttribute('aria-current', 'page');
  }

  // Update topbar heading
  const titleEl = document.getElementById('admin-page-title');
  if (titleEl && titles[tabId]) titleEl.innerText = titles[tabId];
}

function clearAiCache() {
  try { localStorage.removeItem('roamly-ai-cache'); } catch (error) { /* Storage may be unavailable in private browsing. */ }
  showToast('AI response cache cleared. The next request will refresh results.', 'broom');
}

function sendBroadcast() {
  const message = window.prompt('Write the announcement for active travelers:');
  if (!message || !message.trim()) return;
  try {
    localStorage.setItem('roamly-admin-last-broadcast', JSON.stringify({ message: message.trim(), createdAt: new Date().toISOString() }));
    showToast('Announcement saved in the dashboard.', 'bullhorn');
  } catch (error) {
    showToast('This browser could not save the announcement.', 'triangle-exclamation');
  }
}

function downloadBackup() {
  const backup = {
    exportedAt: new Date().toISOString(),
    bookings,
    prompts,
    promos,
    settings: readSettings()
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `roamly-admin-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Your dashboard backup has been downloaded.', 'database');
}

function addPromo() {
  const code = window.prompt('Enter a promo code (for example, ROAM25):');
  if (!code || !code.trim()) return;
  const normalizedCode = code.trim().toUpperCase();
  if (promos.some(promo => promo.code.toLowerCase() === normalizedCode.toLowerCase())) {
    showToast('That promo code already exists.', 'triangle-exclamation');
    return;
  }
  const desc = window.prompt('Describe the offer:');
  if (!desc || !desc.trim()) return;
  promos.unshift({ code: normalizedCode, desc: desc.trim(), redemp: '0 users' });
  persistPromos();
  renderPromos();
  showToast(`${normalizedCode} is now in your promo list.`, 'ticket');
}

function persistPromos() {
  try { localStorage.setItem(promoStorageKey, JSON.stringify(promos)); } catch (error) { /* Keep the current session usable if storage is unavailable. */ }
}

function readSettings() {
  try { return JSON.parse(localStorage.getItem(settingsStorageKey) || '{}'); }
  catch (error) { return {}; }
}

function readAdminProfile() {
  try {
    const profile = JSON.parse(localStorage.getItem(profileStorageKey) || '{}');
    return profile && typeof profile === 'object' ? profile : {};
  }
  catch (error) { return {}; }
}

function updateAdminProfileSummary() {
  const profile = readAdminProfile();
  const name = String(profile.name || 'Nada Alawneh');
  const role = String(profile.role || 'Lead System Architect');
  const nameEl = document.getElementById('adminProfileName');
  const roleEl = document.getElementById('adminProfileRole');
  const avatarEl = document.getElementById('adminProfileAvatar');
  if (nameEl) nameEl.textContent = name;
  if (roleEl) roleEl.textContent = role;
  if (avatarEl) {
    avatarEl.textContent = name.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase();
    if (typeof profile.photo === 'string' && /^data:image\/(png|jpeg|webp);base64,/.test(profile.photo)) {
      avatarEl.style.backgroundImage = `url("${profile.photo}")`;
      avatarEl.classList.add('avatar--photo');
    } else {
      avatarEl.style.backgroundImage = '';
      avatarEl.classList.remove('avatar--photo');
    }
  }
}

function saveSettings() {
  const settings = {
    brand: document.getElementById('setting-brand').value.trim(),
    engine: document.getElementById('setting-engine').value,
    price: document.getElementById('setting-price').value,
    status: document.getElementById('setting-status').value
  };
  if (!settings.brand || Number(settings.price) < 0 || settings.price === '') {
    showToast('Enter a platform name and a valid subscription price.', 'triangle-exclamation');
    return;
  }
  try {
    localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
    showToast('Platform settings saved on this device.', 'gear');
  } catch (error) {
    showToast('Settings could not be saved in this browser.', 'triangle-exclamation');
  }
}

/* ---------- 4. TOAST NOTIFICATIONS ---------- */
let toastTimer;
function showToast(msg, icon) {
  const el = document.getElementById('toast');
  const msgEl = document.getElementById('toast-msg');
  const iconEl = document.getElementById('toast-icon');

  if (!el || !msgEl || !iconEl) return;

  msgEl.innerText = msg;
  iconEl.className = 'fa-solid fa-' + (icon || 'circle-check');
  el.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ---------- 5. INITIALIZATION & LIVE FILTER ---------- */
document.addEventListener('DOMContentLoaded', () => {
  updateAdminProfileSummary();

  const profileToggle = document.getElementById('profileMenuToggle');
  const profileMenu = document.getElementById('profileMenu');
  if (profileToggle && profileMenu) {
    profileToggle.addEventListener('click', () => {
      const open = profileToggle.getAttribute('aria-expanded') === 'true';
      profileToggle.setAttribute('aria-expanded', String(!open));
      profileMenu.hidden = open;
    });
    document.addEventListener('click', event => {
      if (!event.target.closest('.profile-menu-wrap')) {
        profileToggle.setAttribute('aria-expanded', 'false');
        profileMenu.hidden = true;
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        profileToggle.setAttribute('aria-expanded', 'false');
        profileMenu.hidden = true;
        profileToggle.focus();
      }
    });
  }

  try {
    const savedPromos = JSON.parse(localStorage.getItem(promoStorageKey) || 'null');
    if (Array.isArray(savedPromos)) promos.splice(0, promos.length, ...savedPromos);
  } catch (error) { /* Use the sample promo list if stored data is invalid. */ }

  renderBookings(bookings);
  renderPrompts();
  renderPromos();

  const dateEl = document.getElementById('dashboard-date');
  if (dateEl) dateEl.textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());

  const settings = readSettings();
  if (settings.brand) document.getElementById('setting-brand').value = settings.brand;
  if (settings.engine) document.getElementById('setting-engine').value = settings.engine;
  if (settings.price) document.getElementById('setting-price').value = settings.price;
  if (settings.status) document.getElementById('setting-status').value = settings.status;

  const initialTab = window.location.hash.slice(1);
  if (titles[initialTab]) switchAdminTab(initialTab);

  // ميزة فلترة الجدول الحية عند الكتابة بمربع البحث
  const filterInput = document.getElementById('bookings-filter');
  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = bookings.filter(b => 
        b.name.toLowerCase().includes(q) ||
        b.dest.toLowerCase().includes(q) ||
        b.ref.toLowerCase().includes(q) ||
        b.pay.toLowerCase().includes(q) ||
        b.status.toLowerCase().includes(q)
      );
      renderBookings(filtered);
      bookingQuery.value = q;
    });
  }

  document.getElementById('bookings-tbody')?.addEventListener('click', event => {
    const deleteButton = event.target.closest('[data-delete-booking]');
    if (!deleteButton) return;
    const ref = deleteButton.dataset.deleteBooking;
    if (!window.confirm(`Remove booking ${ref} from this session?`)) return;
    const index = bookings.findIndex(booking => booking.ref === ref);
    if (index < 0) return;
    bookings.splice(index, 1);
    renderBookings(bookings.filter(booking => `${booking.name} ${booking.dest} ${booking.ref} ${booking.pay} ${booking.status}`.toLowerCase().includes(bookingQuery.value)));
    showToast(`Booking ${ref} removed from this session.`, 'trash-can');
  });
});

window.addEventListener('hashchange', () => {
  const tabId = window.location.hash.slice(1);
  if (titles[tabId]) switchAdminTab(tabId);
});
