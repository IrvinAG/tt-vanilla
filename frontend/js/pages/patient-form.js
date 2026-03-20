import { api } from '../api.js';
import { toast } from '../app.js';

export function renderPatientForm() {
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div class="page-header">
      <h1>Nuevo Paciente</h1>
      <a href="#/patients" class="btn btn-outline" style="color:var(--text);border-color:var(--border);">Cancelar</a>
    </div>
    <div class="card">
      <div class="card-body">
        <form id="patient-form">
          <div class="form-row">
            <div class="form-group">
              <label>Nombre *</label>
              <input class="form-control" name="nombre" required>
            </div>
            <div class="form-group">
              <label>Apellido paterno *</label>
              <input class="form-control" name="apellido_paterno" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Apellido materno *</label>
              <input class="form-control" name="apellido_materno" required>
            </div>
            <div class="form-group">
              <label>CURP *</label>
              <input class="form-control" name="curp" required maxlength="18">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Fecha de nacimiento *</label>
              <input type="date" class="form-control" name="fecha_nacimiento" required>
            </div>
            <div class="form-group">
              <label>Sexo *</label>
              <select class="form-control" name="sexo" required>
                <option value="">Seleccionar</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Domicilio</label>
            <input class="form-control" name="domicilio">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Teléfono</label>
              <input class="form-control" name="telefono">
            </div>
            <div class="form-group">
              <label>Ocupación</label>
              <input class="form-control" name="ocupacion">
            </div>
          </div>
          <div class="form-group">
            <label>Establecimiento *</label>
            <input class="form-control" name="establecimiento" required value="Clínica de Acupuntura / Particular">
          </div>
          <div class="text-right mt-2">
            <button type="submit" class="btn btn-primary" id="save-btn">Guardar paciente</button>
          </div>
        </form>
      </div>
    </div>`;

  document.getElementById('patient-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('save-btn');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());

    try {
      const patient = await api.createPatient(data);
      toast('Paciente creado exitosamente', 'success');
      window.location.hash = `#/patients/${patient.id}`;
    } catch (err) {
      toast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'Guardar paciente';
    }
  });
}
