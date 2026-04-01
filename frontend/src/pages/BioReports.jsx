import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import './AdminReports.css';

const COLORES = ['#2563eb', '#7c3aed', '#16a34a', '#dc2626', '#ea580c'];

const BioReports = () => {
  const [datos, establecerDatos] = useState(null);
  const [cargando, establecerCargando] = useState(true);
  const [rango, establecerRango] = useState('semana');
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => { obtenerDatos(); }, [rango]);

  const obtenerDatos = async () => {
    establecerCargando(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/reportes/bioanalista?rango=${rango}`, config);
      establecerDatos(res.data);
    } catch (e) { console.error('Error en reporte bio:', e); }
    finally { establecerCargando(false); }
  };

  const positivosData = datos ? [
    { name: 'Parasitología', total: parseInt(datos.tipos?.find(t=>t.nombre==='Parasitología')?.valor)||0, positivos: parseInt(datos.positivos?.parasitologia_pos)||0 },
    { name: 'VIH', total: parseInt(datos.tipos?.find(t=>t.nombre==='VIH')?.valor)||0, positivos: parseInt(datos.positivos?.vih_pos)||0 },
    { name: 'Chagas', total: parseInt(datos.tipos?.find(t=>t.nombre==='Chagas')?.valor)||0, positivos: parseInt(datos.positivos?.chagas_pos)||0 },
    { name: 'Glicemia', total: parseInt(datos.tipos?.find(t=>t.nombre==='Glicemia')?.valor)||0, positivos: parseInt(datos.positivos?.glicemia_pos)||0 },
  ] : [];

  return (
    <div className="reportes-container" id="zona-impresion">
      <header className="reportes-header no-print">
        <div>
          <h2>Reportes de Análisis de Laboratorio</h2>
          <p>Estadísticas de carga de trabajo y hallazgos clínicos</p>
        </div>
        <div className="reportes-acciones">
          <select className="filtro-rango" value={rango} onChange={e => establecerRango(e.target.value)}>
            <option value="hora">Última Hora</option>
            <option value="dia">Hoy</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
          </select>
          <button className="btn-imprimir no-print" onClick={() => window.print()}>🖨️ Imprimir</button>
        </div>
      </header>

      {cargando ? (
        <div className="reporte-loading"><div className="spinner-grande"></div><p>Cargando estadísticas...</p></div>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi-card" style={{ borderTopColor: '#2563eb' }}>
              <p className="kpi-label">Total Análisis</p>
              <p className="kpi-valor" style={{ color: '#2563eb' }}>{datos?.total || 0}</p>
              <p className="kpi-sub">Periodo: {rango}</p>
            </div>
            {[
              { key: 'vih_pos', label: 'VIH Reactivo', color: '#dc2626' },
              { key: 'chagas_pos', label: 'Chagas Reactivo', color: '#ea580c' },
              { key: 'parasitologia_pos', label: 'Parásitos +', color: '#7c3aed' },
            ].map(k => (
              <div key={k.key} className="kpi-card" style={{ borderTopColor: k.color }}>
                <p className="kpi-label">{k.label}</p>
                <p className="kpi-valor" style={{ color: k.color }}>{parseInt(datos?.positivos?.[k.key]) || 0}</p>
                <p className="kpi-sub">Casos reactivos</p>
              </div>
            ))}
          </div>

          <div className="graficos-grid">
            <div className="grafico-card">
              <h3>Análisis por Tipo</h3>
              <p className="grafico-subtitulo">Volumen de trabajo por área de análisis</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={datos?.tipos || []}>
                  <XAxis dataKey="nombre" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="valor" name="Realizados" fill="#2563eb" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grafico-card">
              <h3>Positivos vs. Negativos por Prueba</h3>
              <p className="grafico-subtitulo">Comparativa de resultados reactivos</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={positivosData}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" name="Total" fill="#cbd5e1" radius={[4,4,0,0]} />
                  <Bar dataKey="positivos" name="Positivos" fill="#dc2626" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel-ia">
            <div className="ia-cabecera">
              <span className="ia-badge">✨ IA</span>
              <h4>Observación del Bioanalista — Asistida por IA</h4>
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

export default BioReports;
