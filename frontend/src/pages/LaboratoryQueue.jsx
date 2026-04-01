import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LaboratoryQueue.css';

const LaboratoryQueue = () => {
  const [cola, setCola] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(() => {
      fetchQueue();
    }, 30000); // Polling cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/laboratorio/cola', config);
      setCola(res.data);
    } catch (error) {
      console.error('Error al cargar la cola:', error);
      // Fallback a array vacío en error para mostrar el empty state gracefully
      setCola([]); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="queue-container">
      <div className="queue-header">
        <h3>Cola de Análisis</h3>
        {!loading && cola.length > 0 && (
          <span className="queue-badge">{cola.length} en espera</span>
        )}
      </div>

      <div className="queue-list">
        {loading ? (
          // Skeletons de Carga
          [...Array(3)].map((_, i) => (
            <div key={`skel-${i}`} className="skeleton-item"></div>
          ))
        ) : cola.length === 0 ? (
          // Estado Vacío Elegante
          <div className="empty-state">
            <svg className="empty-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h4>No hay pacientes en cola</h4>
            <p>Todos los análisis han sido procesados. El sistema está al día.</p>
          </div>
        ) : (
          // Lista de Clientes en Cola
          cola.map((c, index) => (
            <div key={c.id_cliente} className="queue-card">
              <div className="card-rank">{index + 1}</div>
              
              <div className="patient-avatar">
                {c.foto ? (
                  <img src={`http://localhost:5000${c.foto}`} alt={c.nombre} className="avatar-img" />
                ) : (
                  <div className="avatar-placeholder">
                    {c.nombre[0]}{c.apellido[0]}
                  </div>
                )}
              </div>

              <div className="patient-main-info">
                <div className="name-row">
                  <span className="patient-name">{c.nombre} {c.apellido}</span>
                  <span className={`badge-tramite ${c.tipo_tramite === 'renovacion' ? 'renovacion' : 'primera-vez'}`}>
                    {c.tipo_tramite || 'Trámite'}
                  </span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-item">
                    <svg className="detail-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    CI: {c.ci}
                  </span>
                  <span className="detail-item">
                    <svg className="detail-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {c.lugar_trabajo || 'S/D'}
                  </span>
                </div>
              </div>

              <div className="card-actions">
                <button 
                  className="atender-btn"
                  onClick={() => navigate(`/bioanalista/analisis/${c.id_cliente}`)}
                  title="Iniciar Atención"
                >
                  <span className="btn-text">Atender</span>
                  <svg className="btn-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LaboratoryQueue;
