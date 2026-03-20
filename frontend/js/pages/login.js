import { api } from '../api.js';
import { auth } from '../auth.js';

export function renderLogin(onSuccess) {
  document.getElementById('navbar').classList.add('hidden');
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="login-icon">&#9764;</div>
        <h1>Clínica de Acupuntura</h1>
        <p class="subtitle">Sistema Médico</p>
        <form id="login-form">
          <div class="form-group">
            <label>Correo electrónico</label>
            <input type="email" class="form-control" id="login-email" required placeholder="usuario@clinica.com">
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" class="form-control" id="login-password" required placeholder="********">
          </div>
          <div id="login-error" class="hidden" style="color:var(--danger);font-size:0.85rem;margin-bottom:0.75rem;"></div>
          <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;" id="login-btn">
            Iniciar sesión
          </button>
        </form>
      </div>
    </div>`;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const errEl = document.getElementById('login-error');
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    btn.disabled = true;
    btn.textContent = 'Ingresando...';
    errEl.classList.add('hidden');

    try {
      const tokenData = await api.login(email, password);
      localStorage.setItem('token', tokenData.access_token);
      const user = await api.me();
      auth.setSession(tokenData.access_token, user);
      onSuccess();
    } catch (err) {
      errEl.textContent = err.message || 'Credenciales inválidas';
      errEl.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'Iniciar sesión';
    }
  });
}
