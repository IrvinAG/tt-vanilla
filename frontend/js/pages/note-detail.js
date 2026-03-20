import { api } from '../api.js';
import { toast } from '../app.js';

export async function renderNoteDetail(id) {
  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="loading-page"><div class="spinner"></div></div>`;

  try {
    const n = await api.getNote(id);

    let html = `
      <div class="page-header">
        <h1>Nota de ${n.tipo_nota}</h1>
        <button onclick="history.back()" class="btn btn-outline" style="color:var(--text);border-color:var(--border);">Volver</button>
      </div>

      <div class="card mb-2">
        <div class="card-header">Información general</div>
        <div class="card-body">
          <div class="detail-grid">
            <div class="detail-item"><label>Tipo</label><span class="badge badge-info">${n.tipo_nota}</span></div>
            <div class="detail-item"><label>Fecha</label><span>${new Date(n.fecha_registro).toLocaleString('es-MX')}</span></div>
            <div class="detail-item"><label>Expediente</label><span style="font-size:0.8rem">${n.expediente_id}</span></div>
            <div class="detail-item"><label>Autor</label><span style="font-size:0.8rem">${n.autor_id}</span></div>
          </div>
        </div>
      </div>`;

    // Somatometría
    if (n.somatometria) {
      const s = n.somatometria;
      html += `
      <div class="card mb-2">
        <div class="card-header">Somatometría</div>
        <div class="card-body">
          <div class="detail-grid">
            ${s.peso_kg != null ? `<div class="detail-item"><label>Peso</label><span>${s.peso_kg} kg</span></div>` : ''}
            ${s.talla_cm != null ? `<div class="detail-item"><label>Talla</label><span>${s.talla_cm} cm</span></div>` : ''}
            ${s.imc != null ? `<div class="detail-item"><label>IMC</label><span><strong>${s.imc}</strong></span></div>` : ''}
            ${s.tension_sistolica != null ? `<div class="detail-item"><label>Tensión arterial</label><span>${s.tension_sistolica}/${s.tension_diastolica} mmHg</span></div>` : ''}
            ${s.frecuencia_cardiaca != null ? `<div class="detail-item"><label>Frec. cardíaca</label><span>${s.frecuencia_cardiaca} bpm</span></div>` : ''}
            ${s.temperatura_c != null ? `<div class="detail-item"><label>Temperatura</label><span>${s.temperatura_c} °C</span></div>` : ''}
          </div>
        </div>
      </div>`;
    }

    // Antecedentes familiares
    if (n.antecedentes_familiares?.length) {
      html += `
      <div class="card mb-2">
        <div class="card-header">Antecedentes Familiares</div>
        <div class="card-body sub-items">
          ${n.antecedentes_familiares.map(a => `
            <div class="sub-item">
              <strong>${a.familiar}</strong> — ${a.estado}${a.padecimiento ? ` (${a.padecimiento})` : ''}
            </div>`).join('')}
        </div>
      </div>`;
    }

    // Antecedentes no patológicos
    if (n.antecedentes_no_patologicos) {
      const a = n.antecedentes_no_patologicos;
      html += `
      <div class="card mb-2">
        <div class="card-header">Antecedentes No Patológicos</div>
        <div class="card-body">
          <div class="detail-grid">
            ${a.tipo_vivienda ? `<div class="detail-item"><label>Vivienda</label><span>${a.tipo_vivienda}</span></div>` : ''}
            ${a.servicios ? `<div class="detail-item"><label>Servicios</label><span>${a.servicios}</span></div>` : ''}
            ${a.num_habitaciones != null ? `<div class="detail-item"><label>Habitaciones</label><span>${a.num_habitaciones}</span></div>` : ''}
            ${a.num_convivientes != null ? `<div class="detail-item"><label>Convivientes</label><span>${a.num_convivientes}</span></div>` : ''}
            ${a.actividad_fisica ? `<div class="detail-item"><label>Actividad física</label><span>${a.actividad_fisica}</span></div>` : ''}
            ${a.horas_sueno != null ? `<div class="detail-item"><label>Horas de sueño</label><span>${a.horas_sueno}</span></div>` : ''}
          </div>
          ${a.observaciones ? `<div class="mt-1"><label style="font-size:0.8rem;color:var(--text-light)">Observaciones</label><p>${a.observaciones}</p></div>` : ''}
        </div>
      </div>`;
    }

    // Toxicomanías
    if (n.toxicomanias?.length) {
      html += `
      <div class="card mb-2">
        <div class="card-header">Toxicomanías</div>
        <div class="card-body sub-items">
          ${n.toxicomanias.map(t => `
            <div class="sub-item">
              <strong>${t.sustancia}</strong> — ${t.frecuencia}
              <span class="badge ${t.activo ? 'badge-warning' : 'badge-success'}">${t.activo ? 'Activo' : 'Inactivo'}</span>
            </div>`).join('')}
        </div>
      </div>`;
    }

    // Antecedentes patológicos
    if (n.antecedentes_patologicos?.length) {
      html += `
      <div class="card mb-2">
        <div class="card-header">Antecedentes Patológicos</div>
        <div class="card-body sub-items">
          ${n.antecedentes_patologicos.map(a => `
            <div class="sub-item">
              <span class="badge badge-info">${a.tipo}</span> ${a.descripcion}${a.fecha_aproximada ? ` (${a.fecha_aproximada})` : ''}
            </div>`).join('')}
        </div>
      </div>`;
    }

    // Padecimiento actual
    if (n.padecimiento_actual) {
      html += `
      <div class="card mb-2">
        <div class="card-header">Padecimiento Actual</div>
        <div class="card-body"><p>${n.padecimiento_actual.observaciones}</p></div>
      </div>`;
    }

    // Síntomas
    if (n.sintomas?.length) {
      html += `
      <div class="card mb-2">
        <div class="card-header">Síntomas</div>
        <div class="card-body">
          <div class="tags">${n.sintomas.map(s => `<span class="tag">${s.sintoma}</span>`).join('')}</div>
        </div>
      </div>`;
    }

    // Diagnósticos
    if (n.diagnosticos?.length) {
      html += `
      <div class="card mb-2">
        <div class="card-header">Diagnósticos</div>
        <div class="card-body">
          <table>
            <thead><tr><th>Sistema</th><th>CIE-10</th><th>Descripción</th><th>Principal</th></tr></thead>
            <tbody>
              ${n.diagnosticos.map(d => `
                <tr>
                  <td><span class="badge ${d.sistema === 'occidental' ? 'badge-info' : 'badge-warning'}">${d.sistema}</span></td>
                  <td><strong>${d.cie10}</strong></td>
                  <td>${d.descripcion}</td>
                  <td>${d.es_principal ? '&#9733;' : ''}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
    }

    // Plan terapéutico
    if (n.plan_terapeutico) {
      const p = n.plan_terapeutico;
      html += `
      <div class="card mb-2">
        <div class="card-header">Plan Terapéutico</div>
        <div class="card-body">
          <div class="section"><div class="section-title">Principio</div><p>${p.principio}</p></div>
          <div class="section"><div class="section-title">Puntos principales</div>
            <div class="tags">${p.puntos_principales.split(',').map(pt => `<span class="tag">${pt.trim()}</span>`).join('')}</div>
          </div>
          ${p.puntos_secundarios ? `
          <div class="section mt-1"><div class="section-title">Puntos secundarios</div>
            <div class="tags">${p.puntos_secundarios.split(',').map(pt => `<span class="tag">${pt.trim()}</span>`).join('')}</div>
          </div>` : ''}
        </div>
      </div>`;
    }

    main.innerHTML = html;
  } catch (err) {
    main.innerHTML = `<div class="empty-state"><div class="icon">&#9888;</div><p>${err.message}</p></div>`;
  }
}
