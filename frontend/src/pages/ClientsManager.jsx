import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import './ClientsManager.css';

/**
 * Componente: Administrador de Pacientes (Clientes)
 * Gestiona el registro, visualización y seguimiento de trámites.
 * Cumple con estándares ISO de validación y nomenclatura en español.
 */
const GestorPacientes = () => {
  const [pacientes, establecerPacientes] = useState([]);
  const [rubros, establecerRubros] = useState([]);
  const [gruposSanguineos, establecerGruposSanguineos] = useState([]);
  const [cargando, establecerCargando] = useState(true);
  const [mostrarModal, establecerMostrarModal] = useState(false);
  const [capturandoFoto, establecerCapturandoFoto] = useState(false);
  
  const camaraRef = useRef(null);
  const [fotoCapturada, establecerFotoCapturada] = useState(null);
  const [datosFormulario, establecerDatosFormulario] = useState({
    nombre: '', apellido: '', fecha_nacimiento: '', ci: '', 
    domicilio: '', nro_celular: '', lugar_trabajo: '', 
    id_tipo_trabajo: '', id_gs: ''
  });
  const [editandoId, establecerEditandoId] = useState(null);
  const [esRenovacion, establecerEsRenovacion] = useState(false);

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    obtenerDatosIniciales();
  }, []);

  const obtenerDatosIniciales = async () => {
    try {
      const [resPacientes, resRubros, resGS] = await Promise.all([
        axios.get('http://localhost:5000/api/pacientes', config),
        axios.get('http://localhost:5000/api/catalogos/rubros', config),
        axios.get('http://localhost:5000/api/catalogos/grupos-sanguineos', config)
      ]);
      establecerPacientes(resPacientes.data);
      establecerRubros(resRubros.data);
      establecerGruposSanguineos(resGS.data);
    } catch (error) {
      console.error('Error al obtener datos:', error);
    } finally {
      establecerCargando(false);
    }
  };

  const capturarMuestra = () => {
    const imagenBase64 = camaraRef.current.getScreenshot();
    establecerFotoCapturada(imagenBase64);
    establecerCapturandoFoto(false);
  };

  const gestionarRegistro = async (e) => {
    e.preventDefault();
    
    // Preparar FormData para envío de medios (Multi-part)
    const formDataEnvio = new FormData();
    Object.keys(datosFormulario).forEach(llave => {
      formDataEnvio.append(llave, datosFormulario[llave]);
    });

    if (fotoCapturada && fotoCapturada.startsWith('data:image')) {
      // Convertir base64 a Blob para Multer
      const respuesta = await fetch(fotoCapturada);
      const blob = await respuesta.blob();
      formDataEnvio.append('foto', blob, `paciente_${datosFormulario.ci}.jpg`);
    }

    try {
      if (editandoId) {
        if (esRenovacion) formDataEnvio.append('renovar', 'true');
        await axios.put(`http://localhost:5000/api/pacientes/${editandoId}`, formDataEnvio, {
          headers: { ...config.headers, 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('http://localhost:5000/api/pacientes', formDataEnvio, {
          headers: { ...config.headers, 'Content-Type': 'multipart/form-data' }
        });
      }
      obtenerDatosIniciales();
      establecerMostrarModal(false);
      reestablecerFormulario();
    } catch (error) {
      alert(error.response?.data?.mensaje || 'Error al procesar el registro');
    }
  };

  const reestablecerFormulario = () => {
    establecerDatosFormulario({
      nombre: '', apellido: '', fecha_nacimiento: '', ci: '', 
      domicilio: '', nro_celular: '', lugar_trabajo: '', 
      id_tipo_trabajo: '', id_gs: ''
    });
    establecerFotoCapturada(null);
    establecerEditandoId(null);
    establecerEsRenovacion(false);
  };

  const iniciarEdicion = (paciente, renovar = false) => {
    const fnacFormato = paciente.fecha_nacimiento ? new Date(paciente.fecha_nacimiento).toISOString().split('T')[0] : '';
    establecerDatosFormulario({
      nombre: paciente.nombre || '', 
      apellido: paciente.apellido || '', 
      fecha_nacimiento: fnacFormato, 
      ci: paciente.ci || '', 
      domicilio: paciente.domicilio || '', 
      nro_celular: paciente.nro_celular || '', 
      lugar_trabajo: paciente.lugar_trabajo || '', 
      id_tipo_trabajo: paciente.id_tipo_trabajo || '', 
      id_gs: paciente.id_gs || ''
    });
    establecerFotoCapturada(paciente.foto ? `http://localhost:5000${paciente.foto}` : null);
    establecerEditandoId(paciente.id_cliente);
    establecerEsRenovacion(renovar);
    establecerMostrarModal(true);
  };

  const calcularAlertaRenovacion = (fechaRegistro) => {
    const fechaReg = new Date(fechaRegistro);
    const ahora = new Date();
    const diferenciaMs = ahora - fechaReg;
    const diasTranscurridos = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
    return diasTranscurridos >= 335; // Alerta 30 días antes del año
  };

  const manejarSeguimiento = (paciente) => {
    alert(`Paciente: ${paciente.nombre} ${paciente.apellido}\nFase Actual: ${paciente.fase_actual}\n\n` + 
          (paciente.fase_actual === 'LABORATORIO' ? 'El paciente está esperando resultados de laboratorio.' : 
          paciente.fase_actual === 'MEDICO' ? 'El paciente tiene resultados de laboratorio y espera revisión médica.' : 
          'El trámite está finalizado.'));
  };

  const simularImpresion = (paciente) => {
    if (paciente.fase_actual !== 'FINALIZADO') {
      alert('⚠️ El trámite aún no ha finalizado. No se puede imprimir el carnet sanitario.');
    } else {
      alert(`🖨️ Generando Carnet Sanitario para ${paciente.nombre} ${paciente.apellido}...\n[SIMULACIÓN DE IMPRESIÓN]`);
    }
  };

  if (cargando) return <div className="cargando">Cargando registros del sistema...</div>;

  return (
    <div className="gestor-pacientes">
      <header className="cabecera-seccion">
        <h2>Registro y Control de Pacientes</h2>
        <button className="btn-primario" onClick={() => { reestablecerFormulario(); establecerMostrarModal(true); }}>
          + Nuevo Trámite
        </button>
      </header>

      <div className="pacientes-grid">
        {pacientes.map(p => (
          <div key={p.id_cliente} className="paciente-card">
            <div className="card-header">
              <div className="foto-contenedor">
                <img src={p.foto ? `http://localhost:5000${p.foto}` : '/placeholder-paciente.png'} alt="Paciente" className="paciente-foto-card" />
                {calcularAlertaRenovacion(p.fecha_registro) && (
                  <div className="alerta-flotante" title="Próximo a vencer">⚠️</div>
                )}
              </div>
              <div className="resumen-fase">
                <span className={`fase-badge ${p.fase_actual.toLowerCase()}`}>
                  {p.fase_actual}
                </span>
                <span className="tramite-mini-badge">{p.tipo_tramite}</span>
              </div>
            </div>

            <div className="paciente-body">
              <h4 className="paciente-nombre-card">{p.apellido}, {p.nombre}</h4>
              <div className="paciente-datos-grid">
                <div className="dato-item">
                  <span className="dato-label">CI:</span>
                  <span className="dato-valor">{p.ci}</span>
                </div>
                <div className="dato-item">
                  <span className="dato-label">Rubro:</span>
                  <span className="dato-valor">{p.rubro_desc || 'S/D'}</span>
                </div>
              </div>
            </div>

            <div className="paciente-footer">
              <div className="acciones-paciente">
                <button className="btn-circulo" title="Editar" onClick={() => iniciarEdicion(p)}>✏️</button>
                {calcularAlertaRenovacion(p.fecha_registro) && (
                  <button className="btn-circulo" title="Renovar" onClick={() => iniciarEdicion(p, true)}>🔄</button>
                )}
                <button className="btn-circulo" title="Seguimiento" onClick={() => manejarSeguimiento(p)}>🔍</button>
                <button 
                  className={`btn-circulo ${p.fase_actual === 'FINALIZADO' ? 'imprimir-listo' : ''}`} 
                  title="Imprimir Carnet" 
                  onClick={() => simularImpresion(p)}
                >
                  🖨️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {mostrarModal && (
        <div className="capa-modal">
          <div className="modal-contenido anima-entrada">
            <h3>{esRenovacion ? 'Renovación de Carnet' : (editandoId ? 'Editar Paciente' : 'Registro Integral de Paciente')}</h3>
            <form onSubmit={gestionarRegistro}>
              <div className="seccion-fotos">
                {capturandoFoto ? (
                  <div className="camara-contenedor">
                    <Webcam audio={false} ref={camaraRef} screenshotFormat="image/jpeg" className="previsualizacion-cam" />
                    <button type="button" onClick={capturarMuestra} className="btn-capturar">Capturar Foto</button>
                  </div>
                ) : (
                  <div className="foto-capturada-visor">
                    {fotoCapturada ? (
                      <img src={fotoCapturada} alt="Muestra" className="muestra-img" />
                    ) : (
                      <div className="sin-foto">Sin fotografía</div>
                    )}
                    <button type="button" onClick={() => establecerCapturandoFoto(true)} className="btn-secundario">
                      {fotoCapturada ? 'Volver a Tomar' : 'Tomar Fotografía'}
                    </button>
                  </div>
                )}
              </div>

              <div className="formulario-cuadricula">
                <input type="text" placeholder="Nombres" required value={datosFormulario.nombre} onChange={e => establecerDatosFormulario({...datosFormulario, nombre: e.target.value})} />
                <input type="text" placeholder="Apellidos" required value={datosFormulario.apellido} onChange={e => establecerDatosFormulario({...datosFormulario, apellido: e.target.value})} />
                <input type="date" placeholder="Fecha Nacimiento" required value={datosFormulario.fecha_nacimiento} onChange={e => establecerDatosFormulario({...datosFormulario, fecha_nacimiento: e.target.value})} />
                <input type="text" placeholder="Cédula de Identidad" required value={datosFormulario.ci} onChange={e => establecerDatosFormulario({...datosFormulario, ci: e.target.value})} />
                <input type="text" placeholder="Domicilio Exacto" required value={datosFormulario.domicilio} onChange={e => establecerDatosFormulario({...datosFormulario, domicilio: e.target.value})} />
                <input type="text" placeholder="Nro de Celular" value={datosFormulario.nro_celular} onChange={e => establecerDatosFormulario({...datosFormulario, nro_celular: e.target.value})} />
                <input type="text" placeholder="Lugar de Trabajo" value={datosFormulario.lugar_trabajo} onChange={e => establecerDatosFormulario({...datosFormulario, lugar_trabajo: e.target.value})} />
                
                <select required value={datosFormulario.id_tipo_trabajo} onChange={e => establecerDatosFormulario({...datosFormulario, id_tipo_trabajo: e.target.value})}>
                  <option value="">Seleccione Rubro</option>
                  {rubros.map(r => <option key={r.id_tipo_trabajo} value={r.id_tipo_trabajo}>{r.descripcion}</option>)}
                </select>


              </div>

              <div className="acciones-finales">
                <button type="submit" className="btn-confirmar">{editandoId ? 'Guardar Cambios' : 'Completar Registro'}</button>
                <button type="button" onClick={() => establecerMostrarModal(false)} className="btn-cancelar">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestorPacientes;
