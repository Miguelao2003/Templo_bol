# Usar Python 3.11 como base
FROM python:3.11-slim

# Información del mantenedor
LABEL maintainer="Jose Miguel Atora Yugar <tu-email@ejemplo.com>"
LABEL description="Backend del Sistema de Gestión Templo.BOL"

# Establecer directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema necesarias para PostgreSQL y ML
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar archivo de requirements primero (para cache de Docker)
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo el código fuente
COPY . .

# Crear usuario no-root para seguridad
RUN adduser --disabled-password --gecos '' appuser
RUN chown -R appuser:appuser /app
USER appuser

# Exponer el puerto
EXPOSE 8000

# Comando por defecto
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]