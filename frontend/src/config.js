// src/config.js
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://kardex-api.onrender.com'; // <--- PEGA AQUÍ TU URL DE RENDER

export default API_URL;