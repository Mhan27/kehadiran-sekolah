/* =======================================================================
   SISTEM KEHADIRAN GURU & KARYAWAN — SMP MUHAMMADIYAH 7 SURABAYA
   Vanilla HTML / CSS / JS version. Data disimpan di Firebase (Firestore).
======================================================================= */

/* =========================================================================
   GANTI BAGIAN INI dengan firebaseConfig dari Firebase Console proyekmu
   ========================================================================= */
const firebaseConfig = {
  apiKey: "GANTI_DENGAN_API_KEY",
  authDomain: "GANTI_DENGAN_PROJECT.firebaseapp.com",
  projectId: "GANTI_DENGAN_PROJECT_ID",
  storageBucket: "GANTI_DENGAN_PROJECT.appspot.com",
  messagingSenderId: "GANTI_DENGAN_SENDER_ID",
  appId: "GANTI_DENGAN_APP_ID"
};
/* ========================================================================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, setDoc, deleteDoc, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let fbApp, auth, db;
let firebaseReady = false;
let firebaseInitError = null;
function isFirebaseConfigFilled(cfg) {
  return Object.values(cfg).every((v) => typeof v === 'string' && v.trim() && !v.includes('GANTI'));
}
try{
  if (isFirebaseConfigFilled(firebaseConfig)) {
    fbApp = initializeApp(firebaseConfig);
    auth = getAuth(fbApp);
    db = getFirestore(fbApp);
    firebaseReady = true;
  }
}catch(e){
  firebaseInitError = e;
  console.error("Gagal inisialisasi Firebase:", e);
}

/* ---------------------------- ICONS (inline SVG) ---------------------------- */
const icon = (path, size = 16) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

const ICONS = {
  dashboard: icon('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
  userPlus: icon('<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-7 7-7s7 3 7 7"/><path d="M19 8v6M16 11h6"/>'),
  users: icon('<circle cx="8" cy="8" r="3.5"/><path d="M2 21c0-3.5 2.7-6 6-6s6 2.5 6 6"/><path d="M15 6.5c1.7 0 3 1.3 3 3s-1.3 3-3 3"/><path d="M22 21c0-3-2-5.2-4.5-5.8"/>'),
  clock: icon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'),
  clipboard: icon('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v-1.5H9z"/><path d="M9 11h6M9 15h4"/>'),
  logOut: icon('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>'),
  trash: icon('<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/>'),
  plus: icon('<path d="M12 5v14M5 12h14"/>'),
  checkCircle: icon('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>', 13),
  alertTriangle: icon('<path d="M12 3l10 18H2L12 3z"/><path d="M12 10v4M12 17h.01"/>', 13),
  xCircle: icon('<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>', 13),
  sunSmall: icon('<circle cx="12" cy="12" r="9"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M6 6l1.5 1.5M16.5 16.5L18 18M6 18l1.5-1.5M16.5 7.5L18 6"/>', 13),
  menu: icon('<path d="M4 6h16M4 12h16M4 18h16"/>', 22),
  x: icon('<path d="M6 6l12 12M18 6L6 18"/>', 22),
  search: icon('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>'),
  save: icon('<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v6h8V4M8 14h8v6H8z"/>', 14),
  download: icon('<path d="M12 3v12m0 0l-4.5-4.5M12 15l4.5-4.5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>', 16),
};

/* ---------------------------- SUN MOTIF ---------------------------- */
function sunMotif(size = 64, opacity = 1, color = 'var(--green-700)') {
  const rays = 16;
  let bars = '';
  for (let i = 0; i < rays; i++) {
    const angle = (360 / rays) * i;
    bars += `<rect x="-2.5" y="-98" width="5" height="42" rx="2.5" fill="${color}" transform="rotate(${angle})"/>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 200 200" style="opacity:${opacity}">
    <g transform="translate(100,100)">${bars}<circle r="34" fill="none" stroke="${color}" stroke-width="3"/></g>
  </svg>`;
}

/* ---------------------------- HELPERS ---------------------------- */
const pad2 = (n) => String(n).padStart(2, '0');
const dateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const todayKey = () => dateKey(new Date());
const isSunday = (dstr) => new Date(dstr + 'T00:00:00').getDay() === 0;
const toMinutes = (t) => { if (!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const DAY_NAMES_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTH_NAMES_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const formatIndo = (dstr) => { const d = new Date(dstr + 'T00:00:00'); return `${DAY_NAMES_ID[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES_ID[d.getMonth()]} ${d.getFullYear()}`; };
const daysInMonth = (year, monthIdx) => new Date(year, monthIdx + 1, 0).getDate();
const uid = (p = 'id') => `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const escapeHtml = (str) => String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

const DEFAULT_SCHEDULE = { jamMasuk: '07:00', jamPulang: '14:00' };
const TOLERANCE_MIN = 5;

function getSchedule(schedules, staffId) {
  return schedules.find((s) => s.staffId === staffId) || DEFAULT_SCHEDULE;
}
function computeStatus(jamInput, jamMasuk) {
  if (!jamInput) return 'Alpa';
  const inMin = toMinutes(jamInput);
  const cutoff = toMinutes(jamMasuk) + TOLERANCE_MIN;
  return inMin <= cutoff ? 'Hadir' : 'Terlambat';
}
function badgeHtml(status) {
  const map = {
    Hadir: { cls: 'badge-hadir', icon: ICONS.checkCircle },
    Terlambat: { cls: 'badge-terlambat', icon: ICONS.alertTriangle },
    Alpa: { cls: 'badge-alpa', icon: ICONS.xCircle },
    Libur: { cls: 'badge-libur', icon: ICONS.sunSmall },
  };
  const m = map[status] || map.Alpa;
  return `<span class="badge ${m.cls}">${m.icon}${status}</span>`;
}

/* ---------------------------- STORAGE (Firestore) ---------------------------- */
async function loadAllData(){
  const [usersSnap, staffSnap, schedSnap, attSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'staff')),
    getDocs(collection(db, 'schedules')),
    getDocs(collection(db, 'attendance')),
  ]);
  state.users = usersSnap.docs.map((d) => d.data());
  state.staff = staffSnap.docs.map((d) => d.data());
  state.schedules = schedSnap.docs.map((d) => d.data());
  state.attendance = attSnap.docs.map((d) => d.data());

  if (state.users.length === 0) {
    const superadmin = { id: uid('usr'), fullName: 'Super Admin', username: 'superadmin', password: 'super123', role: 'superadmin' };
    await setDoc(doc(db, 'users', superadmin.username), superadmin);
    state.users = [superadmin];
  }
}

/* ---------------------------- APP STATE ---------------------------- */
const state = {
  users: [],
  staff: [],
  schedules: [],
  attendance: [],
  currentUser: null,
  page: 'dashboard',
  mobileOpen: false,
  toast: null,
  confirm: null,       // { title, body, onConfirm }
  reportTab: 'harian',
  reportDate: todayKey(),
  staffSelected: [],
  staffQuery: '',
};

let chartInstance = null;
let toastTimer = null;

function notify(message, type = 'success') {
  state.toast = { message, type };
  render();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { state.toast = null; renderToastOnly(); }, 2600);
}
function renderToastOnly() {
  const el = document.getElementById('toast-slot');
  if (el) el.innerHTML = state.toast ? toastHtml() : '';
}
function toastHtml() {
  if (!state.toast) return '';
  return `<div class="toast ${state.toast.type}">${escapeHtml(state.toast.message)}</div>`;
}

/* ---------------------------- RENDER ROOT ---------------------------- */
function render() {
  const app = document.getElementById('app');
  if (!state.currentUser) {
    app.innerHTML = renderLogin();
    attachLoginEvents();
    return;
  }
  app.innerHTML = renderShell();
  attachShellEvents();
}

/* ---------------------------- LOGIN PAGE ---------------------------- */
function renderLogin() {
  return `
    <div class="login-page">
      <div class="sun-decor top">${sunMotif(360, 0.10, '#C9A227')}</div>
      <div class="sun-decor bottom">${sunMotif(300, 0.07, '#C9A227')}</div>
      <div class="card login-card">
        <div class="login-logo"><img src="logo.png" alt="Logo SMP Muhammadiyah 7 Surabaya" class="brand-logo brand-logo-lg" /></div>
        <p class="login-eyebrow">SMP Muhammadiyah 7 Surabaya</p>
        <h1 class="login-title">Sistem Kehadiran</h1>
        <div class="field">
          <span class="field-label">Username</span>
          <input id="login-username" class="input" placeholder="Masukkan username" />
        </div>
        <div class="field">
          <span class="field-label">Kata Sandi</span>
          <input id="login-password" type="password" class="input" placeholder="Masukkan kata sandi" />
        </div>
        <p id="login-error" class="login-error" style="display:none"></p>
        <button id="login-submit" class="btn btn-primary btn-block" style="padding:12px">Masuk</button>
        <p class="login-hint">Akun default: <b>superadmin</b> / <b>super123</b></p>
      </div>
      <div id="toast-slot">${toastHtml()}</div>
    </div>
  `;
}
function attachLoginEvents() {
  const doLogin = () => {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl = document.getElementById('login-error');
    if (!username || !password) {
      errEl.textContent = 'Username dan kata sandi wajib diisi.'; errEl.style.display = 'block'; return;
    }
    const found = state.users.find((u) => u.username === username && u.password === password);
    if (!found) {
      errEl.textContent = 'Username atau kata sandi salah.'; errEl.style.display = 'block'; return;
    }
    state.currentUser = found;
    state.page = 'dashboard';
    render();
  };
  document.getElementById('login-submit').addEventListener('click', doLogin);
  ['login-username', 'login-password'].forEach((id) => {
    document.getElementById(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
  });
}

/* ---------------------------- SHELL (sidebar + content) ---------------------------- */
function navForRole(isSuper) {
  return isSuper
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: ICONS.dashboard },
        { id: 'tambah-admin', label: 'Tambah Admin', icon: ICONS.userPlus },
        { id: 'data-staff', label: 'Data Guru/Karyawan', icon: ICONS.users },
        { id: 'jam-kehadiran', label: 'Jam Kehadiran', icon: ICONS.clock },
        { id: 'laporan', label: 'Laporan', icon: ICONS.clipboard },
      ]
    : [
        { id: 'dashboard', label: 'Dashboard', icon: ICONS.dashboard },
        { id: 'input-kehadiran', label: 'Input Kehadiran', icon: ICONS.clipboard },
        { id: 'laporan', label: 'Laporan', icon: ICONS.clipboard },
      ];
}

function renderShell() {
  const isSuper = state.currentUser.role === 'superadmin';
  const nav = navForRole(isSuper);

  const navHtml = nav.map((n) => `
    <button class="nav-item ${state.page === n.id ? 'active' : ''}" data-page="${n.id}">
      ${n.icon}<span>${n.label}</span>
    </button>`).join('');

  return `
    <div class="app-shell ${state.mobileOpen ? 'sidebar-is-open' : ''}">
      <div class="sidebar ${state.mobileOpen ? 'mobile-open' : ''}" id="sidebar">
        <div class="sidebar-brand">
          <img src="logo.png" alt="Logo SMP Muhammadiyah 7 Surabaya" class="brand-logo brand-logo-sm" />
          <div>
            <div class="sidebar-brand-name">Kehadiran</div>
            <div class="sidebar-brand-school">SMP MUHAMMADIYAH 7 SBY</div>
          </div>
        </div>
        <div class="sidebar-nav">${navHtml}</div>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="sidebar-user-name">${escapeHtml(state.currentUser.fullName)}</div>
            <div class="sidebar-user-role">${isSuper ? 'Super Admin' : 'Admin'}</div>
          </div>
          <button class="logout-btn" id="logout-btn">${ICONS.logOut}Keluar</button>
        </div>
      </div>
      <div class="sidebar-backdrop" id="sidebar-backdrop"></div>

      <div class="mobile-topbar">
        <div class="mobile-topbar-title" style="display:flex;align-items:center;gap:9px">
          <img src="logo.png" alt="Logo" class="brand-logo brand-logo-xs" />Kehadiran
        </div>
        <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Buka menu">${state.mobileOpen ? ICONS.x : ICONS.menu}</button>
      </div>

      <div class="main-content">${renderPage(isSuper)}</div>
    </div>
    <div id="toast-slot">${toastHtml()}</div>
    ${renderConfirmModal()}
  `;
}

function attachShellEvents() {
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.page = btn.dataset.page;
      state.mobileOpen = false;
      render();
    });
  });
  document.getElementById('logout-btn').addEventListener('click', () => {
    state.currentUser = null;
    render();
  });
  const mobileBtn = document.getElementById('mobile-menu-btn');
  if (mobileBtn) mobileBtn.addEventListener('click', () => { state.mobileOpen = !state.mobileOpen; render(); });
  const backdrop = document.getElementById('sidebar-backdrop');
  if (backdrop) backdrop.addEventListener('click', () => { state.mobileOpen = false; render(); });

  attachConfirmModalEvents();
  attachPageEvents();
}

/* ---------------------------- PAGE ROUTER ---------------------------- */
function renderPage(isSuper) {
  switch (state.page) {
    case 'dashboard': return renderDashboard();
    case 'tambah-admin': return isSuper ? renderTambahAdmin() : renderDashboard();
    case 'data-staff': return isSuper ? renderDataStaff() : renderDashboard();
    case 'jam-kehadiran': return isSuper ? renderJamKehadiran() : renderDashboard();
    case 'input-kehadiran': return !isSuper ? renderInputKehadiran() : renderDashboard();
    case 'laporan': return renderLaporan();
    default: return renderDashboard();
  }
}
function attachPageEvents() {
  switch (state.page) {
    case 'dashboard': attachDashboardEvents(); break;
    case 'tambah-admin': attachTambahAdminEvents(); break;
    case 'data-staff': attachDataStaffEvents(); break;
    case 'jam-kehadiran': attachJamKehadiranEvents(); break;
    case 'input-kehadiran': attachInputKehadiranEvents(); break;
    case 'laporan': attachLaporanEvents(); break;
  }
}

function pageHeader(eyebrow, title, desc) {
  return `
    <div class="page-header">
      <div class="page-eyebrow">${escapeHtml(eyebrow)}</div>
      <h1 class="page-title">${escapeHtml(title)}</h1>
      ${desc ? `<p class="page-desc">${desc}</p>` : ''}
    </div>`;
}

/* ---------------------------- DASHBOARD ---------------------------- */
function renderDashboard() {
  const { staff, schedules, attendance } = state;
  const today = todayKey();
  const todaySunday = isSunday(today);

  let hadir = 0, terlambat = 0;
  staff.forEach((s) => {
    const rec = attendance.find((a) => a.staffId === s.id && a.date === today);
    if (rec) {
      const st = computeStatus(rec.jamHadir, getSchedule(schedules, s.id).jamMasuk);
      if (st === 'Hadir') hadir++; else if (st === 'Terlambat') terlambat++;
    }
  });
  const total = staff.length;
  const alpa = todaySunday ? 0 : Math.max(total - hadir - terlambat, 0);

  return `
    ${pageHeader('Ringkasan', 'Dashboard', `Statistik kehadiran • ${formatIndo(today)}`)}
    <div class="stat-row">
      <div class="card stat-card"><div class="stat-label">Total Guru/Karyawan</div><div class="stat-value">${total}</div></div>
      <div class="card stat-card"><div class="stat-label">Hadir Hari Ini</div><div class="stat-value" style="color:var(--green-700)">${hadir}</div></div>
      <div class="card stat-card"><div class="stat-label">Terlambat</div><div class="stat-value" style="color:var(--amber)">${terlambat}</div></div>
      <div class="card stat-card">
        <div class="stat-label">Belum Hadir</div>
        <div class="stat-value" style="color:var(--red)">${todaySunday ? '—' : alpa}</div>
        ${todaySunday ? `<div class="stat-sub">Hari libur (Minggu)</div>` : ''}
      </div>
    </div>
    <div class="card chart-card">
      <h3 class="chart-title">Kehadiran 7 Hari Terakhir</h3>
      <div class="chart-wrap"><canvas id="dashboard-chart"></canvas></div>
    </div>
  `;
}
function attachDashboardEvents() {
  const { staff, schedules, attendance } = state;
  const labels = [], hadirData = [], terlambatData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = dateKey(d);
    let hadir = 0, terlambat = 0;
    if (!isSunday(key)) {
      staff.forEach((s) => {
        const rec = attendance.find((a) => a.staffId === s.id && a.date === key);
        if (rec) {
          const st = computeStatus(rec.jamHadir, getSchedule(schedules, s.id).jamMasuk);
          if (st === 'Hadir') hadir++; else terlambat++;
        }
      });
    }
    labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
    hadirData.push(hadir); terlambatData.push(terlambat);
  }
  const ctx = document.getElementById('dashboard-chart');
  if (!ctx || typeof Chart === 'undefined') return;
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [
      { label: 'Hadir', data: hadirData, backgroundColor: '#0F5132', borderRadius: 5, maxBarThickness: 34 },
      { label: 'Terlambat', data: terlambatData, backgroundColor: '#C9A227', borderRadius: 5, maxBarThickness: 34 },
    ]},
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, ticks: { precision: 0, font: { family: 'Plus Jakarta Sans', size: 12 } }, grid: { color: '#E4E1D6' } },
                x: { ticks: { font: { family: 'Plus Jakarta Sans', size: 12 } }, grid: { display: false } } },
      plugins: { legend: { labels: { font: { family: 'Plus Jakarta Sans', size: 12.5 } } } },
    },
  });
}

/* ---------------------------- TAMBAH ADMIN ---------------------------- */
function renderTambahAdmin() {
  const admins = state.users.filter((u) => u.role === 'admin');
  return `
    ${pageHeader('Super Admin', 'Tambah Admin', 'Kelola akun admin yang dapat menginput kehadiran.')}
    <div class="grid-2">
      <div class="card card-p">
        <h3 class="chart-title">Akun Admin Baru</h3>
        <div class="field"><span class="field-label">Nama Lengkap</span><input id="ta-fullname" class="input" placeholder="Contoh: Siti Aminah, S.Pd." /></div>
        <div class="field"><span class="field-label">Username</span><input id="ta-username" class="input" placeholder="Contoh: siti.aminah" /></div>
        <div class="field"><span class="field-label">Kata Sandi</span><input id="ta-password" type="password" class="input" placeholder="Minimal 4 karakter" /></div>
        <button id="ta-submit" class="btn btn-primary btn-block">${ICONS.plus}Tambah Admin</button>
      </div>
      <div class="card card-p">
        <h3 class="chart-title">Daftar Admin (${admins.length})</h3>
        ${admins.length === 0
          ? `<div class="empty-state">Belum ada admin. Tambahkan admin pertama di sebelah kiri.</div>`
          : admins.map((a) => `
            <div class="list-row">
              <div><div class="list-row-name">${escapeHtml(a.fullName)}</div><div class="list-row-sub">@${escapeHtml(a.username)}</div></div>
              <button class="icon-btn" data-del-admin="${a.id}">${ICONS.trash}</button>
            </div>`).join('')}
      </div>
    </div>
  `;
}
function attachTambahAdminEvents() {
  document.getElementById('ta-submit').addEventListener('click', async () => {
    const fullName = document.getElementById('ta-fullname').value.trim();
    const username = document.getElementById('ta-username').value.trim();
    const password = document.getElementById('ta-password').value;
    if (!fullName || !username || !password) { notify('Semua kolom wajib diisi.', 'error'); return; }
    if (state.users.some((u) => u.username === username)) { notify('Username sudah digunakan.', 'error'); return; }
    const newUser = { id: uid('usr'), fullName, username, password, role: 'admin' };
    try {
      await setDoc(doc(db, 'users', username), newUser);
      state.users.push(newUser);
      notify('Admin baru berhasil ditambahkan.');
      render();
    } catch (e) {
      console.error('Gagal menambah admin:', e);
      notify('Gagal menyimpan ke server: ' + e.message, 'error');
    }
  });
  document.querySelectorAll('[data-del-admin]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const admin = state.users.find((u) => u.id === btn.dataset.delAdmin);
      state.confirm = {
        title: 'Hapus akun admin?',
        body: `Akun "${escapeHtml(admin.fullName)}" (@${escapeHtml(admin.username)}) akan dihapus permanen.`,
        onConfirm: async () => {
          try {
            await deleteDoc(doc(db, 'users', admin.username));
            state.users = state.users.filter((u) => u.id !== admin.id);
            state.confirm = null;
            notify('Admin dihapus.');
            render();
          } catch (e) {
            console.error('Gagal menghapus admin:', e);
            state.confirm = null;
            notify('Gagal menghapus di server: ' + e.message, 'error');
            render();
          }
        },
      };
      render();
    });
  });
}

/* ---------------------------- DATA GURU/KARYAWAN ---------------------------- */
function renderDataStaff() {
  const filtered = state.staff.filter((s) => s.name.toLowerCase().includes(state.staffQuery.toLowerCase()));
  const allChecked = filtered.length > 0 && state.staffSelected.length === filtered.length;

  return `
    ${pageHeader('Super Admin', 'Data Guru & Karyawan', 'Tambahkan atau hapus data guru dan karyawan.')}
    <div class="card card-p-sm" style="margin-bottom:20px">
      <div class="inline-form">
        <div class="grow"><span class="field-label">Nama Lengkap</span><input id="ds-name" class="input" placeholder="Contoh: Ahmad Fauzi, S.Pd." /></div>
        <div class="grow-sm"><span class="field-label">Jabatan (opsional)</span><input id="ds-position" class="input" placeholder="Guru / Tata Usaha / dll" /></div>
        <div style="padding-bottom:2px"><button id="ds-submit" class="btn btn-primary">${ICONS.plus}Tambah</button></div>
      </div>
    </div>
    <div class="card card-p-sm">
      <div class="toolbar">
        <div class="search-wrap">${ICONS.search}<input id="ds-search" class="input search-input" placeholder="Cari nama..." value="${escapeHtml(state.staffQuery)}" /></div>
        <button id="ds-bulk-delete" class="btn btn-danger" ${state.staffSelected.length === 0 ? 'disabled' : ''}>${ICONS.trash}Hapus Terpilih (${state.staffSelected.length})</button>
      </div>
      ${filtered.length === 0 ? `<div class="empty-state">Belum ada data guru/karyawan.</div>` : `
      <div class="table-wrap"><table>
        <thead><tr><th><input type="checkbox" id="ds-select-all" ${allChecked ? 'checked' : ''} /></th><th>Nama Lengkap</th><th>Jabatan</th><th>Jam Masuk</th><th>Jam Pulang</th></tr></thead>
        <tbody>
          ${filtered.map((s) => {
            const sch = getSchedule(state.schedules, s.id);
            return `<tr>
              <td data-label="Pilih"><input type="checkbox" class="ds-check" data-id="${s.id}" ${state.staffSelected.includes(s.id) ? 'checked' : ''} /></td>
              <td data-label="Nama" style="font-weight:700;color:var(--ink)">${escapeHtml(s.name)}</td>
              <td data-label="Jabatan">${escapeHtml(s.position)}</td>
              <td data-label="Jam Masuk">${sch.jamMasuk}</td>
              <td data-label="Jam Pulang">${sch.jamPulang}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>`}
    </div>
  `;
}
function attachDataStaffEvents() {
  document.getElementById('ds-submit').addEventListener('click', async () => {
    const name = document.getElementById('ds-name').value.trim();
    const position = document.getElementById('ds-position').value.trim() || 'Guru';
    if (!name) { notify('Nama wajib diisi.', 'error'); return; }
    const newStaff = { id: uid('stf'), name, position };
    try {
      await setDoc(doc(db, 'staff', newStaff.id), newStaff);
      state.staff.push(newStaff);
      notify('Guru/Karyawan berhasil ditambahkan. Jam kehadiran default otomatis tersinkron.');
      render();
    } catch (e) {
      console.error('Gagal menambah staff:', e);
      notify('Gagal menyimpan ke server: ' + e.message, 'error');
    }
  });
  document.getElementById('ds-search').addEventListener('input', (e) => {
    state.staffQuery = e.target.value;
    render();
  });
  const selectAll = document.getElementById('ds-select-all');
  if (selectAll) selectAll.addEventListener('change', () => {
    const filtered = state.staff.filter((s) => s.name.toLowerCase().includes(state.staffQuery.toLowerCase()));
    state.staffSelected = selectAll.checked ? filtered.map((s) => s.id) : [];
    render();
  });
  document.querySelectorAll('.ds-check').forEach((chk) => {
    chk.addEventListener('change', () => {
      const id = chk.dataset.id;
      state.staffSelected = chk.checked ? [...state.staffSelected, id] : state.staffSelected.filter((x) => x !== id);
      render();
    });
  });
  const bulkBtn = document.getElementById('ds-bulk-delete');
  if (bulkBtn) bulkBtn.addEventListener('click', () => {
    if (state.staffSelected.length === 0) return;
    state.confirm = {
      title: 'Hapus data terpilih?',
      body: `${state.staffSelected.length} data guru/karyawan beserta riwayat kehadirannya akan dihapus permanen.`,
      onConfirm: async () => {
        const ids = state.staffSelected;
        try {
          for (const id of ids) {
            await deleteDoc(doc(db, 'staff', id));
            await deleteDoc(doc(db, 'schedules', id)).catch(() => {});
            const q = query(collection(db, 'attendance'), where('staffId', '==', id));
            const snap = await getDocs(q);
            await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
          }
          state.staff = state.staff.filter((s) => !ids.includes(s.id));
          state.schedules = state.schedules.filter((s) => !ids.includes(s.staffId));
          state.attendance = state.attendance.filter((a) => !ids.includes(a.staffId));
          notify(`${ids.length} data dihapus.`);
          state.staffSelected = [];
          state.confirm = null;
          render();
        } catch (e) {
          console.error('Gagal menghapus staff:', e);
          state.confirm = null;
          notify('Gagal menghapus di server: ' + e.message, 'error');
          render();
        }
      },
    };
    render();
  });
}

/* ---------------------------- JAM KEHADIRAN ---------------------------- */
function renderJamKehadiran() {
  return `
    ${pageHeader('Super Admin', 'Jam Kehadiran', 'Atur jam masuk &amp; pulang khusus untuk setiap guru/karyawan. Daftar tersinkron otomatis dengan Data Guru/Karyawan.')}
    <div class="card card-p-sm">
      ${state.staff.length === 0 ? `<div class="empty-state">Belum ada data guru/karyawan. Tambahkan terlebih dahulu di menu Data Guru/Karyawan.</div>` : `
      <div class="table-wrap"><table>
        <thead><tr><th>Nama</th><th>Jabatan</th><th>Jam Masuk</th><th>Jam Pulang</th><th></th></tr></thead>
        <tbody>
          ${state.staff.map((s) => {
            const sch = getSchedule(state.schedules, s.id);
            return `<tr data-staff-row="${s.id}">
              <td data-label="Nama" style="font-weight:700">${escapeHtml(s.name)}</td>
              <td data-label="Jabatan">${escapeHtml(s.position)}</td>
              <td data-label="Jam Masuk"><input type="time" class="input" style="width:130px" data-jk-masuk="${s.id}" value="${sch.jamMasuk}" /></td>
              <td data-label="Jam Pulang"><input type="time" class="input" style="width:130px" data-jk-pulang="${s.id}" value="${sch.jamPulang}" /></td>
              <td data-label=""><button class="btn btn-subtle" data-jk-save="${s.id}">${ICONS.save}Simpan</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>`}
    </div>
  `;
}
function attachJamKehadiranEvents() {
  document.querySelectorAll('[data-jk-save]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.jkSave;
      const jamMasuk = document.querySelector(`[data-jk-masuk="${id}"]`).value || '07:00';
      const jamPulang = document.querySelector(`[data-jk-pulang="${id}"]`).value || '14:00';
      const sched = { staffId: id, jamMasuk, jamPulang };
      try {
        await setDoc(doc(db, 'schedules', id), sched);
        state.schedules = [...state.schedules.filter((s) => s.staffId !== id), sched];
        notify('Jam kehadiran disimpan.');
      } catch (e) {
        console.error('Gagal menyimpan jam kehadiran:', e);
        notify('Gagal menyimpan ke server: ' + e.message, 'error');
      }
    });
  });
}

/* ---------------------------- INPUT KEHADIRAN (Admin) ---------------------------- */
function renderInputKehadiran() {
  const today = todayKey();
  const todayRecords = state.attendance.filter((a) => a.date === today);
  return `
    ${pageHeader('Admin', 'Input Kehadiran', `Catat kehadiran guru/karyawan untuk hari ini • ${formatIndo(today)}`)}
    <div class="grid-2">
      <div class="card card-p">
        <div class="field"><span class="field-label">Nama Lengkap</span>
          <select id="ik-staff" class="input">
            <option value="">Pilih guru/karyawan...</option>
            ${state.staff.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><span class="field-label">Jam Kehadiran</span><input id="ik-jam" type="time" class="input" /></div>
        <p id="ik-hint" style="font-size:12.5px;color:var(--ink-soft);margin:-6px 0 14px;display:none"></p>
        <button id="ik-submit" class="btn btn-primary btn-block">${ICONS.plus}Simpan Kehadiran</button>
      </div>
      <div class="card card-p">
        <h3 class="chart-title">Sudah Diinput Hari Ini (${todayRecords.length})</h3>
        ${todayRecords.length === 0 ? `<div class="empty-state">Belum ada data kehadiran hari ini.</div>` :
          todayRecords.map((r) => {
            const s = state.staff.find((x) => x.id === r.staffId);
            if (!s) return '';
            const status = computeStatus(r.jamHadir, getSchedule(state.schedules, s.id).jamMasuk);
            return `<div class="list-row">
              <div><div class="list-row-name">${escapeHtml(s.name)}</div><div class="list-row-sub">Jam ${r.jamHadir}</div></div>
              ${badgeHtml(status)}
            </div>`;
          }).join('')}
      </div>
    </div>
  `;
}
function attachInputKehadiranEvents() {
  const staffSelect = document.getElementById('ik-staff');
  const hint = document.getElementById('ik-hint');
  staffSelect.addEventListener('change', () => {
    if (staffSelect.value) {
      const sch = getSchedule(state.schedules, staffSelect.value);
      hint.style.display = 'block';
      hint.innerHTML = `Jam masuk terjadwal: <b>${sch.jamMasuk}</b> (toleransi ${TOLERANCE_MIN} menit)`;
    } else {
      hint.style.display = 'none';
    }
  });
  document.getElementById('ik-submit').addEventListener('click', async () => {
    const staffId = staffSelect.value;
    const jam = document.getElementById('ik-jam').value;
    if (!staffId || !jam) { notify('Pilih nama dan isi jam kehadiran.', 'error'); return; }
    const today = todayKey();
    const record = { id: uid('att'), staffId, date: today, jamHadir: jam, inputBy: state.currentUser.username };
    try {
      await setDoc(doc(db, 'attendance', `${staffId}_${today}`), record);
      state.attendance = state.attendance.filter((a) => !(a.staffId === staffId && a.date === today));
      state.attendance.push(record);
      notify('Kehadiran berhasil disimpan.');
      render();
    } catch (e) {
      console.error('Gagal menyimpan kehadiran:', e);
      notify('Gagal menyimpan ke server: ' + e.message, 'error');
    }
  });
}

/* ---------------------------- EKSPOR PDF ---------------------------- */
let logoDataUrlPromise = null;
function getLogoDataUrl() {
  if (!logoDataUrlPromise) {
    logoDataUrlPromise = new Promise((resolve) => {
      try {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
            canvas.getContext('2d').drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } catch (e) { resolve(null); }
        };
        img.onerror = () => resolve(null);
        img.src = 'logo.png';
      } catch (e) { resolve(null); }
    });
  }
  return logoDataUrlPromise;
}

function getPdfCtor() {
  if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
  return null;
}

function drawPdfHeader(doc, logoDataUrl, title, subtitle) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const textX = logoDataUrl ? 34 : 14;
  if (logoDataUrl) {
    try { doc.addImage(logoDataUrl, 'PNG', 14, 9, 18, 18); } catch (e) { /* skip logo if it fails */ }
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 81, 50);
  doc.text('SMP MUHAMMADIYAH 7 SURABAYA', textX, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(91, 107, 96);
  doc.text('Sistem Kehadiran Guru & Karyawan', textX, 22);
  doc.setDrawColor(201, 162, 39);
  doc.setLineWidth(0.9);
  doc.line(14, 30, pageWidth - 14, 30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(27, 42, 34);
  doc.text(title, 14, 39);
  let y = 39;
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(91, 107, 96);
    doc.text(subtitle, 14, 45);
    y = 45;
  }
  return y + 6;
}

function drawPdfFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const printedInfo = `Dicetak ${formatIndo(todayKey())} oleh ${state.currentUser.fullName} (${state.currentUser.role === 'superadmin' ? 'Super Admin' : 'Admin'})`;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(printedInfo, 14, pageHeight - 8);
    doc.text(`Hal. ${i}/${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }
}

async function exportLaporanHarianPDF() {
  const JsPDFCtor = getPdfCtor();
  if (!JsPDFCtor) { notify('Modul PDF belum siap, coba lagi sesaat.', 'error'); return; }
  const date = state.reportDate;
  const sunday = isSunday(date);
  const isFuture = date > todayKey();
  const logoDataUrl = await getLogoDataUrl();

  const doc = new JsPDFCtor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const startY = drawPdfHeader(doc, logoDataUrl, 'Laporan Kehadiran Harian', formatIndo(date));

  if (sunday) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(91, 107, 96);
    doc.text('Hari ini libur (Minggu). Tidak ada data kehadiran.', 14, startY + 2);
  } else if (state.staff.length === 0) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(91, 107, 96);
    doc.text('Belum ada data guru/karyawan.', 14, startY + 2);
  } else {
    const body = state.staff.map((s) => {
      const rec = state.attendance.find((a) => a.staffId === s.id && a.date === date);
      const status = isFuture ? '—' : computeStatus(rec?.jamHadir, getSchedule(state.schedules, s.id).jamMasuk);
      return [s.name, s.position, rec?.jamHadir || '—', status];
    });
    doc.autoTable({
      startY,
      head: [['Nama', 'Jabatan', 'Jam Hadir', 'Status']],
      body,
      theme: 'grid',
      margin: { left: 14, right: 14 },
      styles: { font: 'helvetica', fontSize: 9, textColor: [27, 42, 34], lineColor: [228, 225, 214], lineWidth: 0.2 },
      headStyles: { fillColor: [15, 81, 50], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [234, 243, 236] },
      didParseCell: (dataCell) => {
        if (dataCell.section === 'body' && dataCell.column.index === 3) {
          const v = dataCell.cell.raw;
          if (v === 'Hadir') dataCell.cell.styles.textColor = [15, 81, 50];
          else if (v === 'Terlambat') dataCell.cell.styles.textColor = [154, 107, 0];
          else if (v === 'Alpa') dataCell.cell.styles.textColor = [179, 38, 30];
          dataCell.cell.styles.fontStyle = 'bold';
        }
      },
    });
  }

  drawPdfFooter(doc);
  doc.save(`Laporan-Harian-${date}.pdf`);
  notify('Laporan harian berhasil diunduh sebagai PDF.');
}

async function exportLaporanBulananPDF() {
  const JsPDFCtor = getPdfCtor();
  if (!JsPDFCtor) { notify('Modul PDF belum siap, coba lagi sesaat.', 'error'); return; }
  const date = state.reportDate;
  const d = new Date(date + 'T00:00:00');
  const year = d.getFullYear(), month = d.getMonth();
  const totalDays = daysInMonth(year, month);
  const todayD = new Date();
  const isCurrentMonth = todayD.getFullYear() === year && todayD.getMonth() === month;
  const lastDay = isCurrentMonth ? todayD.getDate() : (new Date(year, month, 1) > todayD ? 0 : totalDays);
  const logoDataUrl = await getLogoDataUrl();

  const doc = new JsPDFCtor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const startY = drawPdfHeader(doc, logoDataUrl, 'Laporan Kehadiran Bulanan', `${MONTH_NAMES_ID[month]} ${year}`);

  if (state.staff.length === 0) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(91, 107, 96);
    doc.text('Belum ada data guru/karyawan.', 14, startY + 2);
  } else if (lastDay === 0) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(91, 107, 96);
    doc.text('Bulan ini belum berjalan.', 14, startY + 2);
  } else {
    let totalHadir = 0, totalTerlambat = 0, totalAlpa = 0;
    const body = state.staff.map((s) => {
      let hadir = 0, terlambat = 0, alpa = 0, hariSekolah = 0;
      for (let day = 1; day <= lastDay; day++) {
        const key = `${year}-${pad2(month + 1)}-${pad2(day)}`;
        if (isSunday(key)) continue;
        hariSekolah++;
        const rec = state.attendance.find((a) => a.staffId === s.id && a.date === key);
        const status = computeStatus(rec?.jamHadir, getSchedule(state.schedules, s.id).jamMasuk);
        if (status === 'Hadir') hadir++; else if (status === 'Terlambat') terlambat++; else alpa++;
      }
      totalHadir += hadir; totalTerlambat += terlambat; totalAlpa += alpa;
      return [s.name, String(hariSekolah), String(hadir), String(terlambat), String(alpa)];
    });
    body.push(['TOTAL', '', String(totalHadir), String(totalTerlambat), String(totalAlpa)]);

    doc.autoTable({
      startY,
      head: [['Nama', 'Hari Sekolah', 'Hadir', 'Terlambat', 'Alpa']],
      body,
      theme: 'grid',
      margin: { left: 14, right: 14 },
      styles: { font: 'helvetica', fontSize: 9, textColor: [27, 42, 34], lineColor: [228, 225, 214], lineWidth: 0.2 },
      headStyles: { fillColor: [15, 81, 50], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [234, 243, 236] },
      didParseCell: (dataCell) => {
        const isTotalRow = dataCell.row.index === body.length - 1 && dataCell.section === 'body';
        if (isTotalRow) { dataCell.cell.styles.fontStyle = 'bold'; dataCell.cell.styles.fillColor = [239, 226, 184]; }
      },
    });
  }

  drawPdfFooter(doc);
  doc.save(`Laporan-Bulanan-${MONTH_NAMES_ID[month]}-${year}.pdf`);
  notify('Laporan bulanan berhasil diunduh sebagai PDF.');
}


function renderLaporan() {
  return `
    ${pageHeader('Laporan', 'Laporan Kehadiran', 'Pilih tanggal untuk melihat laporan harian atau bulanan.')}
    <div class="tabs">
      <button class="tab-btn ${state.reportTab === 'harian' ? 'active' : ''}" data-tab="harian">Harian</button>
      <button class="tab-btn ${state.reportTab === 'bulanan' ? 'active' : ''}" data-tab="bulanan">Bulanan</button>
    </div>
    <div class="card card-p-sm" style="margin-bottom:20px">
      <div style="display:flex; gap:14px; flex-wrap:wrap; align-items:flex-end; justify-content:space-between">
        <div class="field" style="margin-bottom:0">
          <span class="field-label">${state.reportTab === 'harian' ? 'Pilih Tanggal' : 'Pilih Tanggal (bulan & tahun akan digunakan)'}</span>
          <input id="rep-date" type="date" class="input" style="max-width:220px" value="${state.reportDate}" />
        </div>
        <button id="rep-export-pdf" class="btn btn-gold">${ICONS.download}Unduh PDF</button>
      </div>
    </div>
    <div id="report-body">${state.reportTab === 'harian' ? renderLaporanHarian() : renderLaporanBulanan()}</div>
  `;
}
function renderLaporanHarian() {
  const date = state.reportDate;
  const isFuture = date > todayKey();
  const sunday = isSunday(date);
  return `
    <div class="card card-p">
      <h3 class="chart-title" style="margin-bottom:4px">${formatIndo(date)}</h3>
      ${sunday ? `<p class="page-desc" style="margin-bottom:16px">Hari libur (Minggu).</p>` : ''}
      ${isFuture && !sunday ? `<p class="page-desc" style="margin-bottom:16px">Tanggal belum terjadi — belum ada data.</p>` : ''}
      ${state.staff.length === 0 ? `<div class="empty-state">Belum ada data guru/karyawan.</div>` : sunday ? '' : `
      <div class="table-wrap"><table>
        <thead><tr><th>Nama</th><th>Jabatan</th><th>Jam Hadir</th><th>Status</th></tr></thead>
        <tbody>
          ${state.staff.map((s) => {
            const rec = state.attendance.find((a) => a.staffId === s.id && a.date === date);
            const status = isFuture ? null : computeStatus(rec?.jamHadir, getSchedule(state.schedules, s.id).jamMasuk);
            return `<tr>
              <td data-label="Nama" style="font-weight:700">${escapeHtml(s.name)}</td>
              <td data-label="Jabatan">${escapeHtml(s.position)}</td>
              <td data-label="Jam Hadir">${rec?.jamHadir || '—'}</td>
              <td data-label="Status">${status ? badgeHtml(status) : '<span style="color:var(--ink-soft)">—</span>'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>`}
    </div>
  `;
}
function renderLaporanBulanan() {
  const date = state.reportDate;
  const d = new Date(date + 'T00:00:00');
  const year = d.getFullYear(), month = d.getMonth();
  const totalDays = daysInMonth(year, month);
  const todayD = new Date();
  const isCurrentMonth = todayD.getFullYear() === year && todayD.getMonth() === month;
  const lastDay = isCurrentMonth ? todayD.getDate() : (new Date(year, month, 1) > todayD ? 0 : totalDays);

  const rows = state.staff.map((s) => {
    let hadir = 0, terlambat = 0, alpa = 0, hariSekolah = 0;
    for (let day = 1; day <= lastDay; day++) {
      const key = `${year}-${pad2(month + 1)}-${pad2(day)}`;
      if (isSunday(key)) continue;
      hariSekolah++;
      const rec = state.attendance.find((a) => a.staffId === s.id && a.date === key);
      const status = computeStatus(rec?.jamHadir, getSchedule(state.schedules, s.id).jamMasuk);
      if (status === 'Hadir') hadir++; else if (status === 'Terlambat') terlambat++; else alpa++;
    }
    return { staff: s, hadir, terlambat, alpa, hariSekolah };
  });

  return `
    <div class="card card-p">
      <h3 class="chart-title" style="margin-bottom:4px">${MONTH_NAMES_ID[month]} ${year}</h3>
      <p class="page-desc" style="margin-bottom:16px">${lastDay === 0 ? 'Bulan ini belum berjalan.' : `Rekap hingga tanggal ${lastDay} (hari Minggu tidak dihitung).`}</p>
      ${state.staff.length === 0 ? `<div class="empty-state">Belum ada data guru/karyawan.</div>` : lastDay === 0 ? '' : `
      <div class="table-wrap"><table>
        <thead><tr><th>Nama</th><th>Hari Sekolah</th><th>Hadir</th><th>Terlambat</th><th>Alpa</th></tr></thead>
        <tbody>
          ${rows.map((r) => `<tr>
            <td data-label="Nama" style="font-weight:700">${escapeHtml(r.staff.name)}</td>
            <td data-label="Hari Sekolah">${r.hariSekolah}</td>
            <td data-label="Hadir" style="color:var(--green-700);font-weight:700">${r.hadir}</td>
            <td data-label="Terlambat" style="color:var(--amber);font-weight:700">${r.terlambat}</td>
            <td data-label="Alpa" style="color:var(--red);font-weight:700">${r.alpa}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>`}
    </div>
  `;
}
function attachLaporanEvents() {
  document.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => { state.reportTab = btn.dataset.tab; render(); });
  });
  document.getElementById('rep-date').addEventListener('change', (e) => {
    state.reportDate = e.target.value;
    document.getElementById('report-body').innerHTML =
      state.reportTab === 'harian' ? renderLaporanHarian() : renderLaporanBulanan();
  });
  const exportBtn = document.getElementById('rep-export-pdf');
  if (exportBtn) exportBtn.addEventListener('click', async () => {
    exportBtn.disabled = true;
    const originalHtml = exportBtn.innerHTML;
    exportBtn.innerHTML = 'Menyiapkan PDF...';
    try {
      if (state.reportTab === 'harian') await exportLaporanHarianPDF();
      else await exportLaporanBulananPDF();
    } catch (e) {
      console.error('Gagal membuat PDF:', e);
      notify('Gagal membuat PDF: ' + e.message, 'error');
    } finally {
      exportBtn.disabled = false;
      exportBtn.innerHTML = originalHtml;
    }
  });
}

/* ---------------------------- CONFIRM MODAL ---------------------------- */
function renderConfirmModal() {
  if (!state.confirm) return '';
  return `
    <div class="modal-overlay" id="confirm-overlay">
      <div class="card modal-box">
        <h3 class="modal-title">${state.confirm.title}</h3>
        <p class="modal-body">${state.confirm.body}</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" id="confirm-cancel">Batal</button>
          <button class="btn btn-danger" id="confirm-ok">Hapus</button>
        </div>
      </div>
    </div>`;
}
function attachConfirmModalEvents() {
  const cancel = document.getElementById('confirm-cancel');
  const ok = document.getElementById('confirm-ok');
  if (cancel) cancel.addEventListener('click', () => { state.confirm = null; render(); });
  if (ok) ok.addEventListener('click', () => { if (state.confirm) state.confirm.onConfirm(); });
}

/* ---------------------------- GLOBAL UX HELPERS ---------------------------- */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (state.confirm) { state.confirm = null; render(); return; }
  if (state.mobileOpen) { state.mobileOpen = false; render(); }
});

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (window.innerWidth > 900 && state.mobileOpen) { state.mobileOpen = false; render(); }
  }, 150);
});

/* ---------------------------- BOOT (Firebase) ---------------------------- */
function renderBootScreen(message, isError = false) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="login-page">
      <div class="sun-decor top">${sunMotif(360, 0.10, '#C9A227')}</div>
      <div class="sun-decor bottom">${sunMotif(300, 0.07, '#C9A227')}</div>
      <div class="card login-card" style="text-align:center">
        <div class="login-logo"><img src="logo.png" alt="Logo SMP Muhammadiyah 7 Surabaya" class="brand-logo brand-logo-lg" /></div>
        <p class="login-eyebrow">SMP Muhammadiyah 7 Surabaya</p>
        <h1 class="login-title">Sistem Kehadiran</h1>
        <p class="${isError ? 'login-error' : 'page-desc'}" style="display:block;margin-top:12px">${escapeHtml(message)}</p>
      </div>
    </div>`;
}

async function boot() {
  if (!firebaseReady) {
    if (firebaseInitError) {
      renderBootScreen(
        `Firebase gagal diinisialisasi: "${firebaseInitError.message || firebaseInitError}". ` +
        `Periksa kembali nilai firebaseConfig di app.js (apiKey, authDomain, projectId, dll.) — ` +
        `salin ulang persis dari Firebase Console > Project Settings > General > Your apps, lalu muat ulang halaman. ` +
        `Detail lengkap ada di console browser (tekan F12).`,
        true
      );
    } else {
      renderBootScreen(
        'Firebase belum dikonfigurasi. Buka app.js, cari komentar "GANTI BAGIAN INI", lalu pastikan SEMUA nilai ' +
        '(apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId) sudah diganti dan tidak ada lagi teks ' +
        '"GANTI_DENGAN_..." tersisa. Setelah itu aktifkan Authentication (metode Anonymous) dan Firestore Database di Firebase Console.',
        true
      );
    }
    return;
  }
  renderBootScreen('Menghubungkan ke server...');
  try {
    await signInAnonymously(auth);
    await loadAllData();
  } catch (e) {
    console.error('Gagal memuat data dari Firebase:', e);
    renderBootScreen(
      `Gagal terhubung ke server: "${e.code || e.message}". Penyebab paling umum: (1) metode sign-in Anonymous belum ` +
      `diaktifkan di Authentication > Sign-in method, (2) Firestore Database belum dibuat, atau (3) Firestore Rules ` +
      `belum dipublish / masih menolak akses. Detail lengkap ada di console browser (F12).`,
      true
    );
    return;
  }
  render();
}

/* ---------------------------- INIT ---------------------------- */
document.addEventListener('DOMContentLoaded', boot);
