import { api } from '../api.js';
import { toast } from '../app.js';

let currentPage = 1;

export async function renderAudit() {
  currentPage = 1;
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header">
      <h1>Log de Auditoría</h1>
    </div>
    <div class="card mb-2">
      <div class="card-body">
        <div class="form-row">
          <div class="form-group">
            <label>Filtrar por User ID</label>
            <input class="form-control" id="audit-user-id" placeholder="UUID del usuario">
          </div>
          <div class="form-group">
            <label>Filtrar por Patient ID</label>
            <input class="form-control" id="audit-patient-id" placeholder="UUID del paciente">
          </div>
        </div>
        <button class="btn btn-primary" id="audit-filter-btn">Filtrar</button>
      </div>
    </div>
    <div class="card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr><th>Fecha</th><th>Acción</th><th>Recurso</th><th>User ID</th><th>Recurso ID</th></tr>
          </thead>
          <tbody id="audit-table"><tr><td colspan="5" class="loading-page"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>
    <div class="flex justify-between items-center mt-1">
      <button class="btn btn-sm btn-primary" id="audit-prev" disabled>Anterior</button>
      <span id="audit-page-info">Página 1</span>
      <button class="btn btn-sm btn-primary" id="audit-next">Siguiente</button>
    </div>`;

  const load = async () => {
    const tbody = document.getElementById('audit-table');
    tbody.innerHTML = `<tr><td colspan="5" class="loading-page"><div class="spinner"></div></td></tr>`;

    try {
      const params = {
        page: currentPage,
        limit: 50,
        user_id: document.getElementById('audit-user-id').value || undefined,
        patient_id: document.getElementById('audit-patient-id').value || undefined,
      };
      const logs = await api.getAudit(params);

      if (!logs.length) {
        tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><p>Sin registros</p></div></td></tr>`;
      } else {
        tbody.innerHTML = logs.map(l => `
          <tr>
            <td>${new Date(l.created_at).toLocaleString('es-MX')}</td>
            <td><span class="badge badge-info">${l.accion}</span></td>
            <td>${l.recurso_tipo}</td>
            <td style="font-size:0.75rem">${l.user_id}</td>
            <td style="font-size:0.75rem">${l.recurso_id || '-'}</td>
          </tr>`).join('');
      }

      document.getElementById('audit-page-info').textContent = `Página ${currentPage}`;
      document.getElementById('audit-prev').disabled = currentPage <= 1;
      document.getElementById('audit-next').disabled = logs.length < 50;
    } catch (err) { toast(err.message, 'error'); }
  };

  document.getElementById('audit-filter-btn').addEventListener('click', () => { currentPage = 1; load(); });
  document.getElementById('audit-prev').addEventListener('click', () => { currentPage--; load(); });
  document.getElementById('audit-next').addEventListener('click', () => { currentPage++; load(); });

  await load();
}
