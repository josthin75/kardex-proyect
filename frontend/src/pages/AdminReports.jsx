import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './AdminReports.css';

const COLORES = ['#2563eb', '#7c3aed', '#16a34a', '#dc2626', '#ea580c'];

const TarjetaKPI = ({ titulo, valor, subtitulo, color }) => (
  <div className="kpi-card" style={{ borderTopColor: color }}>
    <p className="kpi-label">{titulo}</p>
    <p className="kpi-valor" style={{ color }}>{valor}</p>
    {subtitulo && <p className="kpi-sub">{subtitulo}</p>}
  </div>
);

const PanelIA = ({ texto, cargando, onRefresh }) => (
  <div className="panel-ia">
    <div className="ia-cabecera">
      <span className="ia-badge">✨ IA</span>
      <h4>Análisis Epidemiológico Inteligente</h4>
      <button className="ia-refresh" onClick={onRefresh} title="Regenerar análisis">↻</button>
    </div>
    <div className="ia-texto">
      {cargando ? <p className="ia-loading">Consultando Gemini AI...</p> : <p>{texto || 'Sin datos suficientes para analizar.'}</p>}
    </div>
  </div>
);

const ReportesAdmin = () => {
  const [datos, establecerDatos] = useState(null);
  const [cargando, establecerCargando] = useState(true);
  const [rango, establecerRango] = useState('mes');
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => { obtenerDatos(); }, [rango]);

  const obtenerDatos = async () => {
    establecerCargando(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/reportes/admin?rango=${rango}`, config);
      establecerDatos(res.data);
    } catch (e) { console.error('Error en reporte admin:', e); }
    finally { establecerCargando(false); }
  };

  const imprimir = () => window.print();

  const clinicos = datos ? [
    { name: 'VIH Reactivo', value: parseInt(datos.clinicos?.vih_positivos) || 0 },
    { name: 'Chagas Reactivo', value: parseInt(datos.clinicos?.chagas_positivos) || 0 },
    { name: 'Parasitología +', value: parseInt(datos.clinicos?.parasito_positivos) || 0 },
    { name: 'Glicemia Alterada', value: parseInt(datos.clinicos?.glicemia_alterada) || 0 },
  ] : [];

  const sanos = datos ? Math.max(0, parseInt(datos.clinicos?.total_analisis || 0) - clinicos.reduce((s, c) => s + c.value, 0)) : 0;
  const pieData = [...clinicos.filter(c => c.value > 0), { name: 'Sin hallazgos', value: sanos }];

  return (
    <div className="reportes-container" id="zona-impresion">
      <header className="reportes-header no-print">
        <div>
          <h2>Panel de Reportes Administrativos</h2>
          <p>Análisis estadístico y epidemiológico del SEDES Beni</p>
        </div>
        <div className="reportes-acciones">
          <select className="filtro-rango" value={rango} onChange={e => establecerRango(e.target.value)}>
            <option value="hora">Última Hora</option>
            <option value="dia">Hoy</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
            <option value="anio">Este Año</option>
          </select>
          <button className="btn-imprimir no-print" onClick={imprimir}>🖨️ Imprimir Informe</button>
        </div>
      </header>

      {cargando ? (
        <div className="reporte-loading">
          <div className="spinner-grande"></div>
          <p>Generando análisis estadístico...</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="kpi-grid">
            <TarjetaKPI titulo="Total Trámites" valor={datos?.resumen?.total ?? 0} subtitulo={`Periodo: ${rango}`} color="#2563eb" />
            <TarjetaKPI titulo="VIH Reactivo" valor={parseInt(datos?.clinicos?.vih_positivos) || 0} subtitulo="Casos detectados" color="#dc2626" />
            <TarjetaKPI titulo="Chagas Reactivo" valor={parseInt(datos?.clinicos?.chagas_positivos) || 0} subtitulo="Casos detectados" color="#ea580c" />
            <TarjetaKPI titulo="Parasitología +" valor={parseInt(datos?.clinicos?.parasito_positivos) || 0} subtitulo="Hallazgos parasit." color="#7c3aed" />
          </div>

          <div className="graficos-grid">
            {/* Trámites por Tipo */}
            <div className="grafico-card">
              <h3>Flujo de Trámites</h3>
              <p className="grafico-subtitulo">Primeras Veces vs. Renovaciones</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={datos?.tramites || []}>
                  <XAxis dataKey="tipo_tramite" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Cantidad" fill="#2563eb" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Flujo por Fases */}
            <div className="grafico-card">
              <h3>Estado por Fases del Trámite</h3>
              <p className="grafico-subtitulo">Laboratorio → Médico → Finalizado</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={datos?.fases || []}>
                  <XAxis dataKey="fase" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Pacientes" fill="#7c3aed" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Resultados Clínicos Pie */}
            <div className="grafico-card">
              <h3>Resultados Clínicos</h3>
              <p className="grafico-subtitulo">Distribución de hallazgos patológicos</p>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} (${(percent*100).toFixed(0)}%)`} labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Distribución Etaria */}
            <div className="grafico-card">
              <h3>Distribución por Edad</h3>
              <p className="grafico-subtitulo">Rangos etarios de los pacientes</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={datos?.edades || []}>
                  <XAxis dataKey="rango_edad" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Pacientes" fill="#16a34a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <PanelIA texto={datos?.analisis_ia} cargando={false} onRefresh={obtenerDatos} />
        </>
      )}
    </div>
  );
};

export default ReportesAdmin;
