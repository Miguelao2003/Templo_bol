from sqlalchemy.orm import Session
from app.models.users import Usuario
from app.models.metricas_usuario import MetricaUsuario
from app.schemas.metricas_usuario import MetricaUsuarioCreate, MetricaUsuarioUpdate
from typing import Optional
from datetime import date

def calcular_tmb(genero: str, peso: float, altura: float, edad: int) -> float:
    """Calcula la Tasa Metabólica Basal usando Harris-Benedict (1984)"""
    altura_cm = altura * 100  # Conversión clave: metros → centímetros
    
    genero_lower = genero.lower()
    if genero_lower == "masculino":
        tmb = 66 + (13.7 * peso) + (5 * altura_cm) - (6.8 * edad)
    elif genero_lower == "femenino":
        tmb = 655 + (9.6 * peso) + (1.8 * altura_cm) - (4.7 * edad)
    else:
        raise ValueError(f"Género desconocido: {genero}")
    
    return round(tmb, 2)

def calcular_imc(peso: float, altura: float) -> float:
    """Calcula el Índice de Masa Corporal"""
    return peso / (altura ** 2)

def determinar_rango_imc(imc: float) -> str:
    """Determina el rango de IMC según OMS"""
    if imc < 18.5:
        return "Bajo peso"
    elif 18.5 <= imc < 25:
        return "Normal"
    elif 25 <= imc < 30:
        return "Sobrepeso"
    else:
        return "Obesidad"

def calcular_grasa_corporal(imc: float, edad: int, genero: str) -> float:
    """Estima el porcentaje de grasa corporal usando fórmula aproximada"""
    if genero.lower() == 'masculino':
        return (1.20 * imc) + (0.23 * edad) - 16.2
    else:  # femenino
        return (1.20 * imc) + (0.23 * edad) - 5.4

def calcular_peso_ideal(altura: float, genero: str) -> float:
    """Calcula el peso ideal usando fórmula de Lorentz"""
    altura_cm = altura * 100
    if genero.lower() == 'masculino':
        return (altura_cm - 100) - ((altura_cm - 150) / 4)
    else:  # femenino
        return (altura_cm - 100) - ((altura_cm - 150) / 2.5)

def calcular_todas_metricas(db: Session, id_usuario: int, peso: float, altura: float, edad: int) -> dict:
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise ValueError("Usuario no encontrado para calcular métricas")
    
    genero = usuario.genero
    if genero is None:
        raise ValueError("El género no está definido para este usuario")

    tmb = calcular_tmb(genero, peso, altura, edad)
    imc = peso / (altura ** 2)
    rango_imc = determinar_rango_imc(imc)
    grasa_corporal_estimada = calcular_grasa_corporal(imc, edad, genero)  # ← corregido
    peso_ideal = calcular_peso_ideal(altura, genero)

    return {
        "tmb": tmb,
        "imc": imc,
        "rango_imc": rango_imc,
        "grasa_corporal_estimada": grasa_corporal_estimada,
        "peso_ideal": peso_ideal
    }


def get_metrica_usuario(db: Session, id_usuario: int):
    return db.query(MetricaUsuario).filter(MetricaUsuario.id_usuario == id_usuario).first()

def create_metrica_usuario(db: Session, metrica: MetricaUsuarioCreate, peso: float, altura: float, edad: int):
    metricas_calculadas = calcular_todas_metricas(db, metrica.id_usuario, peso, altura, edad)
    
    db_metrica = MetricaUsuario(
        id_usuario=metrica.id_usuario,
        **metricas_calculadas
    )
    db.add(db_metrica)
    db.commit()
    db.refresh(db_metrica)
    return db_metrica

def create_or_update_metrica_usuario(db: Session, id_usuario: int):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise ValueError("Usuario no encontrado para calcular métricas")
    
    if any(valor is None for valor in [usuario.peso, usuario.altura, usuario.edad, usuario.genero]):
        raise ValueError("Faltan datos en el usuario para calcular métricas")

    metricas_calculadas = calcular_todas_metricas(
        db=db,
        id_usuario=id_usuario,
        peso=usuario.peso,
        altura=usuario.altura,
        edad=usuario.edad,
    )

    db_metrica = get_metrica_usuario(db, id_usuario)
    
    if db_metrica:
        # Actualizar existente
        for field, value in metricas_calculadas.items():
            setattr(db_metrica, field, value)
    else:
        # Crear nueva
        db_metrica = MetricaUsuario(
            id_usuario=id_usuario,
            **metricas_calculadas
        )
        db.add(db_metrica)

    print("Intentando guardar métricas:", {field: getattr(db_metrica, field) for field in metricas_calculadas.keys()})

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        print("Error al guardar métricas:", e)
        raise e

    db.refresh(db_metrica)
    return db_metrica



def update_metrica_usuario(db: Session, id_usuario: int, genero: str, peso: float, altura: float, edad: int):
    db_metrica = get_metrica_usuario(db, id_usuario)
    if not db_metrica:
        return None
    
    metricas_calculadas = calcular_todas_metricas(db, id_usuario, peso, altura, edad)
    
    for field, value in metricas_calculadas.items():
        setattr(db_metrica, field, value)
    
    db.commit()
    db.refresh(db_metrica)
    return db_metrica

def delete_metrica_usuario(db: Session, id_usuario: int):
    db_metrica = get_metrica_usuario(db, id_usuario)
    if not db_metrica:
        return False
    db.delete(db_metrica)
    db.commit()
    return True