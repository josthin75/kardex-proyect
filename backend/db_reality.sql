-- ================================================================
-- ESQUEMA ACTUALIZADO DESDE BASE DE DATOS REAL (Auditoría Profunda)
-- ================================================================

-- ----------------------------------------------------------------
-- TABLA: analisis_chagas
-- ----------------------------------------------------------------
CREATE TABLE analisis_chagas (
    id_chagas            INTEGER NOT NULL DEFAULT nextval('analisis_chagas_id_chagas_seq'::regclass),
    fase_sospechada      CHARACTER VARYING(20),
    prueba_elisa         CHARACTER VARYING(60),
    resultado_elisa      CHARACTER VARYING(20),
    indice_elisa         NUMERIC,
    prueba_hat           CHARACTER VARYING(60),
    resultado_hat        CHARACTER VARYING(20),
    prueba_ifi           CHARACTER VARYING(60),
    resultado_ifi        CHARACTER VARYING(20),
    titulo_ifi           CHARACTER VARYING(20),
    gota_gruesa          BOOLEAN DEFAULT false,
    resultado_gota_gruesa CHARACTER VARYING(20),
    estudio_xenodiagnostico BOOLEAN DEFAULT false,
    resultado_final      CHARACTER VARYING(20) NOT NULL,
    control_positivo     BOOLEAN,
    control_negativo     BOOLEAN,
    observaciones        TEXT,
    id_responsable       INTEGER NOT NULL,
    fecha_analisis       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    /* CHECK (((fase_sospechada)::text = ANY ((ARRAY['AGUDA'::character varying, 'CRONICA'::character varying, 'CONGENITA'::character varying, 'DESCONOCIDA'::character varying])::text[]))) */,
    /* CHECK (((resultado_elisa)::text = ANY ((ARRAY['REACTIVO'::character varying, 'NO_REACTIVO'::character varying, 'INDETERMINADO'::character varying, 'NO_REALIZADO'::character varying])::text[]))) */,
    /* CHECK (((resultado_hat)::text = ANY ((ARRAY['REACTIVO'::character varying, 'NO_REACTIVO'::character varying, 'INDETERMINADO'::character varying, 'NO_REALIZADO'::character varying])::text[]))) */,
    /* CHECK (((resultado_ifi)::text = ANY ((ARRAY['REACTIVO'::character varying, 'NO_REACTIVO'::character varying, 'INDETERMINADO'::character varying, 'NO_REALIZADO'::character varying])::text[]))) */,
    /* CHECK (((resultado_gota_gruesa)::text = ANY ((ARRAY['POSITIVO'::character varying, 'NEGATIVO'::character varying, 'NO_REALIZADO'::character varying])::text[]))) */,
    /* CHECK (((resultado_final)::text = ANY ((ARRAY['REACTIVO'::character varying, 'NO_REACTIVO'::character varying, 'INDETERMINADO'::character varying])::text[]))) */,
    /* PRIMARY KEY (id_chagas) */,
    /* FOREIGN KEY (id_responsable) REFERENCES usuarios(id_usuario) */
);

-- ----------------------------------------------------------------
-- TABLA: analisis_glicemia
-- ----------------------------------------------------------------
CREATE TABLE analisis_glicemia (
    id_glicemia          INTEGER NOT NULL DEFAULT nextval('analisis_glicemia_id_glicemia_seq'::regclass),
    tipo_muestra         CHARACTER VARYING(30) NOT NULL,
    horas_ayuno          SMALLINT,
    glucosa_mg_dl        NUMERIC NOT NULL,
    glucosa_basal_mgdl   NUMERIC,
    glucosa_60min_mgdl   NUMERIC,
    glucosa_120min_mgdl  NUMERIC,
    interpretacion       CHARACTER VARYING(30),
    metodo_analisis      CHARACTER VARYING(60),
    muestra_tipo         CHARACTER VARYING(20) DEFAULT 'PLASMA_VENOSO'::character varying,
    observaciones        TEXT,
    id_responsable       INTEGER NOT NULL,
    fecha_analisis       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    /* CHECK (((tipo_muestra)::text = ANY ((ARRAY['AYUNAS'::character varying, 'POSTPRANDIAL_1H'::character varying, 'POSTPRANDIAL_2H'::character varying, 'CASUAL'::character varying, 'CURVA_TOLERANCIA'::character varying])::text[]))) */,
    /* CHECK (((interpretacion)::text = ANY ((ARRAY['NORMAL'::character varying, 'PREDIABETES'::character varying, 'DIABETES'::character varying, 'HIPOGLUCEMIA'::character varying, 'NO_APLICA'::character varying])::text[]))) */,
    /* PRIMARY KEY (id_glicemia) */,
    /* FOREIGN KEY (id_responsable) REFERENCES usuarios(id_usuario) */
);

-- ----------------------------------------------------------------
-- TABLA: analisis_grupo_sanguineo
-- ----------------------------------------------------------------
CREATE TABLE analisis_grupo_sanguineo (
    id_analisis_gs       INTEGER NOT NULL DEFAULT nextval('analisis_grupo_sanguineo_id_analisis_gs_seq'::regclass),
    reaccion_anti_a      CHARACTER VARYING(10),
    reaccion_anti_b      CHARACTER VARYING(10),
    reaccion_anti_ab     CHARACTER VARYING(10),
    reaccion_anti_d      CHARACTER VARYING(10),
    rh_debil_du          BOOLEAN DEFAULT false,
    id_grupo_resultado   INTEGER NOT NULL,
    tecnica_utilizada    CHARACTER VARYING(60),
    prueba_cruzada_mayor CHARACTER VARYING(20),
    prueba_cruzada_menor CHARACTER VARYING(20),
    observaciones        TEXT,
    id_responsable       INTEGER NOT NULL,
    fecha_analisis       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    /* PRIMARY KEY (id_analisis_gs) */,
    /* FOREIGN KEY (id_grupo_resultado) REFERENCES grupos_sanguineos(id_grupo) */,
    /* FOREIGN KEY (id_responsable) REFERENCES usuarios(id_usuario) */
);

-- ----------------------------------------------------------------
-- TABLA: analisis_laboratorio
-- ----------------------------------------------------------------
CREATE TABLE analisis_laboratorio (
    id_analisis_lab      INTEGER NOT NULL DEFAULT nextval('analisis_laboratorio_id_analisis_lab_seq'::regclass),
    id_cliente           INTEGER NOT NULL,
    id_usuario_registro  INTEGER NOT NULL,
    id_parasitologia     INTEGER,
    id_analisis_gs       INTEGER,
    id_glicemia          INTEGER,
    id_vih               INTEGER,
    id_chagas            INTEGER,
    observacion          TEXT,
    fecha_registro       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    /* CHECK (((id_parasitologia IS NOT NULL) OR (id_analisis_gs IS NOT NULL) OR (id_glicemia IS NOT NULL) OR (id_vih IS NOT NULL) OR (id_chagas IS NOT NULL))) */,
    /* PRIMARY KEY (id_analisis_lab) */,
    /* FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) */,
    /* FOREIGN KEY (id_usuario_registro) REFERENCES usuarios(id_usuario) */,
    /* FOREIGN KEY (id_parasitologia) REFERENCES analisis_parasitologia(id_parasitologia) */,
    /* FOREIGN KEY (id_analisis_gs) REFERENCES analisis_grupo_sanguineo(id_analisis_gs) */,
    /* FOREIGN KEY (id_glicemia) REFERENCES analisis_glicemia(id_glicemia) */,
    /* FOREIGN KEY (id_vih) REFERENCES analisis_vih(id_vih) */,
    /* FOREIGN KEY (id_chagas) REFERENCES analisis_chagas(id_chagas) */
);

-- ----------------------------------------------------------------
-- TABLA: analisis_parasitologia
-- ----------------------------------------------------------------
CREATE TABLE analisis_parasitologia (
    id_parasitologia     INTEGER NOT NULL DEFAULT nextval('analisis_parasitologia_id_parasitologia_seq'::regclass),
    consistencia_heces   CHARACTER VARYING(20),
    color_heces          CHARACTER VARYING(30),
    sangre_macroscopica  BOOLEAN DEFAULT false,
    moco_macroscopico    BOOLEAN DEFAULT false,
    leucocitos           CHARACTER VARYING(20),
    eritrocitos          CHARACTER VARYING(20),
    celulas_epiteliales  CHARACTER VARYING(20),
    levaduras            BOOLEAN DEFAULT false,
    parasito_encontrado  BOOLEAN NOT NULL DEFAULT false,
    nombre_parasito      CHARACTER VARYING(200),
    estadio_parasito     CHARACTER VARYING(50),
    cantidad_parasitos   CHARACTER VARYING(30),
    metodo_directo       BOOLEAN DEFAULT true,
    metodo_concentracion BOOLEAN DEFAULT false,
    metodo_kato_katz     BOOLEAN DEFAULT false,
    tincion_utilizada    CHARACTER VARYING(50),
    resultado_general    TEXT NOT NULL,
    observaciones        TEXT,
    id_responsable       INTEGER NOT NULL,
    fecha_analisis       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    /* CHECK (((consistencia_heces)::text = ANY ((ARRAY['LIQUIDA'::character varying, 'BLANDA'::character varying, 'SEMIBLANDA'::character varying, 'FORMADA'::character varying, 'DURA'::character varying])::text[]))) */,
    /* PRIMARY KEY (id_parasitologia) */,
    /* FOREIGN KEY (id_responsable) REFERENCES usuarios(id_usuario) */
);

-- ----------------------------------------------------------------
-- TABLA: analisis_vih
-- ----------------------------------------------------------------
CREATE TABLE analisis_vih (
    id_vih               INTEGER NOT NULL DEFAULT nextval('analisis_vih_id_vih_seq'::regclass),
    prueba_tamizaje      CHARACTER VARYING(60) NOT NULL,
    resultado_tamizaje   CHARACTER VARYING(20) NOT NULL,
    indice_s_co          NUMERIC,
    prueba_confirmatoria CHARACTER VARYING(60),
    resultado_confirmatorio CHARACTER VARYING(20),
    tipo_muestra         CHARACTER VARYING(30) DEFAULT 'SUERO'::character varying,
    resultado_final      CHARACTER VARYING(20) NOT NULL,
    control_positivo     BOOLEAN,
    control_negativo     BOOLEAN,
    consejeria_pretest   BOOLEAN DEFAULT false,
    consejeria_postest   BOOLEAN DEFAULT false,
    observaciones        TEXT,
    id_responsable       INTEGER NOT NULL,
    fecha_analisis       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    /* CHECK (((resultado_tamizaje)::text = ANY ((ARRAY['REACTIVO'::character varying, 'NO_REACTIVO'::character varying, 'INDETERMINADO'::character varying])::text[]))) */,
    /* CHECK (((resultado_confirmatorio)::text = ANY ((ARRAY['POSITIVO'::character varying, 'NEGATIVO'::character varying, 'INDETERMINADO'::character varying, 'NO_REALIZADO'::character varying])::text[]))) */,
    /* CHECK (((tipo_muestra)::text = ANY ((ARRAY['SUERO'::character varying, 'PLASMA'::character varying, 'SANGRE_TOTAL'::character varying, 'PRUEBA_RAPIDA'::character varying])::text[]))) */,
    /* CHECK (((resultado_final)::text = ANY ((ARRAY['REACTIVO'::character varying, 'NO_REACTIVO'::character varying, 'INDETERMINADO'::character varying])::text[]))) */,
    /* PRIMARY KEY (id_vih) */,
    /* FOREIGN KEY (id_responsable) REFERENCES usuarios(id_usuario) */
);

-- ----------------------------------------------------------------
-- TABLA: clientes
-- ----------------------------------------------------------------
CREATE TABLE clientes (
    id_cliente           INTEGER NOT NULL DEFAULT nextval('clientes_id_cliente_seq'::regclass),
    nombre               CHARACTER VARYING(100) NOT NULL,
    apellido             CHARACTER VARYING(100) NOT NULL,
    fecha_nacimiento     DATE NOT NULL,
    ci                   CHARACTER VARYING(20) NOT NULL,
    domicilio            TEXT NOT NULL,
    nro_celular          CHARACTER VARYING(20),
    fecha_registro       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    lugar_trabajo        CHARACTER VARYING(200),
    foto                 TEXT,
    tipo_tramite         CHARACTER VARYING(20),
    id_tipo_trabajo      INTEGER,
    id_gs                INTEGER,
    /* PRIMARY KEY (id_cliente) */,
    /* UNIQUE (ci) */,
    /* FOREIGN KEY (id_tipo_trabajo) REFERENCES tipos_trabajo(id_tipo_trabajo) */,
    /* FOREIGN KEY (id_gs) REFERENCES grupos_sanguineos(id_grupo) ON UPDATE CASCADE NOT VALID */
);

-- ----------------------------------------------------------------
-- TABLA: grupos_sanguineos
-- ----------------------------------------------------------------
CREATE TABLE grupos_sanguineos (
    id_grupo             INTEGER NOT NULL DEFAULT nextval('grupos_sanguineos_id_grupo_seq'::regclass),
    nombre_grupo         CHARACTER VARYING(10) NOT NULL,
    descripcion          TEXT,
    /* PRIMARY KEY (id_grupo) */
);

-- ----------------------------------------------------------------
-- TABLA: historial_medico
-- ----------------------------------------------------------------
CREATE TABLE historial_medico (
    id_historial         INTEGER NOT NULL DEFAULT nextval('historial_medico_id_historial_seq'::regclass),
    id_analisis_lab      INTEGER NOT NULL,
    id_cliente           INTEGER NOT NULL,
    id_usuario           INTEGER NOT NULL,
    diagnostico          TEXT NOT NULL,
    tratamiento          TEXT,
    fecha_consulta       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    observaciones        TEXT,
    /* PRIMARY KEY (id_historial) */,
    /* FOREIGN KEY (id_analisis_lab) REFERENCES analisis_laboratorio(id_analisis_lab) */,
    /* FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) */,
    /* FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) */
);

-- ----------------------------------------------------------------
-- TABLA: roles
-- ----------------------------------------------------------------
CREATE TABLE roles (
    id_rol               INTEGER NOT NULL DEFAULT nextval('roles_id_rol_seq'::regclass),
    nombre_rol           CHARACTER VARYING(60) NOT NULL,
    descripcion          TEXT,
    /* PRIMARY KEY (id_rol) */,
    /* UNIQUE (nombre_rol) */
);

-- ----------------------------------------------------------------
-- TABLA: tipos_trabajo
-- ----------------------------------------------------------------
CREATE TABLE tipos_trabajo (
    id_tipo_trabajo      INTEGER NOT NULL DEFAULT nextval('tipos_trabajo_id_tipo_trabajo_seq'::regclass),
    descripcion          CHARACTER VARYING(100) NOT NULL,
    /* PRIMARY KEY (id_tipo_trabajo) */,
    /* UNIQUE (descripcion) */
);

-- ----------------------------------------------------------------
-- TABLA: usuarios
-- ----------------------------------------------------------------
CREATE TABLE usuarios (
    id_usuario           INTEGER NOT NULL DEFAULT nextval('usuarios_id_usuario_seq'::regclass),
    nombre               CHARACTER VARYING(100) NOT NULL,
    apellido             CHARACTER VARYING(100) NOT NULL,
    ci                   CHARACTER VARYING(20) NOT NULL,
    id_rol               INTEGER NOT NULL,
    contrasena_hash      TEXT NOT NULL,
    fecha_creacion       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    activo               BOOLEAN NOT NULL DEFAULT true,
    /* PRIMARY KEY (id_usuario) */,
    /* UNIQUE (ci) */,
    /* FOREIGN KEY (id_rol) REFERENCES roles(id_rol) */
);

