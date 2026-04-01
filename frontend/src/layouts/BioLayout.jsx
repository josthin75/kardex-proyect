import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import '../layouts/AdminLayout.css'; // Reutilizamos estilos base

const BioLayout = () => {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const [plegada, setPlegada] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <aside className={`barra-lateral ${plegada ? 'plegada' : ''}`}>
        <button className="btn-toggle" onClick={() => setPlegada(!plegada)} title={plegada ? "Expandir" : "Plegar"}>
          ☰
        </button>
        <div className="cabecera-lateral">
          <h3>SEDES Lab</h3>
          <p className="usuario-identidad">{usuario?.nombre}</p>
          <span className="rol-badge">BIOANALISTA</span>
        </div>
        <nav className="navegacion-lateral">
          <NavLink to="/bioanalista/cola" className={({ isActive }) => isActive ? 'activo' : ''}>
            <span className="nav-icon">📋</span>
            <span className="nav-text">Cola de Espera</span>
          </NavLink>
          <NavLink to="/bioanalista/reportes" className={({ isActive }) => isActive ? 'activo' : ''}>
            <span className="nav-icon">📈</span>
            <span className="nav-text">Mis Reportes</span>
          </NavLink>
        </nav>
        <button className="btn-cierre" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
          <span>Cerrar Sesión</span>
        </button>
      </aside>
      <main className="area-contenido">
        <header className="cabecera-pagina">
          <h2>Módulo de Bioanálisis</h2>
        </header>
        <div className="contenido-dinamico">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default BioLayout;
