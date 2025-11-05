#!/usr/bin/env python3
# Script para truncar el archivo ConfiguracionModulo.tsx a las primeras 674 líneas

archivo = r"c:\Users\momen\Desktop\Projects\GPT-chatBot-v0\front_crm\bot_crm\src\components\calendar\ConfiguracionModulo.tsx"

with open(archivo, 'r', encoding='utf-8') as f:
    lineas = f.readlines()

# Mantener solo las primeras 674 líneas
lineas_correctas = lineas[:674]

# Escribir de vuelta
with open(archivo, 'w', encoding='utf-8') as f:
    f.writelines(lineas_correctas)

print(f"✅ Archivo truncado a 674 líneas correctamente")
print(f"📊 Se eliminaron {len(lineas) - 674} líneas duplicadas")
