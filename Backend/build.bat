@echo off
echo 🔨 Building Templo Backend Docker Image...

echo 🧹 Limpiando imágenes anteriores...
docker rmi templo-backend:latest 2>nul

echo 📦 Construyendo nueva imagen...
docker build -t templo-backend:latest .

if %ERRORLEVEL% EQU 0 (
    echo ✅ ¡Imagen construida exitosamente!
    echo 📋 Información de la imagen:
    docker images templo-backend:latest
    echo.
    echo 🚀 Para ejecutar:
    echo    docker run -p 8000:8000 templo-backend:latest
    echo.
    echo 🐳 O con docker-compose:
    echo    docker-compose up
) else (
    echo ❌ Error al construir la imagen
    exit /b 1
)