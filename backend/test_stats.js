const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgres://postgres:cristhiane@localhost:5432/sedeskardex'
});

async function testStats() {
  const queries = [
    { name: 'Tramites', sql: 'SELECT tipo_tramite, COUNT(*) FROM clientes GROUP BY tipo_tramite' },
    { name: 'Fases', sql: `SELECT 
         CASE 
           WHEN h.id_historial IS NOT NULL THEN 'FINALIZADO'
           WHEN al.id_analisis_lab IS NOT NULL THEN 'MEDICO'
           ELSE 'LABORATORIO'
         END as fase,
         COUNT(*)
       FROM clientes c 
       LEFT JOIN (SELECT DISTINCT id_cliente, id_analisis_lab FROM analisis_laboratorio) al ON c.id_cliente = al.id_cliente
       LEFT JOIN historial_medico h ON al.id_analisis_lab = h.id_analisis_lab
       GROUP BY fase` },
    { name: 'Edades', sql: `SELECT 
         CASE 
           WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) < 18 THEN 'Menor de 18'
           WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) BETWEEN 18 AND 40 THEN '18-40'
           WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) BETWEEN 41 AND 60 THEN '41-60'
           ELSE 'Mayor de 60'
         END as rango_edad,
         COUNT(*)
       FROM clientes GROUP BY rango_edad` }
  ];

  for (const q of queries) {
    try {
      console.log(`Probando query: ${q.name}...`);
      const res = await pool.query(q.sql);
      console.log(`Resultado ${q.name}: Exitoso (${res.rowCount} filas)`);
    } catch (err) {
      console.error(`ERROR en ${q.name}:`, err.message);
    }
  }
  pool.end();
}

testStats();
