// src/config.js
const RENDER_URL = 'https://kardex-api.onrender.com'; 

const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : RENDER_URL;

export default API_URL;