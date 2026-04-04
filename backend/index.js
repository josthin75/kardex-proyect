const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
// Render asigna el puerto automáticamente mediante la variable PORT
const puerto = process.env.PORT || 5000;

// Prevenir que el servidor se cierre por errores no controlados
process.on('unhandledRejection', (reason) => {
  console.error('[SERVIDOR] Error no controlado:', reason?.message || reason);
});
process.on('uncaughtException', (err) => {
  console.error('[SERVIDOR] Excepción capturada:', err.message);
});

// Asegurar que el directorio de fotos exista
const fotosDir = path.join(__dirname, 'uploads/fotos');
if (!fs.existsSync(fotosDir)) {
  fs.mkdirSync(fotosDir, { recursive: true });
}

// Almacenamiento Seguro con Filtros de Seguridad
const almacenamiento = multer.diskStorage({
  destination: (req, archivo, cb) => cb(null, path.join(__dirname, 'uploads/fotos')),
  filename: (req, archivo, cb) => {
    const sufijo = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, sufijo + path.extname(archivo.originalname));
  }
});

const subirFoto = multer({ 
  storage: almacenamiento,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limite 2MB (Optimizado para escalabilidad)
  fileFilter: (req, archivo, cb) => {
    const tiposPermitidos = /jpeg|jpg|png|webp/;
    const mimetype = tiposPermitidos.test(archivo.mimetype);
    const extname = tiposPermitidos.test(path.extname(archivo.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error("Solo se permiten imágenes (jpg, png, webp)"));
  }
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// Configuración de CORS: En producción, Render y Vercel necesitan permisos
app.use(cors({
  origin: '*', // Por ahora permitimos todo para evitar bloqueos en el despliegue
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/archivos', express.static(path.join(__dirname, 'uploads')));

// --- CONFIGURACIÓN DE BASE DE DATOS (Mantenemos tu local como respaldo) ---
const poolBD = new Pool({ 
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:1234@localhost:5432/sedeskardex',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Función para asegurar índices de alto rendimiento (Escalabilidad)
const asegurarIndices = async () => {
  try {
    const queries = [
      'CREATE INDEX IF NOT EXISTS idx_clientes_fecha ON clientes(fecha_registro DESC)',
      'CREATE INDEX IF NOT EXISTS idx_usuarios_ci ON usuarios(ci)',
      'CREATE INDEX IF NOT EXISTS idx_analisis_lab_fecha ON analisis_laboratorio(fecha_registro DESC)',
      'CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_medico(fecha_consulta DESC)',
      'CREATE INDEX IF NOT EXISTS idx_analisis_lab_cliente ON analisis_laboratorio(id_cliente)',
      'CREATE INDEX IF NOT EXISTS idx_historial_cliente ON historial_medico(id_cliente)'
    ];
    for (let q of queries) await poolBD.query(q);
    console.log('[CONFIG] Índices de rendimiento verificados/creados');
  } catch (e) { console.error('[ALERTA] No se pudieron crear los índices:', e.message); }
};
asegurarIndices();

// --- MIDDLEWARES (Español) ---

const autenticarToken = (req, res, next) => {
  const cabecera = req.headers['authorization'];
  const token = cabecera && cabecera.split(' ')[1];
  if (!token) return res.status(401).json({ mensaje: 'No autorizado' });

  jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
    if (err) return res.status(403).json({ mensaje: 'Sesión expirada' });
    req.usuario = usuario;
    next();
  });
};

const esAdministrador = (req, usuario, next) => {
  if (req.usuario.rol !== 'ADMINISTRADOR') return res.status(403).json({ mensaje: 'Acceso restringido: Se requiere rol de Administrador' });
  next();
};

const esBioanalista = (req, res, next) => {
  if (req.usuario.rol !== 'BIOANALISTA' && req.usuario.rol !== 'ADMINISTRADOR') {
    return res.status(403).json({ mensaje: 'Acceso restringido: Se requiere rol de Bioanalista' });
  }
  next();
};

const esMedico = (req, res, next) => {
  if (req.usuario.rol !== 'MEDICO' && req.usuario.rol !== 'ADMINISTRADOR') {
    return res.status(403).json({ mensaje: 'Acceso restringido: Se requiere rol de Médico' });
  }
  next();
};

// --- RUTAS DE AUTENTICACIÓN ---

app.post('/api/autenticacion/inicio-sesion', async (req, res) => {
  const { ci, contrasena } = req.body;
  try {
    const resU = await poolBD.query('SELECT u.*, r.nombre_rol FROM usuarios u JOIN roles r ON u.id_rol = r.id_rol WHERE u.ci = $1', [ci]);
    if (resU.rows.length === 0) return res.status(401).json({ mensaje: 'Credenciales inválidas' });

    const usuario = resU.rows[0];
    const valida = await bcrypt.compare(contrasena, usuario.contrasena_hash);
    if (!valida) return res.status(401).json({ mensaje: 'Credenciales inválidas' });

    const token = jwt.sign({ id: usuario.id_usuario, rol: usuario.nombre_rol }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, usuario: { id: usuario.id_usuario, nombre: usuario.nombre, rol: usuario.nombre_rol } });
  } catch (e) { 
    console.error('[LOGIN ERROR]', e);
    res.status(500).json({ mensaje: 'Error interno del servidor' }); 
  }
});

// --- RUTAS DE USUARIOS (CRUD) ---

app.get('/api/usuarios', autenticarToken, esAdministrador, async (req, res) => {
  const { limite = 50, pagina = 1 } = req.query;
  const desplazamiento = (pagina - 1) * limite;
  try {
    const resU = await poolBD.query(`
      SELECT u.id_usuario, u.nombre, u.apellido, u.ci, u.activo, r.nombre_rol 
      FROM usuarios u JOIN roles r ON u.id_rol = r.id_rol
      LIMIT $1 OFFSET $2`, [limite, desplazamiento]);
    res.json(resU.rows);
  } catch (e) { res.status(500).json({ mensaje: 'Error al obtener usuarios' }); }
});

app.post('/api/usuarios', autenticarToken, esAdministrador, async (req, res) => {
  const { nombre, apellido, ci, id_rol, contrasena } = req.body;
  const hash = await bcrypt.hash(contrasena, 10);
  try {
    await poolBD.query('INSERT INTO usuarios (nombre, apellido, ci, id_rol, contrasena_hash) VALUES ($1, $2, $3, $4, $5)', [nombre, apellido, ci, id_rol, hash]);
    res.status(201).json({ mensaje: 'Usuario registrado con éxito' });
  } catch (e) { res.status(500).json({ mensaje: 'Error al registrar' }); }
});

app.put('/api/usuarios/:id', autenticarToken, esAdministrador, async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, ci, id_rol, contrasena } = req.body;
  try {
    if (contrasena && contrasena.trim() !== '') {
      const hash = await bcrypt.hash(contrasena, 10);
      await poolBD.query('UPDATE usuarios SET nombre=$1, apellido=$2, ci=$3, id_rol=$4, contrasena_hash=$5 WHERE id_usuario=$6', [nombre, apellido, ci, id_rol, hash, id]);
    } else {
      await poolBD.query('UPDATE usuarios SET nombre=$1, apellido=$2, ci=$3, id_rol=$4 WHERE id_usuario=$5', [nombre, apellido, ci, id_rol, id]);
    }
    res.json({ mensaje: 'Usuario actualizado con éxito' });
  } catch (e) { res.status(500).json({ mensaje: 'Error al actualizar usuario' }); }
});

app.put('/api/usuarios/:id/estado', autenticarToken, esAdministrador, async (req, res) => {
  const { id } = req.params;
  try {
    const currentState = await poolBD.query('SELECT activo FROM usuarios WHERE id_usuario = $1', [id]);
    if (currentState.rows.length === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    const newState = !currentState.rows[0].activo;
    await poolBD.query('UPDATE usuarios SET activo = $1 WHERE id_usuario = $2', [newState, id]);
    res.json({ mensaje: 'Estado actualizado', activo: newState });
  } catch (e) { res.status(500).json({ mensaje: 'Error al cambiar estado' }); }
});

// --- RUTAS DE PACIENTES ---

app.get('/api/pacientes', autenticarToken, async (req, res) => {
  const { limite = 50, pagina = 1 } = req.query;
  const desplazamiento = (pagina - 1) * limite;
  try {
    const consulta = `
      SELECT c.*, t.descripcion as rubro_desc, gs.nombre_grupo as gs_desc,
      CASE WHEN h.id_historial IS NOT NULL THEN 'FINALIZADO' WHEN al.id_analisis_lab IS NOT NULL THEN 'MEDICO' ELSE 'LABORATORIO' END as fase_actual
      FROM clientes c 
      LEFT JOIN tipos_trabajo t ON c.id_tipo_trabajo = t.id_tipo_trabajo 
      LEFT JOIN grupos_sanguineos gs ON c.id_gs = gs.id_grupo
      LEFT JOIN (SELECT DISTINCT id_cliente, id_analisis_lab FROM analisis_laboratorio) al ON c.id_cliente = al.id_cliente
      LEFT JOIN historial_medico h ON al.id_analisis_lab = h.id_analisis_lab
      ORDER BY c.fecha_registro DESC
      LIMIT $1 OFFSET $2`;
    const resP = await poolBD.query(consulta, [limite, desplazamiento]);
    res.json(resP.rows);
  } catch (e) { res.status(500).json({ mensaje: 'Error al obtener pacientes' }); }
});

app.post('/api/pacientes', autenticarToken, esAdministrador, subirFoto.single('foto'), async (req, res) => {
  let { nombre, apellido, fecha_nacimiento, ci, domicilio, nro_celular, lugar_trabajo, id_tipo_trabajo, id_gs } = req.body;
  const foto_url = req.file ? `/archivos/fotos/${req.file.filename}` : null;
  if (!id_gs || id_gs === 'null' || String(id_gs).trim() === '') {
    const defaultGs = await poolBD.query("SELECT id_grupo FROM grupos_sanguineos WHERE nombre_grupo = 'O+' LIMIT 1");
    if (defaultGs.rows.length > 0) id_gs = defaultGs.rows[0].id_grupo;
  }
  if (!id_tipo_trabajo || id_tipo_trabajo === 'null' || String(id_tipo_trabajo).trim() === '') {
    id_tipo_trabajo = null;
  }
  try {
    validarDatos(req.body, ['nombre', 'apellido', 'ci', 'domicilio']);
    const resP = await poolBD.query(
      'INSERT INTO clientes (nombre, apellido, fecha_nacimiento, ci, domicilio, nro_celular, lugar_trabajo, id_tipo_trabajo, id_gs, foto, tipo_tramite) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [nombre, apellido, fecha_nacimiento, ci, domicilio, nro_celular, lugar_trabajo, id_tipo_trabajo, id_gs, foto_url, 'primera vez']
    );
    res.status(201).json(resP.rows[0]);
  } catch (e) { res.status(500).json({ mensaje: 'Error al registrar paciente', detalle: e.message }); }
});

app.put('/api/pacientes/:id', autenticarToken, esAdministrador, subirFoto.single('foto'), async (req, res) => {
  const { id } = req.params;
  let { nombre, apellido, fecha_nacimiento, ci, domicilio, nro_celular, lugar_trabajo, id_tipo_trabajo, id_gs, renovar } = req.body;
  const foto_url = req.file ? `/archivos/fotos/${req.file.filename}` : null;
  if (!id_gs || id_gs === 'null' || String(id_gs).trim() === '') {
    const defaultGs = await poolBD.query("SELECT id_grupo FROM grupos_sanguineos WHERE nombre_grupo = 'O+' LIMIT 1");
    if (defaultGs.rows.length > 0) id_gs = defaultGs.rows[0].id_grupo;
  }
  if (!id_tipo_trabajo || id_tipo_trabajo === 'null' || String(id_tipo_trabajo).trim() === '') {
    id_tipo_trabajo = null;
  }
  try {
    let query = '';
    let valores = [];
    if (renovar === 'true') {
      if (foto_url) {
        query = 'UPDATE clientes SET nombre=$1, apellido=$2, fecha_nacimiento=$3, ci=$4, domicilio=$5, nro_celular=$6, lugar_trabajo=$7, id_tipo_trabajo=$8, id_gs=$9, foto=$10, tipo_tramite=$11, fecha_registro=NOW() WHERE id_cliente=$12 RETURNING *';
        valores = [nombre, apellido, fecha_nacimiento, ci, domicilio, nro_celular, lugar_trabajo, id_tipo_trabajo, id_gs, foto_url, 'renovacion', id];
      } else {
        query = 'UPDATE clientes SET nombre=$1, apellido=$2, fecha_nacimiento=$3, ci=$4, domicilio=$5, nro_celular=$6, lugar_trabajo=$7, id_tipo_trabajo=$8, id_gs=$9, tipo_tramite=$10, fecha_registro=NOW() WHERE id_cliente=$11 RETURNING *';
        valores = [nombre, apellido, fecha_nacimiento, ci, domicilio, nro_celular, lugar_trabajo, id_tipo_trabajo, id_gs, 'renovacion', id];
      }
    } else {
      if (foto_url) {
        query = 'UPDATE clientes SET nombre=$1, apellido=$2, fecha_nacimiento=$3, ci=$4, domicilio=$5, nro_celular=$6, lugar_trabajo=$7, id_tipo_trabajo=$8, id_gs=$9, foto=$10 WHERE id_cliente=$11 RETURNING *';
        valores = [nombre, apellido, fecha_nacimiento, ci, domicilio, nro_celular, lugar_trabajo, id_tipo_trabajo, id_gs, foto_url, id];
      } else {
        query = 'UPDATE clientes SET nombre=$1, apellido=$2, fecha_nacimiento=$3, ci=$4, domicilio=$5, nro_celular=$6, lugar_trabajo=$7, id_tipo_trabajo=$8, id_gs=$9 WHERE id_cliente=$10 RETURNING *';
        valores = [nombre, apellido, fecha_nacimiento, ci, domicilio, nro_celular, lugar_trabajo, id_tipo_trabajo, id_gs, id];
      }
    }
    const resP = await poolBD.query(query, valores);
    if (resP.rows.length === 0) return res.status(404).json({ mensaje: 'Paciente no encontrado' });
    res.json(resP.rows[0]);
  } catch (e) { res.status(500).json({ mensaje: 'Error al actualizar paciente', detalle: e.message }); }
});

// --- CATÁLOGOS ---

app.get('/api/catalogos/roles', autenticarToken, esAdministrador, async (req, res) => {
  const resR = await poolBD.query('SELECT * FROM roles ORDER BY nombre_rol');
  res.json(resR.rows);
});
app.get('/api/catalogos/rubros', autenticarToken, async (req, res) => {
  const resT = await poolBD.query('SELECT * FROM tipos_trabajo ORDER BY descripcion');
  res.json(resT.rows);
});
app.get('/api/catalogos/grupos-sanguineos', autenticarToken, async (req, res) => {
  const resG = await poolBD.query('SELECT * FROM grupos_sanguineos ORDER BY nombre_grupo');
  res.json(resG.rows);
});

// --- LABORATORIO (ENDPOINTS COMPLETADOS) ---

app.get('/api/laboratorio/cola', autenticarToken, esBioanalista, async (req, res) => {
  const resC = await poolBD.query('SELECT c.* FROM clientes c LEFT JOIN analisis_laboratorio al ON c.id_cliente = al.id_cliente WHERE al.id_analisis_lab IS NULL ORDER BY c.fecha_registro ASC');
  res.json(resC.rows);
});

// 1. Parasitología Ampliado
app.post('/api/laboratorio/parasitologia', autenticarToken, esBioanalista, async (req, res) => {
  const { consistencia_heces, color_heces, sangre_macroscopica, moco_macroscopico, leucocitos, eritrocitos, celulas_epiteliales, levaduras, parasito_encontrado, nombre_parasito, estadio_parasito, cantidad_parasitos, metodo_directo, metodo_concentracion, metodo_kato_katz, tincion_utilizada, resultado_general, observaciones } = req.body;
  try {
    const q = `INSERT INTO analisis_parasitologia 
      (consistencia_heces, color_heces, sangre_macroscopica, moco_macroscopico, leucocitos, eritrocitos, celulas_epiteliales, levaduras, parasito_encontrado, nombre_parasito, estadio_parasito, cantidad_parasitos, metodo_directo, metodo_concentracion, metodo_kato_katz, tincion_utilizada, resultado_general, observaciones, id_responsable) 
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING id_parasitologia`;

    // Convert boolean checks correctly
    const v = [consistencia_heces, color_heces, !!sangre_macroscopica, !!moco_macroscopico, leucocitos, eritrocitos, celulas_epiteliales, !!levaduras, !!parasito_encontrado, nombre_parasito, estadio_parasito || null, cantidad_parasitos || null, !!metodo_directo, !!metodo_concentracion, !!metodo_kato_katz, tincion_utilizada, resultado_general, observaciones, req.usuario.id];

    const resP = await poolBD.query(q, v);
    res.status(201).json(resP.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// 2. Grupo Sanguíneo
app.post('/api/laboratorio/grupo-sanguineo', autenticarToken, esBioanalista, async (req, res) => {
  const { reaccion_anti_a, reaccion_anti_b, reaccion_anti_ab, reaccion_anti_d, rh_debil_du, id_grupo_resultado, tecnica_utilizada, prueba_cruzada_mayor, prueba_cruzada_menor, observaciones } = req.body;
  try {
    const q = `INSERT INTO analisis_grupo_sanguineo 
    (reaccion_anti_a, reaccion_anti_b, reaccion_anti_ab, reaccion_anti_d, rh_debil_du, id_grupo_resultado, tecnica_utilizada, prueba_cruzada_mayor, prueba_cruzada_menor, observaciones, id_responsable) 
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id_analisis_gs as id_grupo_sanguineo`;
    const v = [reaccion_anti_a, reaccion_anti_b, reaccion_anti_ab, reaccion_anti_d, !!rh_debil_du, id_grupo_resultado, tecnica_utilizada, prueba_cruzada_mayor, prueba_cruzada_menor, observaciones, req.usuario.id];
    const r = await poolBD.query(q, v);
    res.status(201).json(r.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// 3. Glicemia
app.post('/api/laboratorio/glicemia', autenticarToken, esBioanalista, async (req, res) => {
  const { tipo_muestra, horas_ayuno, glucosa_mg_dl, glucosa_basal_mgdl, glucosa_60min_mgdl, glucosa_120min_mgdl, interpretacion, metodo_analisis, muestra_tipo, observaciones } = req.body;
  try {
    const q = `INSERT INTO analisis_glicemia 
    (tipo_muestra, horas_ayuno, glucosa_mg_dl, glucosa_basal_mgdl, glucosa_60min_mgdl, glucosa_120min_mgdl, interpretacion, metodo_analisis, muestra_tipo, observaciones, id_responsable) 
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id_glicemia`;
    const v = [tipo_muestra, horas_ayuno, glucosa_mg_dl, glucosa_basal_mgdl || null, glucosa_60min_mgdl || null, glucosa_120min_mgdl || null, interpretacion, metodo_analisis, muestra_tipo, observaciones, req.usuario.id];
    const r = await poolBD.query(q, v);
    res.status(201).json(r.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// 4. VIH
app.post('/api/laboratorio/vih', autenticarToken, esBioanalista, async (req, res) => {
  const { prueba_tamizaje, resultado_tamizaje, indice_s_co, prueba_confirmatoria, resultado_confirmatorio, tipo_muestra, resultado_final, control_positivo, control_negativo, consejeria_pretest, consejeria_postest, observaciones } = req.body;
  try {
    const q = `INSERT INTO analisis_vih 
    (prueba_tamizaje, resultado_tamizaje, indice_s_co, prueba_confirmatoria, resultado_confirmatorio, tipo_muestra, resultado_final, control_positivo, control_negativo, consejeria_pretest, consejeria_postest, observaciones, id_responsable) 
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id_vih`;
    const v = [prueba_tamizaje, resultado_tamizaje, indice_s_co || null, prueba_confirmatoria, resultado_confirmatorio, tipo_muestra, resultado_final, !!control_positivo, !!control_negativo, !!consejeria_pretest, !!consejeria_postest, observaciones, req.usuario.id];
    const r = await poolBD.query(q, v);
    res.status(201).json(r.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// 5. Chagas
app.post('/api/laboratorio/chagas', autenticarToken, esBioanalista, async (req, res) => {
  const { fase_sospechada, prueba_elisa, resultado_elisa, indice_elisa, prueba_hat, resultado_hat, prueba_ifi, resultado_ifi, titulo_ifi, gota_gruesa, resultado_gota_gruesa, estudio_xenodiagnostico, resultado_final, control_positivo, control_negativo, observaciones } = req.body;
  try {
    const q = `INSERT INTO analisis_chagas 
    (fase_sospechada, prueba_elisa, resultado_elisa, indice_elisa, prueba_hat, resultado_hat, prueba_ifi, resultado_ifi, titulo_ifi, gota_gruesa, resultado_gota_gruesa, estudio_xenodiagnostico, resultado_final, control_positivo, control_negativo, observaciones, id_responsable)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING id_chagas`;
    const v = [fase_sospechada, prueba_elisa, resultado_elisa, indice_elisa || null, prueba_hat, resultado_hat, prueba_ifi, resultado_ifi, titulo_ifi, !!gota_gruesa, resultado_gota_gruesa, !!estudio_xenodiagnostico, resultado_final, !!control_positivo, !!control_negativo, observaciones, req.usuario.id];
    const r = await poolBD.query(q, v);
    res.status(201).json(r.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// Consolidar todos
app.post('/api/laboratorio/registrar', autenticarToken, esBioanalista, async (req, res) => {
  const { id_cliente, id_parasitologia, id_analisis_gs, id_glicemia, id_vih, id_chagas, observacion } = req.body;
  try {
    const resA = await poolBD.query('INSERT INTO analisis_laboratorio (id_cliente, id_usuario_registro, id_parasitologia, id_analisis_gs, id_glicemia, id_vih, id_chagas, observacion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id_analisis_lab', [id_cliente, req.usuario.id, id_parasitologia || null, id_analisis_gs || null, id_glicemia || null, id_vih || null, id_chagas || null, observacion]);

    // Opcional: auto-sincronizar grupo sanguíneo en cliente (según la charla SEDES)
    if (id_analisis_gs) {
      const gsRes = await poolBD.query('SELECT id_grupo_resultado FROM analisis_grupo_sanguineo WHERE id_analisis_gs = $1', [id_analisis_gs]);
      if (gsRes.rows.length > 0) {
        await poolBD.query('UPDATE clientes SET id_gs = $1 WHERE id_cliente = $2', [gsRes.rows[0].id_grupo_resultado, id_cliente]);
      }
    }

    res.status(201).json(resA.rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// --- MÉDICO (ENDPOINTS COMPLETADOS) ---

app.get('/api/medico/cola', autenticarToken, esMedico, async (req, res) => {
  const resC = await poolBD.query('SELECT c.*, al.id_analisis_lab FROM clientes c JOIN analisis_laboratorio al ON c.id_cliente = al.id_cliente LEFT JOIN historial_medico h ON al.id_analisis_lab = h.id_analisis_lab WHERE h.id_historial IS NULL ORDER BY al.fecha_registro ASC');
  res.json(resC.rows);
});

// Obtener resultados detallados completos de lab del paciente para mostrarlos al médico
app.get('/api/medico/resultados/:idAnalisisLab', autenticarToken, esMedico, async (req, res) => {
  const { idAnalisisLab } = req.params;
  try {
    const query = `
      SELECT 
        al.id_cliente,
        c.nombre,
        c.apellido,
        c.ci,
        c.foto,
        row_to_json(ap.*) as parasitologia,
        row_to_json(ag.*) as glicemia,
        row_to_json(av.*) as vih,
        row_to_json(ac.*) as chagas,
        (
          SELECT json_build_object(
            'detalle', row_to_json(gs_sub.*),
            'grupo_nombre', gr.nombre_grupo
          )
          FROM analisis_grupo_sanguineo gs_sub 
          JOIN grupos_sanguineos gr ON gs_sub.id_grupo_resultado = gr.id_grupo 
          WHERE gs_sub.id_analisis_gs = al.id_analisis_gs
        ) as grupo_sanguineo
      FROM analisis_laboratorio al
      JOIN clientes c ON al.id_cliente = c.id_cliente
      LEFT JOIN analisis_parasitologia ap on al.id_parasitologia = ap.id_parasitologia
      LEFT JOIN analisis_glicemia ag on al.id_glicemia = ag.id_glicemia
      LEFT JOIN analisis_vih av on al.id_vih = av.id_vih
      LEFT JOIN analisis_chagas ac on al.id_chagas = ac.id_chagas
      WHERE al.id_analisis_lab = $1
    `;
    const result = await poolBD.query(query, [idAnalisisLab]);
    res.json(result.rows[0] || {});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Nuevo: Guardar diagnóstico médico
app.post('/api/medico/historial', autenticarToken, esMedico, async (req, res) => {
  const { id_analisis_lab, id_cliente, diagnostico, tratamiento, observaciones } = req.body;
  try {
    const q = `INSERT INTO historial_medico (id_analisis_lab, id_cliente, id_usuario, diagnostico, tratamiento, observaciones) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id_historial`;
    const v = [id_analisis_lab, id_cliente, req.usuario.id, diagnostico, tratamiento, observaciones];
    const result = await poolBD.query(q, v);
    res.status(201).json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- REPORTES CON CACHÉ (Escalabilidad) ---
const cacheIA = new Map();
const CACHE_DURATION = 1000 * 60 * 10; // 10 minutos de caché

/** Helper de Validación Robusta */
const validarDatos = (datos, campos) => {
  for (const campo of campos) {
    if (!datos[campo] || String(datos[campo]).trim() === '') {
      throw new Error(`El campo '${campo}' es obligatorio y no puede estar vacío`);
    }
  }
  if (datos.ci && !/^[0-9A-Z.-]{5,20}$/i.test(datos.ci)) {
    throw new Error('El formato de Cédula de Identidad (CI) no es válido');
  }
};

/** Helper: llama a Gemini con soporte de Caché */
const generarAnalisisIA = async (prompt) => {
  const hash = Buffer.from(prompt).toString('base64').substring(0, 32);
  const ahora = Date.now();
  
  if (cacheIA.has(hash)) {
    const entry = cacheIA.get(hash);
    if (ahora - entry.timestamp < CACHE_DURATION) return entry.data;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return 'Configura GEMINI_API_KEY en .env';
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const text = result?.response?.text();
    
    if (text) cacheIA.set(hash, { data: text, timestamp: ahora });
    return text || 'Respuesta vacía de IA';
  } catch (e) {
    const msg = e?.message || String(e);
    console.error('[IA] Error Gemini (capturado):', msg);
    if (msg.includes('429')) return 'Límite de cuota de IA alcanzado. Intente más tarde.';
    if (msg.includes('404')) return 'Modelo de IA no disponible. Verifique la configuración.';
    return 'El análisis con IA no está disponible en este momento.';
  }
};

/** Convertir parámetro de rango a intervalo SQL */
const rangoAintervalo = (rango) => {
  const mapa = { hora: '1 hour', dia: '1 day', semana: '1 week', mes: '1 month', anio: '1 year' };
  return mapa[rango] || '1 month';
};

// REPORTE ADMINISTRADOR
app.get('/api/reportes/admin', autenticarToken, esAdministrador, async (req, res) => {
  const { rango = 'mes' } = req.query;
  const intervalo = rangoAintervalo(rango);
  try {
    // 1. Trámites por tipo (primeras veces vs renovaciones)
    const rTramites = await poolBD.query(`
      SELECT tipo_tramite, COUNT(*) as count
      FROM clientes WHERE fecha_registro >= NOW() - INTERVAL '${intervalo}'
      GROUP BY tipo_tramite ORDER BY count DESC`);

    // 2. Flujo por fases (laboratorio / médico / finalizado)
    const rFases = await poolBD.query(`
      SELECT CASE 
        WHEN h.id_historial IS NOT NULL THEN 'Finalizado'
        WHEN al.id_analisis_lab IS NOT NULL THEN 'Consulta Médica'
        ELSE 'Laboratorio'
      END as fase, COUNT(*) as count
      FROM clientes c
      LEFT JOIN (SELECT DISTINCT id_cliente, id_analisis_lab FROM analisis_laboratorio) al ON c.id_cliente = al.id_cliente
      LEFT JOIN historial_medico h ON al.id_analisis_lab = h.id_analisis_lab
      WHERE c.fecha_registro >= NOW() - INTERVAL '${intervalo}'
      GROUP BY fase`);

    // 3. Resultados clínicos (positivos por enfermedad)
    const rPositivos = await poolBD.query(`
      SELECT 
        SUM(CASE WHEN av.resultado_final = 'REACTIVO' THEN 1 ELSE 0 END) as vih_positivos,
        SUM(CASE WHEN ac.resultado_final = 'REACTIVO' THEN 1 ELSE 0 END) as chagas_positivos,
        SUM(CASE WHEN ap.parasito_encontrado = TRUE THEN 1 ELSE 0 END) as parasito_positivos,
        SUM(CASE WHEN ag.interpretacion IN ('PREDIABETES','DIABETES') THEN 1 ELSE 0 END) as glicemia_alterada,
        COUNT(al.id_analisis_lab) as total_analisis
      FROM analisis_laboratorio al
      LEFT JOIN analisis_vih av ON al.id_vih = av.id_vih
      LEFT JOIN analisis_chagas ac ON al.id_chagas = ac.id_chagas
      LEFT JOIN analisis_parasitologia ap ON al.id_parasitologia = ap.id_parasitologia
      LEFT JOIN analisis_glicemia ag ON al.id_glicemia = ag.id_glicemia
      LEFT JOIN clientes c ON al.id_cliente = c.id_cliente
      WHERE c.fecha_registro >= NOW() - INTERVAL '${intervalo}'`);

    // 4. Distribución etaria
    const rEdades = await poolBD.query(`
      SELECT 
        CASE 
          WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) < 18 THEN 'Menor 18'
          WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) BETWEEN 18 AND 30 THEN '18-30'
          WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) BETWEEN 31 AND 45 THEN '31-45'
          WHEN EXTRACT(YEAR FROM AGE(fecha_nacimiento)) BETWEEN 46 AND 60 THEN '46-60'
          ELSE 'Mayor 60'
        END as rango_edad,
        COUNT(*) as count
      FROM clientes
      WHERE fecha_registro >= NOW() - INTERVAL '${intervalo}'
      GROUP BY rango_edad ORDER BY rango_edad`);

    const datos = rPositivos.rows[0] || {};
    const totalTramites = rTramites.rows.reduce((s, r) => s + parseInt(r.count || 0), 0);
    const prompt = `Eres un epidemiólogo del SEDES Beni, Bolivia. Analiza estos datos del período (${rango}) y redacta un informe ejecutivo breve (máximo 4 oraciones) con observaciones y recomendaciones en español:\n
- Total trámites: ${totalTramites}\n- Primeras veces vs renovaciones: ${JSON.stringify(rTramites.rows)}\n- Casos VIH reactivos: ${datos.vih_positivos || 0}\n- Casos Chagas reactivos: ${datos.chagas_positivos || 0}\n- Casos positivos en parasitología: ${datos.parasito_positivos || 0}\n- Glicemia alterada: ${datos.glicemia_alterada || 0}\n- Distribución etaria: ${JSON.stringify(rEdades.rows)}\nRecomendaciones sanitarias concisas para la administración del SEDES.`;

    const analisis_ia = await generarAnalisisIA(prompt);

    res.json({
      tramites: rTramites.rows,
      fases: rFases.rows,
      clinicos: datos,
      edades: rEdades.rows,
      resumen: { total: totalTramites },
      analisis_ia
    });
  } catch (e) {
    console.error('[REPORTES/ADMIN]', e);
    res.status(500).json({ mensaje: 'Error al generar reporte', detalle: e.message });
  }
});

// REPORTE BIOANALISTA
app.get('/api/reportes/bioanalista', autenticarToken, esBioanalista, async (req, res) => {
  const { rango = 'semana' } = req.query;
  const intervalo = rangoAintervalo(rango);
  try {
    // Volúmen por tipo de análisis
    const rTipos = await poolBD.query(`
      SELECT 
        SUM(CASE WHEN id_parasitologia IS NOT NULL THEN 1 ELSE 0 END) as parasitologia,
        SUM(CASE WHEN id_analisis_gs IS NOT NULL THEN 1 ELSE 0 END) as grupo_sanguineo,
        SUM(CASE WHEN id_glicemia IS NOT NULL THEN 1 ELSE 0 END) as glicemia,
        SUM(CASE WHEN id_vih IS NOT NULL THEN 1 ELSE 0 END) as vih,
        SUM(CASE WHEN id_chagas IS NOT NULL THEN 1 ELSE 0 END) as chagas,
        COUNT(*) as total
      FROM analisis_laboratorio
      WHERE fecha_registro >= NOW() - INTERVAL '${intervalo}'`);

    // Positivos por tipo
    const rPositivos = await poolBD.query(`
      SELECT 
        SUM(CASE WHEN ap.parasito_encontrado = TRUE THEN 1 ELSE 0 END) as parasitologia_pos,
        SUM(CASE WHEN av.resultado_final = 'REACTIVO' THEN 1 ELSE 0 END) as vih_pos,
        SUM(CASE WHEN ac.resultado_final = 'REACTIVO' THEN 1 ELSE 0 END) as chagas_pos,
        SUM(CASE WHEN ag.interpretacion IN ('PREDIABETES','DIABETES') THEN 1 ELSE 0 END) as glicemia_pos
      FROM analisis_laboratorio al
      LEFT JOIN analisis_parasitologia ap ON al.id_parasitologia = ap.id_parasitologia
      LEFT JOIN analisis_vih av ON al.id_vih = av.id_vih
      LEFT JOIN analisis_chagas ac ON al.id_chagas = ac.id_chagas
      LEFT JOIN analisis_glicemia ag ON al.id_glicemia = ag.id_glicemia
      WHERE al.fecha_registro >= NOW() - INTERVAL '${intervalo}'`);

    const tipos = rTipos.rows[0] || {};
    const pos = rPositivos.rows[0] || {};
    const prompt = `Eres un bioanalista de laboratorio. Analiza estos datos de trabajo del período (${rango}) y genera un comentario profesional breve (máximo 3 oraciones) en español sobre la carga de trabajo y los hallazgos más relevantes:\n- Total análisis: ${tipos.total || 0}\n- Parasitología: ${tipos.parasitologia || 0} (${pos.parasitologia_pos || 0} positivos)\n- VIH: ${tipos.vih || 0} (${pos.vih_pos || 0} reactivos)\n- Chagas: ${tipos.chagas || 0} (${pos.chagas_pos || 0} reactivos)\n- Glicemia: ${tipos.glicemia || 0} (${pos.glicemia_pos || 0} alterados)\n- Grupo Sanguíneo: ${tipos.grupo_sanguineo || 0}`;

    const analisis_ia = await generarAnalisisIA(prompt);

    res.json({
      tipos: [
        { nombre: 'Parasitología', valor: parseInt(tipos.parasitologia) || 0 },
        { nombre: 'Grupo Sanguíneo', valor: parseInt(tipos.grupo_sanguineo) || 0 },
        { nombre: 'Glicemia', valor: parseInt(tipos.glicemia) || 0 },
        { nombre: 'VIH', valor: parseInt(tipos.vih) || 0 },
        { nombre: 'Chagas', valor: parseInt(tipos.chagas) || 0 }
      ],
      positivos: pos,
      total: parseInt(tipos.total) || 0,
      analisis_ia
    });
  } catch (e) {
    console.error('[REPORTES/BIO]', e);
    res.status(500).json({ mensaje: 'Error al generar reporte', detalle: e.message });
  }
});

// REPORTE MÉDICO
app.get('/api/reportes/medico', autenticarToken, esMedico, async (req, res) => {
  const { rango = 'semana' } = req.query;
  const intervalo = rangoAintervalo(rango);
  try {
    const rConsultas = await poolBD.query(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN diagnostico ILIKE '%RECONSULTA%' THEN 1 ELSE 0 END) as reconsultas
      FROM historial_medico
      WHERE fecha_consulta >= NOW() - INTERVAL '${intervalo}'`);

    const rDiag = await poolBD.query(`
      SELECT LEFT(diagnostico, 80) as diagnostico, COUNT(*) as frecuencia
      FROM historial_medico
      WHERE fecha_consulta >= NOW() - INTERVAL '${intervalo}'
      GROUP BY LEFT(diagnostico, 80)
      ORDER BY frecuencia DESC LIMIT 5`);

    const c = rConsultas.rows[0];
    const aprobados = parseInt(c.total) - parseInt(c.reconsultas || 0);
    const prompt = `Eres un médico del SEDES Beni. Resume en 3 oraciones en español estos datos de consulta del período (${rango}): ${c.total} consultas realizadas, ${c.reconsultas} derivadas a reconsulta, ${aprobados} pacientes aprobados. Diagnósticos más frecuentes: ${rDiag.rows.map(d => d.diagnostico).join(' | ')}. Resalta tendencias o alertas relevantes.`;

    const analisis_ia = await generarAnalisisIA(prompt);

    res.json({
      total: parseInt(c.total) || 0,
      reconsultas: parseInt(c.reconsultas) || 0,
      aprobados,
      diagnosticos: rDiag.rows,
      analisis_ia
    });
  } catch (e) {
    console.error('[REPORTES/MEDICO]', e);
    res.status(500).json({ mensaje: 'Error al generar reporte', detalle: e.message });
  }
});

app.listen(puerto, () => console.log(`🚀 Servidor en producción listo en puerto ${puerto}`));
