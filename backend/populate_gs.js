const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function poblarGrupos() {
  const grupos = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
  try {
    const check = await pool.query('SELECT COUNT(*) FROM grupos_sanguineos');
    if (parseInt(check.rows[0].count) === 0) {
      console.log('Poblando grupos sanguíneos...');
      for (const gs of grupos) {
        await pool.query('INSERT INTO grupos_sanguineos (nombre_grupo) VALUES ($1)', [gs]);
      }
      console.log('Grupos sanguíneos insertados con éxito.');
    } else {
      console.log('La tabla grupos_sanguineos ya contiene datos.');
    }
  } catch (error) {
    console.error('Error poblando DB:', error);
  } finally {
    pool.end();
  }
}

poblarGrupos();
