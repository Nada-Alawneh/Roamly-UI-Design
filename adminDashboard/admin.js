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

/* ---------- 2. DYNAMIC RENDERING ---------- */
function renderBookings(list) {
  const tbody = document.getElementById('bookings-tbody');
  if (!tbody) return;

  tbody.innerHTML = list.map(b => `
    <tr>
      <td style="font-weight:700;color:var(--ink);">${b.name}</td>
      <td>${b.dest}</td>
      <td style="font-family:monospace;color:var(--muted);">${b.ref}</td>
      <td><span class="badge" style="background:${b.payBg};color:${b.payFg};">${b.pay}</span></td>
      <td><span class="badge" style="background:${b.statBg};color:${b.statFg};">${b.status}</span></td>
      <td style="text-align:right;">
        <button class="icon-btn" title="Delete Booking" onclick="this.closest('tr').remove()">
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
        <span class="promo-code">${p.code}</span>
        <span class="badge" style="background:var(--emerald-bg);color:var(--emerald);">Active</span>
      </div>
      <p class="promo-desc">${p.desc}</p>
      <p class="promo-redemp">Redemptions: ${p.redemp}</p>
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
  // Hide all tabs & activate the selected one
  document.querySelectorAll('.admin-tab').forEach(el => el.classList.remove('active'));
  const targetTab = document.getElementById('tab-' + tabId);
  if (targetTab) targetTab.classList.add('active');

  // Update sidebar active link
  document.querySelectorAll('.admin-nav-link').forEach(el => el.classList.remove('active'));
  const targetNav = document.getElementById('nav-' + tabId);
  if (targetNav) targetNav.classList.add('active');

  // Update topbar heading
  const titleEl = document.getElementById('admin-page-title');
  if (titleEl && titles[tabId]) titleEl.innerText = titles[tabId];
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
  renderBookings(bookings);
  renderPrompts();
  renderPromos();

  // ميزة فلترة الجدول الحية عند الكتابة بمربع البحث
  const filterInput = document.getElementById('bookings-filter');
  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = bookings.filter(b => 
        b.name.toLowerCase().includes(q) ||
        b.dest.toLowerCase().includes(q) ||
        b.ref.toLowerCase().includes(q) ||
        b.status.toLowerCase().includes(q)
      );
      renderBookings(filtered);
    });
  }
});