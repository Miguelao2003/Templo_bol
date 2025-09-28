import os

def verify_dataset_location():
    """Verificar dónde está el dataset"""
    print("🔍 VERIFICANDO UBICACIÓN DEL DATASET...")
    print(f"📁 Directorio actual: {os.getcwd()}")
    
    possible_paths = [
        "Backend/app/dataset/dataset_rutinas_calistenia_mejorado.csv",  # ← UBICACIÓN REAL CORREGIDA
        "app/dataset/dataset_rutinas_calistenia_mejorado.csv",  # Si ejecutas desde Backend/
        "../dataset/dataset_rutinas_calistenia_mejorado.csv",
        "dataset_rutinas_calistenia_mejorado.csv",
        "Backend/app/data/dataset_rutinas_calistenia_mejorado.csv",
        "Backend/data/dataset_rutinas_calistenia_mejorado.csv",
        "Backend/dataset/dataset_rutinas_calistenia_mejorado.csv",  # Por si acaso
        "dataset/dataset_rutinas_calistenia_mejorado.csv",
    ]
    
    found = False
    working_path = None
    
    for path in possible_paths:
        abs_path = os.path.abspath(path)
        if os.path.exists(path):
            print(f"✅ ENCONTRADO: {abs_path}")
            found = True
            working_path = path
            
            # Verificar contenido
            try:
                import pandas as pd
                df = pd.read_csv(path)
                print(f"📊 Registros: {len(df)}")
                print(f"📋 Columnas: {list(df.columns)}")
                if 'objetivo' in df.columns:
                    print(f"🎯 Objetivos únicos: {len(df['objetivo'].unique())}")
                    print(f"🎯 Objetivos: {df['objetivo'].unique()}")
                if 'genero' in df.columns:
                    print(f"👥 Géneros: {df['genero'].unique()}")
                
                # Mostrar muestra de datos
                print(f"\n📄 Muestra de primeras 2 filas:")
                print(df.head(2).to_string())
                
                print(f"\n💡 RUTA A USAR EN TU CÓDIGO:")
                print(f"dataset_path = r'{abs_path}'")
                print(f"# O ruta relativa:")
                print(f"dataset_path = '{path}'")
                
                break  # Salir del loop al encontrar el primero
                
            except Exception as e:
                print(f"⚠️ Error leyendo archivo: {e}")
        else:
            print(f"❌ No existe: {abs_path}")
    
    if not found:
        print("\n⚠️ DATASET NO ENCONTRADO en ninguna ubicación!")
        print("💡 Soluciones:")
        print("1. Verificar que el archivo existe")
        print("2. Ejecutar desde el directorio correcto")
        print("3. Usar ruta absoluta en el código")
        
        # Buscar manualmente
        print("\n🔍 Buscando manualmente...")
        for root, dirs, files in os.walk("."):
            for file in files:
                if file == "dataset_rutinas_calistenia_mejorado.csv":
                    full_path = os.path.join(root, file)
                    abs_full_path = os.path.abspath(full_path)
                    print(f"🔍 Encontrado en: {abs_full_path}")
                    
                    # Convertir a ruta relativa desde directorio actual
                    try:
                        rel_path = os.path.relpath(abs_full_path)
                        print(f"📍 Ruta relativa: {rel_path}")
                        print(f"\n💡 USA ESTA LÍNEA EN TU CÓDIGO:")
                        print(f"dataset_path = r'{abs_full_path}'  # Ruta absoluta")
                        print(f"# O:")
                        print(f"dataset_path = '{rel_path}'  # Ruta relativa")
                    except:
                        pass
    else:
        print(f"\n✅ Dataset encontrado y verificado correctamente!")
        print(f"🎯 Usar ruta: {working_path}")
    
    return found, working_path if found else None

if __name__ == "__main__":
    found, path = verify_dataset_location()
    if found:
        print(f"\n🚀 LISTO PARA USAR:")
        print(f"En tu código de machine learning, usa:")
        print(f"df = pd.read_csv(r'{os.path.abspath(path)}')")