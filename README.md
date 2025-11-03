# 🏐 Torneo de Voley VIT 2025 - Sistema de Llaves

> Sistema de gestión de torneos con eliminación directa para el Torneo de Voley Interno 2025 del VIT

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](CHANGELOG.md)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Una aplicación web moderna y elegante para gestionar torneos de voley con sistema de eliminación directa. Diseñada con React, Supabase y fuente Lexend, con un diseño ultra dark inspirado en Vercel.

## ✨ Características Principales

### 🎯 Sistema de Torneos
- **Dos Ciclos Independientes**: Ciclo Básico (1ro-3ro) y Ciclo Superior (4to-7mo)
- **Eliminación Directa**: Sistema de brackets con avance automático
- **Formatos Flexibles**: Diferentes configuraciones de sets según ciclo y ronda
- **Visualización en Tiempo Real**: Actualización instantánea de resultados

### 👥 Gestión de Equipos
- **CRUD Completo**: Crear, editar y eliminar equipos
- **Importación JSON**: Carga masiva de equipos desde archivo
- **17 Cursos Soportados**: Desde 1ro A hasta 7mo 2da
- **Organización Automática**: Separación por ciclos

### 🔀 Emparejamientos Inteligentes
- **Generación Automática**: Creación de brackets con un click
- **Reordenamiento Visual**: Flechas para cambiar orden de matches
- **Intercambio de Equipos**: Sistema de selección para intercambiar posiciones
- **Soporte BYE**: Manejo automático de equipos impares

### 📊 Administración de Llaves
- **Registro de Resultados**: Captura de scores por sets
- **Cálculo Automático**: Determinación de ganadores
- **Brackets Visuales**: Componente interactivo de llaves
- **Configuración de Finales**: Formato personalizable (3 o 5 sets)

### 🎨 Diseño Moderno
- **Ultra Dark Theme**: Interfaz elegante y profesional
- **Fuente Lexend**: Tipografía optimizada para legibilidad
- **Responsive**: Adaptado para diferentes dispositivos
- **Animaciones Suaves**: Transiciones y efectos visuales

## Estructura del Torneo

### Ciclo Básico
- **Cursos**: 1ro, 2do, 3ro A, 3ro B, 3ro C
- **Formato**: Partidos a 1 set (excepto final)
- **Final**: Al mejor de 3 sets

### Ciclo Superior  
- **Cursos**: 4to, 5to, 6to, 7mo 1ra, 7mo 2da
- **Formato**: Partidos al mejor de 3 sets
- **Final**: Al mejor de 5 sets (configurable)

## Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd torneo-llaves-app
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar Supabase**
   - Crea un proyecto en [Supabase](https://supabase.com)
   - Ejecuta el archivo `database.sql` en el SQL Editor de Supabase
   - Copia `.env.example` a `.env` y configura las variables:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

4. **Ejecutar la aplicación**
```bash
npm run dev
```

## Configuración de Base de Datos

1. Ve al SQL Editor en tu dashboard de Supabase
2. Copia y ejecuta todo el contenido del archivo `database.sql`
3. Esto creará todas las tablas, índices, políticas y datos necesarios

### Estructura de la Base de Datos

- **admin_config**: Configuración administrativa (contraseña por defecto: `admin123`)
- **teams**: Equipos participantes con nombre y curso
- **matches**: Partidos con resultados, rondas y ganadores

## Uso de la Aplicación

### Página Principal (`/`)
- Visualización pública de ambos torneos
- Muestra el progreso de las llaves en tiempo real

### Panel Administrativo

#### Acceso (`/a/login`)
- Contraseña por defecto: `admin123`
- Configurable desde la base de datos

#### Dashboard (`/a/dash`)
- Estadísticas generales del torneo
- Accesos rápidos a todas las funciones

#### Gestión de Equipos (`/a/teams`)
- Agregar/editar/eliminar equipos
- Asignación de cursos automática por ciclo

#### Emparejamientos (`/a/emparejamientos`)
- Generación automática de llaves
- Vista previa antes de guardar
- Manejo de equipos impares (bye)

#### Administración de Llaves (`/a/llaves`)
- Actualización de resultados en tiempo real
- Diferentes formatos según el ciclo
- Avance automático de ganadores

## Tecnologías Utilizadas

- **Frontend**: React 18, Vite
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Sistema personalizado con localStorage

## Estructura del Proyecto

```
src/
├── components/
│   ├── Layout.jsx          # Layout principal del admin
│   └── ProtectedRoute.jsx  # Protección de rutas admin
├── lib/
│   └── supabase.js        # Configuración de Supabase
├── pages/
│   ├── Home.jsx           # Página principal pública
│   └── admin/
│       ├── Login.jsx      # Login administrativo
│       ├── Dashboard.jsx  # Panel principal
│       ├── Teams.jsx      # Gestión de equipos
│       ├── Emparejamientos.jsx # Configuración de llaves
│       └── Llaves.jsx     # Administración de resultados
└── App.jsx               # Componente principal con rutas
```

## Personalización

### Cambiar Contraseña de Admin
```sql
UPDATE admin_config SET password = 'nueva_contraseña' WHERE id = 1;
```

### Modificar Cursos
Edita las opciones en `src/pages/admin/Teams.jsx` y actualiza las restricciones en la base de datos.

### Ajustar Colores
Modifica el archivo `tailwind.config.js` para cambiar la paleta de colores.

## Desarrollo

### Scripts Disponibles
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run preview` - Vista previa del build

### Contribuir
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📋 Roadmap

- [ ] Diseño responsive para mobile (vertical y horizontal)
- [ ] Exportación de resultados a PDF
- [ ] Historial de torneos anteriores
- [ ] Estadísticas avanzadas por equipo
- [ ] Sistema de notificaciones
- [ ] Modo claro/oscuro

## 📝 Changelog

Ver [CHANGELOG.md](CHANGELOG.md) para el historial completo de cambios.

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Capria Franco** - [GitHub](https://github.com/CapriaFranco)

## 📞 Soporte

Para reportar bugs o solicitar features, abre un issue en el repositorio de GitHub.

---

⭐ Si este proyecto te fue útil, considera darle una estrella!