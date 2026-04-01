import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DisenoAdmin from './layouts/AdminLayout';
import GestorUsuarios from './pages/UsersManager';
import GestorPacientes from './pages/ClientsManager';
import ReportesAdmin from './pages/AdminReports';

import BioLayout from './layouts/BioLayout';
import LaboratoryQueue from './pages/LaboratoryQueue';
import LaboratoryAnalysis from './pages/LaboratoryAnalysis';
import MedicalLayout from './layouts/MedicalLayout';
import MedicalQueue from './pages/MedicalQueue';
import MedicalHistory from './pages/MedicalHistory';
import BioReports from './pages/BioReports';
import MedicalReports from './pages/MedicalReports';

// --- RUTAS PROTEGIDAS CONFIGURADAS ---
const RutaProtegida = ({ children, rolPermitido }) => {
  const token = localStorage.getItem('token');
  const usuario = JSON.parse(localStorage.getItem('usuario'));

  if (!token || !usuario) {
    return <Navigate to="/login" replace />;
  }

  if (rolPermitido && usuario.rol !== rolPermitido) {
    const redirectMap = {
      'ADMINISTRADOR': '/admin',
      'BIOANALISTA': '/bioanalista',
      'MEDICO': '/medico'
    };
    return <Navigate to={redirectMap[usuario.rol] || '/login'} replace />;
  }

  return children;
};


// --- COMPONENTE DE ERROR SEGURO ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
          <h2>Algo no salió como esperábamos.</h2>
          <p>La aplicación ha encontrado un error inesperado.</p>
          <button onClick={() => window.location.href = '/'} style={{ padding: '0.8rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            Reiniciar Sistema
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Módulo Administrador */}
        <Route path="/admin" element={
          <RutaProtegida rolPermitido="ADMINISTRADOR">
            <DisenoAdmin />
          </RutaProtegida>
        }>
          <Route index element={<Navigate to="usuarios" replace />} />
          <Route path="usuarios" element={<GestorUsuarios />} />
          <Route path="clientes" element={<GestorPacientes />} />
          <Route path="reportes" element={<ReportesAdmin />} />
        </Route>

        {/* Módulo Bioanalista */}
        <Route path="/bioanalista" element={
          <RutaProtegida rolPermitido="BIOANALISTA">
            <BioLayout />
          </RutaProtegida>
        }>
          <Route index element={<Navigate to="cola" replace />} />
          <Route path="cola" element={<LaboratoryQueue />} />
          <Route path="analisis/:idCliente" element={<LaboratoryAnalysis />} />
          <Route path="reportes" element={<BioReports />} />
        </Route>

        {/* Módulo Médico */}
        <Route path="/medico" element={
          <RutaProtegida rolPermitido="MEDICO">
            <MedicalLayout />
          </RutaProtegida>
        }>
          <Route index element={<Navigate to="cola" replace />} />
          <Route path="cola" element={<MedicalQueue />} />
          <Route path="consulta/:idAnalisisLab" element={<MedicalHistory />} />
          <Route path="reportes" element={<MedicalReports />} />
        </Route>

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
