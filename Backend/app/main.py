from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routers import rutina
from app.database import engine
from app.models.users import Usuario
from app.models.rutina import Rutina
from app.models.equipos import EquipoPowerplate
from app.models.horarios import Horario  # Nueva importación
from app.models.reservas import Reserva
from app.models.metricas_usuario import MetricaUsuario
from app.routers import users, metricas_usuario, auth, equipos, horarios, reservas, ai_routines  # ✅ Agregar ai_routines

# ✅ NUEVO: Importar modelo de IA
from app.models.ai_routines import ai_model
import os

import logging
from datetime import datetime
import traceback



# Agregar también logging a consola
logging.basicConfig(
    level=logging.DEBUG,  # ✅ Cambiar nivel
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    encoding='utf-8',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()  # ✅ Agregar esta línea para ver en consola
    ]
)

logger = logging.getLogger(__name__)


app = FastAPI(
    title="API de Gestión para Templo2 Gym con IA",
    description="API para el sistema de gestión del gimnasio Templo2 con rutinas generadas por IA",
    version="0.1.0"
)

# Registrar inicio del servidor
logger.info("Servidor FastAPI iniciado con IA de rutinas")

# ✅ CONFIGURACIÓN MÁS ESPECÍFICA
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos
    allow_headers=["*"],  # Permitir todos los headers
    expose_headers=["*"],  # Exponer todos los headers
)



# @app.middleware("http")
# async def log_requests(request: Request, call_next):
#     logger.info(f"Petición recibida: {request.method} {request.url}")
#     try:
#         response = await call_next(request)
#         logger.info(f"Respuesta generada: {response.status_code} para {request.url}")
#         return response
#     except HTTPException as http_exc:
#         logger.error(
#             f"Error HTTP en {request.method} {request.url}: "
#             f"Status {http_exc.status_code} - {http_exc.detail}\n"
#             f"Traceback: {traceback.format_exc()}"
#         )
#         raise
#     except Exception as e:
#         # ✅ AGREGAR ESTAS LÍNEAS PARA VER EL ERROR REAL
#         print(f"=== ERROR DETALLADO ===")
#         print(f"Request: {request.method} {request.url}")
#         print(f"Error: {str(e)}")
#         print(f"Traceback completo:")
#         traceback.print_exc()
#         print(f"=== FIN ERROR ===")
        
#         logger.error(
#             f"Error inesperado en {request.method} {request.url}: {str(e)}\n"
#             f"Traceback: {traceback.format_exc()}"
#         )
#         raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/")
def read_root():
    logger.info("Ruta raíz '/' accedida")
    return {
        "message": "Bienvenido al API de Templo2 Gym con IA",
        "version": "0.1.0",
        "features": {
            "usuarios": "Gestión de usuarios",
            "rutinas": "Rutinas tradicionales",
            "ia_rutinas": "Rutinas generadas por IA",
            "equipos": "Gestión de equipos",
            "horarios": "Gestión de horarios",
            "reservas": "Sistema de reservas"
        },
        "ai_endpoints": {
            "entrenar_modelo": "/ai/train-model",
            "estado_modelo": "/ai/model-status",
            "info_dataset": "/ai/dataset-info",
            "rutina_nueva": "/ai/predict-routine",
            "rutina_usuario": "/ai/predict-routine-for-user/{user_id}"
        }
    }

# ✅ ACTUALIZADO: Evento de inicio para cargar modelo de IA automáticamente
@app.on_event("startup")
async def startup_event():
    logger.info("Iniciando Templo2 Gym API con IA...")
    
    # ✅ NUEVO: Intentar cargar modelo de IA existente
    try:
        modelo_path = 'modelo_calisthenics.pkl'
        
        if os.path.exists(modelo_path):
            logger.info("Encontrado archivo de modelo entrenado, cargando...")
            
            if ai_model.cargar_modelo(modelo_path):
                logger.info("Modelo de IA cargado automáticamente al iniciar")
                logger.info(f"Dataset disponible: {ai_model.dataset is not None}")
                
                if ai_model.dataset is not None:
                    logger.info(f"Registros en dataset: {len(ai_model.dataset)}")
                    logger.info(f"Objetivos disponibles: {list(ai_model.dataset['objetivo'].unique())}")
                    logger.info("Sistema de IA listo para generar rutinas!")
                else:
                    logger.warning("Modelo cargado pero dataset no disponible")
            else:
                logger.error("Error al cargar modelo existente")
                logger.info("Solución: Ejecuta POST /ai/train-model para entrenar nuevo modelo")
        else:
            logger.info("No se encontró modelo entrenado")
            logger.info("Para entrenar nuevo modelo: POST /ai/train-model")
            logger.info(f"Buscando en: {os.path.abspath(modelo_path)}")
            
    except Exception as e:
        logger.error(f"Error durante inicialización de IA: {str(e)}")
        logger.info("El sistema funcionará, pero será necesario entrenar el modelo")
    
    logger.info("Sistema de IA de rutinas disponible")
    logger.info("Documentación API: http://localhost:8000/docs")

# Incluir routers con prefijos
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(metricas_usuario.router, prefix="/metricas-usuario", tags=["metricas-usuario"])
app.include_router(rutina.router, prefix="/rutinas", tags=["rutinas"])
app.include_router(equipos.router, prefix="/equipos-powerplate", tags=["equipos-powerplate"])
app.include_router(horarios.router, prefix="/horarios", tags=["horarios"])
app.include_router(reservas.router, prefix="/reservas", tags=["Reservas"])
app.include_router(ai_routines.router, prefix="/ai")