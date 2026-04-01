import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MedicalQueue.css'; // Premium custom CSS for Medical Role

const MedicalQueue = () => {
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
      const res = await axios.get('http://localhost:5000/api/medico/cola', config);
      setCola(res.data);
    } catch (error) {
      alert('Error al cargar la cola médica');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="medical-queue-container">
        <h3 className="medical-queue-title">🩺 Consultorio Médico</h3>
        <div className="queue-grid">
          {[1,2,3,4].map(n => (
            <div key={n} className="skeleton-card">
              <div className="skeleton-text title"></div>
              <div className="skeleton-text short"></div>
              <div className="skeleton-text short" style={{marginTop: '2rem'}}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="medical-queue-container">
      <h3 className="medical-queue-title">🩺 Fila de Pacientes en Espera</h3>
      
      {cola.length === 0 ? (
        <div className="empty-queue-state">
          <div className="empty-icon">☕</div>
          <h4>No hay pacientes pendientes</h4>
          <p>Toda la cola ha sido despachada por el momento.</p>
        </div>
      ) : (
        <div className="medical-queue-grid">
          {cola.map((c, index) => (
            <div key={c.id_cliente} className="medical-card">
              <div className="card-indicator">#{index + 1}</div>
              
              <div className="patient-avatar-mini">
                {c.foto ? (
                  <img src={`http://localhost:5000${c.foto}`} alt={c.nombre} className="avatar-img" />
                ) : (
                  <div className="avatar-placeholder-med">
                    {c.nombre[0]}{c.apellido[0]}
                  </div>
                )}
              </div>

              <div className="patient-core-info">
                <h4 className="patient-name-title">{c.nombre} {c.apellido}</h4>
                <div className="patient-meta-row">
                  <span className="meta-item">CI: {c.ci}</span>
                  <span className="meta-separator">•</span>
                  <span className="meta-item">{c.tipo_tramite}</span>
                </div>
              </div>

              <div className="card-ctrl">
                <button 
                  className="btn-expediente"
                  onClick={() => navigate(`/medico/consulta/${c.id_analisis_lab}`)}
                >
                  Abrir Consulta
                  <svg className="btn-icon-med" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalQueue;
