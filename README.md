# 🏋️ Templo - Sistema de Gestión Administrativa y Asistente Inteligente

## 📋 Descripción del Proyecto

Sistema web para la gestión administrativa automatizada de horarios y asistente inteligente de entrenamientos calisténicos en el Gimnasio TEMPLO.BOL. El sistema utiliza algoritmos de machine learning para personalizar rutinas según características físicas individuales, optimizando la distribución de recursos y mejorando significativamente la experiencia del usuario.

**Caso de Estudio:** TEMPLO.BOL - Cochabamba, Bolivia

## 🚀 Características Principales

- **Gestión Automatizada de Horarios**: Sistema completo de reservas y programación
- **Asistente Inteligente con IA**: Rutinas personalizadas usando Random Forest (99.5% precisión)
- **Gestión de Usuarios**: Control de roles diferenciados (Administrador, Entrenador, Cliente)
- **Dashboard Analítico**: Reportes y visualizaciones para toma de decisiones
- **Interfaz Responsiva**: Diseño optimizado para diferentes dispositivos
- **Autenticación Segura**: Sistema JWT con roles y permisos

## 🛠️ Tecnologías Principales

### Backend
- **Framework**: FastAPI 0.104+
- **Lenguaje**: Python 3.11+
- **Base de Datos**: PostgreSQL 15+
- **ORM**: SQLAlchemy 2.0+
- **Machine Learning**: scikit-learn 1.3+, pandas 2.0+

### Frontend
- **Framework**: React.js 18.2+
- **Bundler**: Vite 4+
- **Gestión de Estado**: Context API
- **Estilos**: TailwindCSS

### Herramientas de Desarrollo
- **API Testing**: Postman
- **Documentación**: Swagger/OpenAPI
- **Control de Versiones**: Git
- **Metodología**: Scrum

## 🏗️ Arquitectura del Sistema

El sistema implementa una arquitectura **Modelo-Vista-Controlador (MVC)** con separación clara de responsabilidades:

- **Modelo**: Gestión de datos con PostgreSQL y SQLAlchemy
- **Vista**: Interfaz React.js con componentes reutilizables  
- **Controlador**: APIs RESTful con FastAPI

### Módulos Principales

1. **Gestión de Usuarios** - Registro, autenticación y control de acceso
2. **Gestión de Horarios** - Programación y reservas en tiempo real
3. **Gestión de Rutinas** - Biblioteca de ejercicios calisténicos
4. **Asistente Inteligente** - Recomendaciones personalizadas con IA
5. **Módulo de Reportes** - Analytics y exportación PDF/Excel

## 📊 Inteligencia Artificial

### Modelo Seleccionado: Random Forest
- **Precisión**: 99.5%
- **Recall**: 99.4%
- **F1-Score**: 99.4%
- **Tiempo de Entrenamiento**: 2.3 segundos

### Características de Entrada
- Edad, peso, altura
- Género y objetivos de entrenamiento
- Métricas calculadas: IMC, TMB, grasa corporal

### Evaluación Rigurosa
Se evaluaron 4 modelos (Random Forest, SVM, Gradient Boosting, Red Neuronal MLP) con pruebas exhaustivas anti-overfitting, seleccionando Random Forest por su estabilidad y generalización.

## ⚡ Requisitos del Sistema

### Requisitos Mínimos
- **SO**: Windows 10 / macOS 10.15 / Ubuntu 18.04
- **RAM**: 8 GB
- **Procesador**: Intel Core i5 8va generación
- **Almacenamiento**: 256 GB SSD
- **Conexión**: 10 Mbps

### Requisitos Ideales
- **SO**: Windows 11 / macOS 12+ / Ubuntu 20.04+
- **RAM**: 32 GB
- **Procesador**: Intel Core i7 10ma generación
- **Almacenamiento**: 512 GB SSD
- **Conexión**: 50 Mbps

## 🔧 Instalación en Local

### Backend
```bash
# Clonar el repositorio
git clone https://github.com/Miguelao2003/Templo.git
cd Templo/Backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate    # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de base de datos

# Ejecutar migraciones
alembic upgrade head

# Iniciar servidor
uvicorn main:app --reload
```

### Frontend
```bash
# Navegar al frontend
cd ../Frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con la URL del backend

# Iniciar en modo desarrollo
npm run dev
```

### Base de Datos
```sql
-- Crear base de datos PostgreSQL
CREATE DATABASE templo_db;
CREATE USER templo_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE templo_db TO templo_user;
```

## 📁 Estructura del Proyecto

```
Templo/
├── Backend/
│   ├── app/
│   │   ├── api/          # Endpoints de la API
│   │   ├── core/         # Configuración y seguridad
│   │   ├── db/           # Modelos y conexión DB
│   │   ├── ml/           # Módulos de Machine Learning
│   │   └── services/     # Lógica de negocio
│   ├── tests/            # Pruebas unitarias
│   └── requirements.txt
├── Frontend/
│   ├── src/
│   │   ├── components/   # Componentes reutilizables
│   │   ├── pages/        # Páginas principales
│   │   ├── services/     # Servicios API
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # Utilidades
│   ├── public/           # Archivos estáticos
│   └── package.json
└── VSCodeCounter/        # Métricas del código
```

## 🧪 Pruebas y Validación

### Pruebas Implementadas
- **82 pruebas funcionales** - 100% de éxito
- **Pruebas de carga** - 28.50 requests/segundo
- **Pruebas de aceptación** - Validadas por usuarios reales
- **Pruebas de estrés** - Evaluación bajo carga extrema

### Métricas de Rendimiento
- **Tiempo de respuesta promedio**: 66ms
- **Percentil 90**: 275ms
- **Percentil 95**: 330ms
- **Percentil 99**: 616ms

## 📊 Resultados del Proyecto

### Métricas de Desarrollo
- **Líneas de código**: 31,293 total
  - Backend: 3,714 líneas
  - Frontend: 27,579 líneas
- **Tiempo de desarrollo**: 15.19 meses (estimado COCOMO II)
- **Esfuerzo**: 173.36 persona-mes

### Análisis Económico
- **Relación Beneficio-Costo**: 4.85:1
- **Costo de desarrollo**: Bs 28,560
- **Ahorro anual estimado**: Bs 17,000
- **ROI**: Proyecto económicamente viable

## 🔐 Seguridad

- **Autenticación JWT** con tokens seguros
- **Encriptación de contraseñas** con bcrypt
- **Validación de roles** y permisos granulares
- **Sanitización de entradas** para prevenir inyecciones
- **HTTPS** en producción

## 📈 Funcionalidades por Rol

### 👨‍💼 Administrador
- Gestión completa de usuarios
- Configuración de horarios y equipos
- Generación de reportes analíticos
- Supervisión del sistema

### 🏋️‍♂️ Entrenador
- Creación y gestión de rutinas
- Programación de horarios personales
- Visualización de clientes asignados

### 👤 Cliente
- Reserva de turnos en tiempo real
- Rutinas personalizadas con IA
- Seguimiento de progreso
- Historial de entrenamientos

## 🚀 Roadmap Futuro

### Mejoras Planificadas
- [ ] Aplicación móvil nativa
- [ ] Integración con dispositivos wearables
- [ ] Módulo de pagos en línea
- [ ] Sistema de notificaciones push
- [ ] Análisis predictivo de demanda
- [ ] Recomendaciones nutricionales

### Expansiones Técnicas
- [ ] Microservicios architecture
- [ ] Implementación de GraphQL
- [ ] Cache con Redis
- [ ] Containerización con Docker
- [ ] CI/CD pipeline

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👨‍💻 Autor

**José Miguel Atora Yugar**
- Email: miguel.atora@ejemplo.com
- LinkedIn: [tu-perfil-linkedin]
- Universidad: Escuela Militar de Ingeniería "Mcal. Antonio José de Sucre"

## 🙏 Agradecimientos

- **Tutor**: M. Sc. Ariel Luis Gruich Arratia
- **Gimnasio TEMPLO.BOL** - Por proporcionar el caso de estudio
- **Escuela Militar de Ingeniería** - Por el apoyo académico y recursos

---

**Desarrollado con ❤️ para revolutionar la gestión de gimnasios mediante inteligencia artificial**
