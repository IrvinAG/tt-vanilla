import { api } from '../api.js';
import { toast } from '../app.js';

export async function renderDoctorForm(editId = null) {
  const main = document.getElementById('main-content');
  const isEdit = !!editId;
  let doctor = null;

  if (isEdit) {
    main.innerHTML = `<div class="loading-page"><div class="spinner"></div></div>`;
    try { doctor = await api.getDoctor(editId); }
    catch (err) {
      main.innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`;
      return;
    }
  }

  main.innerHTML = `
    <div class="page-header">
      <h1>${isEdit ? 'Editar' : 'Nuevo'} Profesional</h1>
      <a href="#/doctors" class="btn btn-outline" style="color:var(--text);border-color:var(--border);">Cancelar</a>
    </div>
    <div class="card">
      <div class="card-body">
        <form id="doctor-form">
          <div class="form-row">
            <div class="form-group">
              <label>Nombre completo *</label>
              <input class="form-control" name="nombre_completo" required value="${doctor?.nombre_completo || ''}">
            </div>
            <div class="form-group">
              <label>Cédula profesional *</label>
              <input class="form-control" name="cedula_profesional" ${isEdit ? 'disabled' : 'required'} value="${doctor?.cedula_profesional || ''}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Tipo de personal *</label>
              <select class="form-control" name="tipo_personal" required>
                <option value="">Seleccionar</option>
                <option value="Médico Tratante" ${doctor?.tipo_personal === 'Médico Tratante' ? 'selected' : ''}>Médico Tratante</option>
                <option value="Médico Especialista" ${doctor?.tipo_personal === 'Médico Especialista' ? 'selected' : ''}>Médico Especialista</option>
                <option value="Administrador" ${doctor?.tipo_personal === 'Administrador' ? 'selected' : ''}>Administrador</option>
              </select>
            </div>
            <div class="form-group">
              <label>Rol *</label>
              <select class="form-control" name="rol" required>
                <option value="medico" ${doctor?.rol === 'medico' ? 'selected' : ''}>Médico</option>
                <option value="admin" ${doctor?.rol === 'admin' ? 'selected' : ''}>Admin</option>
                <option value="auditor" ${doctor?.rol === 'auditor' ? 'selected' : ''}>Auditor</option>
              </select>
            </div>
          </div>
          ${!isEdit ? `
          <div class="form-row">
            <div class="form-group">
              <label>Email *</label>
              <input type="email" class="form-control" name="email" required>
            </div>
            <div class="form-group">
              <label>Contraseña *</label>
              <input type="password" class="form-control" name="password" required minlength="6">
            </div>
          </div>` : ''}
          <div class="text-right mt-2">
            <button type="submit" class="btn btn-primary" id="save-btn">${isEdit ? 'Actualizar' : 'Crear profesional'}</button>
          </div>
        </form>
      </div>
    </div>`;

  document.getElementById('doctor-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-btn');
    btn.disabled = true;

    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());

    try {
      if (isEdit) {
        await api.updateDoctor(editId, {
          nombre_completo: data.nombre_completo,
          tipo_personal: data.tipo_personal,
          rol: data.rol,
        });
        toast('Profesional actualizado', 'success');
      } else {
        await api.createDoctor(data);
        toast('Profesional creado', 'success');
      }
      window.location.hash = '#/doctors';
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false;
    }
  });
}
