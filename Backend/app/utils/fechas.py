import calendar
from datetime import date


def get_dia_semana(fecha: date) -> str:
    dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    return dias[fecha.weekday()]