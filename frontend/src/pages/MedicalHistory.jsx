import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MedicalHistory.css';

const MedicalHistory = () => {
  const { idAnalisisLab } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // 'parasitologia', 'glicemia', etc.
  const [formData, setFormData] = useState({
    diagnostico: '', tratamiento: '', observaciones: ''
  });

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchResultados();
  }, [idAnalisisLab]);

  const fetchResultados = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/medico/resultados/${idAnalisisLab}`, config);
      setData(res.data);
    } catch (error) {
      alert('Error al cargar datos del paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmission = async (accion) => {
    if(!formData.diagnostico) {
      alert('Por favor ingrese un diagnóstico');
      return;
    }
    if(!data) return;
    
    let diagFinal = formData.diagnostico;
    if(accion === 'RECONSULTA') {
      diagFinal = '[RECONSULTA EXIGIDA] ' + diagFinal;
    }

    try {
      await axios.post('http://localhost:5000/api/medico/historial', {
        ...formData,
        diagnostico: diagFinal,
        id_analisis_lab: idAnalisisLab,
        id_cliente: data.id_cliente
      }, config);
      if(accion === 'RECONSULTA') {
        alert('⚠️ Paciente derivado a RECONSULTA médica.');
      } else {
        alert('✅ Historial registrado exitosamente. Trámite Finalizado (Aprobado).');
      }
      navigate('/medico/cola');
    } catch (error) {
      alert('Error al registrar historial médico');
    }
  };

  if (loading) return <div className="loading-state"><div className="spinner"></div><p>Cargando expediente médico...</p></div>;
  if (!data) return <div className="error-state">No se encontró el paciente.</div>;

  const renderModal = () => {
    if (!activeModal) return null;

    let title = '';
    let content = null;

    if (activeModal === 'parasitologia') {
      title = 'Reporte: Parasitología';
      const p = data.parasitologia;
      if(!p) { content = <p>No hay datos.</p>; } else {
        content = (
          <div className="modal-details-grid">
            <div className="detail-item"><span>Consistencia:</span> {p.consistencia_heces}</div>
            <div className="detail-item"><span>Color:</span> {p.color_heces}</div>
            <div className="detail-item"><span>Sangre Macroscópica:</span> {p.sangre_macroscopica ? 'Sí' : 'No'}</div>
            <div className="detail-item"><span>Leucocitos:</span> {p.leucocitos}</div>
            <div className="detail-item"><span>Levaduras:</span> {p.levaduras ? 'Sí' : 'No'}</div>
            <div className="detail-item highlight"><span>Parásito Encontrado:</span> {p.parasito_encontrado ? `SÍ (${p.nombre_parasito} - ${p.estadio_parasito})` : 'NO'}</div>
            <div className="detail-item full-width"><span>Conclusión Laboratorio:</span> {p.resultado_general}</div>
          </div>
        );
      }
    } else if (activeModal === 'glicemia') {
      title = 'Reporte: Glicemia';
      const g = data.glicemia;
      if(!g) { content = <p>No hay datos.</p>; } else {
        content = (
          <div className="modal-details-grid">
            <div className="detail-item"><span>Muestra:</span> {g.tipo_muestra} ({g.horas_ayuno}h ayuno)</div>
            <div className="detail-item highlight"><span>Glucosa Central:</span> {g.glucosa_mg_dl} mg/dL</div>
            <div className="detail-item highlight-blue"><span>Interpretación ADA:</span> {g.interpretacion}</div>
            <div className="detail-item"><span>Método:</span> {g.metodo_analisis}</div>
            <div className="detail-item full-width"><span>Observaciones:</span> {g.observaciones || 'Ninguna'}</div>
          </div>
        );
      }
    } else if (activeModal === 'vih') {
      title = 'Reporte: VIH-1 / VIH-2';
      const v = data.vih;
      if(!v) { content = <p>No hay datos.</p>; } else {
         content = (
          <div className="modal-details-grid">
            <div className="detail-item"><span>Prueba:</span> {v.prueba_tamizaje}</div>
            <div className="detail-item"><span>Resultado Tamizaje:</span> {v.resultado_tamizaje}</div>
            <div className="detail-item"><span>Índice S/CO:</span> {v.indice_s_co}</div>
            <div className="detail-item highlight-red"><span>Dictamen Final:</span> {v.resultado_final}</div>
            <div className="detail-item"><span>Consejería Pre/Post test:</span> {(v.consejeria_pretest && v.consejeria_postest) ? 'Ambas realizadas' : 'Pendiente o Parcial'}</div>
          </div>
        );
      }
    } else if (activeModal === 'chagas') {
      title = 'Reporte: Chagas (T. cruzi)';
      const c = data.chagas;
      if(!c) { content = <p>No hay datos.</p>; } else {
         content = (
          <div className="modal-details-grid">
            <div className="detail-item"><span>Fase Sospechada:</span> {c.fase_sospechada}</div>
            <div className="detail-item"><span>ELISA:</span> {c.resultado_elisa}</div>
            <div className="detail-item"><span>HAI:</span> {c.resultado_hat}</div>
            <div className="detail-item"><span>IFI:</span> {c.resultado_ifi} (Título: {c.titulo_ifi})</div>
            <div className="detail-item highlight-red"><span>Confirmación Final (OPS):</span> {c.resultado_final}</div>
          </div>
        );
      }
    } else if (activeModal === 'grupo_sanguineo') {
      title = 'Reporte: Tipificación Sanguínea';
      const gs = data.grupo_sanguineo;
      if(!gs || !gs.detalle) { content = <p>No hay datos.</p>; } else {
         content = (
          <div className="modal-details-grid">
            <div className="detail-item"><span>Anti-A:</span> {gs.detalle.reaccion_anti_a}</div>
            <div className="detail-item"><span>Anti-B:</span> {gs.detalle.reaccion_anti_b}</div>
            <div className="detail-item"><span>Anti-D (Rh):</span> {gs.detalle.reaccion_anti_d}</div>
            <div className="detail-item highlight-blue"><span>Grupo Sanguíneo:</span> {gs.grupo_nombre}</div>
            <div className="detail-item"><span>Rh Débil Du:</span> {gs.detalle.rh_debil_du ? 'Positivo' : 'Negativo'}</div>
          </div>
        );
      }
    }

    return (
      <div className="modal-overlay" onClick={() => setActiveModal(null)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <button className="close-btn" onClick={() => setActiveModal(null)}>✖</button>
          <h4>{title}</h4>
          <div className="modal-body">
            {content}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="medical-history-container">
      <div className="patient-banner glass-panel">
        <div className="patient-avatar">
          {data.foto ? <img src={`http://localhost:5000${data.foto}`} alt="Paciente" /> : <div className="avatar-placeholder">👤</div>}
        </div>
        <div className="patient-info">
          <h2>{data.nombre} {data.apellido}</h2>
          <p><strong>CI:</strong> {data.ci} &nbsp;|&nbsp; <strong>Trámite:</strong> <span className="tramite-badge">{data.tipo_tramite}</span></p>
        </div>
      </div>

      <div className="medical-grid">
        <section className="lab-results-section glass-panel">
          <h3>Expedientes de Laboratorio</h3>
          <p className="section-desc">Seleccione una prueba para revisar sus hallazgos íntegros dictaminados por el bioanalista.</p>
          <div className="action-buttons-grid">
            <button className="lab-btn parasitologia" onClick={(e) => { e.preventDefault(); setActiveModal('parasitologia'); }}>
              <span className="icon">🔬</span> Ver Parasitología
            </button>
            <button className="lab-btn glicemia" onClick={(e) => { e.preventDefault(); setActiveModal('glicemia'); }}>
              <span className="icon">🩸</span> Ver Glicemia
            </button>
            <button className="lab-btn vih" onClick={(e) => { e.preventDefault(); setActiveModal('vih'); }}>
              <span className="icon">🛡️</span> Ver VIH
            </button>
            <button className="lab-btn chagas" onClick={(e) => { e.preventDefault(); setActiveModal('chagas'); }}>
              <span className="icon">🪲</span> Ver Chagas
            </button>
            <button className="lab-btn grupo_sanguineo" onClick={(e) => { e.preventDefault(); setActiveModal('grupo_sanguineo'); }}>
              <span className="icon">🅰️</span> Ver G. Sanguíneo
            </button>
          </div>
        </section>

        <section className="history-form-section glass-panel">
          <h3>Dictamen Médico Final</h3>
          <p className="section-desc">Complete su valoración basándose en los resultados de laboratorio para decidir si el paciente aprueba su carnet o es remitido a reconsulta.</p>
          <form onSubmit={(e)=>e.preventDefault()} className="medical-form">
            <div className="form-group">
              <label>Diagnóstico (Obligatorio):</label>
              <textarea 
                required 
                placeholder="Ej. Paciente aparentemente sano, sin indicios de patologías en etapa aguda..."
                value={formData.diagnostico} 
                onChange={e => setFormData({...formData, diagnostico: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Tratamiento Prescrito (Si aplica):</label>
              <textarea 
                placeholder="Medicamentos, dosis, o medidas preventivas..."
                value={formData.tratamiento} 
                onChange={e => setFormData({...formData, tratamiento: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Observaciones o Derivaciones:</label>
              <textarea 
                placeholder="¿Requiere reconsulta? ¿Notas para el administrador?"
                value={formData.observaciones} 
                onChange={e => setFormData({...formData, observaciones: e.target.value})}
              />
            </div>
            <hr className="divider" />
            
            <div className="medical-action-panel">
              <button type="button" className="btn-finalizar" onClick={() => handleSubmission('FINALIZAR')}>
                ✓ Dictaminar Saludable y Aprobar Carnet
              </button>
              <button type="button" className="btn-reconsulta" onClick={() => handleSubmission('RECONSULTA')}>
                ⚠️ Derivar a Reconsulta Médica
              </button>
            </div>
          </form>
        </section>
      </div>

      {renderModal()}
    </div>
  );
};

export default MedicalHistory;
