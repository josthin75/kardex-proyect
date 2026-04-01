const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgres://postgres:cristhiane@localhost:5432/sedeskardex'
});

async function update() {
  try {
    const res = await pool.query("UPDATE usuarios SET contrasena_hash = '$2b$10$SboqStRdnRGyV3rYR9Tm9OIR98mVBCdxMPMPkjQP3e68YvhXVuwEm' WHERE ci = '1234567'");
    console.log('ACTUALIZADO:', res.rowCount, 'filas.');
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    pool.end();
  }
}
update();
