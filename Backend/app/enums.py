from enum import Enum

class UserRole(str, Enum):
    administrador = "administrador"
    entrenador = "entrenador"
    cliente = "cliente"

class UserCategory(str, Enum):
    calistenia = "calistenia"
    powerplate = "powerplate"

class ParteMusculo(str, Enum):
    pecho = "pecho"
    espalda = "espalda"
    hombro = "hombro"
    bicep = "bicep"
    tricep = "tricep"
    pierna = "pierna"
    abdomen = "abdomen"

class EstadoEquipo(str, Enum):
    activo = "activo"
    mantenimiento = "mantenimiento"