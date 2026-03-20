import { api } from '../api.js';
import { toast } from '../app.js';

export async function renderDoctors() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header">
      <h1>Profesionales de Salud</h1>
      <a href="#/doctors/new" class="btn btn-primary">+ Nuevo profesional</a>
    </div>
    <div class="card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr><th>Nombre</th><th>Cédula</th><th>Tipo</th><th>Email</th><th>Rol</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody id="doctors-table"><tr><td colspan="7" class="loading-page"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>`;

  try {
    const doctors = await api.getDoctors();
    const tbody = document.getElementById('doctors-table');
    if (!doctors.length) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><p>No hay profesionales registrados</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = doctors.map(d => `
      <tr>
        <td>${d.nombre_completo}</td>
        <td>${d.cedula_profesional}</td>
        <td>${d.tipo_personal}</td>
        <td>${d.email}</td>
        <td><span class="badge ${d.rol === 'admin' ? 'badge-warning' : d.rol === 'auditor' ? 'badge-info' : 'badge-success'}">${d.rol}</span></td>
        <td><span class="badge ${d.activo ? 'badge-success' : 'badge-danger'}">${d.activo ? 'Activo' : 'Inactivo'}</span></td>
        <td>
          <a href="#/doctors/edit/${d.id}" class="btn btn-sm btn-primary">Editar</a>
          ${d.activo ? `<button class="btn btn-sm btn-danger btn-deactivate" data-id="${d.id}">Desactivar</button>` : ''}
        </td>
      </tr>`).join('');

    tbody.querySelectorAll('.btn-deactivate').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Desactivar este profesional?')) return;
        try {
          await api.deleteDoctor(btn.dataset.id);
          toast('Profesional desactivado', 'success');
          renderDoctors();
        } catch (err) { toast(err.message, 'error'); }
      });
    });
  } catch (err) { toast(err.message, 'error'); }
}
