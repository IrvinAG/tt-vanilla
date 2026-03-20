import { api } from '../api.js';
import { toast } from '../app.js';

export async function renderPatients() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header">
      <h1>Pacientes</h1>
      <a href="#/patients/new" class="btn btn-primary">+ Nuevo paciente</a>
    </div>
    <div class="search-bar">
      <input type="text" class="form-control" id="search-input" placeholder="Buscar por nombre o CURP...">
      <button class="btn btn-primary" id="search-btn">Buscar</button>
    </div>
    <div class="card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nombre completo</th>
              <th>CURP</th>
              <th>Sexo</th>
              <th>Teléfono</th>
              <th>Expediente</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="patients-table"><tr><td colspan="6" class="loading-page"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>`;

  const loadPatients = async (search = '') => {
    const tbody = document.getElementById('patients-table');
    try {
      const patients = await api.getPatients(search);
      if (!patients.length) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="icon">&#128100;</div><p>No se encontraron pacientes</p></div></td></tr>`;
        return;
      }
      tbody.innerHTML = patients.map(p => `
        <tr>
          <td><a href="#/patients/${p.id}" class="btn-link">${p.nombre} ${p.apellido_paterno} ${p.apellido_materno}</a></td>
          <td>${p.curp}</td>
          <td>${p.sexo}</td>
          <td>${p.telefono || '-'}</td>
          <td>${p.expediente ? `<span class="badge badge-success">Activo</span>` : '-'}</td>
          <td><a href="#/patients/${p.id}" class="btn btn-sm btn-primary">Ver</a></td>
        </tr>`).join('');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  document.getElementById('search-btn').addEventListener('click', () => {
    loadPatients(document.getElementById('search-input').value);
  });
  document.getElementById('search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadPatients(e.target.value);
  });

  await loadPatients();
}
