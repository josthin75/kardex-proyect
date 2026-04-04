import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import API_URL from '../config'; 

const Login = () => {
  const [ci, establecerCI] = useState('');
  const [contrasena, establecerContrasena] = useState('');
  const [error, establecerError] = useState('');
  const [cargando, establecerCargando] = useState(false);
  const navegar = useNavigate();

  const gestionarEnvio = async (e) => {
    e.preventDefault();
    establecerError('');
    establecerCargando(true);

    try {
      // Usamos la URL dinámica. 
      // Si estás en Vercel, esto apuntará a Render automáticamente.
      const respuesta = await axios.post(`${API_URL}/api/autenticacion/inicio-sesion`, { 
        ci, 
        contrasena 
      });
      
      const { token, usuario } = respuesta.data;

      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));

      // Redirección lógica
      const rol = usuario.id_rol === 1 ? 'ADMINISTRADOR' : usuario.rol; 

      if (rol === 'ADMINISTRADOR') {
        navegar('/admin');
      } else if (rol === 'BIOANALISTA') {
        navegar('/bioanalista');
      } else if (rol === 'MEDICO') {
        navegar('/medico');
      } else {
        establecerError('Rol no reconocido. Contacte al soporte.');
      }
    } catch (err) {
      console.error("Error completo:", err);
      if (err.code === 'ERR_NETWORK') {
        establecerError('No se pudo conectar con el servidor. El backend en Render podría estar despertando, intenta de nuevo en 30 segundos.');
      } else {
        establecerError(err.response?.data?.mensaje || 'Credenciales incorrectas');
      }
    } finally {
      establecerCargando(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>SEDES Kardex</h2>
        <p>Sistema Central de Gestión de Carnet Sanitario</p>
        <form onSubmit={gestionarEnvio}>
          <div className="form-group">
            <label htmlFor="ci">Cédula de Identidad</label>
            <input
              type="text"
              id="ci"
              value={ci}
              onChange={(e) => establecerCI(e.target.value)}
              required
              placeholder="Ingrese su CI"
            />
          </div>
          <div className="form-group">
            <label htmlFor="contrasena">Contraseña</label>
            <input
              type="password"
              id="contrasena"
              value={contrasena}
              onChange={(e) => establecerContrasena(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>
          {error && <div className="error-message" style={{color: 'red', marginBottom: '10px'}}>{error}</div>}
          <button type="submit" disabled={cargando}>
            {cargando ? 'Conectando con el servidor...' : 'Acceder al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;