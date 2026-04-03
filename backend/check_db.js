const { Pool } = require('pg');

const pool = new Pool({
  // Si existe la variable DATABASE_URL (en producción), la usa. 
  // Si no, usa tu local (para que sigas trabajando en casa).
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:1234@localhost:5432/sedeskardex',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});
async function check() {
  try {
    const res = await pool.query('SELECT u.id_usuario, u.nombre, u.ci, r.nombre_rol, u.contrasena_hash FROM usuarios u LEFT JOIN roles r ON u.id_rol = r.id_rol');
    console.log('--- RESULTADO ---');
    console.log(JSON.stringify(res.rows, null, 2));
    console.log('--- FIN ---');
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    pool.end();
  }
}
check();
