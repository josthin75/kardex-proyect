-- 1. UNIFICAR ROLES
UPDATE roles SET descripcion = 'registro y control de usuarios, manejo de reportes y datos estadisticos de las otras areas' WHERE nombre_rol = 'ADMINISTRADOR';
UPDATE roles SET descripcion = 'Registro y control de rasustados de analisis de laboratorio' WHERE nombre_rol = 'BIOANALISTA';
UPDATE roles SET descripcion = 'Consulta, diagnóstico y tratamiento' WHERE nombre_rol = 'MEDICO';

-- 2. CATALOGO DE GRUPOS SANGUINEOS (Si no existe, crear tabla y poblar)
CREATE TABLE IF NOT EXISTS grupos_sanguineos (
    id_grupo SERIAL PRIMARY KEY,
    nombre_grupo VARCHAR(10) NOT NULL UNIQUE
);

INSERT INTO grupos_sanguineos (nombre_grupo) VALUES 
('A+'), ('A-'), ('B+'), ('B-'), ('AB+'), ('AB-'), ('O+'), ('O-')
ON CONFLICT (nombre_grupo) DO NOTHING;

-- 3. AJUSTES EN TABLA CLIENTES
ALTER TABLE clientes ALTER COLUMN domicilio TYPE TEXT;
ALTER TABLE clientes ALTER COLUMN fecha_nacimiento SET NOT NULL;
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='foto') THEN
    ALTER TABLE clientes ADD COLUMN foto TEXT;
END IF;
IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clientes' AND column_name='grupo_sanguineo') THEN
    ALTER TABLE clientes ADD COLUMN grupo_sanguineo VARCHAR(100);
END IF;

-- 4. AJUSTES EN ANALISIS_PARASITOLOGIA (Añadir campos técnicos faltantes)
ALTER TABLE analisis_parasitologia ADD COLUMN IF NOT EXISTS ci_responsable VARCHAR(20);
ALTER TABLE analisis_parasitologia ADD COLUMN IF NOT EXISTS consistencia_heces VARCHAR(20) CHECK (consistencia_heces IN ('LIQUIDA','BLANDA','SEMIBLANDA','FORMADA','DURA'));
ALTER TABLE analisis_parasitologia ADD COLUMN IF NOT EXISTS color_heces VARCHAR(30);
ALTER TABLE analisis_parasitologia ADD COLUMN IF NOT EXISTS sangre_macroscopica BOOLEAN DEFAULT FALSE;
ALTER TABLE analisis_parasitologia ADD COLUMN IF NOT EXISTS moco_macroscopico BOOLEAN DEFAULT FALSE;
ALTER TABLE analisis_parasitologia ADD COLUMN IF NOT EXISTS leucocitos VARCHAR(20);
ALTER TABLE analisis_parasitologia ADD COLUMN IF NOT EXISTS eritrocitos VARCHAR(20);
ALTER TABLE analisis_parasitologia ADD COLUMN IF NOT EXISTS celulas_epiteliales VARCHAR(20);
ALTER TABLE analisis_parasitologia ADD COLUMN IF NOT EXISTS levaduras BOOLEAN DEFAULT FALSE;
ALTER TABLE analisis_parasitologia ADD COLUMN IF NOT EXISTS estadio_parasito VARCHAR(50);
ALTER TABLE analisis_parasitologia ADD COLUMN IF NOT EXISTS cantidad_parasitos VARCHAR(30);
ALTER TABLE analisis_parasitologia ADD COLUMN IF NOT EXISTS metodo_directo BOOLEAN DEFAULT TRUE;
ALTER TABLE analisis_parasitologia ADD COLUMN IF NOT EXISTS metodo_concentracion BOOLEAN DEFAULT FALSE;
ALTER TABLE analisis_parasitologia ADD COLUMN IF NOT EXISTS metodo_kato_katz BOOLEAN DEFAULT FALSE;
ALTER TABLE analisis_parasitologia ADD COLUMN IF NOT EXISTS tincion_utilizada VARCHAR(50);

-- 5. AJUSTES EN ANALISIS_VIH (Protocolo PNLSS)
ALTER TABLE analisis_vih ADD COLUMN IF NOT EXISTS indice_s_co NUMERIC(6,3);
ALTER TABLE analisis_vih ADD COLUMN IF NOT EXISTS prueba_confirmatoria VARCHAR(60);
ALTER TABLE analisis_vih ADD COLUMN IF NOT EXISTS resultado_confirmatorio VARCHAR(20);
ALTER TABLE analisis_vih ADD COLUMN IF NOT EXISTS tipo_muestra VARCHAR(30);
ALTER TABLE analisis_vih ADD COLUMN IF NOT EXISTS control_positivo BOOLEAN;
ALTER TABLE analisis_vih ADD COLUMN IF NOT EXISTS control_negativo BOOLEAN;
ALTER TABLE analisis_vih ADD COLUMN IF NOT EXISTS consejeria_pretest BOOLEAN DEFAULT FALSE;
ALTER TABLE analisis_vih ADD COLUMN IF NOT EXISTS consejeria_postest BOOLEAN DEFAULT FALSE;

-- 6. AJUSTES EN HISTORIAL_MEDICO
ALTER TABLE historial_medico ADD COLUMN IF NOT EXISTS ci_medico VARCHAR(20);
-- El campo diagnostico ya es TEXT NOT NULL en el esquema actual.

-- 7. REFRESCAR INDICES
CREATE INDEX IF NOT EXISTS idx_clientes_ci ON clientes(ci);
