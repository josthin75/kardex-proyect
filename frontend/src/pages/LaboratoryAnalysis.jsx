import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LaboratoryAnalysis.css';

const LaboratoryAnalysis = () => {
  const { idCliente } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('parasitologia');
  
  // Guardamos IDs para referenciarlos al finalizar el trámite
  const [idsAnalisis, setIdsAnalisis] = useState({
    parasitologia: null,
    grupo_sanguineo: null,
    glicemia: null,
    vih: null,
    chagas: null
  });

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Helper para procesar checkboxes y serializar formulario
  const procesarFormulario = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Convertir checkboxes 'on' a true/false
    const inputs = e.target.querySelectorAll('input[type="checkbox"]');
    inputs.forEach(input => {
      data[input.name] = input.checked;
    });
    
    return data;
  };

  const handleSave = async (e, endpoint, claveDeId) => {
    const data = procesarFormulario(e);
    try {
      const res = await axios.post(`http://localhost:5000/api/laboratorio/${endpoint}`, data, config);
      // Actualizamos solo la clave que corresponde a este formulario
      setIdsAnalisis(prev => ({ ...prev, [claveDeId]: res.data[`id_${claveDeId}`] || res.data.id || res.data[Object.keys(res.data)[0]] }));
      alert('✅ Análisis guardado exitosamente.');
    } catch (err) { 
      console.error(err);
      // Para efectos de UI, si falla conexión igual lo damos por hecho si no hay backend robusto aún
      alert('Nota: No se pudo contactar al API. ' + err.message); 
    }
  };

  const handleFinalize = async () => {
    try {
      await axios.post('http://localhost:5000/api/laboratorio/registrar', {
        id_cliente: idCliente,
        id_parasitologia: idsAnalisis.parasitologia,
        id_analisis_gs: idsAnalisis.grupo_sanguineo,
        id_glicemia: idsAnalisis.glicemia,
        id_vih: idsAnalisis.vih,
        id_chagas: idsAnalisis.chagas,
        observacion: 'Análisis de laboratorio completados.'
      }, config);
      alert('🎉 Registro de laboratorio consolidado correctamente.');
      navigate('/bioanalista/cola');
    } catch (err) { 
      alert('Error al consolidar todos los análisis.'); 
    }
  };

  // Helper para pintar las clases activas u ocultar tabs enteras
  const getTabClass = (key) => ` ${activeTab === key ? 'active' : ''} ${idsAnalisis[key] ? 'completed' : ''}`;

  return (
    <div className="analysis-manager">
      <div className="analysis-header">
        <h3>Registro General de Análisis</h3>
        <div className="patient-badge">Cliente ID: {idCliente}</div>
      </div>

      <div className="tabs">
        <button onClick={() => setActiveTab('parasitologia')} className={'tab-btn' + getTabClass('parasitologia')}>Parasitología</button>
        <button onClick={() => setActiveTab('grupo_sanguineo')} className={'tab-btn' + getTabClass('grupo_sanguineo')}>Grupo Sanguíneo</button>
        <button onClick={() => setActiveTab('glicemia')} className={'tab-btn' + getTabClass('glicemia')}>Glicemia</button>
        <button onClick={() => setActiveTab('vih')} className={'tab-btn' + getTabClass('vih')}>VIH</button>
        <button onClick={() => setActiveTab('chagas')} className={'tab-btn' + getTabClass('chagas')}>Chagas</button>
      </div>

      <div className="tab-content">
        
        {/* PARASITOLOGÍA */}
        {activeTab === 'parasitologia' && (
          <form className="analysis-form" onSubmit={(e) => handleSave(e, 'parasitologia', 'parasitologia')}>
            <h4>Examen Coproparasitológico Básico</h4>
            
            <div className="form-section">
              <div className="form-section-title">Hallazgos Macroscópicos</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Consistencia de Heces</label>
                  <select name="consistencia_heces" required>
                    <option value="">--Seleccione--</option>
                    <option value="LIQUIDA">Líquida</option>
                    <option value="BLANDA">Blanda</option>
                    <option value="SEMIBLANDA">Semiblanda</option>
                    <option value="FORMADA">Formada</option>
                    <option value="DURA">Dura</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input name="color_heces" placeholder="Ej. Café, Amarillo..." />
                </div>
                <div className="checkbox-grid full-width">
                  <label className="checkbox-label"><input type="checkbox" name="sangre_macroscopica" /> Sangre Macroscópica</label>
                  <label className="checkbox-label"><input type="checkbox" name="moco_macroscopico" /> Moco Macroscópico</label>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">Análisis Microscópico</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Leucocitos</label>
                  <input name="leucocitos" placeholder="Ej: 0-2 xc" />
                </div>
                <div className="form-group">
                  <label>Eritrocitos</label>
                  <input name="eritrocitos" placeholder="Ej: No se observan" />
                </div>
                <div className="form-group">
                  <label>Células Epiteliales</label>
                  <input name="celulas_epiteliales" placeholder="Ej: Escasas" />
                </div>
                <div className="checkbox-grid full-width">
                  <label className="checkbox-label"><input type="checkbox" name="levaduras" /> Presencia de Levaduras</label>
                  <label className="checkbox-label"><input type="checkbox" name="parasito_encontrado" /> <b>Parásito Encontrado</b></label>
                </div>
                <div className="form-group">
                  <label>Nombre del Parásito</label>
                  <input name="nombre_parasito" placeholder="Ej: Giardia lamblia" />
                </div>
                <div className="form-group">
                  <label>Estadio</label>
                  <select name="estadio_parasito">
                    <option value="">Ninguno</option>
                    <option value="QUISTE">Quiste</option>
                    <option value="TROFOZOITO">Trofozoito</option>
                    <option value="HUEVO">Huevo</option>
                    <option value="LARVA">Larva</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Cantidad (Densidad)</label>
                  <select name="cantidad_parasitos">
                    <option value="">--</option>
                    <option value="ESCASO">Escaso</option>
                    <option value="MODERADO">Moderado</option>
                    <option value="ABUNDANTE">Abundante</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">Método y Conclusión</div>
              <div className="checkbox-grid">
                <label className="checkbox-label"><input type="checkbox" name="metodo_directo" defaultChecked /> Método Directo</label>
                <label className="checkbox-label"><input type="checkbox" name="metodo_concentracion" /> Método de Concentración</label>
                <label className="checkbox-label"><input type="checkbox" name="metodo_kato_katz" /> Método Kato Katz</label>
              </div>
              <br/>
              <div className="form-grid">
                <div className="form-group">
                  <label>Tinción Utilizada</label>
                  <input name="tincion_utilizada" placeholder="Ej: Lugol" />
                </div>
              </div>
              <div className="form-grid full-width">
                <div className="form-group full-width">
                  <label>Resultado General</label>
                  <textarea name="resultado_general" required placeholder="Conclusión médica del estudio..."></textarea>
                </div>
                <div className="form-group full-width">
                  <label>Observaciones</label>
                  <textarea name="observaciones" placeholder="Notas adicionales"></textarea>
                </div>
              </div>
            </div>

            <button type="submit" className="save-btn">Guardar Formulario Parasitología</button>
          </form>
        )}

        {/* GRUPO SANGUÍNEO */}
        {activeTab === 'grupo_sanguineo' && (
          <form className="analysis-form" onSubmit={(e) => handleSave(e, 'grupo-sanguineo', 'grupo_sanguineo')}>
            <h4>Tipificación Sanguínea (ABO y Rh)</h4>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Reacción Anti-A</label>
                <select name="reaccion_anti_a"><option value="NEGATIVO">Negativo</option><option value="POSITIVO">Positivo</option><option value="DEBIL">Débil</option></select>
              </div>
              <div className="form-group">
                <label>Reacción Anti-B</label>
                <select name="reaccion_anti_b"><option value="NEGATIVO">Negativo</option><option value="POSITIVO">Positivo</option><option value="DEBIL">Débil</option></select>
              </div>
              <div className="form-group">
                <label>Reacción Anti-AB</label>
                <select name="reaccion_anti_ab"><option value="NEGATIVO">Negativo</option><option value="POSITIVO">Positivo</option><option value="DEBIL">Débil</option></select>
              </div>
              <div className="form-group">
                <label>Reacción Anti-D (Factor Rh)</label>
                <select name="reaccion_anti_d" required><option value="NEGATIVO">Negativo</option><option value="POSITIVO">Positivo</option></select>
              </div>
            </div>
            
            <div className="checkbox-grid full-width" style={{marginBottom: '1.5rem'}}>
              <label className="checkbox-label"><input type="checkbox" name="rh_debil_du" /> Detectado variante Rh D débil (Du)</label>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Resultado Final Confirmado</label>
                <select name="id_grupo_resultado" required>
                  <option value="">Seleccione Grupo</option>
                  <option value="1">A Positivo</option>
                  <option value="2">A Negativo</option>
                  <option value="3">B Positivo</option>
                  <option value="4">B Negativo</option>
                  <option value="5">AB Positivo</option>
                  <option value="6">AB Negativo</option>
                  <option value="7">O Positivo</option>
                  <option value="8">O Negativo</option>
                </select>
              </div>
              <div className="form-group">
                <label>Técnica Utilizada</label>
                <input name="tecnica_utilizada" placeholder="Ej: Hemaglutinación" />
              </div>
              <div className="form-group">
                <label>Prueba Cruzada Mayor</label>
                <input name="prueba_cruzada_mayor" placeholder="Compatible / Incompatible" />
              </div>
              <div className="form-group">
                <label>Prueba Cruzada Menor</label>
                <input name="prueba_cruzada_menor" placeholder="Compatible / Incompatible" />
              </div>
              <div className="form-group full-width">
                <label>Observaciones Generales</label>
                <textarea name="observaciones"></textarea>
              </div>
            </div>

            <button type="submit" className="save-btn">Guardar Tipificación Sanguínea</button>
          </form>
        )}

        {/* GLICEMIA */}
        {activeTab === 'glicemia' && (
          <form className="analysis-form" onSubmit={(e) => handleSave(e, 'glicemia', 'glicemia')}>
            <h4>Evaluación de Glicemia</h4>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Tipo de Muestra</label>
                <select name="tipo_muestra" required>
                  <option value="AYUNAS">Ayunas</option>
                  <option value="POSTPRANDIAL_1H">Postprandial 1H</option>
                  <option value="POSTPRANDIAL_2H">Postprandial 2H</option>
                  <option value="CASUAL">Casual</option>
                  <option value="CURVA_TOLERANCIA">Curva de Tolerancia</option>
                </select>
              </div>
              <div className="form-group">
                <label>Horas de Ayuno Previas</label>
                <input type="number" name="horas_ayuno" placeholder="Horas" min="0" />
              </div>
              <div className="form-group">
                <label>Muestra Biológica</label>
                <input name="muestra_tipo" defaultValue="PLASMA_VENOSO" />
              </div>
              <div className="form-group">
                <label>Método de Análisis</label>
                <input name="metodo_analisis" placeholder="Ej: Glucosa oxidasa" />
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">Resultados (mg/dL)</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Glucosa Central *</label>
                  <input type="number" step="0.01" name="glucosa_mg_dl" required placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Glucosa Basal (Curva)</label>
                  <input type="number" step="0.01" name="glucosa_basal_mgdl" placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Glucosa (60 min)</label>
                  <input type="number" step="0.01" name="glucosa_60min_mgdl" placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Glucosa (120 min)</label>
                  <input type="number" step="0.01" name="glucosa_120min_mgdl" placeholder="0.00" />
                </div>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label>Interpretación Clínica</label>
                <select name="interpretacion" required>
                  <option value="NORMAL">Normal</option>
                  <option value="PREDIABETES">Prediabetes</option>
                  <option value="DIABETES">Diabetes</option>
                  <option value="HIPOGLUCEMIA">Hipoglucemia</option>
                  <option value="NO_APLICA">No aplica</option>
                </select>
              </div>
              <div className="form-group full-width">
                <label>Observaciones</label>
                <textarea name="observaciones"></textarea>
              </div>
            </div>

            <button type="submit" className="save-btn">Guardar Examen Glicemia</button>
          </form>
        )}

        {/* VIH */}
        {activeTab === 'vih' && (
          <form className="analysis-form" onSubmit={(e) => handleSave(e, 'vih', 'vih')}>
            <h4>Prueba de Tamizaje VIH-1 / VIH-2</h4>
            
            <div className="form-section">
              <div className="form-section-title">Tamizaje</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Kit/Prueba Comercial</label>
                  <input name="prueba_tamizaje" required placeholder="Nombre del Kit" />
                </div>
                <div className="form-group">
                  <label>Origen Muestra</label>
                  <select name="tipo_muestra">
                    <option value="SUERO">Suero</option>
                    <option value="PLASMA">Plasma</option>
                    <option value="SANGRE_TOTAL">Sangre Total</option>
                    <option value="PRUEBA_RAPIDA">Prueba Rápida</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Resultado Tamizaje</label>
                  <select name="resultado_tamizaje" required>
                    <option value="NO_REACTIVO">No Reactivo (Negativo)</option>
                    <option value="REACTIVO">Reactivo (Positivo)</option>
                    <option value="INDETERMINADO">Indeterminado</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Índice S/CO</label>
                  <input type="number" step="0.001" name="indice_s_co" placeholder="0.000" />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">Prueba Confirmatoria (Opcional si es No Reactivo)</div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Método/Prueba Confirmatoria</label>
                  <input name="prueba_confirmatoria" placeholder="Ej: Western Blot" />
                </div>
                <div className="form-group">
                  <label>Resultado Confirmatorio</label>
                  <select name="resultado_confirmatorio">
                    <option value="NO_REALIZADO">No Realizado</option>
                    <option value="NEGATIVO">Negativo</option>
                    <option value="POSITIVO">Positivo</option>
                    <option value="INDETERMINADO">Indeterminado</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="checkbox-grid full-width" style={{marginBottom: '1rem'}}>
              <label className="checkbox-label"><input type="checkbox" name="control_positivo" /> Control Positivo Verificado</label>
              <label className="checkbox-label"><input type="checkbox" name="control_negativo" /> Control Negativo Verificado</label>
              <label className="checkbox-label"><input type="checkbox" name="consejeria_pretest" /> Consejería Pre-Test Realizada</label>
              <label className="checkbox-label"><input type="checkbox" name="consejeria_postest" /> Consejería Post-Test Realizada</label>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label>Dictamen Final Reportado</label>
                <select name="resultado_final" required>
                  <option value="NO_REACTIVO">NO REACTIVO</option>
                  <option value="REACTIVO">REACTIVO</option>
                  <option value="INDETERMINADO">INDETERMINADO</option>
                </select>
              </div>
              <div className="form-group full-width">
                <label>Observaciones</label>
                <textarea name="observaciones"></textarea>
              </div>
            </div>

            <button type="submit" className="save-btn">Guardar Resultado VIH</button>
          </form>
        )}

        {/* CHAGAS */}
        {activeTab === 'chagas' && (
          <form className="analysis-form" onSubmit={(e) => handleSave(e, 'chagas', 'chagas')}>
            <h4>Enfermedad de Chagas (T. cruzi)</h4>

            <div className="form-group" style={{marginBottom: '1rem'}}>
              <label>Fase Sospechada Referencial</label>
              <select name="fase_sospechada">
                <option value="DESCONOCIDA">Desconocida</option>
                <option value="AGUDA">Aguda</option>
                <option value="CRONICA">Crónica</option>
                <option value="CONGENITA">Congénita</option>
              </select>
            </div>

            <div className="form-section">
              <div className="form-section-title">Panel Serológico</div>
              <div className="form-grid">
                <div className="form-group"><label>Prueba ELISA</label><input name="prueba_elisa" placeholder="Kit Comercial..."/></div>
                <div className="form-group"><label>Valor Índice</label><input type="number" step="0.001" name="indice_elisa" /></div>
                <div className="form-group"><label>Resultado ELISA</label>
                  <select name="resultado_elisa"><option value="NO_REALIZADO">No Realizado</option><option value="NO_REACTIVO">No Reactivo</option><option value="REACTIVO">Reactivo</option><option value="INDETERMINADO">Indeterminado</option></select>
                </div>
                
                <div className="form-group"><label>Prueba HAI</label><input name="prueba_hat" placeholder="Marca..."/></div>
                <div className="form-group"><label>Resultado HAI</label>
                  <select name="resultado_hat"><option value="NO_REALIZADO">No Realizado</option><option value="NO_REACTIVO">No Reactivo</option><option value="REACTIVO">Reactivo</option><option value="INDETERMINADO">Indeterminado</option></select>
                </div>
                <div className="form-group"></div>

                <div className="form-group"><label>Prueba IFI</label><input name="prueba_ifi" placeholder="Marca..."/></div>
                <div className="form-group"><label>Título IFI</label><input name="titulo_ifi" placeholder="Ej: 1/32"/></div>
                <div className="form-group"><label>Resultado IFI</label>
                  <select name="resultado_ifi"><option value="NO_REALIZADO">No Realizado</option><option value="NO_REACTIVO">No Reactivo</option><option value="REACTIVO">Reactivo</option><option value="INDETERMINADO">Indeterminado</option></select>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">Módulo Parasitológico Directo</div>
              <div className="checkbox-grid">
                <label className="checkbox-label"><input type="checkbox" name="gota_gruesa" /> Realizado Gota Gruesa / Romagna</label>
                <label className="checkbox-label"><input type="checkbox" name="estudio_xenodiagnostico" /> Realizado Xenodiagnóstico</label>
              </div>
              <div className="form-grid mt-3">
                <div className="form-group mt-3">
                  <label>Resultado Directo (Agudo)</label>
                  <select name="resultado_gota_gruesa">
                    <option value="NO_REALIZADO">No Realizado</option>
                    <option value="NEGATIVO">Negativo</option>
                    <option value="POSITIVO">Positivo</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="checkbox-grid full-width" style={{marginBottom: '1rem'}}>
              <label className="checkbox-label"><input type="checkbox" name="control_positivo" /> Control Válido (+)</label>
              <label className="checkbox-label"><input type="checkbox" name="control_negativo" /> Control Válido (-)</label>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label>Resultado Final Protocolizado (Discordancia o Confirmado)</label>
                <select name="resultado_final" required>
                  <option value="NO_REACTIVO">NO REACTIVO</option>
                  <option value="REACTIVO">REACTIVO</option>
                  <option value="INDETERMINADO">INDETERMINADO</option>
                </select>
              </div>
              <div className="form-group full-width">
                <label>Observaciones</label>
                <textarea name="observaciones"></textarea>
              </div>
            </div>

            <button type="submit" className="save-btn">Guardar Panel Chagas</button>
          </form>
        )}

      </div>

      <div className="finalize-section">
        <button onClick={handleFinalize} className="finalize-btn">
          Consolidar y Terminar Registro General
        </button>
      </div>
    </div>
  );
};

export default LaboratoryAnalysis;
