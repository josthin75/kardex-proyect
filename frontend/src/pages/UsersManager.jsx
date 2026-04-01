import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UsersManager.css';

/**
 * Componente: Gestor de Usuarios
 * Permite el registro y control de personal del SEDES (Admin, Bio, Med).
 * Nomenclatura profesional en español según "Aspectos Generales".
 */
const GestorUsuarios = () => {
  const [usuarios, establecerUsuarios] = useState([]);
  const [roles, establecerRoles] = useState([]);
  const [cargando, establecerCargando] = useState(true);
  const [mostrarModal, establecerMostrarModal] = useState(false);
  const [usuarioEditando, establecerUsuarioEditando] = useState(null);
  const [datosFormulario, establecerDatosFormulario] = useState({
    nombre: '', apellido: '', ci: '', id_rol: '', contrasena: ''
  });

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    obtenerDatosSistema();
  }, []);

  const obtenerDatosSistema = async () => {
    try {
      const [resUsuarios, resRoles] = await Promise.all([
        axios.get('http://localhost:5000/api/usuarios', config),
        axios.get('http://localhost:5000/api/catalogos/roles', config)
      ]);
      establecerUsuarios(resUsuarios.data);
      establecerRoles(resRoles.data);
    } catch (error) {
      console.error('Error al sincronizar usuarios:', error);
    } finally {
      establecerCargando(false);
    }
  };

  const abrirModalNuevo = () => {
    establecerUsuarioEditando(null);
    establecerDatosFormulario({ nombre: '', apellido: '', ci: '', id_rol: '', contrasena: '' });
    establecerMostrarModal(true);
  };

  const abrirModalEdicion = (usuario) => {
    establecerUsuarioEditando(usuario);
    establecerDatosFormulario({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      ci: usuario.ci,
      id_rol: roles.find(r => r.nombre_rol === usuario.nombre_rol)?.id_rol || '',
      contrasena: '' // Se deja vacío por seguridad, si no lo llenan no se actualiza
    });
    establecerMostrarModal(true);
  };

  const gestionarRegistro = async (e) => {
    e.preventDefault();
    try {
      if (usuarioEditando) {
        await axios.put(`http://localhost:5000/api/usuarios/${usuarioEditando.id_usuario}`, datosFormulario, config);
        alert('Usuario actualizado exitosamente');
      } else {
        await axios.post('http://localhost:5000/api/usuarios', datosFormulario, config);
        alert('Usuario registrado con éxito');
      }
      obtenerDatosSistema();
      establecerMostrarModal(false);
    } catch (error) {
      alert(error.response?.data?.mensaje || 'Fallo en la operación');
    }
  };

  const cambiarEstadoUsuario = async (id_usuario) => {
    if(!window.confirm('¿Seguro que desea cambiar el estado de acceso de este usuario?')) return;
    try {
      await axios.put(`http://localhost:5000/api/usuarios/${id_usuario}/estado`, {}, config);
      obtenerDatosSistema();
    } catch (error) {
      alert('Error al actualizar el estado del usuario');
    }
  };

  if (cargando) return <div className="cargando">Cargando personal autorizado...</div>;

  return (
    <div className="gestor-usuarios">
      <header className="cabecera-seccion">
        <h2>Personal del Sistema</h2>
        <button className="btn-primario" onClick={abrirModalNuevo}>
          + Registrar Usuario
        </button>
      </header>

      <div className="usuarios-grid">
        {usuarios.map(u => (
          <div key={u.id_usuario} className="usuario-card">
            <div className="card-top">
              <div className={`usuario-avatar rol-${u.nombre_rol.toLowerCase().replace(' ', '-')}`}>
                {u.nombre[0]}{u.apellido[0]}
              </div>
              <div className="usuario-status">
                <span className={`punto-estado ${u.activo ? 'activo' : 'inactivo'}`}></span>
                {u.activo ? 'Autorizado' : 'Suspendido'}
              </div>
            </div>

            <div className="usuario-info">
              <h4 className="usuario-nombre">{u.apellido}, {u.nombre}</h4>
              <p className="usuario-ci">CI: {u.ci}</p>
              <span className="usuario-rol-badge">{u.nombre_rol}</span>
            </div>

            <div className="usuario-acciones">
              <button className="btn-icon-accion" onClick={() => abrirModalEdicion(u)} title="Editar">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button 
                className={`btn-icon-accion ${u.activo ? 'suspender' : 'autorizar'}`} 
                onClick={() => cambiarEstadoUsuario(u.id_usuario)}
                title={u.activo ? 'Suspender Acceso' : 'Autorizar Acceso'}
              >
                {u.activo ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {mostrarModal && (
        <div className="capa-modal">
          <div className="modal-contenido anima-entrada">
            <h3>{usuarioEditando ? 'Actualizar Datos del Personal' : 'Registro de Nuevo Personal'}</h3>
            <form onSubmit={gestionarRegistro} className="formulario-vertical">
              <div className="campo-grupo">
                <input type="text" placeholder="Nombres" required value={datosFormulario.nombre} onChange={e => establecerDatosFormulario({...datosFormulario, nombre: e.target.value})} />
                <input type="text" placeholder="Apellidos" required value={datosFormulario.apellido} onChange={e => establecerDatosFormulario({...datosFormulario, apellido: e.target.value})} />
                <input type="text" placeholder="Cédula de Identidad" required value={datosFormulario.ci} onChange={e => establecerDatosFormulario({...datosFormulario, ci: e.target.value})} />
                
                <select required value={datosFormulario.id_rol} onChange={e => establecerDatosFormulario({...datosFormulario, id_rol: e.target.value})}>
                  <option value="">Asignar Rol</option>
                  {roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>)}
                </select>

                <input 
                  type="password" 
                  placeholder={usuarioEditando ? "Nueva Contraseña (dejar en blanco para mantener)" : "Contraseña de Acceso"} 
                  required={!usuarioEditando} 
                  value={datosFormulario.contrasena} 
                  onChange={e => establecerDatosFormulario({...datosFormulario, contrasena: e.target.value})} 
                />
              </div>

              <div className="acciones-finales">
                <button type="submit" className="btn-confirmar">
                  {usuarioEditando ? 'Guardar Cambios' : 'Registrar Nuevo Personal'}
                </button>
                <button type="button" onClick={() => establecerMostrarModal(false)} className="btn-cancelar">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestorUsuarios;
