import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminReports.css';

const MedicalReports = () => {
  const [datos, establecerDatos] = useState(null);
  const [cargando, establecerCargando] = useState(true);
  const [rango, establecerRango] = useState('semana');
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => { obtenerDatos(); }, [rango]);

  const obtenerDatos = async () => {
    establecerCargando(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/reportes/medico?rango=${rango}`, config);
      establecerDatos(res.data);
    } catch (e) { console.error('Error en reporte médico:', e); }
    finally { establecerCargando(false); }
  };

  const tasaAprobacion = datos && datos.total > 0
    ? ((datos.aprobados / datos.total) * 100).toFixed(1)
    : 0;

  return (
    <div className="reportes-container" id="zona-impresion">
      <header className="reportes-header no-print">
        <div>
          <h2>Reportes de Consultas Médicas</h2>
          <p>Estadísticas de atención médica y diagnósticos del SEDES Beni</p>
        </div>
        <div className="reportes-acciones">
          <select className="filtro-rango" value={rango} onChange={e => establecerRango(e.target.value)}>
            <option value="dia">Hoy</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
          </select>
          <button className="btn-imprimir no-print" onClick={() => window.print()}>🖨️ Imprimir</button>
        </div>
      </header>

      {cargando ? (
        <div className="reporte-loading"><div className="spinner-grande"></div><p>Cargando datos médicos...</p></div>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi-card" style={{ borderTopColor: '#2563eb' }}>
              <p className="kpi-label">Consultas Realizadas</p>
              <p className="kpi-valor" style={{ color: '#2563eb' }}>{datos?.total || 0}</p>
              <p className="kpi-sub">Periodo: {rango}</p>
            </div>
            <div className="kpi-card" style={{ borderTopColor: '#16a34a' }}>
              <p className="kpi-label">Pacientes Aprobados</p>
              <p className="kpi-valor" style={{ color: '#16a34a' }}>{datos?.aprobados || 0}</p>
              <p className="kpi-sub">Carnet emitido</p>
            </div>
            <div className="kpi-card" style={{ borderTopColor: '#dc2626' }}>
              <p className="kpi-label">Derivados a Reconsulta</p>
              <p className="kpi-valor" style={{ color: '#dc2626' }}>{datos?.reconsultas || 0}</p>
              <p className="kpi-sub">Requieren seguimiento</p>
            </div>
            <div className="kpi-card" style={{ borderTopColor: '#7c3aed' }}>
              <p className="kpi-label">Tasa de Aprobación</p>
              <p className="kpi-valor" style={{ color: '#7c3aed' }}>{tasaAprobacion}%</p>
              <p className="kpi-sub">Del período actual</p>
            </div>
          </div>

          <div className="grafico-card" style={{ marginTop: '1.5rem' }}>
            <h3>Diagnósticos Más Frecuentes</h3>
            <p className="grafico-subtitulo">Top 5 diagnósticos del período seleccionado</p>
            {datos?.diagnosticos?.length > 0 ? (
              <table className="tabla-diagnosticos">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Diagnóstico</th>
                    <th>Frecuencia</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.diagnosticos.map((d, i) => (
                    <tr key={i}>
                      <td><span className="rank-badge">#{i + 1}</span></td>
                      <td>{d.diagnostico}</td>
                      <td><strong>{d.frecuencia}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="empty-msg">No hay diagnósticos registrados en este período.</p>
            )}
          </div>

          <div className="panel-ia">
            <div className="ia-cabecera">
              <span className="ia-badge">✨ IA</span>
              <h4>Observación Clínica — Asistida por Gemini AI</h4>
              <button className="ia-refresh" onClick={obtenerDatos}>↻</button>
            </div>
            <div className="ia-texto">
              <p>{datos?.analisis_ia || 'Sin datos suficientes para analizar.'}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MedicalReports;
