import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import './AdminLayout.css';

const DisenoAdmin = () => {
  const navegar = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const [plegada, setPlegada] = useState(false);

  const gestionarCierreSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navegar('/login');
  };

  return (
    <div className="admin-layout">
      <aside className={`barra-lateral ${plegada ? 'plegada' : ''}`}>
        <button className="btn-toggle" onClick={() => setPlegada(!plegada)} title={plegada ? "Expandir" : "Plegar"}>
          ☰
        </button>
        <div className="cabecera-lateral">
          <h3>SEDES Admin</h3>
          <p className="usuario-identidad">{usuario?.nombre}</p>
          <span className="rol-badge">{usuario?.rol}</span>
        </div>
        <nav className="navegacion-lateral">
          <NavLink to="/admin/usuarios" className={({ isActive }) => isActive ? 'activo' : ''}>
            <span className="nav-icon">👥</span>
            <span className="nav-text">Gestión de Usuarios</span>
          </NavLink>
          <NavLink to="/admin/clientes" className={({ isActive }) => isActive ? 'activo' : ''}>
            <span className="nav-icon">📇</span>
            <span className="nav-text">Gestión de Pacientes</span>
          </NavLink>
          <NavLink to="/admin/reportes" className={({ isActive }) => isActive ? 'activo' : ''}>
            <span className="nav-icon">📊</span>
            <span className="nav-text">Reportes Estadísticos</span>
          </NavLink>
        </nav>
        <button className="btn-cierre" onClick={gestionarCierreSesion}>
          <span className="nav-icon">🚪</span>
          <span>Cerrar Sesión</span>
        </button>
      </aside>
      <main className="area-contenido">
        <header className="cabecera-pagina">
          <h2>Panel de Administración Central</h2>
        </header>
        <div className="contenido-dinamico">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DisenoAdmin;
