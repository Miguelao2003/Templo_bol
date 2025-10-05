from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path
from dotenv import load_dotenv
import os

from app.routers import rutina
from app.database import engine
from app.models.users import Usuario
from app.models.rutina import Rutina
from app.models.equipos import EquipoPowerplate
from app.models.horarios import Horario
from app.models.reservas import Reserva
from app.models.metricas_usuario import MetricaUsuario
from app.routers import users, metricas_usuario, auth, equipos, horarios, reservas, ai_routines

# Importar modelo de IA
from app.models.ai_routines import ai_model

import logging
from datetime import datetime
import traceback

# ✅ CARGAR VARIABLES DE ENTORNO
load_dotenv()

# Configuración de logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    encoding='utf-8',
    handlers=[
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# ✅ CONFIGURACIÓN DESDE .ENV
DEBUG_MODE = os.getenv("DEBUG", "False").lower() == "true"
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

app = FastAPI(
    title="API de Gestión para Templo2 Gym con IA",
    description="API para el sistema de gestión del gimnasio Templo2 con rutinas generadas por IA",
    version="1.0.0",
    debug=DEBUG_MODE
)

logger.info(f"Servidor FastAPI iniciado - Entorno: {ENVIRONMENT}")

# ✅ CORS desde variables de entorno
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
allowed_origins = [origin.strip() for origin in allowed_origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

logger.info(f"CORS configurado para: {allowed_origins}")

# ✅ Middleware de logging (comentado por rendimiento, descomentar si necesitas debug)
# @app.middleware("http")
# async def log_requests(request: Request, call_next):
#     logger.info(f"Petición recibida: {request.method} {request.url}")
#     try:
#         response = await call_next(request)
#         logger.info(f"Respuesta generada: {response.status_code} para {request.url}")
#         return response
#     except Exception as e:
#         print(f"=== ERROR DETALLADO ===")
#         print(f"Request: {request.method} {request.url}")
#         print(f"Error: {str(e)}")
#         traceback.print_exc()
#         print(f"=== FIN ERROR ===")
#         raise HTTPException(status_code=500, detail="Error interno del servidor")

# Incluir routers de API
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(metricas_usuario.router, prefix="/api/metricas-usuario", tags=["metricas-usuario"])
app.include_router(rutina.router, prefix="/api/rutinas", tags=["rutinas"])
app.include_router(equipos.router, prefix="/api/equipos-powerplate", tags=["equipos-powerplate"])
app.include_router(horarios.router, prefix="/api/horarios", tags=["horarios"])
app.include_router(reservas.router, prefix="/api/reservas", tags=["Reservas"])
app.include_router(ai_routines.router, prefix="/api/ai", tags=["AI Routines"])

# ✅ EVENTO DE INICIO - Cargar modelo de IA
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Iniciando Templo2 Gym API con IA...")
    
    # Cargar modelo de IA existente
    try:
        modelo_path = 'modelo_calisthenics.pkl'
        
        if os.path.exists(modelo_path):
            logger.info("📦 Encontrado archivo de modelo entrenado, cargando...")
            
            if ai_model.cargar_modelo(modelo_path):
                logger.info("✅ Modelo de IA cargado automáticamente")
                logger.info(f"Dataset disponible: {ai_model.dataset is not None}")
                
                if ai_model.dataset is not None:
                    logger.info(f"Registros en dataset: {len(ai_model.dataset)}")
                    logger.info(f"Objetivos disponibles: {list(ai_model.dataset['objetivo'].unique())}")
                    logger.info("🎯 Sistema de IA listo para generar rutinas!")
                else:
                    logger.warning("⚠️ Modelo cargado pero dataset no disponible")
            else:
                logger.error("❌ Error al cargar modelo existente")
                logger.info("💡 Solución: Ejecuta POST /api/ai/train-model")
        else:
            logger.info("📝 No se encontró modelo entrenado")
            logger.info("💡 Para entrenar nuevo modelo: POST /api/ai/train-model")
            logger.info(f"Buscando en: {os.path.abspath(modelo_path)}")
            
    except Exception as e:
        logger.error(f"❌ Error durante inicialización de IA: {str(e)}")
        logger.info("⚠️ El sistema funcionará, pero será necesario entrenar el modelo")
    
    logger.info(f"📚 Documentación API: http://localhost:{os.getenv('PORT', '8000')}/docs")
    logger.info(f"🌍 Entorno: {ENVIRONMENT}")

# ✅ SERVIR FRONTEND COMPILADO
frontend_dist = Path(__file__).parent.parent.parent / "Frontend" / "dist"

if frontend_dist.exists():
    logger.info(f"✅ Frontend encontrado en: {frontend_dist}")
    
    # Montar archivos estáticos
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")
    
        # ✅ AGREGAR ESTO: Servir archivos estáticos de la raíz (como templo.png)
    @app.get("/templo.png", include_in_schema=False)
    async def serve_logo():
        logo_path = frontend_dist / "templo.png"
        if logo_path.exists():
            return FileResponse(str(logo_path))
        raise HTTPException(status_code=404, detail="Logo no encontrado")
    

    @app.get("/", include_in_schema=False)
    async def serve_frontend_root():
        """Servir el frontend de React en la raíz"""
        logger.debug("Sirviendo frontend desde /")
        return FileResponse(str(frontend_dist / "index.html"))
    
    # Catch-all para React Router (DEBE IR AL FINAL)
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend_catchall(full_path: str):
        """Catch-all para rutas de React Router"""
        # No interceptar rutas de API o documentación
        if full_path.startswith(("api/", "docs", "redoc", "openapi.json")):
            logger.warning(f"Ruta de API no encontrada: /{full_path}")
            raise HTTPException(status_code=404, detail="API endpoint not found")
        
        # Servir index.html para todas las rutas del frontend
        logger.debug(f"Sirviendo frontend para ruta: /{full_path}")
        return FileResponse(str(frontend_dist / "index.html"))
else:
    logger.warning(f"⚠️ Frontend no encontrado en: {frontend_dist}")
    logger.info("💡 Ejecuta 'npm run build' en la carpeta Frontend")
    
    # Ruta alternativa si no hay frontend
    @app.get("/")
    def read_root():
        return {
            "message": "Bienvenido al API de Templo2 Gym con IA",
            "version": "1.0.0",
            "environment": ENVIRONMENT,
            "features": {
                "usuarios": "Gestión de usuarios",
                "rutinas": "Rutinas tradicionales",
                "ia_rutinas": "Rutinas generadas por IA",
                "equipos": "Gestión de equipos",
                "horarios": "Gestión de horarios",
                "reservas": "Sistema de reservas"
            },
            "api_endpoints": {
                "docs": "/docs",
                "redoc": "/redoc",
                "auth": "/api/auth",
                "users": "/api/users",
                "rutinas": "/api/rutinas",
                "ai": "/api/ai"
            },
            "ai_endpoints": {
                "entrenar_modelo": "/api/ai/train-model",
                "estado_modelo": "/api/ai/model-status",
                "info_dataset": "/api/ai/dataset-info",
                "rutina_nueva": "/api/ai/predict-routine",
                "rutina_usuario": "/api/ai/predict-routine-for-user/{user_id}"
            },
            "warning": "Frontend no compilado. Ejecuta 'npm run build' en Frontend/"
        }

# ✅ HEALTH CHECK
@app.get("/api/health")
async def health_check():
    """Endpoint para verificar el estado del servidor"""
    return {
        "status": "ok",
        "environment": ENVIRONMENT,
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
        "ai_model_loaded": ai_model.modelo is not None,
        "database": "connected"
    }

# ✅ EJECUTAR CON UVICORN
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=ENVIRONMENT == "development"
    )