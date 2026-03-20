import { api } from '../api.js';
import { toast } from '../app.js';

let antFamCount = 0;
let toxCount = 0;
let antPatCount = 0;
let sintCount = 0;
let dxCount = 0;

function addItem(containerId, type) {
  const c = document.getElementById(containerId);
  const idx = type === 'af' ? antFamCount++ :
              type === 'tox' ? toxCount++ :
              type === 'ap' ? antPatCount++ :
              type === 'sint' ? sintCount++ : dxCount++;

  const templates = {
    af: `<div class="repeater-item" data-idx="${idx}">
      <button type="button" class="btn-remove" onclick="this.parentElement.remove()">&times;</button>
      <div class="form-row">
        <div class="form-group"><label>Familiar</label>
          <select class="form-control" name="af_familiar_${idx}">
            <option value="madre">Madre</option><option value="padre">Padre</option>
            <option value="hermano">Hermano</option><option value="abuelo">Abuelo</option>
            <option value="hijos">Hijos</option>
          </select>
        </div>
        <div class="form-group"><label>Estado</label>
          <select class="form-control" name="af_estado_${idx}">
            <option value="Vivo">Vivo</option><option value="Fallecido">Fallecido</option>
            <option value="Vivo / Sano">Vivo / Sano</option>
          </select>
        </div>
      </div>
      <div class="form-group"><label>Padecimiento</label><input class="form-control" name="af_padecimiento_${idx}"></div>
    </div>`,
    tox: `<div class="repeater-item" data-idx="${idx}">
      <button type="button" class="btn-remove" onclick="this.parentElement.remove()">&times;</button>
      <div class="form-row">
        <div class="form-group"><label>Sustancia</label><input class="form-control" name="tox_sustancia_${idx}" required></div>
        <div class="form-group"><label>Frecuencia</label><input class="form-control" name="tox_frecuencia_${idx}" required></div>
      </div>
    </div>`,
    ap: `<div class="repeater-item" data-idx="${idx}">
      <button type="button" class="btn-remove" onclick="this.parentElement.remove()">&times;</button>
      <div class="form-row">
        <div class="form-group"><label>Tipo</label>
          <select class="form-control" name="ap_tipo_${idx}">
            <option value="quirurgico">Quirúrgico</option><option value="traumatico">Traumático</option>
            <option value="alergico">Alérgico</option><option value="cronico_degenerativo">Crónico degenerativo</option>
          </select>
        </div>
        <div class="form-group"><label>Descripción</label><input class="form-control" name="ap_descripcion_${idx}" required></div>
      </div>
      <div class="form-group"><label>Fecha aproximada</label><input class="form-control" name="ap_fecha_${idx}"></div>
    </div>`,
    sint: `<div class="repeater-item" data-idx="${idx}">
      <button type="button" class="btn-remove" onclick="this.parentElement.remove()">&times;</button>
      <div class="form-group"><label>Síntoma</label><input class="form-control" name="sint_${idx}" required></div>
    </div>`,
    dx: `<div class="repeater-item" data-idx="${idx}">
      <button type="button" class="btn-remove" onclick="this.parentElement.remove()">&times;</button>
      <div class="form-row-3">
        <div class="form-group"><label>Sistema</label>
          <select class="form-control" name="dx_sistema_${idx}">
            <option value="occidental">Occidental</option><option value="mtch">MTCH</option>
          </select>
        </div>
        <div class="form-group"><label>CIE-10</label><input class="form-control" name="dx_cie10_${idx}" required></div>
        <div class="form-group"><label>Descripción</label><input class="form-control" name="dx_descripcion_${idx}" required></div>
      </div>
      <div class="form-group"><label><input type="checkbox" name="dx_principal_${idx}"> Diagnóstico principal</label></div>
    </div>`,
  };

  c.insertAdjacentHTML('beforeend', templates[type]);
}

// Make addItem available globally for onclick handlers
window.__addItem = addItem;

export function renderNoteForm(expedienteId) {
  antFamCount = 0; toxCount = 0; antPatCount = 0; sintCount = 0; dxCount = 0;

  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header">
      <h1>Nueva Nota Médica</h1>
      <button onclick="history.back()" class="btn btn-outline" style="color:var(--text);border-color:var(--border);">Cancelar</button>
    </div>
    <form id="note-form">
      <input type="hidden" name="expediente_id" value="${expedienteId}">

      <!-- Tipo de nota -->
      <div class="card mb-2">
        <div class="card-header">Tipo de nota</div>
        <div class="card-body">
          <div class="form-group">
            <select class="form-control" name="tipo_nota" required>
              <option value="ingreso">Ingreso</option>
              <option value="evolucion">Evolución</option>
              <option value="interconsulta">Interconsulta</option>
              <option value="egreso">Egreso</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Somatometría -->
      <div class="card mb-2">
        <div class="card-header">Somatometría</div>
        <div class="card-body">
          <div class="form-row-3">
            <div class="form-group"><label>Peso (kg)</label><input type="number" step="0.01" class="form-control" name="peso_kg"></div>
            <div class="form-group"><label>Talla (cm)</label><input type="number" step="0.01" class="form-control" name="talla_cm"></div>
            <div class="form-group"><label>Temperatura (°C)</label><input type="number" step="0.1" class="form-control" name="temperatura_c"></div>
          </div>
          <div class="form-row-3">
            <div class="form-group"><label>T. Sistólica (mmHg)</label><input type="number" class="form-control" name="tension_sistolica"></div>
            <div class="form-group"><label>T. Diastólica (mmHg)</label><input type="number" class="form-control" name="tension_diastolica"></div>
            <div class="form-group"><label>Frec. Cardíaca</label><input type="number" class="form-control" name="frecuencia_cardiaca"></div>
          </div>
        </div>
      </div>

      <!-- Antecedentes familiares -->
      <div class="card mb-2">
        <div class="card-header">Antecedentes Familiares</div>
        <div class="card-body">
          <div id="af-container"></div>
          <button type="button" class="btn-add" onclick="window.__addItem('af-container','af')">+ Agregar familiar</button>
        </div>
      </div>

      <!-- Antecedentes no patológicos -->
      <div class="card mb-2">
        <div class="card-header">Antecedentes No Patológicos</div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group"><label>Tipo de vivienda</label>
              <select class="form-control" name="tipo_vivienda">
                <option value="">--</option><option value="Propia">Propia</option>
                <option value="Rentada">Rentada</option><option value="Prestada">Prestada</option>
              </select>
            </div>
            <div class="form-group"><label>Servicios</label><input class="form-control" name="servicios"></div>
          </div>
          <div class="form-row-3">
            <div class="form-group"><label>Habitaciones</label><input type="number" class="form-control" name="num_habitaciones"></div>
            <div class="form-group"><label>Convivientes</label><input type="number" class="form-control" name="num_convivientes"></div>
            <div class="form-group"><label>Horas de sueño</label><input type="number" class="form-control" name="horas_sueno"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Actividad física</label>
              <select class="form-control" name="actividad_fisica">
                <option value="">--</option><option value="sedentarismo">Sedentarismo</option>
                <option value="moderada">Moderada</option><option value="intensa">Intensa</option>
              </select>
            </div>
            <div class="form-group"><label>Observaciones</label><textarea class="form-control" name="anp_observaciones"></textarea></div>
          </div>
        </div>
      </div>

      <!-- Toxicomanías -->
      <div class="card mb-2">
        <div class="card-header">Toxicomanías</div>
        <div class="card-body">
          <div id="tox-container"></div>
          <button type="button" class="btn-add" onclick="window.__addItem('tox-container','tox')">+ Agregar sustancia</button>
        </div>
      </div>

      <!-- Antecedentes patológicos -->
      <div class="card mb-2">
        <div class="card-header">Antecedentes Patológicos</div>
        <div class="card-body">
          <div id="ap-container"></div>
          <button type="button" class="btn-add" onclick="window.__addItem('ap-container','ap')">+ Agregar antecedente</button>
        </div>
      </div>

      <!-- Padecimiento actual -->
      <div class="card mb-2">
        <div class="card-header">Padecimiento Actual</div>
        <div class="card-body">
          <div class="form-group"><label>Observaciones</label><textarea class="form-control" name="padecimiento_obs" rows="3"></textarea></div>
        </div>
      </div>

      <!-- Síntomas -->
      <div class="card mb-2">
        <div class="card-header">Síntomas</div>
        <div class="card-body">
          <div id="sint-container"></div>
          <button type="button" class="btn-add" onclick="window.__addItem('sint-container','sint')">+ Agregar síntoma</button>
        </div>
      </div>

      <!-- Diagnósticos -->
      <div class="card mb-2">
        <div class="card-header">Diagnósticos</div>
        <div class="card-body">
          <div id="dx-container"></div>
          <button type="button" class="btn-add" onclick="window.__addItem('dx-container','dx')">+ Agregar diagnóstico</button>
        </div>
      </div>

      <!-- Plan terapéutico -->
      <div class="card mb-2">
        <div class="card-header">Plan Terapéutico</div>
        <div class="card-body">
          <div class="form-group"><label>Principio terapéutico</label><textarea class="form-control" name="principio" rows="2"></textarea></div>
          <div class="form-group"><label>Puntos principales</label><input class="form-control" name="puntos_principales" placeholder="H14, H13, Vb34, H3..."></div>
          <div class="form-group"><label>Puntos secundarios</label><input class="form-control" name="puntos_secundarios"></div>
        </div>
      </div>

      <div class="text-right mb-2">
        <button type="submit" class="btn btn-primary" id="save-note-btn">Guardar nota médica</button>
      </div>
    </form>`;

  document.getElementById('note-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-note-btn');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    const fd = new FormData(e.target);

    const body = {
      expediente_id: fd.get('expediente_id'),
      tipo_nota: fd.get('tipo_nota'),
    };

    // Somatometría
    const soma = {};
    ['peso_kg', 'talla_cm', 'temperatura_c', 'tension_sistolica', 'tension_diastolica', 'frecuencia_cardiaca'].forEach(k => {
      const v = fd.get(k);
      if (v) soma[k] = parseFloat(v);
    });
    if (Object.keys(soma).length) body.somatometria = soma;

    // Antecedentes familiares
    const afItems = document.querySelectorAll('#af-container .repeater-item');
    if (afItems.length) {
      body.antecedentes_familiares = Array.from(afItems).map(el => {
        const idx = el.dataset.idx;
        return {
          familiar: fd.get(`af_familiar_${idx}`),
          estado: fd.get(`af_estado_${idx}`),
          padecimiento: fd.get(`af_padecimiento_${idx}`) || null,
        };
      });
    }

    // Antecedentes no patológicos
    const anp = {};
    ['tipo_vivienda', 'servicios', 'actividad_fisica'].forEach(k => {
      const v = fd.get(k); if (v) anp[k] = v;
    });
    ['num_habitaciones', 'num_convivientes', 'horas_sueno'].forEach(k => {
      const v = fd.get(k); if (v) anp[k] = parseInt(v);
    });
    const anpObs = fd.get('anp_observaciones');
    if (anpObs) anp.observaciones = anpObs;
    if (Object.keys(anp).length) body.antecedentes_no_patologicos = anp;

    // Toxicomanías
    const toxItems = document.querySelectorAll('#tox-container .repeater-item');
    if (toxItems.length) {
      body.toxicomanias = Array.from(toxItems).map(el => {
        const idx = el.dataset.idx;
        return { sustancia: fd.get(`tox_sustancia_${idx}`), frecuencia: fd.get(`tox_frecuencia_${idx}`) };
      });
    }

    // Antecedentes patológicos
    const apItems = document.querySelectorAll('#ap-container .repeater-item');
    if (apItems.length) {
      body.antecedentes_patologicos = Array.from(apItems).map(el => {
        const idx = el.dataset.idx;
        return {
          tipo: fd.get(`ap_tipo_${idx}`),
          descripcion: fd.get(`ap_descripcion_${idx}`),
          fecha_aproximada: fd.get(`ap_fecha_${idx}`) || null,
        };
      });
    }

    // Padecimiento actual
    const padObs = fd.get('padecimiento_obs');
    if (padObs) body.padecimiento_actual = { observaciones: padObs };

    // Síntomas
    const sintItems = document.querySelectorAll('#sint-container .repeater-item');
    if (sintItems.length) {
      body.sintomas = Array.from(sintItems).map(el => fd.get(`sint_${el.dataset.idx}`)).filter(Boolean);
    }

    // Diagnósticos
    const dxItems = document.querySelectorAll('#dx-container .repeater-item');
    if (dxItems.length) {
      body.diagnosticos = Array.from(dxItems).map(el => {
        const idx = el.dataset.idx;
        return {
          sistema: fd.get(`dx_sistema_${idx}`),
          cie10: fd.get(`dx_cie10_${idx}`),
          descripcion: fd.get(`dx_descripcion_${idx}`),
          es_principal: !!fd.get(`dx_principal_${idx}`),
        };
      });
    }

    // Plan terapéutico
    const principio = fd.get('principio');
    const puntosPrin = fd.get('puntos_principales');
    if (principio && puntosPrin) {
      body.plan_terapeutico = {
        principio,
        puntos_principales: puntosPrin,
        puntos_secundarios: fd.get('puntos_secundarios') || null,
      };
    }

    try {
      await api.createNote(body);
      toast('Nota médica creada exitosamente', 'success');
      history.back();
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Guardar nota médica';
    }
  });
}
