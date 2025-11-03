-- Torneo de Llaves - Base de datos para Supabase
-- Ejecutar estos comandos en el SQL Editor de Supabase

-- Tabla de configuración administrativa
CREATE TABLE admin_config (
    id SERIAL PRIMARY KEY,
    password TEXT NOT NULL DEFAULT 'admin123',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- La contraseña se insertará por separado en password.sql

-- Tabla de equipos
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    course TEXT NOT NULL CHECK (course IN (
        '1ro A', '1ro B', '1ro C',
        '2do A', '2do B', '2do C',
        '3ro A', '3ro B', '3ro C',
        '4to 1ra', '4to 2da',
        '5to 1ra', '5to 2da',
        '6to 1ra', '6to 2da',
        '7mo 1ra', '7mo 2da'
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, course)
);

-- Tabla de partidos/emparejamientos
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    cycle TEXT NOT NULL CHECK (cycle IN ('basico', 'superior')),
    round INTEGER NOT NULL,
    team1_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    team2_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    winner_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
    team1_sets INTEGER DEFAULT 0,
    team2_sets INTEGER DEFAULT 0,
    score TEXT, -- Detalle del marcador (ej: "6-4, 6-2")
    is_bye BOOLEAN DEFAULT FALSE, -- Para equipos que pasan automáticamente
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (team1_id != team2_id OR team2_id IS NULL),
    CHECK (winner_id = team1_id OR winner_id = team2_id OR winner_id IS NULL)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_teams_course ON teams(course);
CREATE INDEX idx_matches_cycle ON matches(cycle);
CREATE INDEX idx_matches_round ON matches(round);
CREATE INDEX idx_matches_cycle_round ON matches(cycle, round);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_admin_config_updated_at 
    BEFORE UPDATE ON admin_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at 
    BEFORE UPDATE ON teams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at 
    BEFORE UPDATE ON matches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de seguridad RLS (Row Level Security)
-- Nota: Para simplicidad, permitimos acceso público de lectura
-- En producción, deberías configurar políticas más restrictivas

ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública de equipos y partidos
CREATE POLICY "Allow public read access on teams" ON teams
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access on matches" ON matches
    FOR SELECT USING (true);

-- Política para permitir lectura de configuración admin (solo password hash)
CREATE POLICY "Allow public read access on admin_config" ON admin_config
    FOR SELECT USING (true);

-- Para operaciones de escritura, necesitarías autenticación
-- Por simplicidad, permitimos todas las operaciones
-- En producción, implementa autenticación adecuada

CREATE POLICY "Allow all operations on teams" ON teams
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on matches" ON matches
    FOR ALL USING (true);

CREATE POLICY "Allow all operations on admin_config" ON admin_config
    FOR ALL USING (true);

-- Datos de ejemplo (opcional)
-- Descomenta las siguientes líneas si quieres datos de prueba

/*
-- Equipos de ejemplo para Ciclo Básico
INSERT INTO teams (name, course) VALUES 
    ('Los Tigres', '1ro'),
    ('Águilas Doradas', '2do'),
    ('Leones FC', '3ro A'),
    ('Dragones', '3ro B'),
    ('Halcones', '3ro C');

-- Equipos de ejemplo para Ciclo Superior
INSERT INTO teams (name, course) VALUES 
    ('Campeones', '4to'),
    ('Invencibles', '5to'),
    ('Gladiadores', '6to'),
    ('Titanes', '7mo 1ra'),
    ('Guerreros', '7mo 2da');
*/

-- Vistas útiles para consultas
CREATE VIEW teams_by_cycle AS
SELECT 
    id,
    name,
    course,
    CASE 
        WHEN course IN ('1ro A', '1ro B', '1ro C', '2do A', '2do B', '2do C', '3ro A', '3ro B', '3ro C') THEN 'basico'
        ELSE 'superior'
    END as cycle,
    created_at
FROM teams
ORDER BY 
    CASE 
        WHEN course IN ('1ro A', '1ro B', '1ro C', '2do A', '2do B', '2do C', '3ro A', '3ro B', '3ro C') THEN 1
        ELSE 2
    END,
    course,
    name;

CREATE VIEW matches_with_teams AS
SELECT 
    m.*,
    t1.name as team1_name,
    t1.course as team1_course,
    t2.name as team2_name,
    t2.course as team2_course,
    CASE 
        WHEN m.winner_id = m.team1_id THEN t1.name
        WHEN m.winner_id = m.team2_id THEN t2.name
        ELSE NULL
    END as winner_name
FROM matches m
LEFT JOIN teams t1 ON m.team1_id = t1.id
LEFT JOIN teams t2 ON m.team2_id = t2.id
ORDER BY m.cycle, m.round, m.id;

-- Comentarios sobre el esquema
COMMENT ON TABLE admin_config IS 'Configuración administrativa del sistema';
COMMENT ON TABLE teams IS 'Equipos participantes en el torneo';
COMMENT ON TABLE matches IS 'Partidos y emparejamientos del torneo';

COMMENT ON COLUMN teams.course IS 'Curso del equipo: 1ro A/B/C, 2do A/B/C, 3ro A/B/C para básico; 4to-7mo 1ra/2da para superior';
COMMENT ON COLUMN matches.cycle IS 'Ciclo del torneo: basico o superior';
COMMENT ON COLUMN matches.round IS 'Ronda del torneo (1, 2, 3, etc.)';
COMMENT ON COLUMN matches.is_bye IS 'Indica si el equipo pasa automáticamente por número impar';
COMMENT ON COLUMN matches.score IS 'Detalle del marcador del partido';