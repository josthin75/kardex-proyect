import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import API_URL from '../config'; // Importamos la URL dinámica

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
      // USAMOS API_URL EN LUGAR DE localhost
      const respuesta = await axios.post(`${API_URL}/api/autenticacion/inicio-sesion`, { 
        ci, 
        contrasena 
      });
      
      const { token, usuario } = respuesta.data;

      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));

      // Redirección basada en el rol
      if (usuario.rol === 'ADMINISTRADOR') {
        navegar('/admin');
      } else if (usuario.rol === 'BIOANALISTA') {
        navegar('/bioanalista');
      } else if (usuario.rol === 'MEDICO') {
        navegar('/medico');
      } else {
        establecerError('Rol de usuario no reconocido en el sistema');
      }
    } catch (err) {
      establecerError(err.response?.data?.mensaje || 'Error en la autenticación central');
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
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={cargando}>
            {cargando ? 'Autenticando...' : 'Acceder al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;