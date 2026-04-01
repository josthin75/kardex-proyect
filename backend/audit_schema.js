const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({
  connectionString: 'postgres://postgres:cristhiane@localhost:5432/sedeskardex'
});

async function audit() {
  let output = '';
  try {
    const resTables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    const tables = resTables.rows.map(r => r.table_name);
    output += '--- TABLAS ---\n' + tables.join(', ') + '\n';

    for (const table of tables) {
      const resCols = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`, [table]);
      output += `\n--- TABLA: ${table} ---\n`;
      resCols.rows.forEach(c => {
        output += `- ${c.column_name} (${c.data_type}, ${c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})\n`;
      });
    }
    fs.writeFileSync('full_schema.txt', output, 'utf8');
    console.log('Auditoria completada en full_schema.txt');
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    pool.end();
  }
}
audit();
