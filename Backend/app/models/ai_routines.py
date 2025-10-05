# app/models/ai_routines.py - VERSION CORREGIDA COMPLETA con bícep y trícep

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import random
import pickle
import os
from typing import Dict, List, Tuple, Any
import ast
from collections import defaultdict, Counter
from app.crud.reservas import analizar_grupos_musculares_recientes, calcular_frecuencia_entrenamiento

class CalisthenicsAI:
    def __init__(self):
        # Modelo matemático
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.label_encoders = {}
        self.dataset = None
        self.ejercicios_por_perfil = {}
        
        # CORREGIDO: Configuración específica para cada nivel
        self.config_ejercicios = {
            'principiante': {
                'total_dia': (6, 8), 
                'por_grupo': (1, 1),
                'tipo_entrenamiento': 'full_body',  # NUEVO: Cuerpo completo
                'frecuencia_semanal': 3,  # NUEVO: 3 días por semana
                'dias_entrenamiento': ['Lunes', 'Miércoles', 'Viernes']  # NUEVO: Días específicos
            },
            'intermedio': {
                'total_dia': (8, 10), 
                'por_grupo': (2, 3),
                'tipo_entrenamiento': 'split',
                'frecuencia_semanal': 5,
                'dias_entrenamiento': ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']  # Incluir sábado
            },
            'avanzado': {
                'total_dia': (9, 12), 
                'por_grupo': (3, 4),
                'tipo_entrenamiento': 'split',
                'frecuencia_semanal': 6,
                'dias_entrenamiento': ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
            }
        }
        
        # Grupos musculares principales para principiantes (cuerpo completo)
        self.grupos_musculares = ['pecho', 'espalda', 'pierna', 'bicep', 'tricep', 'hombro', 'abdomen']
        
        # Sistema de reglas de descanso basado en fisiología
        self.reglas_descanso = {
            'pecho': 2,      # 2 días de descanso (músculo grande)
            'espalda': 2,    # 2 días de descanso (músculo grande)
            'pierna': 2,     # 2 días de descanso (músculo grande)
            'hombro': 1,     # 1 día de descanso (músculo mediano)
            'bicep': 1,      # 1 día de descanso (músculo pequeño)
            'tricep': 1,     # 1 día de descanso (músculo pequeño)
            'abdomen': 0     # Puede trabajarse diario (músculo de resistencia)
        }
        
        # Clasificación por tamaño muscular
        self.musculos_grandes = ['pecho', 'espalda', 'pierna']
        self.musculos_medianos = ['hombro']
        self.musculos_pequenos = ['bicep', 'tricep', 'abdomen']
        
        # Patrones inteligentes aprendidos del dataset
        self.patrones_musculares = {}
        self.distribucion_dias = {}

    def cargar_dataset(self, archivo_csv='dataset_rutinas_calistenia_mejorado.csv'):
        """Cargar dataset real desde archivo CSV"""
        try:
            # RUTAS CORREGIDAS PARA TU ESTRUCTURA DE PROYECTO
            possible_paths = [
                # Ruta absoluta directa (más confiable)
                r"C:\Users\USUARIO\Desktop\Proyecto_Grado\Backend\app\dataset\dataset_rutinas_calistenia_mejorado.csv",
                
                # Rutas relativas desde donde se ejecuta el código
                "Backend/app/dataset/dataset_rutinas_calistenia_mejorado.csv",  # Desde raíz del proyecto
                "app/dataset/dataset_rutinas_calistenia_mejorado.csv",          # Desde Backend/
                f"dataset/{archivo_csv}",                                        # Por si está en dataset/
                
                # Rutas relativas desde la ubicación del archivo models/
                os.path.join(os.path.dirname(__file__), '..', 'dataset', archivo_csv),  # Desde models/ a dataset/
                os.path.join(os.path.dirname(__file__), '..', '..', 'Backend', 'app', 'dataset', archivo_csv),
                
                # Fallback con nombre solo
                archivo_csv,
            ]
            
            df = None
            ruta_encontrada = None
            
            for path in possible_paths:
                if os.path.exists(path):
                    df = pd.read_csv(path)
                    ruta_encontrada = path
                    print(f"✅ Dataset cargado: {len(df)} registros desde {os.path.abspath(path)}")
                    break
            
            if df is None:
                # Mostrar rutas intentadas para debug
                print("❌ Dataset no encontrado en ninguna de estas rutas:")
                print(f"📁 Directorio actual: {os.getcwd()}")
                print(f"📁 Directorio del archivo: {os.path.dirname(__file__)}")
                for path in possible_paths:
                    abs_path = os.path.abspath(path)
                    exists = "✅" if os.path.exists(path) else "❌"
                    print(f"  {exists} {abs_path}")
                
                # Buscar el archivo manualmente
                print("\n🔍 Buscando archivo manualmente...")
                for root, dirs, files in os.walk(".."):  # Buscar en directorio padre
                    for file in files:
                        if file == archivo_csv:
                            found_path = os.path.join(root, file)
                            print(f"🔍 Encontrado en: {os.path.abspath(found_path)}")
                            try:
                                df = pd.read_csv(found_path)
                                ruta_encontrada = found_path
                                print(f"✅ Dataset cargado desde búsqueda manual: {len(df)} registros")
                                break
                            except Exception as ex:  
                                print(f"❌ Error leyendo {found_path}: {ex}")
                                continue
                            
                    if df is not None:
                        break
                
                if df is None:
                    raise FileNotFoundError(f"No se encontró el archivo {archivo_csv} en ninguna ubicación")

            # Mapear nombres de columnas correctos
            mapeo_columnas = {'TMB': 'tmb', 'día': 'dia'}
            df = df.rename(columns=mapeo_columnas)

            # Calcular IMC si no existe
            if 'altura' in df.columns and 'peso' in df.columns and 'imc' not in df.columns:
                df['imc'] = df['peso'] / (df['altura'] ** 2)

            # Limpiar columna parte_musculo
            if 'parte_musculo' in df.columns:
                df['parte_musculo'] = df['parte_musculo'].astype(str)

            # Mostrar información del dataset para debug
            print(f"📊 Objetivos en dataset: {df['objetivo'].unique()}")
            print(f"📊 Géneros en dataset: {df['genero'].unique()}")
            print(f"📊 Columnas disponibles: {list(df.columns)}")

            self.dataset = df
            
            # Extraer patrones inteligentes del dataset
            self._extraer_patrones_inteligentes()
            
            return df

        except Exception as e:
            print(f"❌ Error al cargar el dataset: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _extraer_patrones_inteligentes(self):
        """Extraer patrones reales del dataset para generar rutinas inteligentes"""
        if self.dataset is None:
            return

        print("🧠 Extrayendo patrones inteligentes del dataset...")

        # 1. ANALIZAR DISTRIBUCIÓN DE MÚSCULOS POR DÍA
        patrones_por_dia = defaultdict(list)

        if 'dia' in self.dataset.columns:
            for dia in self.dataset['dia'].unique():
                datos_dia = self.dataset[self.dataset['dia'] == dia]

                # Extraer músculos de este día
                musculos_dia = []
                for _, row in datos_dia.iterrows():
                    musculos = self._procesar_campo_lista(row['parte_musculo'], [])
                    musculos_dia.extend(musculos)

                # Contar frecuencias y obtener los más comunes
                contador = Counter(musculos_dia)
                musculos_principales = [m for m, c in contador.most_common(4)]  # Top 4
                patrones_por_dia[dia] = musculos_principales

        self.patrones_musculares = dict(patrones_por_dia)

        # 2. CREAR DISTRIBUCIONES SEGÚN NIVEL
        self._crear_distribuciones_por_nivel()

        print(f"📊 Patrones extraídos: {len(self.patrones_musculares)} días")
        print(f"🎯 Distribuciones por nivel creadas")

    def _crear_distribuciones_por_nivel(self):
        """
        Crear distribuciones respetando frecuencia_semanal de cada nivel
        """
        distribuciones = {}
        
        # PRINCIPIANTES: Full Body (3 días)
        distribuciones['principiante'] = self._crear_distribucion_principiante()
        
        # INTERMEDIO: Split 5 días (Lunes-Viernes + opción Sábado si es necesario)
        dias_intermedios = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        dist_intermedio = self._crear_distribucion_split(dias_intermedios)
        
        # Forzar al menos 5 días de entrenamiento para intermedio
        dias_con_entrenamiento = [d for d, g in dist_intermedio.items() if g and d != 'Domingo']
        if len(dias_con_entrenamiento) < 5:
            print("Ajustando intermedio para tener al menos 5 días de entrenamiento...")
            # Buscar día vacío y llenarlo
            for dia in ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']:
                if not dist_intermedio.get(dia):
                    # Asignar grupos que puedan trabajarse
                    dist_intermedio[dia] = ['abdomen', 'hombro']
                    break
        
        distribuciones['intermedio'] = dist_intermedio
        
        # AVANZADO: Split 6 días
        dias_avanzados = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        distribuciones['avanzado'] = self._crear_distribucion_split(dias_avanzados)
        
        self.distribucion_dias = distribuciones

    def _crear_distribucion_principiante(self):
        """NUEVO: Crear distribución específica para principiantes (FULL BODY)"""
        print("🌟 Creando distribución FULL BODY para principiantes...")
        
        # Para principiantes: trabajar TODO EL CUERPO en cada sesión
        # Lunes, Miércoles, Viernes = cuerpo completo
        # Martes, Jueves, Sábado, Domingo = descanso
        
        grupos_cuerpo_completo = ['pecho', 'espalda', 'pierna', 'hombro', 'bicep', 'tricep', 'abdomen']
        
        distribucion_principiante = {
            'Lunes': grupos_cuerpo_completo.copy(),      # Cuerpo completo
            'Martes': [],                                 # Descanso total
            'Miércoles': grupos_cuerpo_completo.copy(),  # Cuerpo completo
            'Jueves': [],                                 # Descanso total
            'Viernes': grupos_cuerpo_completo.copy(),    # Cuerpo completo
            'Sábado': [],                                 # Descanso total
            'Domingo': []                                 # Descanso total
        }
        
        print("✅ Distribución principiante creada:")
        for dia, grupos in distribucion_principiante.items():
            if grupos:
                print(f"   {dia}: {grupos} ({len(grupos)} grupos)")
            else:
                print(f"   {dia}: DESCANSO")
        
        return distribucion_principiante

    def _crear_distribucion_split(self, dias_entrenamiento):
        """
        VERSIÓN CORREGIDA: Asegura que se usen TODOS los días de entrenamiento disponibles
        """
        print(f"Creando distribución SPLIT para {len(dias_entrenamiento)} días...")
        
        grupos_obligatorios = ['pecho', 'espalda', 'pierna', 'hombro', 'bicep', 'tricep', 'abdomen']
        grupos_asignados = set()
        
        distribucion = {}
        ultimo_dia_trabajado = {}
        
        # PRIMERA PASADA: Asignar grupos a TODOS los días de entrenamiento
        for i, dia in enumerate(dias_entrenamiento):
            musculos_disponibles_hoy = []
            
            # Verificar disponibilidad por reglas de descanso
            for musculo in grupos_obligatorios:
                if musculo not in ultimo_dia_trabajado:
                    musculos_disponibles_hoy.append(musculo)
                else:
                    ultimo_dia = ultimo_dia_trabajado[musculo]
                    dias_transcurridos = i - ultimo_dia
                    dias_descanso_necesarios = self.reglas_descanso.get(musculo, 1)
                    
                    if dias_transcurridos > dias_descanso_necesarios:
                        musculos_disponibles_hoy.append(musculo)
            
            # Priorizar grupos que aún no han sido asignados
            grupos_no_asignados = [m for m in musculos_disponibles_hoy if m not in grupos_asignados]
            
            if grupos_no_asignados:
                musculos_dia = self._seleccionar_con_prioridad(grupos_no_asignados, musculos_disponibles_hoy)
            elif musculos_disponibles_hoy:
                # Todos los grupos ya fueron asignados, hacer segundo ciclo
                musculos_dia = self._seleccionar_musculos_balance(musculos_disponibles_hoy)
            else:
                # No hay músculos disponibles (muy raro), usar abdomen
                musculos_dia = ['abdomen']
            
            # Actualizar tracking
            for musculo in musculos_dia:
                ultimo_dia_trabajado[musculo] = i
                grupos_asignados.add(musculo)
            
            distribucion[dia] = musculos_dia
            print(f"   {dia}: {musculos_dia}")
        
        # VERIFICACIÓN CRÍTICA: Asegurar que bícep y trícep están incluidos
        if 'bicep' not in grupos_asignados or 'tricep' not in grupos_asignados:
            print("Reajustando para incluir bícep y trícep...")
            distribucion = self._reajustar_para_incluir_faltantes(distribucion, dias_entrenamiento, grupos_asignados)
        
        # Completar días de descanso
        todos_los_dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        for dia in todos_los_dias:
            if dia not in distribucion:
                distribucion[dia] = []
        
        # CRÍTICO: Domingo siempre es descanso (gimnasio cerrado)
        distribucion['Domingo'] = []
        
        print(f"Distribución finalizada con grupos: {grupos_asignados}")
        return distribucion

    def _seleccionar_con_prioridad(self, grupos_prioritarios, todos_disponibles):
        """NUEVO: Seleccionar músculos dando prioridad a grupos específicos"""
        musculos_seleccionados = []
        
        # 1. Seleccionar de grupos prioritarios primero
        if grupos_prioritarios:
            # Priorizar bícep y trícep si están disponibles
            if 'bicep' in grupos_prioritarios:
                musculos_seleccionados.append('bicep')
            elif 'tricep' in grupos_prioritarios:
                musculos_seleccionados.append('tricep')
            elif grupos_prioritarios:
                # Seleccionar otro grupo prioritario
                musculos_seleccionados.append(random.choice(grupos_prioritarios))
        
        # 2. Completar con otros grupos disponibles
        otros_disponibles = [m for m in todos_disponibles if m not in musculos_seleccionados]
        
        # Agregar un músculo grande si está disponible
        musculos_grandes = [m for m in otros_disponibles if m in self.musculos_grandes]
        if musculos_grandes and len(musculos_seleccionados) < 2:
            musculos_seleccionados.append(random.choice(musculos_grandes))
        
        # Completar hasta 2-3 músculos
        otros_disponibles = [m for m in otros_disponibles if m not in musculos_seleccionados]
        espacios_restantes = 3 - len(musculos_seleccionados)
        
        if espacios_restantes > 0 and otros_disponibles:
            num_adicionales = min(espacios_restantes, len(otros_disponibles))
            adicionales = random.sample(otros_disponibles, num_adicionales)
            musculos_seleccionados.extend(adicionales)
        
        return musculos_seleccionados[:3]

    def _reajustar_para_incluir_faltantes(self, distribucion, dias_entrenamiento, grupos_asignados):
        """NUEVO: Reajustar distribución para incluir grupos faltantes como bícep y trícep"""
        grupos_faltantes = []
        
        if 'bicep' not in grupos_asignados:
            grupos_faltantes.append('bicep')
        if 'tricep' not in grupos_asignados:
            grupos_faltantes.append('tricep')
        
        if not grupos_faltantes:
            return distribucion
        
        print(f"🔧 Reajustando para incluir: {grupos_faltantes}")
        
        # Buscar días donde podamos agregar estos grupos
        for grupo_faltante in grupos_faltantes:
            for dia in dias_entrenamiento:
                musculos_dia = distribucion[dia]
                
                # Si el día tiene menos de 3 grupos, agregar el faltante
                if len(musculos_dia) < 3:
                    distribucion[dia].append(grupo_faltante)
                    print(f"   ✅ Agregado {grupo_faltante} a {dia}")
                    break
                else:
                    # Reemplazar abdomen si está presente (es el más flexible)
                    if 'abdomen' in musculos_dia and len(musculos_dia) >= 2:
                        distribucion[dia] = [m for m in musculos_dia if m != 'abdomen']
                        distribucion[dia].append(grupo_faltante)
                        print(f"   ✅ Reemplazado abdomen por {grupo_faltante} en {dia}")
                        break
        
        return distribucion

    def _seleccionar_musculos_balance(self, musculos_disponibles):
        """CORREGIDO: Seleccionar músculos balanceados asegurando inclusión de bícep y trícep"""
        if not musculos_disponibles:
            return ['abdomen']  # Fallback seguro
        
        # ESTRATEGIA MEJORADA: Asegurar que bícep y trícep aparezcan en la rutina
        musculos_grandes_disponibles = [m for m in musculos_disponibles if m in self.musculos_grandes]
        musculos_medianos_disponibles = [m for m in musculos_disponibles if m in self.musculos_medianos]
        musculos_pequenos_disponibles = [m for m in musculos_disponibles if m in self.musculos_pequenos]
        
        musculos_seleccionados = []
        
        # 1. Prioridad: Un músculo grande si está disponible
        if musculos_grandes_disponibles:
            musculo_grande = random.choice(musculos_grandes_disponibles)
            musculos_seleccionados.append(musculo_grande)
        
        # 2. NUEVO: Priorizar bícep y trícep cuando estén disponibles
        bicep_disponible = 'bicep' in musculos_disponibles
        tricep_disponible = 'tricep' in musculos_disponibles
        
        # Si tenemos espacio, agregar bícep o trícep preferentemente
        if bicep_disponible and len(musculos_seleccionados) < 2:
            musculos_seleccionados.append('bicep')
        elif tricep_disponible and len(musculos_seleccionados) < 2:
            musculos_seleccionados.append('tricep')
        
        # 3. Completar con otros músculos disponibles
        otros_disponibles = musculos_medianos_disponibles + musculos_pequenos_disponibles
        otros_disponibles = [m for m in otros_disponibles if m not in musculos_seleccionados]
        
        # Seleccionar músculos adicionales hasta llegar a 2-3
        espacios_restantes = 3 - len(musculos_seleccionados)
        if espacios_restantes > 0 and otros_disponibles:
            num_adicionales = min(espacios_restantes, len(otros_disponibles))
            adicionales = random.sample(otros_disponibles, num_adicionales)
            musculos_seleccionados.extend(adicionales)
        
        # 4. Asegurar que tengamos al menos 2 músculos
        if len(musculos_seleccionados) < 2:
            # Agregar abdomen como comodín (siempre disponible)
            if 'abdomen' not in musculos_seleccionados:
                musculos_seleccionados.append('abdomen')
        
        return musculos_seleccionados[:3]  # Máximo 3 músculos por día

    def _procesar_campo_lista(self, campo, valor_defecto):
        """Procesar campos que pueden ser listas o strings"""
        if isinstance(campo, str) and campo.startswith('['):
            import ast
            try:
                lista = ast.literal_eval(campo)
                return lista if isinstance(lista, list) else [lista]
            except:
                return valor_defecto
        elif pd.notna(campo):
            return [campo]
        else:
            return valor_defecto

    def crear_perfiles_usuario(self):
        """Crear perfiles basados en características del usuario para clasificación"""
        if self.dataset is None:
            return None

        df = self.dataset.copy()

        perfiles = df.groupby(['genero', 'edad', 'peso', 'altura', 'objetivo', 'tmb']).agg({
            'ejercicio': 'count',
            'imc': 'first'
        }).reset_index()

        perfiles = perfiles.rename(columns={'ejercicio': 'num_ejercicios'})

        def clasificar_nivel(row):
            tmb = row['tmb']
            edad = row['edad']
            imc = row['imc']
            genero = row['genero']

            if genero.lower() == 'masculino':
                if tmb > 1800 and edad < 35 and imc < 25:
                    return 'avanzado'
                elif tmb > 1500 and edad < 45 and imc < 28:
                    return 'intermedio'
                else:
                    return 'principiante'
            else:  # Femenino
                if tmb > 1400 and edad < 35 and imc < 25:
                    return 'avanzado'
                elif tmb > 1200 and edad < 45 and imc < 28:
                    return 'intermedio'
                else:
                    return 'principiante'

        perfiles['nivel'] = perfiles.apply(clasificar_nivel, axis=1)
        print(f"✅ Perfiles creados: {len(perfiles)}")
        return perfiles

    def entrenar_modelo(self, archivo_csv='dataset_rutinas_calistenia_mejorado.csv'):
        """Entrenar el modelo de machine learning con el dataset real"""
        df = self.cargar_dataset(archivo_csv)
        if df is None:
            return False, 0

        perfiles = self.crear_perfiles_usuario()
        if perfiles is None:
            return False, 0

        # Preparar características para el modelo
        caracteristicas_numericas = ['edad', 'peso', 'altura', 'tmb']
        X_numericas = perfiles[caracteristicas_numericas].values

        # Agregar IMC
        imc = perfiles['peso'] / (perfiles['altura'] ** 2)
        X_numericas = np.column_stack([X_numericas, imc])

        # Codificar variables categóricas
        self.label_encoders['genero'] = LabelEncoder()
        genero_encoded = self.label_encoders['genero'].fit_transform(perfiles['genero'])

        self.label_encoders['objetivo'] = LabelEncoder()
        objetivo_encoded = self.label_encoders['objetivo'].fit_transform(perfiles['objetivo'])

        # Combinar todas las características
        X = np.column_stack([X_numericas, genero_encoded, objetivo_encoded])

        # Variable objetivo (nivel)
        self.label_encoders['nivel'] = LabelEncoder()
        y = self.label_encoders['nivel'].fit_transform(perfiles['nivel'])

        # Dividir datos
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        # Entrenar modelo
        self.model.fit(X_train, y_train)

        # Evaluar modelo
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)

        print(f"✅ Modelo entrenado con precisión: {accuracy:.2%}")
        
        # Análisis del plan de descanso
        print("\n🔬 ANÁLISIS DEL PLAN DE DESCANSO:")
        self._analizar_plan_descanso()
        
        return True, accuracy

    def _analizar_plan_descanso(self):
        """Análisis detallado del plan de descanso por nivel"""
        if not hasattr(self, 'distribucion_dias'):
            print("❌ No hay distribución generada")
            return
        
        print("\n📊 ANÁLISIS DETALLADO DEL PLAN DE DESCANSO POR NIVEL")
        print("=" * 60)
        
        for nivel, distribucion in self.distribucion_dias.items():
            print(f"\n🎯 NIVEL: {nivel.upper()}")
            print("-" * 40)
            
            config = self.config_ejercicios[nivel]
            print(f"Tipo: {config['tipo_entrenamiento']}")
            print(f"Frecuencia: {config['frecuencia_semanal']} días/semana")
            
            if config['tipo_entrenamiento'] == 'full_body':
                print("📅 Días de entrenamiento: Lunes, Miércoles, Viernes (cuerpo completo)")
                print("😴 Días de descanso: Martes, Jueves, Sábado, Domingo")
            else:
                dias_entrenamiento = [dia for dia, grupos in distribucion.items() if grupos]
                dias_descanso = [dia for dia, grupos in distribucion.items() if not grupos]
                print(f"📅 Días de entrenamiento: {', '.join(dias_entrenamiento)}")
                print(f"😴 Días de descanso: {', '.join(dias_descanso)}")

    def predecir_perfil(self, genero, edad, peso, altura, objetivo):
        """Predecir el perfil/nivel del usuario usando IA"""
        genero_dataset = 'Masculino' if genero.lower() in ['hombre', 'masculino'] else 'Femenino'

        # USAR FÓRMULA HARRIS BENEDICT (igual que en el dataset)
        altura_cm = altura * 100

        if genero.lower() in ['hombre', 'masculino']:
            tmb = 66 + (13.7 * peso) + (5 * altura_cm) - (6.8 * edad)
        else:
            tmb = 655 + (9.6 * peso) + (1.8 * altura_cm) - (4.7 * edad)

        tmb = round(tmb, 2)
        imc = peso / (altura ** 2)

        if 'genero' not in self.label_encoders or 'objetivo' not in self.label_encoders:
            return 'intermedio', tmb, imc

        try:
            genero_encoded = self.label_encoders['genero'].transform([genero_dataset])[0]
            objetivo_encoded = self.label_encoders['objetivo'].transform([objetivo])[0]

            caracteristicas = np.array([[edad, peso, altura, tmb, imc, genero_encoded, objetivo_encoded]])

            nivel_encoded = self.model.predict(caracteristicas)[0]
            nivel = self.label_encoders['nivel'].inverse_transform([nivel_encoded])[0]

            return nivel, tmb, imc

        except ValueError as e:
            print(f"⚠️ Error en predicción: {e}")
            return 'intermedio', tmb, imc

    def generar_plan_inteligente(self, genero, edad, peso, altura, objetivo, nivel):
        """CORREGIDO: Generar plan de entrenamiento según el nivel específico"""
        
        # Usar la distribución específica para el nivel del usuario
        if hasattr(self, 'distribucion_dias') and nivel in self.distribucion_dias:
            print(f"🎯 Usando distribución {nivel}: {self.config_ejercicios[nivel]['tipo_entrenamiento']}")
            return self.distribucion_dias[nivel].copy()
        
        # Fallback: generar según nivel
        print(f"⚠️ Generando distribución de fallback para {nivel}")
        if nivel == 'principiante':
            return self._generar_plan_principiante_fallback()
        else:
            return self._generar_plan_basico()

    def _generar_plan_principiante_fallback(self):
        """NUEVO: Plan específico para principiantes (fallback)"""
        grupos_completos = ['pecho', 'espalda', 'pierna', 'hombro', 'bicep', 'tricep', 'abdomen']
        
        return {
            'Lunes': grupos_completos.copy(),
            'Martes': [],  # Descanso
            'Miércoles': grupos_completos.copy(),
            'Jueves': [],  # Descanso
            'Viernes': grupos_completos.copy(),
            'Sábado': [],  # Descanso
            'Domingo': []  # Descanso
        }

    def _generar_plan_basico(self):
        """Plan básico de fallback para intermedio/avanzado"""
        plan_basico = {
            'Lunes': ['pecho', 'tricep'],
            'Martes': ['espalda', 'bicep'],
            'Miércoles': ['pierna', 'abdomen'],
            'Jueves': ['hombro', 'abdomen'],
            'Viernes': ['pecho', 'espalda'],
            'Sábado': ['pierna', 'hombro'],
            'Domingo': []  # Descanso
        }
        return plan_basico

    def obtener_ejercicios_para_dia(self, genero, objetivo, nivel, musculos_dia):
        """CORREGIDO: Obtener ejercicios específicos según el nivel y tipo de entrenamiento"""
        ejercicios_dia = []
        
        if self.dataset is None:
            return []

        genero_dataset = 'Masculino' if genero.lower() in ['hombre', 'masculino'] else 'Femenino'
        
        # Configuración según nivel
        config = self.config_ejercicios.get(nivel, self.config_ejercicios['intermedio'])
        
        if config['tipo_entrenamiento'] == 'full_body' and nivel == 'principiante':
            # PRINCIPIANTES: 1 ejercicio por cada grupo muscular = 7 ejercicios total
            print(f"🌟 Generando rutina FULL BODY para principiante: {len(musculos_dia)} grupos")
            
            for musculo in musculos_dia:
                ejercicios_musculo = self.obtener_ejercicios_por_musculo(
                    genero_dataset, objetivo, nivel, musculo, num_ejercicios=1  # SOLO 1 ejercicio por grupo
                )
                ejercicios_dia.extend(ejercicios_musculo)
                
        else:
            # INTERMEDIO/AVANZADO: Split normal
            max_ejercicios_por_grupo = config['por_grupo'][1]
            
            for musculo in musculos_dia:
                num_ejercicios = min(max_ejercicios_por_grupo, 3)
                ejercicios_musculo = self.obtener_ejercicios_por_musculo(
                    genero_dataset, objetivo, nivel, musculo, num_ejercicios=num_ejercicios
                )
                ejercicios_dia.extend(ejercicios_musculo)
        
        print(f"✅ Ejercicios generados para {nivel}: {len(ejercicios_dia)} ejercicios")
        return ejercicios_dia

    def obtener_ejercicios_por_musculo(self, genero_dataset, objetivo, nivel, musculo_target, num_ejercicios=3):
        """Obtener ejercicios específicos para un músculo"""
        ejercicios_encontrados = []
        
        try:
            # Filtrar por género y objetivo
            filtro_base = (
                (self.dataset['genero'] == genero_dataset) &
                (self.dataset['objetivo'] == objetivo)
            )
            datos_filtrados = self.dataset[filtro_base]
            
            if len(datos_filtrados) == 0:
                print(f"❌ No hay datos para {genero_dataset} - {objetivo}")
                return self._generar_ejercicios_fallback(musculo_target, nivel, num_ejercicios)
            
            # Buscar ejercicios que contengan el músculo target
            ejercicios_validos = []
            
            for _, registro in datos_filtrados.iterrows():
                # Procesar parte_musculo
                parte_musculo = registro['parte_musculo']
                musculos_registro = self.procesar_lista_string(parte_musculo, ['pecho'])
                
                # Verificar si el músculo target está en este registro
                if musculo_target in musculos_registro:
                    # Procesar ejercicios
                    ejercicios_data = registro['ejercicio']
                    ejercicios_lista = self.procesar_lista_string(ejercicios_data, ['flexiones'])
                    
                    # Procesar repeticiones
                    repeticiones_data = registro['repeticiones']
                    reps_lista = self.procesar_lista_numerica(repeticiones_data, [12])
                    
                    # Procesar series
                    series_data = registro['series']
                    series_lista = self.procesar_lista_numerica(series_data, [3])
                    
                    # Crear ejercicio individual
                    max_length = max(len(ejercicios_lista), len(reps_lista), len(series_lista))
                    
                    for i in range(max_length):
                        ejercicio = ejercicios_lista[i] if i < len(ejercicios_lista) else ejercicios_lista[-1]
                        rep = reps_lista[i] if i < len(reps_lista) else reps_lista[-1]
                        serie = series_lista[i] if i < len(series_lista) else series_lista[-1]
                        
                        # Ajustar según nivel
                        rep_ajustada, serie_ajustada = self.ajustar_por_nivel(rep, serie, nivel)
                        
                        ejercicios_validos.append({
                            'musculo': musculo_target,
                            'ejercicio': ejercicio,
                            'repeticiones': rep_ajustada,
                            'series': serie_ajustada
                        })
            
            # Seleccionar ejercicios únicos aleatoriamente
            if ejercicios_validos:
                # Eliminar duplicados por nombre de ejercicio
                ejercicios_unicos = {}
                for ej in ejercicios_validos:
                    if ej['ejercicio'] not in ejercicios_unicos:
                        ejercicios_unicos[ej['ejercicio']] = ej
                
                ejercicios_lista = list(ejercicios_unicos.values())
                
                # Seleccionar aleatoriamente el número solicitado
                num_seleccionar = min(num_ejercicios, len(ejercicios_lista))
                ejercicios_seleccionados = random.sample(ejercicios_lista, num_seleccionar)
                
                return ejercicios_seleccionados
            
        except Exception as e:
            print(f"❌ Error obteniendo ejercicios para {musculo_target}: {e}")
        
        # Fallback si no se encuentran ejercicios
        return self._generar_ejercicios_fallback(musculo_target, nivel, num_ejercicios)

    def _generar_ejercicios_fallback(self, musculo_target, nivel, num_ejercicios):
        """Generar ejercicios de fallback cuando no hay datos en dataset"""
        ejercicios_base = {
            'pecho': ['Flexiones de brazos', 'Push ups', 'Flexiones diamante', 'Flexiones inclinadas'],
            'espalda': ['Remo con banda elástica', 'Superman', 'Remo invertido', 'Pull ups'],
            'pierna': ['Sentadillas', 'Zancadas', 'Saltos de sentadilla', 'Wall sit'],
            'bicep': ['Curl con banda', 'Curl con botellas', 'Chin ups isométrico'],
            'tricep': ['Fondos en banco', 'Fondos en silla', 'Flexiones cerradas'],
            'hombro': ['Pike push-ups', 'Elevaciones laterales', 'Handstand progresión'],
            'abdomen': ['Plancha', 'Crunches abdominales', 'Mountain climbers', 'Bicycle crunches']
        }

        ejercicios = ejercicios_base.get(musculo_target.lower(), ['ejercicio general'])
        
        # CORREGIDO: Valores específicos para principiantes
        if nivel == 'principiante':
            config_nivel = {'reps': (8, 12), 'series': (2, 3)}
        elif nivel == 'intermedio':
            config_nivel = {'reps': (12, 16), 'series': (3, 4)}
        else:  # avanzado
            config_nivel = {'reps': (16, 25), 'series': (4, 5)}
        
        ejercicios_generados = []
        for i in range(num_ejercicios):
            ejercicio = ejercicios[i % len(ejercicios)]  # Evitar repetir si hay pocos ejercicios
            ejercicios_generados.append({
                'musculo': musculo_target,
                'ejercicio': ejercicio,
                'repeticiones': random.randint(*config_nivel['reps']),
                'series': random.randint(*config_nivel['series'])
            })
        
        return ejercicios_generados

    def procesar_lista_string(self, data, default):
        """Procesar datos que pueden venir como lista en string"""
        if isinstance(data, str) and data.startswith('['):
            try:
                return ast.literal_eval(data)
            except:
                return default
        elif isinstance(data, list):
            return data
        else:
            return [str(data)] if pd.notna(data) else default

    def procesar_lista_numerica(self, data, default):
        """Procesar datos numéricos que pueden venir como lista en string"""
        if isinstance(data, str) and data.startswith('['):
            try:
                return ast.literal_eval(data)
            except:
                return default
        elif isinstance(data, list):
            return data
        else:
            try:
                return [int(data)] if pd.notna(data) else default
            except:
                return default

    def ajustar_por_nivel(self, rep, serie, nivel):
        """CORREGIDO: Ajustar repeticiones y series según el nivel del usuario"""
        if nivel == 'principiante':
            # Principiantes: menor intensidad, enfoque en forma
            rep_ajustada = max(8, int(rep * 0.8))
            serie_ajustada = max(2, min(3, serie))  # Entre 2-3 series máximo
        elif nivel == 'intermedio':
            rep_ajustada = rep
            serie_ajustada = serie
        else:  # avanzado
            rep_ajustada = int(rep * 1.2)
            serie_ajustada = min(5, serie + 1)
        
        return rep_ajustada, serie_ajustada

    def guardar_modelo(self, ruta: str = 'modelo_calisthenics.pkl'):
        """Guardar el modelo entrenado"""
        modelo_data = {
            'model': self.model,
            'label_encoders': self.label_encoders,
            'grupos_musculares': self.grupos_musculares,
            'reglas_descanso': self.reglas_descanso,
            'musculos_grandes': self.musculos_grandes,
            'musculos_medianos': self.musculos_medianos,
            'musculos_pequenos': self.musculos_pequenos,
            'config_ejercicios': self.config_ejercicios,
            'distribucion_dias': getattr(self, 'distribucion_dias', {}),
            'patrones_musculares': getattr(self, 'patrones_musculares', {})
        }
        
        try:
            with open(ruta, 'wb') as f:
                pickle.dump(modelo_data, f)
            print(f"✅ Modelo guardado en: {ruta}")
            return True
        except Exception as e:
            print(f"❌ Error guardando modelo: {e}")
            return False

    def cargar_modelo(self, ruta: str = 'modelo_calisthenics.pkl'):
        """Cargar modelo previamente entrenado Y dataset"""
        try:
            # Cargar modelo desde pickle
            with open(ruta, 'rb') as f:
                modelo_data = pickle.load(f)
            
            self.model = modelo_data['model']
            self.label_encoders = modelo_data['label_encoders']
            self.grupos_musculares = modelo_data.get('grupos_musculares', self.grupos_musculares)
            
            # Cargar configuraciones del sistema mejorado
            self.reglas_descanso = modelo_data.get('reglas_descanso', self.reglas_descanso)
            self.musculos_grandes = modelo_data.get('musculos_grandes', self.musculos_grandes)
            self.musculos_medianos = modelo_data.get('musculos_medianos', self.musculos_medianos)
            self.musculos_pequenos = modelo_data.get('musculos_pequenos', self.musculos_pequenos)
            self.config_ejercicios = modelo_data.get('config_ejercicios', self.config_ejercicios)
            self.distribucion_dias = modelo_data.get('distribucion_dias', {})
            self.patrones_musculares = modelo_data.get('patrones_musculares', {})
            
            print(f"✅ Modelo cargado desde: {ruta}")
            
            # También cargar el dataset
            dataset_cargado = self.cargar_dataset()
            
            if dataset_cargado is not None:
                print(f"Dataset también cargado: {len(dataset_cargado)} registros")
                return True
            else:
                print("Modelo cargado pero no se pudo cargar el dataset")
                return True
                
        except Exception as e:
            print(f"Error cargando modelo: {e}")
            return False

    def generar_rutina_inteligente(self, genero, objetivo, nivel, dia_semana):
        """CORREGIDO: Generar rutina inteligente según nivel y día"""
        
        # 1. Obtener grupos musculares para el día según nivel
        if hasattr(self, 'distribucion_dias') and nivel in self.distribucion_dias:
            if dia_semana in self.distribucion_dias[nivel]:
                grupos_dia = self.distribucion_dias[nivel][dia_semana]
            else:
                grupos_dia = []
        else:
            # Fallback
            if nivel == 'principiante':
                # Para principiantes: cuerpo completo en días de entrenamiento
                if dia_semana in ['Lunes', 'Miércoles', 'Viernes']:
                    grupos_dia = ['pecho', 'espalda', 'pierna', 'hombro', 'bicep', 'tricep', 'abdomen']
                else:
                    grupos_dia = []  # Día de descanso
            else:
                plan_basico = self._generar_plan_basico()
                grupos_dia = plan_basico.get(dia_semana, [])
        
        # 2. Si es día de descanso, retornar vacío
        if not grupos_dia:
            return []
        
        # 3. Configuración según nivel
        config = self.config_ejercicios.get(nivel, self.config_ejercicios['intermedio'])
        
        # 4. Generar ejercicios
        rutina_dia = []
        genero_dataset = 'Masculino' if genero.lower() in ['hombre', 'masculino'] else 'Femenino'
        
        if config['tipo_entrenamiento'] == 'full_body' and nivel == 'principiante':
            # PRINCIPIANTES: 1 ejercicio por grupo = 7 ejercicios total
            print(f"🌟 Generando rutina FULL BODY para {dia_semana}: {len(grupos_dia)} grupos")
            
            for grupo in grupos_dia:
                ejercicios_grupo = self.obtener_ejercicios_por_musculo(
                    genero_dataset, objetivo, nivel, grupo, num_ejercicios=1
                )
                rutina_dia.extend(ejercicios_grupo)
        else:
            # INTERMEDIO/AVANZADO: Split con más ejercicios por grupo
            max_ejercicios_por_grupo = config['por_grupo'][1]
            
            for grupo in grupos_dia:
                ejercicios_grupo = self.obtener_ejercicios_por_musculo(
                    genero_dataset, objetivo, nivel, grupo, num_ejercicios=max_ejercicios_por_grupo
                )
                rutina_dia.extend(ejercicios_grupo)
        
        print(f"✅ Rutina {nivel} para {dia_semana}: {len(rutina_dia)} ejercicios")
        return rutina_dia

    def obtener_info_descanso(self):
        """Obtener información del sistema de descanso implementado"""
        return {
            "reglas_descanso": self.reglas_descanso,
            "musculos_grandes": self.musculos_grandes,
            "musculos_medianos": self.musculos_medianos,
            "musculos_pequenos": self.musculos_pequenos,
            "distribucion_actual": getattr(self, 'distribucion_dias', {}),
            "config_ejercicios": self.config_ejercicios
        }
    
    def generar_rutina_considerando_historial(self, genero, objetivo, nivel, dia_semana, historial_reciente):
    
        # Analizar qué grupos musculares trabajó recientemente
        grupos_trabajados_recientes = analizar_grupos_musculares_recientes(historial_reciente, dias_limite=2)
        frecuencia_stats = calcular_frecuencia_entrenamiento(historial_reciente)
        
        print(f"🔍 Analizando historial para {dia_semana}:")
        print(f"   Grupos trabajados recientemente: {grupos_trabajados_recientes}")
        print(f"   Estadísticas: {frecuencia_stats}")
        
        # Generar rutina base según el método normal
        rutina_base = self.generar_rutina_inteligente(genero, objetivo, nivel, dia_semana)
        
        if not historial_reciente:
            print("   No hay historial, usando rutina estándar")
            return rutina_base
        
        # Ajustar rutina según historial
        rutina_ajustada = self._ajustar_rutina_por_historial(
            rutina_base, 
            grupos_trabajados_recientes, 
            frecuencia_stats,
            nivel
        )
        
        return rutina_ajustada

    def _ajustar_rutina_por_historial(self, rutina_base, grupos_recientes, frecuencia_stats, nivel):
        """
        Ajustar intensidad y selección de ejercicios basándose en el historial
        """
        rutina_ajustada = []
        
        for ejercicio in rutina_base:
            ejercicio_ajustado = ejercicio.copy()
            musculo = ejercicio['musculo']
            
            # REGLA 1: Reducir intensidad si trabajó este músculo recientemente
            if musculo in grupos_recientes:
                dias_desde = grupos_recientes[musculo]
                
                if dias_desde == 0:  # Trabajó hoy mismo
                    print(f"   ⚠️ {musculo} trabajado hoy, reduciendo intensidad significativamente")
                    ejercicio_ajustado['series'] = max(1, ejercicio_ajustado['series'] - 2)
                    ejercicio_ajustado['repeticiones'] = max(6, int(ejercicio_ajustado['repeticiones'] * 0.6))
                    
                elif dias_desde == 1:  # Trabajó ayer
                    print(f"   ⚠️ {musculo} trabajado ayer, reduciendo intensidad moderadamente")
                    ejercicio_ajustado['series'] = max(1, ejercicio_ajustado['series'] - 1)
                    ejercicio_ajustado['repeticiones'] = max(8, int(ejercicio_ajustado['repeticiones'] * 0.8))
                    
                elif dias_desde == 2:  # Trabajó hace 2 días
                    print(f"   ⚠️ {musculo} trabajado hace 2 días, reducción leve")
                    ejercicio_ajustado['repeticiones'] = max(10, int(ejercicio_ajustado['repeticiones'] * 0.9))
            
            # REGLA 2: Ajustar según frecuencia general de entrenamiento
            if frecuencia_stats['entrenamientos_por_semana'] >= 5:
                # Usuario muy activo, reducir intensidad general
                ejercicio_ajustado['series'] = max(1, ejercicio_ajustado['series'] - 1)
                print(f"   📊 Usuario muy activo ({frecuencia_stats['entrenamientos_por_semana']} entrenamientos/semana), reduciendo volumen")
                
            elif frecuencia_stats['entrenamientos_por_semana'] <= 2:
                # Usuario poco activo, puede manejar más intensidad
                if nivel in ['intermedio', 'avanzado']:
                    ejercicio_ajustado['series'] = min(5, ejercicio_ajustado['series'] + 1)
                    print(f"   📊 Usuario poco activo ({frecuencia_stats['entrenamientos_por_semana']} entrenamientos/semana), aumentando volumen")
            
            # REGLA 3: Ajustar según asistencia promedio
            if frecuencia_stats['asistencia_promedio'] < 70:
                # Baja asistencia, rutina más conservadora
                ejercicio_ajustado['repeticiones'] = max(8, int(ejercicio_ajustado['repeticiones'] * 0.9))
                print(f"   📊 Asistencia baja ({frecuencia_stats['asistencia_promedio']}%), rutina más conservadora")
            
            rutina_ajustada.append(ejercicio_ajustado)
        
        return rutina_ajustada

    def generar_recomendaciones_basadas_en_historial(self, historial_reciente):
        """
        NUEVO: Generar recomendaciones específicas basadas en el patrón de entrenamiento
        """
        if not historial_reciente:
            return ["Comienza con una rutina equilibrada para establecer una base sólida"]
        
        from app.crud.reservas import calcular_frecuencia_entrenamiento, analizar_grupos_musculares_recientes
        
        frecuencia_stats = calcular_frecuencia_entrenamiento(historial_reciente)
        grupos_recientes = analizar_grupos_musculares_recientes(historial_reciente, dias_limite=3)
        
        recomendaciones = []
        
        # Recomendaciones sobre frecuencia
        if frecuencia_stats['entrenamientos_por_semana'] > 5:
            recomendaciones.append("⚠️ Entrenas muy frecuentemente. Considera agregar más días de descanso para mejor recuperación.")
        elif frecuencia_stats['entrenamientos_por_semana'] < 2:
            recomendaciones.append("💪 Podrías aumentar la frecuencia de entrenamiento para mejores resultados.")
        else:
            recomendaciones.append("✅ Tienes una buena frecuencia de entrenamiento.")
        
        # Recomendaciones sobre asistencia
        if frecuencia_stats['asistencia_promedio'] < 70:
            recomendaciones.append("📈 Tu asistencia promedio es baja. Considera rutinas más cortas pero consistentes.")
        elif frecuencia_stats['asistencia_promedio'] > 90:
            recomendaciones.append("🏆 Excelente consistencia en tus entrenamientos!")
        
        # Recomendaciones sobre grupos musculares
        if len(grupos_recientes) > 4:
            recomendaciones.append("🔥 Has trabajado muchos grupos musculares recientemente. Considera un día de descanso activo.")
        
        if 'pierna' not in frecuencia_stats['grupos_mas_trabajados'][:3]:
            recomendaciones.append("🦵 Considera incluir más ejercicios de pierna en tu rutina.")
        
        if 'abdomen' not in frecuencia_stats['grupos_mas_trabajados'][:3]:
            recomendaciones.append("💪 No olvides trabajar el core/abdomen regularmente.")
        
        return recomendaciones
    
    def generar_plan_semanal_completo(self, usuario_nivel, fecha_inicio=None):
        """
        Genera plan de 7 días con descanso dinámico según fecha de inicio
        """
        from datetime import datetime, timedelta
        
        if fecha_inicio is None:
            fecha_inicio = datetime.now()
        
        config = self.config_ejercicios[usuario_nivel]
        frecuencia = config['frecuencia_semanal']
        
        print(f"📅 Generando plan desde {fecha_inicio.strftime('%d/%m/%Y')} - Nivel: {usuario_nivel}")
        print(f"🏋️ Frecuencia: {frecuencia} días de entrenamiento + descanso")
        
        plan_semanal = []
        dias_semana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        
        # ✅ NUEVO: Para principiantes, calcular días de forma alterna desde HOY
        if usuario_nivel == 'principiante':
            dias_descanso_indices = self._calcular_dias_descanso_principiante(fecha_inicio)
        else:
            dias_descanso_indices = self._calcular_dias_descanso(fecha_inicio, frecuencia)
        
        # Generar plan día por día
        for i in range(7):
            fecha_dia = fecha_inicio + timedelta(days=i)
            dia_nombre = dias_semana[fecha_dia.weekday()]
            fecha_str = fecha_dia.strftime('%d/%m')
            
            # Determinar si es día de descanso
            es_descanso = i in dias_descanso_indices
            
            # ✅ Obtener config_nivel AQUÍ (antes de usarlo)
            config_nivel = self.config_ejercicios.get(usuario_nivel, self.config_ejercicios['intermedio'])
            
            if es_descanso:
                tipo_descanso = 'Gimnasio cerrado' if dia_nombre == 'Domingo' else 'Descanso activo'
                plan_semanal.append({
                    'dia': f"{dia_nombre} ({fecha_str})",
                    'fecha_real': fecha_dia.strftime('%Y-%m-%d'),
                    'grupos_musculares': [],
                    'ejercicios': [],
                    'total_ejercicios': 0,
                    'volumen_total': 0,
                    'es_dia_descanso': True,
                    'tipo_descanso': tipo_descanso
                })
            else:
                # ✅ Para principiantes: siempre full body
                if usuario_nivel == 'principiante':
                    grupos_del_dia = ['pecho', 'espalda', 'pierna', 'hombro', 'bicep', 'tricep', 'abdomen']
                else:
                    # Para intermedio/avanzado: usar distribución por día de la semana
                    if hasattr(self, 'distribucion_dias') and usuario_nivel in self.distribucion_dias:
                        distribucion = self.distribucion_dias[usuario_nivel]
                        grupos_del_dia = distribucion.get(dia_nombre, [])
                    else:
                        grupos_del_dia = []
                
                # Generar ejercicios para estos grupos
                ejercicios_dia = []
                if grupos_del_dia:
                    genero_dataset = 'Masculino'  # Por defecto
                    
                    for grupo in grupos_del_dia:
                        num_ej = 1 if config_nivel['tipo_entrenamiento'] == 'full_body' else config_nivel['por_grupo'][1]
                        ejercicios_grupo = self.obtener_ejercicios_por_musculo(
                            genero_dataset, 'aumento de peso', usuario_nivel, grupo, num_ejercicios=num_ej
                        )
                        ejercicios_dia.extend(ejercicios_grupo)
                
                volumen = sum(ej['series'] * ej['repeticiones'] for ej in ejercicios_dia)
                
                plan_semanal.append({
                    'dia': f"{dia_nombre} ({fecha_str})",
                    'fecha_real': fecha_dia.strftime('%Y-%m-%d'),
                    'grupos_musculares': grupos_del_dia,
                    'ejercicios': ejercicios_dia,
                    'total_ejercicios': len(ejercicios_dia),
                    'volumen_total': volumen,
                    'es_dia_descanso': False,
                    'tipo_entrenamiento': config_nivel['tipo_entrenamiento']
                })
        
        # Verificación
        dias_entrenamiento_count = sum(1 for d in plan_semanal if not d['es_dia_descanso'])
        print(f"✅ Plan generado: {dias_entrenamiento_count} días entrenamiento + {7-dias_entrenamiento_count} descanso")
        
        return plan_semanal

    def _calcular_dias_descanso(self, fecha_inicio, frecuencia_semanal):
        """
        VERSIÓN CORREGIDA: Calcula dinámicamente los días de descanso
        - Domingo: Siempre descanso (gimnasio cerrado)
        - Segundo descanso: Después de completar los días de entrenamiento requeridos
        """
        from datetime import timedelta
        
        dias_descanso = []
        dias_semana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        
        # Encontrar domingo
        indice_domingo = None
        for i in range(7):
            fecha_dia = fecha_inicio + timedelta(days=i)
            if dias_semana[fecha_dia.weekday()] == 'Domingo':
                indice_domingo = i
                break
        
        # Contador de entrenamientos
        dias_entrenamiento_completados = 0  # ✅ RENOMBRADO para claridad
        
        for i in range(7):
            fecha_dia = fecha_inicio + timedelta(days=i)
            dia_nombre = dias_semana[fecha_dia.weekday()]
            
            # Domingo siempre descanso
            if i == indice_domingo:
                dias_descanso.append(i)
                print(f"🛌 DESCANSO 1: {dia_nombre} ({fecha_dia.strftime('%d/%m/%Y')}) - Gimnasio cerrado")
            else:
                # ✅ CORRECCIÓN: Verificar ANTES de incrementar
                if dias_entrenamiento_completados < frecuencia_semanal:
                    dias_entrenamiento_completados += 1
                    print(f"🏋️ Entrenamiento {dias_entrenamiento_completados}: {dia_nombre} ({fecha_dia.strftime('%d/%m/%Y')})")
                else:
                    # Ya completamos los entrenamientos, este día es descanso
                    dias_descanso.append(i)
                    print(f"🛌 DESCANSO 2: {dia_nombre} ({fecha_dia.strftime('%d/%m/%Y')}) - Descanso activo")
        
        return sorted(dias_descanso)
    def _calcular_dias_descanso_principiante(self, fecha_inicio):
        """
        NUEVO: Calcula días de descanso para principiantes de forma ALTERNA desde la fecha de inicio
        - Patrón: Entrena, Descansa, Entrena, Descansa...
        - Domingo SIEMPRE descanso (gimnasio cerrado)
        """
        from datetime import timedelta
        
        dias_descanso = []
        dias_semana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        
        print(f"🌟 Calculando plan ALTERNO para principiante desde {fecha_inicio.strftime('%d/%m/%Y')}")
        
        # Encontrar índice del domingo
        for i in range(7):
            fecha_dia = fecha_inicio + timedelta(days=i)
            dia_nombre = dias_semana[fecha_dia.weekday()]
            
            # Domingo siempre descanso
            if dia_nombre == 'Domingo':
                dias_descanso.append(i)
                print(f"   🛌 DÍA {i}: {dia_nombre} ({fecha_dia.strftime('%d/%m')}) - DESCANSO (gimnasio cerrado)")
                continue
            
            # Patrón alterno: día par entrena, día impar descansa (o viceversa)
            # Si HOY (día 0) es de entrenamiento, entonces días impares descansan
            if i % 2 == 1:  # Días impares = descanso
                dias_descanso.append(i)
                print(f"   🛌 DÍA {i}: {dia_nombre} ({fecha_dia.strftime('%d/%m')}) - DESCANSO (alterno)")
            else:  # Días pares = entrenamiento
                print(f"   🏋️ DÍA {i}: {dia_nombre} ({fecha_dia.strftime('%d/%m')}) - ENTRENAMIENTO")
        
        return sorted(dias_descanso)


# Instancia global del modelo de IA
ai_model = CalisthenicsAI()