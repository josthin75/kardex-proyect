const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgres://postgres:cristhiane@localhost:5432/sedeskardex'
});

async function listTables() {
  try {
    const res = await pool.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
    console.log('TABLAS:', res.rows.map(r => r.tablename).join(', '));
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    pool.end();
  }
}
listTables();
