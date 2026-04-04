// src/config.js
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : 'https://kardex-api.onrender.com'; // <--- Tu URL de Render

export default API_URL;