const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgres://postgres:1234@localhost:5432/sedeskardex'
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
