# test_original_api.py - Script para probar la API que respeta el código original

import requests
import json

BASE_URL = "http://localhost:8000"

def test_train_model():
    """1. Entrenar el modelo con el dataset real"""
    print("🤖 ENTRENANDO MODELO CON DATASET REAL...")
    print("="*50)
    
    response = requests.post(f"{BASE_URL}/ai/train-model")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Modelo entrenado exitosamente!")
        print(f"📊 Precisión: {result['precision']:.2%}")
        print(f"📈 Total registros: {result['total_registros']}")
        print(f"🎯 Objetivos disponibles: {result['objetivos_disponibles']}")
        print(f"👥 Géneros disponibles: {result['generos_disponibles']}")
    else:
        print(f"❌ Error: {response.text}")
        return False
    
    print("\n")
    return True

def test_model_status():
    """2. Verificar estado del modelo"""
    print("📊 VERIFICANDO ESTADO DEL MODELO...")
    print("="*50)
    
    response = requests.get(f"{BASE_URL}/ai/model-status")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Estado: {'Entrenado' if result['modelo_entrenado'] else 'No entrenado'}")
        print(f"📊 Dataset cargado: {'Sí' if result['dataset_cargado'] else 'No'}")
        print(f"📈 Total registros: {result['total_registros']}")
        print(f"🎯 Objetivos: {result['objetivos_disponibles']}")
        print(f"👥 Géneros: {result['generos_disponibles']}")
    else:
        print(f"❌ Error: {response.text}")
        return False
    
    print("\n")
    return True

def test_dataset_info():
    """3. Obtener información del dataset"""
    print("📋 INFORMACIÓN DEL DATASET...")
    print("="*50)
    
    response = requests.get(f"{BASE_URL}/ai/dataset-info")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"📊 Total registros: {result['total_registros']}")
        print(f"📏 Rango de edades: {result['edad_min']} - {result['edad_max']} años")
        print(f"⚖️ Rango de pesos: {result['peso_min']} - {result['peso_max']} kg")
        print(f"📐 Rango de alturas: {result['altura_min']} - {result['altura_max']} m")
        print(f"🏋️ Ejercicios únicos: {result['ejercicios_unicos']}")
        print(f"👥 Distribución por género: {result['distribucion_por_genero']}")
        print(f"🎯 Distribución por objetivo: {result['distribucion_por_objetivo']}")
    else:
        print(f"❌ Error: {response.text}")
        return False
    
    print("\n")
    return True

def test_predict_routine_new():
    """4. Generar rutina para usuario nuevo"""
    print("🚀 GENERANDO RUTINA PARA USUARIO NUEVO...")
    print("="*50)
    
    # Datos de prueba
    params = {
        "genero": "Masculino",
        "edad": 25,
        "peso": 75.0,
        "altura": 1.75,
        "objetivo": "aumento de peso"
    }
    
    response = requests.post(f"{BASE_URL}/ai/predict-routine", params=params)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        
        # Mostrar perfil predicho
        perfil = result['perfil']
        print(f"👤 PERFIL PREDICHO:")
        print(f"   🎯 Nivel: {perfil['nivel']}")
        print(f"   🔥 TMB: {perfil['tmb']:.1f} kcal")
        print(f"   📊 IMC: {perfil['imc']:.1f} ({perfil['rango_imc']})")
        print(f"   💬 {result['mensaje']}")
        
        # Mostrar rutina (solo primeros 2 días para no saturar)
        print(f"\n📅 PLAN SEMANAL (Primeros 2 días):")
        for dia_rutina in result['plan_semanal'][:2]:
            print(f"\n🗓️ {dia_rutina['dia']} - Grupos: {', '.join(dia_rutina['grupos_musculares'])}")
            for ejercicio in dia_rutina['ejercicios']:
                print(f"   • {ejercicio['ejercicio']} ({ejercicio['musculo']}) - {ejercicio['series']}x{ejercicio['repeticiones']}")
        
        print(f"\n✅ Rutina completa generada para toda la semana!")
        
    else:
        print(f"❌ Error: {response.text}")
        return False
    
    print("\n")
    return True

def test_predict_routine_existing_user():
    """5. Generar rutina para usuario existente (ID 28)"""
    print("👤 GENERANDO RUTINA PARA USUARIO EXISTENTE (ID: 28)...")
    print("="*50)
    
    response = requests.post(f"{BASE_URL}/ai/predict-routine-for-user/28")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        
        # Mostrar información del usuario
        print(f"👤 Usuario: {result['usuario_nombre']} (ID: {result['usuario_id']})")
        
        # Mostrar perfil predicho
        perfil = result['perfil']
        print(f"🎯 PERFIL PREDICHO:")
        print(f"   📈 Nivel: {perfil['nivel']}")
        print(f"   🔥 TMB: {perfil['tmb']:.1f} kcal")
        print(f"   📊 IMC: {perfil['imc']:.1f} ({perfil['rango_imc']})")
        
        # Mostrar rutina (solo primer día)
        if result['plan_semanal']:
            primer_dia = result['plan_semanal'][0]
            print(f"\n📅 EJEMPLO - {primer_dia['dia']}:")
            print(f"   🎯 Grupos musculares: {', '.join(primer_dia['grupos_musculares'])}")
            for ejercicio in primer_dia['ejercicios'][:3]:  # Solo primeros 3 ejercicios
                print(f"   • {ejercicio['ejercicio']} ({ejercicio['musculo']}) - {ejercicio['series']}x{ejercicio['repeticiones']}")
        
        print(f"\n💬 {result['mensaje']}")
        
    else:
        print(f"❌ Error: {response.text}")
        return False
    
    print("\n")
    return True

def run_all_tests():
    """Ejecutar todas las pruebas"""
    print("🧪 INICIANDO PRUEBAS DE LA API DE IA ORIGINAL")
    print("="*60)
    print("Este script probará la API que respeta completamente el código")
    print("original de Google Colab y usa el dataset real.")
    print("="*60)
    print()
    
    tests = [
        test_train_model,
        test_model_status,
        test_dataset_info,
        test_predict_routine_new,
        test_predict_routine_existing_user
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ Error en {test.__name__}: {e}")
            results.append(False)
    
    # Resumen final
    print("📋 RESUMEN DE PRUEBAS")
    print("="*30)
    test_names = [
        "Entrenamiento del modelo",
        "Estado del modelo",
        "Información del dataset",
        "Rutina usuario nuevo",
        "Rutina usuario existente"
    ]
    
    for i, (name, result) in enumerate(zip(test_names, results)):
        status = "✅ PASÓ" if result else "❌ FALLÓ"
        print(f"{i+1}. {name}: {status}")
    
    total_passed = sum(results)
    print(f"\n🎯 RESULTADO FINAL: {total_passed}/{len(results)} pruebas exitosas")
    
    if total_passed == len(results):
        print("🎉 ¡TODAS LAS PRUEBAS PASARON! La IA está funcionando correctamente.")
    else:
        print("⚠️ Algunas pruebas fallaron. Revisa los errores anteriores.")

if __name__ == "__main__":
    run_all_tests()