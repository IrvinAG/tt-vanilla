import { Router } from './router.js';
import { auth } from './auth.js';
import { renderLogin } from './pages/login.js';
import { renderPatients } from './pages/patients.js';
import { renderPatientForm } from './pages/patient-form.js';
import { renderPatientDetail } from './pages/patient-detail.js';
import { renderNoteForm } from './pages/note-form.js';
import { renderNoteDetail } from './pages/note-detail.js';
import { renderDoctors } from './pages/doctors.js';
import { renderDoctorForm } from './pages/doctor-form.js';
import { renderAudit } from './pages/audit.js';

// ── Toast ──
export function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

// ── Nav ──
function updateNav() {
  const navbar = document.getElementById('navbar');
  const links = document.getElementById('nav-links');
  const userName = document.getElementById('nav-user-name');

  if (!auth.isLoggedIn()) {
    navbar.classList.add('hidden');
    return;
  }

  navbar.classList.remove('hidden');
  userName.textContent = auth.getName();

  const role = auth.getRole();
  const navItems = [];

  if (role === 'medico' || role === 'admin') {
    navItems.push({ href: '#/patients', label: 'Pacientes' });
  }
  if (role === 'admin') {
    navItems.push({ href: '#/doctors', label: 'Profesionales' });
  }
  if (role === 'admin' || role === 'auditor') {
    navItems.push({ href: '#/audit', label: 'Auditoría' });
  }

  links.innerHTML = navItems.map(n =>
    `<a href="${n.href}" class="${window.location.hash.startsWith(n.href) ? 'active' : ''}">${n.label}</a>`
  ).join('');
}

// ── Guard ──
function requireAuth(fn) {
  return (...args) => {
    if (!auth.isLoggedIn()) {
      window.location.hash = '#/login';
      return;
    }
    updateNav();
    fn(...args);
  };
}

function requireRole(roles, fn) {
  return requireAuth((...args) => {
    if (!roles.includes(auth.getRole())) {
      document.getElementById('main-content').innerHTML = `
        <div class="empty-state"><div class="icon">&#128274;</div><p>No tienes permiso para ver esta página</p></div>`;
      return;
    }
    fn(...args);
  });
}

// ── Router setup ──
const router = new Router();

router
  .on('/login', () => {
    if (auth.isLoggedIn()) {
      goHome();
      return;
    }
    renderLogin(() => {
      updateNav();
      goHome();
    });
  })
  .on('/patients', requireRole(['medico', 'admin'], renderPatients))
  .on('/patients/new', requireRole(['medico'], renderPatientForm))
  .on('/patients/:id', requireRole(['medico', 'admin'], renderPatientDetail))
  .on('/notes/new/:expedienteId', requireRole(['medico'], renderNoteForm))
  .on('/notes/:id', requireRole(['medico', 'admin'], renderNoteDetail))
  .on('/doctors', requireRole(['admin'], renderDoctors))
  .on('/doctors/new', requireRole(['admin'], () => renderDoctorForm()))
  .on('/doctors/edit/:id', requireRole(['admin'], (id) => renderDoctorForm(id)))
  .on('/audit', requireRole(['admin', 'auditor'], renderAudit));

function goHome() {
  const role = auth.getRole();
  if (role === 'medico' || role === 'admin') {
    window.location.hash = '#/patients';
  } else if (role === 'auditor') {
    window.location.hash = '#/audit';
  }
}

// ── Logout ──
document.getElementById('btn-logout').addEventListener('click', () => {
  auth.clearSession();
  window.location.hash = '#/login';
});

// ── Highlight active nav on hash change ──
window.addEventListener('hashchange', updateNav);

// ── Init ──
if (!window.location.hash || window.location.hash === '#/') {
  if (auth.isLoggedIn()) {
    goHome();
  } else {
    window.location.hash = '#/login';
  }
}
router.resolve();
