const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({
  connectionString: 'postgres://postgres:cristhiane@localhost:5432/sedeskardex'
});

async function deepAudit() {
  try {
    const resTables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
    const tables = resTables.rows.map(r => r.table_name);
    let sql = '-- ================================================================\n';
    sql += '-- ESQUEMA ACTUALIZADO DESDE BASE DE DATOS REAL (Auditoría Profunda)\n';
    sql += '-- ================================================================\n\n';

    for (const table of tables) {
      sql += `-- ----------------------------------------------------------------\n`;
      sql += `-- TABLA: ${table}\n`;
      sql += `-- ----------------------------------------------------------------\n`;
      sql += `CREATE TABLE ${table} (\n`;

      // Columnas
      const resCols = await pool.query(`
        SELECT column_name, data_type, character_maximum_length, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position`, [table]);

      const lines = [];
      resCols.rows.forEach(c => {
        let line = `    ${c.column_name.padEnd(20)} ${c.data_type.toUpperCase()}`;
        if (c.character_maximum_length) line += `(${c.character_maximum_length})`;
        if (c.is_nullable === 'NO') line += ' NOT NULL';
        if (c.column_default) line += ` DEFAULT ${c.column_default}`;
        lines.push(line);
      });

      // Constraint PK/FK (simplificado)
      const resCons = await pool.query(`
        SELECT pg_get_constraintdef(c.oid) as def
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        JOIN pg_class cl ON cl.oid = c.conrelid
        WHERE n.nspname = 'public' AND cl.relname = $1`, [table]);

      resCons.rows.forEach(con => {
        lines.push(`    /* ${con.def} */`);
      });

      sql += lines.join(',\n');
      sql += '\n);\n\n';
    }

    fs.writeFileSync('db_reality.sql', sql, 'utf8');
    console.log('SQL técnico generado en db_reality.sql');
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    pool.end();
  }
}
deepAudit();
