# Frontend - Sistema Templo

Este proyecto corresponde al **frontend** del sistema **web de gestión administrativa automatizada de horarios y asistente inteligente** para entrenamientos calisténicos en el Gimnasio TEMPLO.BOL.

Está desarrollado en **React.js**, desplegado en **Vercel** y consume la **API del backend** desarrollada en FastAPI.

---

## Tecnologías principales

- [**React.js**](https://reactjs.org/) - Librería para la construcción de interfaces de usuario
- [**Vite**](https://vitejs.dev/) - Herramienta de desarrollo rápida para proyectos frontend
- [**TailwindCSS**](https://tailwindcss.com/) - Framework CSS para diseño responsivo
- [**Axios**](https://axios-http.com/) - Cliente HTTP para consumir APIs
- [**React Router**](https://reactrouter.com/) - Enrutamiento para aplicaciones React
- [**Context API**] - Gestión de estado global de la aplicación

---

## Requisitos previos

- Node.js **18.0.0** o superior
- npm **9+** o yarn **3+** instalado
- Backend del sistema ejecutándose

---

## Instalación en local

```bash
# Clonar el repositorio
git clone https://github.com/Miguelao2003/Templo.git
cd Templo/Frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Ejecutar en modo desarrollo
npm run dev
```

---

## Variables de entorno

Crear archivo `.env.local` con las siguientes variables:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Templo
VITE_APP_VERSION=1.0.0
```

---

## Scripts disponibles

```bash
# Desarrollo
npm run dev

# Construcción para producción
npm run build

# Vista previa de la construcción
npm run preview

# Linting del código
npm run lint

# Formateo de código
npm run format
```

---

## Estructura del proyecto

```
Frontend/
├── public/
│   ├── favicon.ico
│   └── index.html
├── src/
│   ├── components/
│   │   ├── common/       # Componentes reutilizables
│   │   ├── layout/       # Layout y navegación
│   │   └── forms/        # Formularios
│   ├── pages/
│   │   ├── auth/         # Autenticación
│   │   ├── dashboard/    # Panel principal
│   │   ├── users/        # Gestión de usuarios
│   │   ├── schedules/    # Gestión de horarios
│   │   ├── routines/     # Gestión de rutinas
│   │   ├── ai/           # Asistente inteligente
│   │   └── reports/      # Reportes
│   ├── services/
│   │   ├── api.js        # Configuración de Axios
│   │   ├── auth.js       # Servicios de autenticación
│   │   ├── users.js      # Servicios de usuarios
│   │   ├── schedules.js  # Servicios de horarios
│   │   ├── routines.js   # Servicios de rutinas
│   │   └── ai.js         # Servicios de IA
│   ├── hooks/
│   │   ├── useAuth.js    # Hook de autenticación
│   │   ├── useApi.js     # Hook para llamadas API
│   │   └── useForm.js    # Hook para formularios
│   ├── utils/
│   │   ├── constants.js  # Constantes de la app
│   │   ├── helpers.js    # Funciones auxiliares
│   │   └── validators.js # Validaciones
│   ├── styles/
│   │   └── globals.css   # Estilos globales
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── vite.config.js
```

---

## Características implementadas

### Autenticación y Autorización
- **Login/Register** con validación de formularios
- **JWT Token** management y renovación automática
- **Roles de usuario** (Administrador, Entrenador, Cliente)
- **Rutas protegidas** según permisos

### Dashboard y Navegación
- **Sidebar responsiva** con menú dinámico por rol
- **Breadcrumbs** para navegación
- **Notificaciones** en tiempo real
- **Tema claro/oscuro** (opcional)

### Gestión de Usuarios
- **CRUD completo** de usuarios
- **Búsqueda y filtros** avanzados
- **Activación/desactivación** de cuentas
- **Gestión de perfiles** personales

### Gestión de Horarios
- **Vista de calendario** semanal
- **Reservas en tiempo real** con disponibilidad
- **Filtros por tipo** de entrenamiento
- **Notificaciones** de cambios

### Asistente Inteligente
- **Formulario de datos** antropométricos
- **Visualización de rutinas** personalizadas
- **Plan semanal** generado por IA
- **Interfaz interactiva** para recomendaciones

### Reportes y Analytics
- **Gráficos interactivos** con Chart.js
- **Exportación** a PDF y Excel
- **Filtros temporales** y por categorías
- **Dashboard ejecutivo** con métricas

# Backend - Sistema Templo

Este proyecto corresponde al **backend** del sistema **web de gestión administrativa automatizada de horarios y asistente inteligente** para entrenamientos calisténicos en el Gimnasio TEMPLO.BOL.

Está desarrollado en **FastAPI** con **Python**, desplegado en **Render** y utiliza **PostgreSQL** como base de datos.

---

## Tecnologías principales

- [**FastAPI**](https://fastapi.tiangolo.com/) - Framework web moderno para construir APIs con Python
- [**SQLAlchemy**](https://www.sqlalchemy.org/) - ORM para Python y manejo de base de datos
- [**PostgreSQL**](https://www.postgresql.org/) - Base de datos relacional avanzada
- [**scikit-learn**](https://scikit-learn.org/) - Biblioteca de machine learning para Python
- [**pandas**](https://pandas.pydata.org/) - Análisis y manipulación de datos
- [**Alembic**](https://alembic.sqlalchemy.org/) - Migraciones de base de datos
- [**JWT**](https://pyjwt.readthedocs.io/) - Autenticación basada en tokens

---

## Requisitos previos

- Python **3.11.0** o superior
- PostgreSQL **15+** instalado
- pip o pipenv instalado

---

## Instalación en local

```bash
# Clonar el repositorio
git clone https://github.com/Miguelao2003/Templo.git
cd Templo/Backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env

# Configurar base de datos
createdb templo_db

# Ejecutar migraciones
alembic upgrade head

# Ejecutar en modo desarrollo
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## Variables de entorno

Crear archivo `.env` con las siguientes variables:

```env
# Base de datos
DATABASE_URL=postgresql://usuario:password@localhost/templo_db

# JWT
SECRET_KEY=tu_secret_key_super_seguro
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
FRONTEND_URL=http://localhost:3000

# Ambiente
ENVIRONMENT=development
DEBUG=True
```

---

## Estructura del proyecto

```
Backend/
├── app/
│   ├── api/
│   │   ├── endpoints/
│   │   │   ├── auth.py      # Autenticación
│   │   │   ├── users.py     # Gestión de usuarios
│   │   │   ├── schedules.py # Gestión de horarios
│   │   │   ├── routines.py  # Gestión de rutinas
│   │   │   ├── ai.py        # Asistente inteligente
│   │   │   └── reports.py   # Reportes
│   │   └── api.py           # Router principal
│   ├── core/
│   │   ├── config.py        # Configuración
│   │   ├── security.py      # Seguridad y JWT
│   │   └── deps.py          # Dependencias
│   ├── db/
│   │   ├── models/
│   │   │   ├── user.py      # Modelo Usuario
│   │   │   ├── schedule.py  # Modelo Horario
│   │   │   ├── routine.py   # Modelo Rutina
│   │   │   └── base.py      # Clase base
│   │   ├── schemas/
│   │   │   ├── user.py      # Esquemas Usuario
│   │   │   ├── schedule.py  # Esquemas Horario
│   │   │   └── routine.py   # Esquemas Rutina
│   │   ├── database.py      # Conexión DB
│   │   └── base.py          # Base para modelos
│   ├── ml/
│   │   ├── models/
│   │   │   ├── random_forest.py # Modelo Random Forest
│   │   │   └── trainer.py   # Entrenador de modelos
│   │   ├── preprocessing/
│   │   │   ├── features.py  # Extracción de características
│   │   │   └── metrics.py   # Cálculo de métricas
│   │   └── predictions/
│   │       └── routines.py  # Predicciones de rutinas
│   ├── services/
│   │   ├── auth_service.py  # Lógica de autenticación
│   │   ├── user_service.py  # Lógica de usuarios
│   │   ├── schedule_service.py # Lógica de horarios
│   │   ├── routine_service.py  # Lógica de rutinas
│   │   └── ai_service.py    # Lógica de IA
│   ├── utils/
│   │   ├── validators.py    # Validaciones
│   │   ├── helpers.py       # Funciones auxiliares
│   │   └── constants.py     # Constantes
│   └── main.py              # Aplicación principal
├── alembic/
│   ├── versions/            # Migraciones
│   └── env.py              # Configuración Alembic
├── tests/
│   ├── api/                # Tests de endpoints
│   ├── ml/                 # Tests de ML
│   └── conftest.py         # Configuración tests
├── requirements.txt
└── alembic.ini
```


---

*Fuente: Elaboración propia, 2025.*
