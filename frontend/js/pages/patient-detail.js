import { api } from '../api.js';
import { auth } from '../auth.js';
import { toast } from '../app.js';

export async function renderPatientDetail(id) {
  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="loading-page"><div class="spinner"></div></div>`;

  try {
    const p = await api.getPatient(id);
    const role = auth.getRole();

    main.innerHTML = `
      <div class="page-header">
        <h1>${p.nombre} ${p.apellido_paterno} ${p.apellido_materno}</h1>
        <a href="#/patients" class="btn btn-outline" style="color:var(--text);border-color:var(--border);">Volver</a>
      </div>

      <div class="card mb-2">
        <div class="card-header">Datos del paciente</div>
        <div class="card-body">
          <div class="detail-grid">
            <div class="detail-item"><label>CURP</label><span>${p.curp}</span></div>
            <div class="detail-item"><label>Fecha de nacimiento</label><span>${p.fecha_nacimiento}</span></div>
            <div class="detail-item"><label>Sexo</label><span>${p.sexo}</span></div>
            <div class="detail-item"><label>Teléfono</label><span>${p.telefono || '-'}</span></div>
            <div class="detail-item"><label>Domicilio</label><span>${p.domicilio || '-'}</span></div>
            <div class="detail-item"><label>Ocupación</label><span>${p.ocupacion || '-'}</span></div>
          </div>
        </div>
      </div>

      ${p.expediente ? `
      <div class="card mb-2">
        <div class="card-header flex justify-between items-center">
          <span>Expediente Clínico</span>
          <span class="badge ${p.expediente.activo ? 'badge-success' : 'badge-danger'}">${p.expediente.activo ? 'Activo' : 'Inactivo'}</span>
        </div>
        <div class="card-body">
          <div class="detail-grid">
            <div class="detail-item"><label>ID Expediente</label><span style="font-size:0.8rem">${p.expediente.id}</span></div>
            <div class="detail-item"><label>Fecha de apertura</label><span>${p.expediente.fecha_apertura}</span></div>
            <div class="detail-item"><label>Establecimiento</label><span>${p.expediente.establecimiento || '-'}</span></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header flex justify-between items-center">
          <span>Notas Médicas</span>
          ${role === 'medico' ? `<a href="#/notes/new/${p.expediente.id}" class="btn btn-sm btn-primary">+ Nueva nota</a>` : ''}
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr><th>Fecha</th><th>Tipo</th><th></th></tr>
            </thead>
            <tbody id="notes-table">
              <tr><td colspan="3" class="loading-page"><div class="spinner"></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>` : ''}`;

    if (p.expediente) {
      try {
        const notes = await api.getNotes(p.expediente.id);
        const tbody = document.getElementById('notes-table');
        if (!notes.length) {
          tbody.innerHTML = `<tr><td colspan="3"><div class="empty-state"><p>Sin notas médicas</p></div></td></tr>`;
        } else {
          tbody.innerHTML = notes.map(n => `
            <tr>
              <td>${new Date(n.fecha_registro).toLocaleString('es-MX')}</td>
              <td><span class="badge badge-info">${n.tipo_nota}</span></td>
              <td><a href="#/notes/${n.id}" class="btn btn-sm btn-primary">Ver</a></td>
            </tr>`).join('');
        }
      } catch (err) {
        document.getElementById('notes-table').innerHTML = `<tr><td colspan="3">Error cargando notas</td></tr>`;
      }
    }
  } catch (err) {
    main.innerHTML = `<div class="empty-state"><div class="icon">&#9888;</div><p>${err.message}</p></div>`;
  }
}
